// Employee data access: queries for employees, their account/role/LOB
// assignments, and aggregated team/dashboard overviews via Supabase.

import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import type {
  AccountKey,
  AccountLabel,
  AgentPerformance,
  AuthUser,
  TeamMember,
  UserRole,
} from "@/types";
import {
  getAccountIdByCode,
  getStatuses,
  getDashboardChartAnalytics,
  type DashboardChartAnalytics,
  type DashboardTimeframe,
} from "@/lib/db/quality";
import { getScopedAgentIds } from "@/lib/db/helpers";

// Roles that are granted manager-level visibility across all accounts.
const DASHBOARD_MANAGER_ROLES: UserRole[] = [
  "account_manager",
  "qa_supervisor",
  "quality_coordinator",
];

function isManagerRole(role: UserRole | undefined): boolean {
  return role != null && DASHBOARD_MANAGER_ROLES.includes(role);
}

// Returns true when the given role is a manager-level role.
type AccountRow = { account_id: number; account_code: string; account_name: string };
type RoleRow = { role_id: number; role_name: string };
type AssignmentRow = {
  assignment_id: number;
  employee_id: number;
  role_id: number;
  account_id: number;
  lob_id: number | null;
  effective_from: string | null;
  effective_to: string | null;
};

// An assignment joined with role, account, and LOB display names.
export type EnrichedAssignment = {
  role_id: number;
  account_id: number;
  lob_id: number | null;
  effective_from: string | null;
  effective_to: string | null;
  role_name: string;
  account_code: string;
  account_name: string;
  lob_name: string | null;
};

async function loadAccounts(): Promise<AccountRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("account_id, account_code, account_name");
  if (error) {
    console.error("Error loading accounts:", error);
    return [];
  }
  return (data ?? []) as AccountRow[];
}

async function loadRoles(): Promise<RoleRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("roles")
    .select("role_id, role_name");
  if (error) {
    console.error("Error loading roles:", error);
    return [];
  }
  return (data ?? []) as RoleRow[];
}

async function loadLobs(): Promise<{ lob_id: number; lob_name: string }[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lobs")
    .select("lob_id, lob_name");
  if (error) {
    console.error("Error loading lobs:", error);
    return [];
  }
  return (data ?? []) as { lob_id: number; lob_name: string }[];
}

// Joins a raw assignment row with its role, account, and LOB names.
function enrichAssignment(
  row: AssignmentRow,
  roles: RoleRow[],
  accounts: AccountRow[],
  lobs: { lob_id: number; lob_name: string }[]
): EnrichedAssignment {
  const role = roles.find((r) => r.role_id === row.role_id);
  const account = accounts.find((a) => a.account_id === row.account_id);
  const lob = lobs.find((l) => l.lob_id === row.lob_id);
  if (!role?.role_name || !account?.account_code || !account.account_name) {
    throw new Error("Assignment has unresolved role or account metadata");
  }
  return {
    role_id: row.role_id,
    account_id: row.account_id,
    lob_id: row.lob_id,
    effective_from: row.effective_from,
    effective_to: row.effective_to,
    role_name: role.role_name,
    account_code: account.account_code,
    account_name: account.account_name,
    lob_name: lob?.lob_name ?? null,
  };
}

// Returns the stored avatar URL for an employee by email, if any.
export async function getEmployeeAvatarUrl(email: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select("avatar_url")
    .eq("employee_email", email)
    .maybeSingle();

  if (error || !data) return null;

  return (data as { avatar_url: string | null }).avatar_url;
}

// Minimal employee record shape used by the auth layer.
export type EmployeeRecord = {
  id: number;
  employee_code: string;
  employee_name: string | null;
  employee_email: string | null;
  avatar_url: string | null;
};

// Looks up a single employee by email (case-insensitive).
export async function getEmployeeByEmail(email: string) {
  const supabase = await createServerClient();

  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_code, employee_name, employee_email, avatar_url")
    .ilike("employee_email", normalized)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as EmployeeRecord;
}

// Returns the first (primary) enriched assignment for an employee.
export async function getEmployeeAssignment(employeeId: number) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("employee_assignments")
    .select(
      "assignment_id, employee_id, role_id, account_id, lob_id, effective_from, effective_to"
    )
    .eq("employee_id", employeeId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      `[getEmployeeAssignment] Query error for employee ${employeeId}:`,
      error
    );
    return null;
  }

  if (!data) return null;

  const [roles, accounts, lobs] = await Promise.all([
    loadRoles(),
    loadAccounts(),
    loadLobs(),
  ]);

  const enriched = enrichAssignment(data as AssignmentRow, roles, accounts, lobs);
  return {
    role_id: enriched.role_id,
    account_id: enriched.account_id,
    roles: { role_name: enriched.role_name },
    accounts: { account_code: enriched.account_code, account_name: enriched.account_name },
  };
}

