// Assignment data access: resolves selectable people/LOBs for an account and
// persists agent assignment rows (create / update / new-employee) to Supabase.

import { createAdminClient } from "@/lib/supabase/server";
import { getAccountIdByCode, getStatuses } from "@/lib/db/quality";
import type { Database } from "@/types/database";
import type { NewEmployeeInput } from "@/features/assignments/validation";

// A simple id + display-name option used to populate dropdowns.
export type IdNameOption = { id: number; name: string };

// Existing account agents that can receive their first QA assignment.
export type AvailableAgentOption = IdNameOption & {
  assignmentId?: number;
  lobId?: number;
};

// A single assignment row enriched with ids for the editable table.
export type AssignmentTableRow = {
  assignmentId: number;
  agentId: number;
  name: string;
  lobId: number;
  coachId: number | null;
  evaluatorId: number | null;
  teamLeadId: number | null;
  status: string;
};

// An incoming assignment to persist (used by the API route).
export type SaveAgentAssignment = {
  assignmentId?: number;
  agentId?: number;
  agent?: NewEmployeeInput;
  lobId: number;
  coachId: number | null;
  evaluatorId: number | null;
  teamLeadId: number | null;
};

// The persisted result, aligned by input order so the client can merge it.
export type PersistedAssignment = {
  assignmentId: number;
  agentId: number;
  name: string;
};

