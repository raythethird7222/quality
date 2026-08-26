// Employee data access: queries for employees, their account/role/LOB
// assignments, and aggregated team/dashboard overviews via Supabase.

import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
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
  getDashboardChartAnalytics,
  type DashboardChartAnalytics,
} from "@/lib/db/quality";

// Roles that are granted manager-level visibility across all accounts.
const DASHBOARD_MANAGER_ROLES: UserRole[] = [
  "account_manager",
  "qa_supervisor",
  "quality_coordinator",
];

// Raw row shapes for the accounts, roles, and assignments tables.
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

// Loads all accounts from the database (cached 5 min — reference data).
const loadAccounts = unstable_cache(
  async (): Promise<AccountRow[]> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("accounts")
      .select("account_id, account_code, account_name");
    if (error) {
      console.error("Error loading accounts:", error);
      return [];
    }
    return (data ?? []) as AccountRow[];
  },
  ["employees", "accounts"],
  { revalidate: 300, tags: ["db:accounts"] }
);

// Loads all roles from the database (cached 5 min — reference data).
const loadRoles = unstable_cache(
  async (): Promise<RoleRow[]> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("roles")
      .select("role_id, role_name");
    if (error) {
      console.error("Error loading roles:", error);
      return [];
    }
    return (data ?? []) as RoleRow[];
  },
  ["employees", "roles"],
  { revalidate: 300, tags: ["db:roles"] }
);

// Loads all lines of business (LOBs) from the database (cached 5 min).
const loadLobs = unstable_cache(
  async (): Promise<{ lob_id: number; lob_name: string }[]> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("lobs")
      .select("lob_id, lob_name");
    if (error) {
      console.error("Error loading lobs:", error);
      return [];
    }
    return (data ?? []) as { lob_id: number; lob_name: string }[];
  },
  ["employees", "lobs"],
  { revalidate: 300, tags: ["db:lobs"] }
);

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
  return {
    role_id: row.role_id,
    account_id: row.account_id,
    lob_id: row.lob_id,
    effective_from: row.effective_from,
    effective_to: row.effective_to,
    role_name: role?.role_name ?? "QA",
    account_code: account?.account_code ?? "RM",
    account_name: account?.account_name ?? "RM",
    lob_name: lob?.lob_name ?? null,
  };
}

// Returns the stored avatar URL for an employee by email, if any.
export async function getEmployeeAvatarUrl(email: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select("avatar_url")
    .eq("employee_email", email)
    .maybeSingle();

  if (error || !data) return null;

  return (data as { avatar_url: string | null }).avatar_url;
}

// Authenticates an employee by email (case-insensitive) and employee code.
export async function getEmployeeByEmailAndPassword(
  email: string,
  employeeCode: string
) {
  const supabase = createServerClient();

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = employeeCode.trim().toLowerCase();

  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_code, employee_name, employee_email, avatar_url"
    )
    .ilike("employee_email", normalizedEmail)
    .single();

  if (error || !data) {
    return null;
  }

  const storedCode = (data.employee_code ?? "").toString().trim().toLowerCase();
  if (storedCode !== normalizedCode) {
    return null;
  }

  return data as {
    id: number;
    employee_code: string;
    employee_name: string;
    employee_email: string;
    avatar_url: string | null;
  };
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
  const supabase = createServerClient();

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
  const supabase = createServerClient();

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
  const supabase = createServerClient();

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
  const supabase = createServerClient();

  const accounts = await loadAccounts();
  const accountId = accounts.find(
    (a) => a.account_code.toLowerCase() === accountCode.toLowerCase()
  )?.account_id;

  if (!accountId) return [];

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, employee_code, employee_name, employee_email");

  if (empError) {
    console.error("Error fetching employees:", empError);
    return [];
  }

  const { data: assignments } = await supabase
    .from("employee_assignments")
    .select(
      "assignment_id, employee_id, role_id, account_id, lob_id, effective_from, effective_to"
    )
    .eq("account_id", accountId);

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

// Alias for getEmployeesByAccount (kept for naming consistency).
export async function getEmployeesWithAssignments(accountCode: string) {
  return getEmployeesByAccount(accountCode);
}

// Returns the account id, code, and name for a given account code.
export async function getAccountDetails(accountCode: string) {
  const supabase = createServerClient();

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

// Paginated, searchable employee query scoped to a single account.
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
  const supabase = createServerClient();
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

  // Unique employee ids assigned to this account (drives the employee query).
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

// Returns all accounts ordered by code.
export async function getAccounts() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("account_id, account_code, account_name")
    .order("account_code", { ascending: true });

  if (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }

  return (data ?? []) as AccountRow[];
}

// Returns all roles ordered by name.
export async function getRoles() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("roles")
    .select("role_id, role_name")
    .order("role_name", { ascending: true });

  if (error) {
    console.error("Error fetching roles:", error);
    return [];
  }

  return (data ?? []) as RoleRow[];
}

// Returns the LOBs belonging to a specific account, ordered by name.
export async function getLobsByAccount(accountId: number) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("lobs")
    .select("lob_id, lob_name, account_id")
    .eq("account_id", accountId)
    .order("lob_name", { ascending: true });

  if (error) {
    console.error("Error fetching LOBs:", error);
    return [];
  }

  return (data ?? []) as { lob_id: number; lob_name: string; account_id: number }[];
}

// Flattened employee shape with role, account, LOB, and status names.
type EnrichedEmployee = {
  id: number;
  employee_code: string | null;
  employee_name: string | null;
  employee_email: string | null;
  role_name: string;
  account_code: string;
  lob_name: string | null;
  status_name: string | null;
};