// Returns every enriched assignment for an employee.
export async function getEmployeeAllAssignments(employeeId: number) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("employee_assignments")
    .select(
      "assignment_id, employee_id, role_id, account_id, lob_id, effective_from, effective_to"
    )
    .eq("employee_id", employeeId);

  if (error) {
    console.error(
      `[getEmployeeAllAssignments] Query error for employee ${employeeId}:`,
      error
    );
    return [];
  }

  if (!data || data.length === 0) return [];

  const [roles, accounts, lobs] = await Promise.all([
    loadRoles(),
    loadAccounts(),
    loadLobs(),
  ]);

  return (data as AssignmentRow[]).map((row) =>
    enrichAssignment(row, roles, accounts, lobs)
  );
}

// Returns all employees (with assignments) belonging to an account.
export async function getEmployeesByAccount(accountCode: string) {
  const supabase = await createServerClient();

  const accounts = await loadAccounts();
  const accountId = accounts.find(
    (a) => a.account_code.toLowerCase() === accountCode.toLowerCase()
  )?.account_id;

  if (!accountId) return [];

  const { data: assignments } = await supabase
    .from("employee_assignments")
    .select(
      "assignment_id, employee_id, role_id, account_id, lob_id, effective_from, effective_to"
    )
    .eq("account_id", accountId);

  if (!assignments || assignments.length === 0) return [];

  const employeeIds = [...new Set(assignments.map((a) => a.employee_id))];

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, employee_code, employee_name, employee_email")
    .in("id", employeeIds);

  if (empError) {
    console.error("Error fetching employees:", empError);
    return [];
  }

  const roles = await loadRoles();
  const lobs = await loadLobs();

  return (employees ?? [])
    .map((emp) => ({
      ...emp,
      employee_assignments: (assignments ?? [])
        .filter((a) => a.employee_id === emp.id)
        .map((a) => {
          const enriched = enrichAssignment(a as AssignmentRow, roles, accounts, lobs);
          return {
            role_id: enriched.role_id,
            account_id: enriched.account_id,
            lob_id: enriched.lob_id,
            effective_from: enriched.effective_from,
            effective_to: enriched.effective_to,
            roles: { role_name: enriched.role_name },
            accounts: { account_code: enriched.account_code, account_name: enriched.account_name },
            lobs: enriched.lob_name ? { lob_name: enriched.lob_name } : null,
          };
        }),
    }))
    .filter((e) => e.employee_assignments.length > 0);
}

export async function getEmployeesWithAssignments(accountCode: string) {
  return getEmployeesByAccount(accountCode);
}

export async function getAccountDetails(accountCode: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("account_id, account_code, account_name")
    .eq("account_code", accountCode)
    .single();

  if (error) {
    console.error("Error fetching account details:", error);
    return null;
  }

  return data as { account_id: number; account_code: string; account_name: string };
}