// Collects every employee referenced by the account's agent assignments
// (agents, coaches, evaluators, team leads) as id + name options.
export async function getAccountPeople(
  accountCode: string
): Promise<IdNameOption[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createAdminClient();

  const { data: assignments, error: assignmentsErr } = await supabase
    .from("agent_assignments")
    .select(
      "agent_employee_id, qa_coach_employee_id, qa_evaluator_employee_id, team_lead_employee_id"
    )
    .eq("account_id", accountId);
  if (assignmentsErr) {
    console.error("[assignments] getAccountPeople query error:", assignmentsErr.message);
  }

  const ids = new Set<number>();
  for (const a of assignments ?? []) {
    [a.agent_employee_id, a.qa_coach_employee_id, a.qa_evaluator_employee_id, a.team_lead_employee_id].forEach(
      (id) => {
        if (id != null) ids.add(id);
      }
    );
  }
  if (ids.size === 0) return [];

  const { data: employees, error: employeesErr } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", [...ids]);
  if (employeesErr) {
    console.error("[assignments] getAccountPeople employees error:", employeesErr.message);
  }

  return (employees ?? [])
    .map((e) => ({ id: e.id, name: e.employee_name ?? "Unknown" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Returns the LOBs belonging to the account as id + name options.
export async function getAccountLobs(
  accountCode: string
): Promise<IdNameOption[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lobs")
    .select("lob_id, lob_name")
    .eq("account_id", accountId)
    .order("lob_name", { ascending: true });
  if (error) {
    console.error("[assignments] getAccountLobs query error:", error.message);
  }

  return (data ?? []).map((l) => ({ id: l.lob_id, name: l.lob_name }));
}

// Returns every coach in the account, independent of whether they already
// appear in an agent assignment. Combines both sources so no coach is missed:
//  - employees with the coach role in employee_assignments
//  - employees referenced as qa_coach_employee_id in agent_assignments
// Used to populate the QA Coach dropdown.
export async function getAccountCoaches(
  accountCode: string
): Promise<IdNameOption[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createAdminClient();

  const { data: roles, error: rolesErr } = await supabase
    .from("roles")
    .select("role_id, role_name");
  if (rolesErr) {
    console.error("[assignments] getAccountCoaches roles error:", rolesErr.message);
  }
  const coachRoleIds = (roles ?? [])
    .filter((r) => {
      const name = r.role_name.trim().toLowerCase().replace(/[_\s]+/g, " ");
      return (
        name === "coach" ||
        name === "qa coach" ||
        name === "coaches" ||
        name === "qa coaches"
      );
    })
    .map((r) => r.role_id);

  const ids = new Set<number>();

  if (coachRoleIds.length > 0) {
    const { data: empAssignments } = await supabase
      .from("employee_assignments")
      .select("employee_id")
      .eq("account_id", accountId)
      .in("role_id", coachRoleIds);
    for (const a of empAssignments ?? []) ids.add(a.employee_id);
  }

  const { data: agentAssignments } = await supabase
    .from("agent_assignments")
    .select("qa_coach_employee_id")
    .eq("account_id", accountId);
  for (const a of agentAssignments ?? []) {
    if (a.qa_coach_employee_id != null) ids.add(a.qa_coach_employee_id);
  }

  if (ids.size === 0) return [];

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", [...ids]);

  return (employees ?? [])
    .map((e) => ({ id: e.id, name: e.employee_name ?? "Unknown" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Returns every evaluator in the account, independent of whether they already
// appear in an agent assignment. Combines both sources so no evaluator is missed:
//  - employees with the evaluator role in employee_assignments
//  - employees referenced as qa_evaluator_employee_id in agent_assignments
// Used to populate the QA Evaluator dropdown.
export async function getAccountEvaluators(
  accountCode: string
): Promise<IdNameOption[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createAdminClient();

  const { data: roles, error: rolesErr } = await supabase
    .from("roles")
    .select("role_id, role_name");
  if (rolesErr) {
    console.error("[assignments] getAccountEvaluators roles error:", rolesErr.message);
  }
  const evaluatorRoleIds = (roles ?? [])
    .filter((r) => {
      const name = r.role_name.trim().toLowerCase().replace(/[_\s]+/g, " ");
      return (
        name === "evaluator" ||
        name === "qa evaluator" ||
        name === "evaluators" ||
        name === "qa evaluators"
      );
    })
    .map((r) => r.role_id);

  const ids = new Set<number>();

  if (evaluatorRoleIds.length > 0) {
    const { data: empAssignments } = await supabase
      .from("employee_assignments")
      .select("employee_id")
      .eq("account_id", accountId)
      .in("role_id", evaluatorRoleIds);
    for (const a of empAssignments ?? []) ids.add(a.employee_id);
  }

  const { data: agentAssignments } = await supabase
    .from("agent_assignments")
    .select("qa_evaluator_employee_id")
    .eq("account_id", accountId);
  for (const a of agentAssignments ?? []) {
    if (a.qa_evaluator_employee_id != null) ids.add(a.qa_evaluator_employee_id);
  }

  if (ids.size === 0) return [];

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", [...ids]);

  return (employees ?? [])
    .map((e) => ({ id: e.id, name: e.employee_name ?? "Unknown" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
export async function getAccountTeamLeads(
  accountCode: string
): Promise<IdNameOption[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createAdminClient();

  const { data: roles, error: rolesErr } = await supabase
    .from("roles")
    .select("role_id, role_name");
  if (rolesErr) {
    console.error("[assignments] getAccountTeamLeads roles error:", rolesErr.message);
  }
  const tlRoleIds = (roles ?? [])
    .filter((r) => {
      const name = r.role_name.trim().toLowerCase().replace(/[_\s]+/g, " ");
      return (
        name === "team lead" ||
        name === "tl" ||
        name === "teamleader" ||
        name === "team leads"
      );
    })
    .map((r) => r.role_id);

  const ids = new Set<number>();

  if (tlRoleIds.length > 0) {
    const { data: empAssignments } = await supabase
      .from("employee_assignments")
      .select("employee_id")
      .eq("account_id", accountId)
      .in("role_id", tlRoleIds);
    for (const a of empAssignments ?? []) ids.add(a.employee_id);
  }

  const { data: agentAssignments } = await supabase
    .from("agent_assignments")
    .select("team_lead_employee_id")
    .eq("account_id", accountId);
  for (const a of agentAssignments ?? []) {
    if (a.team_lead_employee_id != null) ids.add(a.team_lead_employee_id);
  }

  if (ids.size === 0) return [];

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", [...ids]);

  return (employees ?? [])
    .map((e) => ({ id: e.id, name: e.employee_name ?? "Unknown" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Returns agents with no account assignment yet. QA creates the account link
// when the agent is first assigned from this page.
export async function getAccountAvailableAgents(
  accountCode: string
): Promise<AvailableAgentOption[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createAdminClient();

  const { data: roles } = await supabase
    .from("roles")
    .select("role_id, role_name");
  const agentRoleIds = (roles ?? [])
    .filter((role) => {
      const name = role.role_name.trim().toLowerCase().replace(/[_\s]+/g, " ");
      return name === "agent" || name === "agents";
    })
    .map((role) => role.role_id);

  if (agentRoleIds.length === 0) return [];

  const [{ data: agentEmployees }, { data: employeeAssignments }, { data: currentAssignments }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, employee_name")
        .in("role_id", agentRoleIds),
      supabase
        .from("employee_assignments")
        .select("employee_id"),
      supabase
        .from("agent_assignments")
        .select("agent_employee_id")
        .eq("account_id", accountId),
    ]);

  const accountAssignedIds = new Set((employeeAssignments ?? []).map((row) => row.employee_id));
  const alreadyInAccountIds = new Set((currentAssignments ?? []).map((row) => row.agent_employee_id));

  return (agentEmployees ?? [])
    .filter((employee) => !accountAssignedIds.has(employee.id) && !alreadyInAccountIds.has(employee.id))
    .map((employee) => ({
      id: employee.id,
      name: employee.employee_name ?? "Unknown",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Loads the account's agent assignment rows enriched with the ids the editable
// table needs (agent/LOB/coach/evaluator/team-lead ids). Managers see all
// rows; everyone else sees only agents they coach, evaluate, or lead.
export async function getAccountAssignmentRowsWithIds(
  accountCode: string,
  user?: { employee_id: number; role: string }
): Promise<AssignmentTableRow[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = createAdminClient();

  let query = supabase
    .from("agent_assignments")
    .select(
      "assignment_id, agent_employee_id, lob_id, team_lead_employee_id, qa_coach_employee_id, qa_evaluator_employee_id"
    )
    .eq("account_id", accountId);

  const managerRoles = ["admin", "account_manager", "quality_coordinator", "qa_supervisor"];
  if (user && !managerRoles.includes(user.role)) {
    query = query.or(
      `qa_coach_employee_id.eq.${user.employee_id},qa_evaluator_employee_id.eq.${user.employee_id},team_lead_employee_id.eq.${user.employee_id}`
    );
  }

  const { data: assignments, error } = await query;
  if (error) {
    console.error("[assignments] getAccountAssignmentRowsWithIds query error:", error.message, error.details, error.hint);
    return [];
  }
  if (!assignments || assignments.length === 0) return [];

  const ids = new Set<number>();
  for (const a of assignments) {
    [
      a.agent_employee_id,
      a.qa_coach_employee_id,
      a.qa_evaluator_employee_id,
      a.team_lead_employee_id,
    ].forEach((id) => {
      if (id != null) ids.add(id);
    });
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", [...ids]);

  const nameMap = new Map<number, string>(
    (employees ?? []).map((e) => [e.id, e.employee_name ?? "Unknown"])
  );

  return assignments.map((a) => ({
    assignmentId: a.assignment_id,
    agentId: a.agent_employee_id,
    name: nameMap.get(a.agent_employee_id) ?? "—",
    lobId: a.lob_id,
    coachId: a.qa_coach_employee_id ?? null,
    evaluatorId: a.qa_evaluator_employee_id ?? null,
    teamLeadId: a.team_lead_employee_id ?? null,
    status: "ACTIVE",
  }));
}

// Persists a batch of agent assignments for an account. Validates that every
// referenced employee and LOB belongs to the account, then upserts each row.
// New employees (via `agent`) are created together with their account link.
export async function persistAgentAssignments(
  accountCode: string,
  rows: SaveAgentAssignment[]
): Promise<PersistedAssignment[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) throw new Error("Account not found");

  const supabase = createAdminClient();

  // Membership sets used to validate references against this account only.
  // Any employee assigned to the account (regardless of role/assignment) is a
  // valid agent, coach, evaluator, or team lead reference.
  const { data: employeesForAccount } = await supabase
    .from("employees")
    .select("id")
    .not("role_id", "is", null);

  const validEmployeeIds = new Set<number>((employeesForAccount ?? []).map((employee) => employee.id));

  const { data: lobs } = await supabase
    .from("lobs")
    .select("lob_id")
    .eq("account_id", accountId);
  const validLobIds = new Set<number>((lobs ?? []).map((l) => l.lob_id));

  const { data: roles } = await supabase
    .from("roles")
    .select("role_id, role_name");
  const agentRoleId =
    roles?.find((r) => r.role_name.trim().toLowerCase() === "agent")?.role_id ??
    null;
  const agentRoleIds = (roles ?? [])
    .filter((role) => {
      const name = role.role_name.trim().toLowerCase().replace(/[_\s]+/g, " ");
      return name === "agent" || name === "agents";
    })
    .map((role) => role.role_id);
  const { data: accountAgentAssignments } = agentRoleIds.length > 0
    ? await supabase
        .from("employees")
        .select("id")
        .in("role_id", agentRoleIds)
    : { data: [] };
  const validAgentIds = new Set<number>(
    (accountAgentAssignments ?? []).map((employee) => employee.id)
  );
  const { data: existingAgentAssignments } = await supabase
    .from("agent_assignments")
    .select("assignment_id, agent_employee_id, qa_coach_employee_id, qa_evaluator_employee_id")
    .eq("account_id", accountId);

  const statuses = await getStatuses();
  const statusMap = new Map(
    statuses.map((s) => [s.status_name.trim().toUpperCase(), s.status_id])
  );

  // Pre-check new employees for duplicate codes / emails so we can return a
  // clear, human-readable error instead of a raw constraint violation.
  const newEmployees = rows.filter((r) => r.agent != null);
  if (newEmployees.length > 0) {
    const codes = newEmployees
      .map((r) => r.agent?.employeeCode?.trim())
      .filter((c): c is string => Boolean(c));
    const emails = newEmployees
      .map((r) => r.agent?.employeeEmail?.trim())
      .filter((e): e is string => Boolean(e));

    const dupErrors: string[] = [];

    if (codes.length > 0) {
      const { data } = await supabase
        .from("employees")
        .select("employee_code")
        .in("employee_code", codes);
      if (data && data.length > 0) {
        dupErrors.push(`Employee code already exists: ${data[0].employee_code}`);
      }
    }

    if (emails.length > 0) {
      const { data } = await supabase
        .from("employees")
        .select("employee_email")
        .in("employee_email", emails);
      if (data && data.length > 0) {
        dupErrors.push(
          `An employee with email ${data[0].employee_email} already exists`
        );
      }
    }

    if (dupErrors.length > 0) {
      throw new Error(dupErrors[0]);
    }
  }

  const results: PersistedAssignment[] = [];

  for (const row of rows) {
    let agentEmployeeId = row.agentId ?? null;
    let agentName = "";

    if (row.agent) {
      const statusId = statusMap.get(row.agent.status) ?? null;
      const { data: emp, error } = await supabase
        .from("employees")
        .insert({
          employee_code: row.agent.employeeCode,
          employee_name: row.agent.employeeName,
          employee_email: row.agent.employeeEmail ?? null,
          hire_date: row.agent.hireDate ?? null,
          status_id: statusId,
        })
        .select("id, employee_name")
        .single();
      if (error) throw new Error(`Could not create employee: ${error.message}`);
      agentEmployeeId = emp.id;
      agentName = emp.employee_name ?? row.agent.employeeName;
      if (agentRoleId != null) {
        await supabase
          .from("employee_assignments")
          .insert({
            employee_id: agentEmployeeId,
            role_id: agentRoleId,
            account_id: accountId,
          });
      }
    } else if (agentEmployeeId == null) {
      throw new Error("Each assignment must reference an agent");
    }

    if (!row.agent && agentEmployeeId != null && !validEmployeeIds.has(agentEmployeeId)) {
      throw new Error("Agent is not assigned to this account");
    }
    if (!row.agent && agentEmployeeId != null && !validAgentIds.has(agentEmployeeId)) {
      throw new Error("Selected employee is not an agent in this account");
    }
    if (!row.agent && !row.assignmentId) {
      const existing = existingAgentAssignments?.find(
        (assignment) => assignment.agent_employee_id === agentEmployeeId
      );
      if (existing?.qa_coach_employee_id != null || existing?.qa_evaluator_employee_id != null) {
        throw new Error("This agent already has a QA assignment");
      }
    }
    if (!validLobIds.has(row.lobId)) {
      throw new Error("Selected LOB does not belong to this account");
    }

    // The employee is intentionally unassigned until QA chooses an account.
    // Create that account link at the same time as the first QA assignment.
    if (!row.agent && !row.assignmentId) {
      const { data: accountLink, error: accountLinkError } = await supabase
        .from("employee_assignments")
        .select("assignment_id")
        .eq("employee_id", agentEmployeeId)
        .eq("account_id", accountId)
        .maybeSingle();
      if (accountLinkError) throw new Error("Could not verify the agent account assignment");
      if (!accountLink) {
        const { error } = await supabase
          .from("employee_assignments")
          .insert({
            employee_id: agentEmployeeId,
            role_id: agentRoleId,
            account_id: accountId,
            lob_id: row.lobId,
          });
        if (error) throw new Error(`Could not assign agent to account: ${error.message}`);
      }
    }

    for (const fid of [row.coachId, row.evaluatorId, row.teamLeadId]) {
      if (fid != null && !validEmployeeIds.has(fid)) {
        throw new Error(
          "A referenced QA / team lead is not assigned to this account"
        );
      }
    }

    const payload = {
      agent_employee_id: agentEmployeeId as number,
      account_id: accountId,
      lob_id: row.lobId,
      team_lead_employee_id: row.teamLeadId ?? null,
      qa_coach_employee_id: row.coachId ?? null,
      qa_evaluator_employee_id: row.evaluatorId ?? null,
    } as unknown as Database["public"]["Tables"]["agent_assignments"]["Insert"];

    if (row.assignmentId) {
      const { data, error } = await supabase
        .from("agent_assignments")
        .update(payload)
        .eq("assignment_id", row.assignmentId)
        .eq("account_id", accountId)
        .select("assignment_id")
        .single();
      if (error)
        throw new Error(`Could not update assignment: ${error.message}`);
      results.push({
        assignmentId: data.assignment_id,
        agentId: agentEmployeeId as number,
        name: agentName,
      });
    } else {
      const { data, error } = await supabase
        .from("agent_assignments")
        .insert(payload)
        .select("assignment_id")
        .single();
      if (error)
        throw new Error(`Could not create assignment: ${error.message}`);
      results.push({
        assignmentId: data.assignment_id,
        agentId: agentEmployeeId as number,
        name: agentName,
      });
    }
  }

  return results;
}
