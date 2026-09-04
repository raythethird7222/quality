import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { AuthUser, AccountAssignment, AccountLabel } from "@/types";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/server/auth/roles";
import { AuthenticationError, AuthorizationError } from "@/server/security/errors";
import { getRolePermissions, type Permission } from "@/server/authorization/permissions";

type EmployeeRecord = {
  id: number;
  employee_code: string | null;
  employee_name: string | null;
  employee_email: string | null;
  role_id: number | null;
  avatar_url: string | null;
};

type AssignmentRow = {
  role_id: number | null;
  account_id: number | null;
  roles: { role_name: string } | null;
  accounts: { account_code: string; account_name: string } | null;
};

type AccountRow = {
  account_code: string;
  account_name: string | null;
};

/**
 * Resolves application authorization data only after Supabase Auth has verified
 * the identity. Database lookup uses the server-only admin client so RLS does
 * not accidentally turn a valid session into a false 401; the result is never
 * accepted from browser data.
 */
export async function resolveAuthenticatedEmployee(
  authUserId: string,
  authEmail: string | undefined
): Promise<AuthUser | null> {
  const email = authEmail?.trim().toLowerCase();
  if (!authUserId || !email) return null;

  const admin = createAdminClient();
  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, employee_code, employee_name, employee_email, role_id, avatar_url")
    .ilike("employee_email", email)
    .maybeSingle();

  if (employeeError || !employee) {
    return null;
  }

  const { data: assignments, error: assignmentError } = await admin
    .from("employee_assignments")
    .select(`
      role_id,
      account_id,
      roles:role_id(role_name),
      accounts:account_id(account_code, account_name)
    `)
    .eq("employee_id", employee.id);

  if (assignmentError) {
    return null;
  }

  // Employees may log in before their first account-level assignment. Use the
  // first account only as temporary navigation context; permissions still
  // determine which actions they can perform.
  if (!assignments?.length && employee.role_id != null) {
    const [{ data: role }, { data: primaryAccount }] = await Promise.all([
      admin.from("roles").select("role_name").eq("role_id", employee.role_id).maybeSingle(),
      admin.from("accounts").select("account_code, account_name").order("account_code", { ascending: true }).limit(1).maybeSingle(),
    ]);
    const roleName = role?.role_name ?? "";
    const normalizedRole = normalizeRole(roleName);
    const account = primaryAccount as AccountRow | null;
    if (normalizedRole && account?.account_code && account.account_name) {
      return {
        auth_user_id: authUserId,
        employee_id: employee.id,
        employee_name: employee.employee_name ?? "",
        employee_email: employee.employee_email ?? "",
        employee_code: employee.employee_code ?? "",
        avatar_url: employee.avatar_url ?? undefined,
        account: account.account_code.toUpperCase() as AccountLabel,
        account_name: account.account_name,
        role: normalizedRole,
        role_name: roleName,
        accounts: [{
          account: account.account_code.toUpperCase() as AccountLabel,
          account_name: account.account_name,
          role: normalizedRole,
          role_name: roleName,
        }],
      } as AuthUser;
    }
  }

  const accountAssignments: AccountAssignment[] = [];
  let unscopedManagerRole: { role: AuthUser["role"]; roleName: string } | null = null;

  for (const assignment of assignments as AssignmentRow[]) {
    const roleName = assignment.roles?.role_name;
    const account = assignment.accounts;
    if (!roleName) {
      continue;
    }

    const role = normalizeRole(roleName);
    if (!role) {
      continue;
    }

    // A manager-level assignment with no account is an intentional global
    // assignment. It is trusted only because both the role and assignment were
    // read server-side from the database after Supabase verified the user.
    if (!account?.account_code || !account.account_name) {
      if (isManagerRole(role)) {
        unscopedManagerRole = { role, roleName };
      }
      continue;
    }

    accountAssignments.push({
      account: account.account_code.toUpperCase() as AccountLabel,
      account_name: account.account_name,
      role,
      role_name: roleName,
    });
  }

  if (accountAssignments.length === 0 && unscopedManagerRole) {
    const { data: primaryAccount, error: accountError } = await admin
      .from("accounts")
      .select("account_code, account_name")
      .order("account_code", { ascending: true })
      .limit(1)
      .maybeSingle();

    const account = primaryAccount as AccountRow | null;
    if (!accountError && account?.account_code && account.account_name) {
      accountAssignments.push({
        account: account.account_code.toUpperCase() as AccountLabel,
        account_name: account.account_name,
        role: unscopedManagerRole.role,
        role_name: unscopedManagerRole.roleName,
      });
    }
  }

  if (accountAssignments.length === 0) {
    return null;
  }

  const primary = accountAssignments[0];
  return {
    auth_user_id: authUserId,
    employee_id: (employee as EmployeeRecord).id,
    employee_name: employee.employee_name ?? "",
    employee_email: employee.employee_email ?? "",
    employee_code: employee.employee_code ?? "",
    avatar_url: employee.avatar_url ?? undefined,
    account: primary.account,
    account_name: primary.account_name,
    role: primary.role,
    role_name: primary.role_name,
    accounts: accountAssignments,
  } as AuthUser;
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createServerClient();
  // getUser validates the bearer token with Supabase Auth. Do not use a
  // browser-supplied employee id, role, or user metadata for authorization.
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  return resolveAuthenticatedEmployee(authData.user.id, authData.user.email);
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  const permissions = getRolePermissions(user.role);
  if (!permissions.has(permission)) {
    throw new AuthorizationError();
  }
  return user;
}

const MANAGER_ROLES = new Set([
  "admin",
  "account_manager",
  "quality_coordinator",
  "qa_supervisor",
]);

function isManagerRole(role: string): boolean {
  return MANAGER_ROLES.has(role);
}

export async function requireAccountAccess(accountCode: string) {
  const user = await requireUser();
  const normalized = accountCode.trim().toUpperCase();
  const assignment = user.accounts.find((entry) => entry.account === normalized);

  if (!assignment && !isManagerRole(user.role)) {
    throw new AuthorizationError("You do not have access to this account");
  }

  return { user, accountCode: normalized };
}

export async function authorize(options: { permission?: Permission; accountCode?: string }) {
  const user = options.permission
    ? await requirePermission(options.permission)
    : await requireUser();

  if (options.accountCode) {
    const normalized = options.accountCode.trim().toUpperCase();
    const assignment = user.accounts.find((entry) => entry.account === normalized);
    if (!assignment && !isManagerRole(user.role)) {
      throw new AuthorizationError("You do not have access to this account");
    }
    return { user, accountCode: normalized };
  }

  return { user };
}
