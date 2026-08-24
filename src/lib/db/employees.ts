import { createServerClient } from "@/lib/supabase/server";

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
  const supabase = createServerClient();
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
  const supabase = createServerClient();
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
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("lobs")
    .select("lob_id, lob_name");
  if (error) {
    console.error("Error loading lobs:", error);
    return [];
  }
  return (data ?? []) as { lob_id: number; lob_name: string }[];
}

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

export async function getEmployeeByEmailAndPassword(
  email: string,
  employeeId: string
) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_id, employee_name, employee_email, avatar_url")
    .eq("employee_email", email)
    .eq("employee_id", employeeId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as {
    id: number;
    employee_id: string;
    employee_name: string;
    employee_email: string;
    avatar_url: string | null;
  };
}

export type EmployeeRecord = {
  id: number;
  employee_id: string;
  employee_name: string | null;
  employee_email: string | null;
  avatar_url: string | null;
};

export async function getEmployeeByEmail(email: string) {
  const supabase = createServerClient();

  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_id, employee_name, employee_email, avatar_url")
    .ilike("employee_email", normalized)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as EmployeeRecord;
}

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

export async function getEmployeesByAccount(accountCode: string) {
  const supabase = createServerClient();

  const accounts = await loadAccounts();
  const accountId = accounts.find(
    (a) => a.account_code.toLowerCase() === accountCode.toLowerCase()
  )?.account_id;

  if (!accountId) return [];

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, employee_id, employee_name, employee_email");

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

export async function getEmployeesWithAssignments(accountCode: string) {
  return getEmployeesByAccount(accountCode);
}

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

  const employeeIds = [...new Set((allAssignments ?? []).map((a) => a.employee_id))];

  if (employeeIds.length === 0) {
    return { employees: [], total: 0, page, pageSize, totalPages: 0 };
  }

  let query = supabase
    .from("employees")
    .select("id, employee_id, employee_name, employee_email", { count: "exact" })
    .in("id", employeeIds);

  if (search) {
    query = query.or(
      `employee_name.ilike.%${search}%,employee_email.ilike.%${search}%,employee_id.ilike.%${search}%`
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