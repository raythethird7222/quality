// Protected employee directory API for manager-level users.
import { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validation";
import { getEmployeeManagementRows } from "@/lib/db/employees";
import { assertTrustedOrigin } from "@/server/security/origin";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { AuthorizationError, ValidationError } from "@/server/security/errors";
import { jsonError, jsonOk } from "@/server/security/http";

const MANAGER_ROLES = ["admin", "account_manager", "quality_coordinator", "qa_supervisor"];

async function requireManager() {
  const user = await requireUser();
  if (!MANAGER_ROLES.includes(user.role)) {
    throw new AuthorizationError("You do not have permission to manage employees");
  }
  return user;
}

export async function GET() {
  try {
    await requireManager();
    return jsonOk({ employees: await getEmployeeManagementRows() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("employees-write", 30, 60_000);
    await requireManager();
    const body = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid employee data");

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .insert(parsed.data)
      .select("id, employee_code, employee_name, employee_email, status_id, hire_date, vici_link")
      .single();
    if (error) throw new ValidationError(error.code === "23505" ? "Employee code or email already exists" : error.message);
    return jsonOk({ success: true, employee: data });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("employees-write", 30, 60_000);
    await requireManager();
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) throw new ValidationError("Invalid employee id");
    const parsed = updateEmployeeSchema.safeParse(await request.json());
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid employee data");

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .update(parsed.data)
      .eq("id", id)
      .select("id, employee_code, employee_name, employee_email, status_id, hire_date, vici_link")
      .single();
    if (error) throw new ValidationError(error.code === "23505" ? "Employee code or email already exists" : error.message);
    return jsonOk({ success: true, employee: data });
  } catch (error) {
    return jsonError(error);
  }
}
