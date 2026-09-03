// Shared database helpers: role-scoping, agent resolution, and name lookups.
// Extracted from quality.ts and employees.ts to eliminate duplicated queries.

import { createServerClient } from "@/lib/supabase/server";
import type { AuthUser, UserRole } from "@/types";

// Roles that see the full analytics picture for an account.
const MANAGER_ROLES: UserRole[] = [
  "admin",
  "account_manager",
  "quality_coordinator",
  "qa_supervisor",
];

// Returns true when the given role is a manager-level role.
export function isManagerRole(role: UserRole | undefined): boolean {
  return role != null && MANAGER_ROLES.includes(role);
}

// Result of a scoped agent lookup: the set of agent employee IDs visible to
// the given user, or null when the user is a manager (sees all agents).
export type ScopedAgentResult = {
  agentIds: number[] | null; // null = manager, sees all
};

/**
 * Resolves the agent IDs scoped to the given user's role within an account.
 * Managers/admins see all agents (returns null). Non-managers see only agents
 * they coach, evaluate, or lead.
 *
 * This is a single, shared query replacing 6+ duplicate implementations.
 */
export async function getScopedAgentIds(
  accountId: number,
  user?: AuthUser
): Promise<ScopedAgentResult> {
  if (!user || isManagerRole(user.role)) {
    return { agentIds: null };
  }

  const supabase = await createServerClient();
  const { data: scopedAssignments } = await supabase
    .from("agent_assignments")
    .select("agent_employee_id")
    .eq("account_id", accountId)
    .or(
      `qa_coach_employee_id.eq.${user.employee_id},qa_evaluator_employee_id.eq.${user.employee_id},team_lead_employee_id.eq.${user.employee_id}`
    );

  const agentIds = [
    ...new Set(
      (scopedAssignments ?? [])
        .map((a) => a.agent_employee_id)
        .filter((id): id is number => id != null)
    ),
  ];

  return { agentIds };
}

// A map from employee ID to display name.
export type EmployeeNameMap = Map<number, string>;

/**
 * Resolves display names for a set of employee IDs in a single query.
 * Returns a Map<id, name> for O(1) lookups.
 */
export async function getEmployeeNameMap(
  ids: Set<number> | number[]
): Promise<EmployeeNameMap> {
  const idArray = [...new Set(ids)].filter((id): id is number => id != null);
  if (idArray.length === 0) return new Map();

  const supabase = await createServerClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", idArray);

  return new Map(
    (employees ?? []).map((e) => [e.id, e.employee_name ?? "Unknown"])
  );
}

/**
 * Applies scoped agent filtering to a Supabase query builder.
 * If the user is a manager, no filter is applied (they see everything).
 * If the user is non-manager, adds an `.in("agent_employee_id", scopedIds)` filter.
 * Returns the modified query and whether the user has zero scoped agents.
 */
export function applyScopedAgentFilter<T extends { in(col: string, vals: number[]): T }>(
  query: T,
  scoped: ScopedAgentResult
): { query: T; isEmpty: boolean } {
  if (scoped.agentIds === null) {
    return { query, isEmpty: false };
  }
  if (scoped.agentIds.length === 0) {
    return { query, isEmpty: true };
  }
  return { query: query.in("agent_employee_id", scoped.agentIds), isEmpty: false };
}