export async function getEmployeesPaginated({
  accountCode,
  page = 1,
  pageSize = 20,
  search = "",
}: {
  accountCode: string;
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const supabase = await createServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const accounts = await loadAccounts();
  const accountId = accounts.find(
    (a) => a.account_code.toLowerCase() === accountCode.toLowerCase()
  )?.account_id;

  if (!accountId) {
    return { employees: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const { data: allAssignments } = await supabase
    .from("employee_assignments")
    .select(
      "assignment_id, employee_id, role_id, account_id, lob_id, effective_from, effective_to"
    )
    .eq("account_id", accountId);

  const employeeIds = [...new Set((allAssignments ?? []).map((a) => a.employee_id))];

  if (employeeIds.length === 0) {
    return { employees: [], total: 0, page, pageSize, totalPages: 0 };
  }

  let query = supabase
    .from("employees")
    .select("id, employee_code, employee_name, employee_email", { count: "exact" })
    .in("id", employeeIds);

  if (search) {
    query = query.or(
      `employee_name.ilike.%${search}%,employee_email.ilike.%${search}%,employee_code.ilike.%${search}%`
    );
  }

  query = query.order("employee_name", { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching paginated employees:", error);
    return { employees: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const roles = await loadRoles();
  const lobs = await loadLobs();

  const employees = (data ?? []).map((emp) => ({
    ...emp,
    employee_assignments: (allAssignments ?? [])
      .filter((a) => a.employee_id === emp.id)
      .map((a) => {
        const enriched = enrichAssignment(a as AssignmentRow, roles, accounts, lobs);
        return {
          role_id: enriched.role_id,
          account_id: enriched.account_id,
          lob_id: enriched.lob_id,
          effective_from: enriched.effective_from,
          effective_to: enriched.effective_to,
          roles: { role_name: enriched.role_name },
          accounts: { account_code: enriched.account_code, account_name: enriched.account_name },
          lobs: enriched.lob_name ? { lob_name: enriched.lob_name } : null,
        };
      }),
  }));

  return {
    employees,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAccounts() {
  const accounts = await loadAccounts();
  return accounts.sort((a, b) => a.account_code.localeCompare(b.account_code));
}

export async function getRoles() {
  const roles = await loadRoles();
  return roles.sort((a, b) => a.role_name.localeCompare(b.role_name));
}

export async function getLobsByAccount(accountId: number) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lobs")
    .select("lob_id, lob_name, account_id")
    .eq("account_id", accountId)
    .order("lob_name", { ascending: true });

  if (error) {
    console.error("Error fetching LOBs:", error);
    return [] as { lob_id: number; lob_name: string; account_id: number }[];
  }

  return (data ?? []) as { lob_id: number; lob_name: string; account_id: number }[];
}

type EnrichedEmployee = {
  id: number;
  employee_code: string | null;
  employee_name: string | null;
  employee_email: string | null;
  status_id: number | null;
  role_name: string;
  account_code: string;
  lob_name: string | null;
  status_name: string | null;
};

function classifyRole(roleName: string): "agent" | "qa" | "team_lead" | "other" {
  const r = roleName.trim().toLowerCase();
  if (r === "agent") return "agent";
  if (r === "team lead" || r === "tl") return "team_lead";
  if (r === "qa" || r === "qa supervisor" || r === "quality coordinator")
    return "qa";
  return "other";
}

async function getEnrichedEmployeesByAccount(
  accountCode: string
): Promise<EnrichedEmployee[]> {
  const supabase = await createServerClient();

  const accounts = await loadAccounts();
  const account = accounts.find(
    (a) => a.account_code.toLowerCase() === accountCode.toLowerCase()
  );
  if (!account) return [];

  const { data: assignments, error } = await supabase
    .from("employee_assignments")
    .select(
      "employee_id, role_id, account_id, lob_id, effective_from, effective_to"
    )
    .eq("account_id", account.account_id);

  if (error) {
    console.error(
      "[getEnrichedEmployeesByAccount] assignments error:",
      error
    );
    return [];
  }
  if (!assignments || assignments.length === 0) return [];

  const employeeIds = [...new Set((assignments as AssignmentRow[]).map((a) => a.employee_id))];

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, employee_code, employee_name, employee_email, status_id")
    .in("id", employeeIds);

  if (empError) {
    console.error("[getEnrichedEmployeesByAccount] employees error:", empError);
    return [];
  }

  const roles = await loadRoles();
  const lobs = await loadLobs();
  const { data: statuses } = await supabase
    .from("statuses")
    .select("status_id, status_name");

  const statusMap = new Map<number, string>(
    (statuses ?? []).map((s) => [s.status_id, s.status_name])
  );

  return (assignments as AssignmentRow[]).map((a) => {
    const emp = (employees ?? []).find((e) => e.id === a.employee_id);
    const role = roles.find((r) => r.role_id === a.role_id);
    const lob = lobs.find((l) => l.lob_id === a.lob_id);
    return {
      id: a.employee_id,
      employee_code: emp?.employee_code ?? null,
      employee_name: emp?.employee_name ?? null,
      employee_email: emp?.employee_email ?? null,
      status_id: emp?.status_id ?? null,
      role_name: role?.role_name ?? "QA",
      account_code: account.account_code,
      lob_name: lob?.lob_name ?? null,
      status_name:
        emp && emp.status_id != null
          ? (statusMap.get(emp.status_id) ?? null)
          : null,
    };
  });
}

export async function getAccountAgents(
  accountCode: string,
  user?: AuthUser
): Promise<AgentPerformance[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = await createServerClient();

  let query = supabase
    .from("agent_assignments")
    .select("agent_employee_id")
    .eq("account_id", accountId);

  if (user && !isManagerRole(user.role)) {
    query = query.or(
      `qa_coach_employee_id.eq.${user.employee_id},qa_evaluator_employee_id.eq.${user.employee_id},team_lead_employee_id.eq.${user.employee_id}`
    );
  }

  const { data: assignments, error } = await query;

  if (error || !assignments || assignments.length === 0) return [];

  const agentIds = [...new Set(assignments.map((a) => a.agent_employee_id))];

  const { data: agents } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", agentIds);

  return (agents ?? []).map((a) => ({
    name: a.employee_name ?? "—",
    score: "—",
    opportunities: 0,
  }));
}

export async function getAccountQAs(accountCode: string): Promise<string[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = createAdminClient();
  const { data: assignments } = await supabase
    .from("agent_assignments")
    .select("qa_coach_employee_id, qa_evaluator_employee_id")
    .eq("account_id", accountId);

  if (!assignments || assignments.length === 0) return [];

  const qaIds = new Set<number>();
  for (const a of assignments) {
    if (a.qa_coach_employee_id) qaIds.add(a.qa_coach_employee_id);
    if (a.qa_evaluator_employee_id) qaIds.add(a.qa_evaluator_employee_id);
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", [...qaIds]);

  return (employees ?? [])
    .map((e) => e.employee_name ?? "")
    .filter(Boolean)
    .sort();
}

export async function getAccountTeamLeads(accountCode: string): Promise<string[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = createAdminClient();
  const { data: assignments } = await supabase
    .from("agent_assignments")
    .select("team_lead_employee_id")
    .eq("account_id", accountId);

  if (!assignments || assignments.length === 0) return [];

  const tlIds = [...new Set(assignments.map((a) => a.team_lead_employee_id))];

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", tlIds);

  return (employees ?? [])
    .map((e) => e.employee_name ?? "")
    .filter(Boolean)
    .sort();
}

export async function getAccountQaName(
  accountCode: string,
  employeeName?: string
): Promise<string> {
  const qas = await getAccountQAs(accountCode);
  if (employeeName) {
    const match = qas.find(
      (q) => q.toLowerCase() === employeeName.toLowerCase()
    );
    if (match) return match;
  }
  return qas[0] ?? employeeName ?? "QA";
}

export async function getAccountLobNames(
  accountCode: string
): Promise<string[]> {
  const accounts = await loadAccounts();
  const account = accounts.find(
    (a) => a.account_code.toLowerCase() === accountCode.toLowerCase()
  );
  if (!account) return [];

  const lobs = await getLobsByAccount(account.account_id);
  return lobs.map((l) => l.lob_name).sort();
}

export type AgentAssignmentRow = {
  name: string;
  lob: string;
  coach: string;
  evaluator: string;
  teamLead: string;
  status: string;
  assignmentId?: number;
  agentId?: number;
  lobId?: number;
  coachId?: number | null;
  evaluatorId?: number | null;
  teamLeadId?: number | null;
};

export async function getAccountAssignmentRows(
  accountCode: string,
  user?: AuthUser
): Promise<AgentAssignmentRow[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = await createServerClient();

  let query = supabase
    .from("agent_assignments")
    .select(
      "assignment_id, agent_employee_id, lob_id, team_lead_employee_id, qa_coach_employee_id, qa_evaluator_employee_id"
    )
    .eq("account_id", accountId);

  if (user && !isManagerRole(user.role)) {
    query = query.or(
      `qa_coach_employee_id.eq.${user.employee_id},qa_evaluator_employee_id.eq.${user.employee_id},team_lead_employee_id.eq.${user.employee_id}`
    );
  }

  const { data: assignments, error } = await query;

  if (error || !assignments || assignments.length === 0) return [];

  const allEmployeeIds = new Set<number>();
  for (const a of assignments) {
    allEmployeeIds.add(a.agent_employee_id);
    allEmployeeIds.add(a.team_lead_employee_id);
    allEmployeeIds.add(a.qa_coach_employee_id);
    allEmployeeIds.add(a.qa_evaluator_employee_id);
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", [...allEmployeeIds]);

  const employeeName = new Map<number, string>(
    (employees ?? []).map((e) => [e.id, e.employee_name ?? "Unknown"])
  );

  const { data: lobs } = await supabase
    .from("lobs")
    .select("lob_id, lob_name")
    .eq("account_id", accountId);

  const lobName = new Map<number, string>(
    (lobs ?? []).map((l) => [l.lob_id, l.lob_name])
  );

  return assignments.map((a) => ({
    name: employeeName.get(a.agent_employee_id) ?? "—",
    lob: lobName.get(a.lob_id) ?? "—",
    coach: employeeName.get(a.qa_coach_employee_id) ?? "",
    evaluator: employeeName.get(a.qa_evaluator_employee_id) ?? "",
    teamLead: employeeName.get(a.team_lead_employee_id) ?? "",
    status: "ACTIVE",
    assignmentId: a.assignment_id,
    agentId: a.agent_employee_id,
    lobId: a.lob_id,
    coachId: a.qa_coach_employee_id ?? null,
    evaluatorId: a.qa_evaluator_employee_id ?? null,
    teamLeadId: a.team_lead_employee_id ?? null,
  }));
}

export type AccountTeamOverview = {
  agents: number;
  activeAgents: number;
  inactiveAgents: number;
  qaCount: number;
  members: TeamMember[];
};

export async function getAccountTeamOverview(
  accountCode: string,
  user?: AuthUser
): Promise<AccountTeamOverview> {
  const enriched = await getEnrichedEmployeesByAccount(accountCode);
  const accountId = await getAccountIdByCode(accountCode);

  const allAgents = enriched.filter(
    (e) => classifyRole(e.role_name) === "agent"
  );

  let agents = allAgents;
  if (accountId && user && !isManagerRole(user.role)) {
    const scoped = await getScopedAgentIds(accountId, user);
    if (scoped.agentIds !== null) {
      const scopedSet = new Set(scoped.agentIds);
      agents = agents.filter((e) => scopedSet.has(e.id));
    }
  }

  const qaMembers = enriched.filter(
    (e) => classifyRole(e.role_name) === "qa"
  );

  let assignments: { agent_employee_id: number; qa_coach_employee_id: number | null }[] = [];
  if (accountId) {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("agent_assignments")
      .select("agent_employee_id, qa_coach_employee_id")
      .eq("account_id", accountId);
    assignments = (data ?? []) as typeof assignments;
  }

  const memberAgentCount = new Map<number, number>();
  for (const a of assignments) {
    const coachId = a.qa_coach_employee_id;
    if (coachId != null) {
      memberAgentCount.set(coachId, (memberAgentCount.get(coachId) ?? 0) + 1);
    }
  }

  const members: TeamMember[] = qaMembers.map((m) => {
    const name = m.employee_name ?? "—";
    const initial = name
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return {
      name,
      initial,
      agents: memberAgentCount.get(m.id) ?? 0,
      employeeId: m.id,
      employeeCode: m.employee_code ?? String(m.id),
    };
  });

  const inactiveAgents = agents.filter(
    (agent) => (agent.status_name ?? "").trim().toUpperCase() === "INACTIVE"
  ).length;
  const activeAgents = agents.filter(
    (agent) => (agent.status_name ?? "").trim().toUpperCase() === "ACTIVE"
  ).length;

  return {
    agents: agents.length,
    activeAgents,
    inactiveAgents,
    qaCount: qaMembers.length,
    members,
  };
}

export type AccountSummary = {
  account: AccountLabel;
  accountKey: AccountKey;
  agents: number;
  activeAgents: number;
  inactiveAgents: number;
  qaCount: number;
};

export type DashboardOverview = {
  isManager: boolean;
  accounts: AccountSummary[];
  totalAgents: number;
  totalActiveAgents: number;
  totalInactiveAgents: number;
  totalQAs: number;
  charts: DashboardChartAnalytics;
};

export async function getDashboardOverview(
  user: AuthUser,
  timeframe: DashboardTimeframe = "Daily",
  anchorDate = new Date().toISOString().slice(0, 10)
): Promise<DashboardOverview> {
  const isManager =
    DASHBOARD_MANAGER_ROLES.includes(user.role) || user.role === "admin";

  const accountCodes = isManager
    ? (await getAccounts()).map((a) => a.account_code)
    : (user.accounts ?? []).map((a) => a.account);

  const accounts = await Promise.all(
    accountCodes.map(async (code) => {
      const overview = await getAccountTeamOverview(code, user);

      return {
        account: code.toUpperCase() as AccountLabel,
        accountKey: code.toLowerCase() as AccountKey,
        agents: overview.agents,
        activeAgents: overview.activeAgents,
        inactiveAgents: overview.inactiveAgents,
        qaCount: overview.qaCount,
      };
    })
  );

  const totalAgents = accounts.reduce((sum, a) => sum + a.agents, 0);
  const totalActiveAgents = accounts.reduce((sum, a) => sum + a.activeAgents, 0);
  const totalInactiveAgents = accounts.reduce((sum, a) => sum + a.inactiveAgents, 0);
  const totalQAs = accounts.reduce((sum, a) => sum + a.qaCount, 0);

  const charts = await getDashboardChartAnalytics(
    accountCodes,
    user,
    timeframe,
    anchorDate
  );

  return {
    isManager,
    accounts,
    totalAgents,
    totalActiveAgents,
    totalInactiveAgents,
    totalQAs,
    charts,
  };
}
