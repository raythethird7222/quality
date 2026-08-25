// Authentication helpers: cookie-based session reading, role normalization,
// and building the application AuthUser from an employee's assignments.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser, AccountAssignment, AccountLabel, UserRole } from "@/types";
import { getEmployeeAllAssignments, type EmployeeRecord } from "@/lib/db/employees";

// Name of the cookie that stores the serialized auth user.
const AUTH_COOKIE_NAME = "qa-rey-auth";

// Account codes recognized by the application for assignment filtering.
const KNOWN_ACCOUNT_CODES = [
  "JS",
  "DFT",
  "RM",
  "BF",
  "FLEXAR",
  "SPA",
  "COVA",
  "FLEET",
];

// Maps raw role name strings to the canonical UserRole values.
const ROLE_MAP: Record<string, UserRole> = {
  agent: "agent",
  qa: "qa",
  "qa supervisor": "qa_supervisor",
  "account manager": "account_manager",
  "quality coordinator": "quality_coordinator",
  admin: "admin",
  tl: "team_lead",
  "team lead": "team_lead",
};

// Normalizes a free-text role name into a canonical UserRole (defaults to "qa").
export function normalizeRole(roleName: string): UserRole {
  return ROLE_MAP[roleName.trim().toLowerCase()] ?? "qa";
}

/**
 * Builds the application AuthUser from an employee record by resolving their
 * account assignments. Returns null when the employee has no assignments to
 * any of the known accounts (used by both password and Google login).
 */
export async function buildAuthUserFromEmployee(
  employee: EmployeeRecord
): Promise<AuthUser | null> {
  const assignments = await getEmployeeAllAssignments(employee.id);

  const known = assignments.filter((a) =>
    KNOWN_ACCOUNT_CODES.includes(a.account_code.toUpperCase())
  );

  const byAccount = new Map<string, (typeof known)[number]>();
  for (const assignment of known) {
    const code = assignment.account_code.toUpperCase();
    const existing = byAccount.get(code);
    const isAgent = normalizeRole(assignment.role_name) === "agent";
    if (!existing) {
      byAccount.set(code, assignment);
    } else if (!isAgent && normalizeRole(existing.role_name) === "agent") {
      byAccount.set(code, assignment);
    }
  }

  const uniqueAssignments = [...byAccount.values()];

  if (uniqueAssignments.length === 0) return null;

  const primary = uniqueAssignments[0];
  const accountAssignments: AccountAssignment[] = uniqueAssignments.map((a) => ({
    account: a.account_code.toUpperCase() as AccountLabel,
    account_name: a.account_name,
    role: normalizeRole(a.role_name),
    role_name: a.role_name,
  }));

  return {
    employee_id: employee.id,
    employee_name: employee.employee_name ?? "",
    employee_email: employee.employee_email ?? "",
    employee_code: employee.employee_code ?? "",
    account: primary.account_code.toUpperCase() as AccountLabel,
    account_name: primary.account_name,
    role: normalizeRole(primary.role_name),
    role_name: primary.role_name,
    avatar_url: employee.avatar_url ?? undefined,
    accounts: accountAssignments,
  };
}

// Reads and validates the current auth user from the session cookie.
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      parsed.employee_name &&
      parsed.employee_email &&
      parsed.employee_code &&
      parsed.account &&
      parsed.role
    ) {
      return parsed as AuthUser;
    }
  } catch {
    return null;
  }

  return null;
}

// Redirects to /login when no session user exists; otherwise returns the user.
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

// Parses and validates a raw auth cookie string into an AuthUser, if well-formed.
export function parseAuthCookieValue(raw: string): AuthUser | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      parsed.employee_name &&
      parsed.employee_email &&
      parsed.employee_code &&
      parsed.account &&
      parsed.role
    ) {
      return parsed as AuthUser;
    }
  } catch {
    return null;
  }
  return null;
}