// Normalizes a role name into a coarse category used for team filtering.
function classifyRole(roleName: string): "agent" | "qa" | "team_lead" | "other" {
  const r = roleName.trim().toLowerCase();
  if (r === "agent") return "agent";
  if (r === "team lead" || r === "tl") return "team_lead";
  if (r === "qa" || r === "qa supervisor" || r === "quality coordinator")
    return "qa";
  return "other";
}

// Core query that returns employees for an account enriched with role, LOB,
// and status detail, used by the higher-level team aggregations below.
async function getEnrichedEmployeesByAccount(
  accountCode: string
): Promise<EnrichedEmployee[]> {
  const supabase = createServerClient();

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

  // Unique employee ids from the assignments, used to load employee rows.
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

  // Maps a status id to its display name for enriching each employee.
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

// Returns the (deduplicated) agents for an account as performance rows.
// Uses agent_assignments table to get only assigned agents.
export async function getAccountAgents(
  accountCode: string
): Promise<AgentPerformance[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = createServerClient();

  // Fetch all agent_assignments for this account.
  const { data: assignments, error } = await supabase
    .from("agent_assignments")
    .select("agent_employee_id")
    .eq("account_id", accountId);

  if (error || !assignments || assignments.length === 0) return [];

  // Deduplicate agent employee ids.
  const agentIds = [...new Set(assignments.map((a) => a.agent_employee_id))];

  // Fetch agent names.
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

// Returns the sorted list of QA employee names (coaches + evaluators) for an account.
export async function getAccountQAs(accountCode: string): Promise<string[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = createServerClient();
  const { data: assignments } = await supabase
    .from("agent_assignments")
    .select("qa_coach_employee_id, qa_evaluator_employee_id")
    .eq("account_id", accountId);

  if (!assignments || assignments.length === 0) return [];

  // Collect all unique QA employee ids.
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

// Returns the sorted list of team lead names for an account.
export async function getAccountTeamLeads(
  accountCode: string
): Promise<string[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = createServerClient();
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

// Resolves the most relevant QA name: a matching employee or the first QA.
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

// Returns the sorted LOB names for an account.
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

// Flat row shape for the account assignment roster table.
export type AgentAssignmentRow = {
  name: string;
  lob: string;
  coach: string;
  evaluator: string;
  teamLead: string;
  status: string;
};

// Builds the assignment roster rows for an account using the agent_assignments table.
export async function getAccountAssignmentRows(
  accountCode: string
): Promise<AgentAssignmentRow[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = createServerClient();

  // Fetch all agent_assignments for this account.
  const { data: assignments, error } = await supabase
    .from("agent_assignments")
    .select(
      "assignment_id, agent_employee_id, lob_id, team_lead_employee_id, qa_coach_employee_id, qa_evaluator_employee_id"
    )
    .eq("account_id", accountId);

  if (error || !assignments || assignments.length === 0) return [];

  // Collect all unique employee ids (agents + supervisors) to resolve names in one query.
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

  // Fetch LOB names for this account.
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
  }));
}

// Aggregated agent count and QA member list for an account.
export type AccountTeamOverview = {
  agents: number;
  qaCount: number;
  members: TeamMember[];
};

// Returns agent/QA counts and the QA member list for an account.
export async function getAccountTeamOverview(
  accountCode: string
): Promise<AccountTeamOverview> {
  const enriched = await getEnrichedEmployeesByAccount(accountCode);

  const agents = enriched.filter(
    (e) => classifyRole(e.role_name) === "agent"
  );
  const qaMembers = enriched.filter(
    (e) => classifyRole(e.role_name) === "qa"
  );

  const members: TeamMember[] = qaMembers.map((m) => {
    const name = m.employee_name ?? "—";
    const initial = name
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return { name, initial, agents: agents.length };
  });

  return {
    agents: agents.length,
    qaCount: qaMembers.length,
    members,
  };
}

// Per-account summary used to build the dashboard overview.
export type AccountSummary = {
  account: AccountLabel;
  accountKey: AccountKey;
  agents: number;
  qaCount: number;
};

// Role-aware rollup of all accounts the current user can see, with totals.
export type DashboardOverview = {
  isManager: boolean;
  accounts: AccountSummary[];
  totalAgents: number;
  totalQAs: number;
  charts: DashboardChartAnalytics;
};

/**
 * Builds a role-aware overview of every account the current user can see.
 * Managers (and admins) see all accounts; everyone else sees only the
 * accounts they are assigned to. Counts are pulled live from the employee
 * assignment data so the dashboard reflects the real team structure.
 * Cached for 2 minutes to avoid redundant Supabase queries on navigation.
 */
export const getDashboardOverview = unstable_cache(
  async (user: AuthUser): Promise<DashboardOverview> => {
    const isManager =
      DASHBOARD_MANAGER_ROLES.includes(user.role) || user.role === "admin";

    const accountCodes = isManager
      ? (await getAccounts()).map((a) => a.account_code)
      : (user.accounts ?? []).map((a) => a.account);

    const accounts = await Promise.all(
      accountCodes.map(async (code) => {
        const overview = await getAccountTeamOverview(code);
        return {
          account: code.toUpperCase() as AccountLabel,
          accountKey: code.toLowerCase() as AccountKey,
          agents: overview.agents,
          qaCount: overview.qaCount,
        };
      })
    );

    const totalAgents = accounts.reduce((sum, a) => sum + a.agents, 0);
    const totalQAs = accounts.reduce((sum, a) => sum + a.qaCount, 0);

    // Fetch real chart analytics across all visible accounts.
    const charts = await getDashboardChartAnalytics(accountCodes);

    return { isManager, accounts, totalAgents, totalQAs, charts };
  },
  ["dashboard", "overview"],
  { revalidate: 120, tags: ["dashboard"] }
);