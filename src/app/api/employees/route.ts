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
import { notifyAllEmployees } from "@/server/notifications";

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
    const { role_id: selectedRoleId, ...employeeFields } = parsed.data;
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("role_id, role_name");
    if (rolesError) throw new ValidationError("Unable to load employee roles");

    const agentRole = roles?.find((role) => {
      const name = role.role_name.trim().toLowerCase().replace(/[_\s]+/g, " ");
      return name === "agent" || name === "agents";
    });
    const selectedRole = selectedRoleId == null
      ? agentRole
      : roles?.find((role) => role.role_id === selectedRoleId);
    if (!selectedRole) throw new ValidationError("Agent role is not configured");
    if (selectedRole.role_name.trim().toLowerCase() === "admin") {
      throw new AuthorizationError("Admin role cannot be assigned from Employee Management");
    }

    if (selectedRoleId != null) {
      const { data: role, error: roleError } = await supabase
        .from("roles")
        .select("role_id, role_name")
        .eq("role_id", selectedRoleId)
        .maybeSingle();
      if (roleError || !role) throw new ValidationError("Selected role is invalid");
      if (role.role_name.trim().toLowerCase() === "admin") {
        throw new AuthorizationError("Admin role cannot be assigned from Employee Management");
      }
    }

    const { data, error } = await supabase
      .from("employees")
      .insert({ ...employeeFields, role_id: selectedRole.role_id })
      .select("id, employee_code, employee_name, employee_email, role_id, status_id, hire_date, vici_link")
      .single();
    if (error) throw new ValidationError(error.code === "23505" ? "Employee code or email already exists" : error.message);

    await notifyAllEmployees(
      "Employee added",
      `${data.employee_name ?? "New employee"} is ready for account assignment.`,
    );

    return jsonOk({
      success: true,
      employee: {
        ...data,
        assignments: [],
      },
    });
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
    const { role_id: selectedRoleId, ...employeeData } = parsed.data;
    if (selectedRoleId != null) {
      const { data: role, error: roleError } = await supabase
        .from("roles")
        .select("role_id, role_name")
        .eq("role_id", selectedRoleId)
        .maybeSingle();
      if (roleError || !role) throw new ValidationError("Selected role is invalid");
      if (role.role_name.trim().toLowerCase() === "admin") {
        throw new AuthorizationError("Admin role cannot be assigned from Employee Management");
      }
    }
    const { data, error } = await supabase
      .from("employees")
      .update({ ...employeeData, ...(selectedRoleId != null ? { role_id: selectedRoleId } : {}) })
      .eq("id", id)
      .select("id, employee_code, employee_name, employee_email, role_id, status_id, hire_date, vici_link")
      .single();
    if (error) throw new ValidationError(error.code === "23505" ? "Employee code or email already exists" : error.message);
    if (selectedRoleId != null) {
      const { error: assignmentError } = await supabase
        .from("employee_assignments")
        .update({ role_id: selectedRoleId })
        .eq("employee_id", id);
      if (assignmentError) throw new ValidationError("Unable to update employee role");
    }
    return jsonOk({ success: true, employee: data });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("employees-delete", 10, 60_000);
    const user = await requireManager();
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) throw new ValidationError("Invalid employee id");
    if (user.employee_id === id) throw new AuthorizationError("You cannot delete your own employee account");

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Confirmation is required");
    }
    const confirmation = typeof body === "object" && body !== null && "confirmation" in body
      ? (body as { confirmation?: unknown }).confirmation
      : undefined;
    if (typeof confirmation !== "string" || confirmation.trim().length === 0) {
      throw new ValidationError("Confirmation is required");
    }

    const supabase = createAdminClient();
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, employee_name")
      .eq("id", id)
      .maybeSingle();
    if (employeeError) throw new ValidationError("Unable to find employee");
    if (!employee) throw new ValidationError("Employee not found");
    if (confirmation.trim() !== (employee.employee_name ?? "").trim()) {
      throw new ValidationError("Confirmation does not match the employee name");
    }

    const { data: employeeAssignments, error: assignmentLookupError } = await supabase
      .from("employee_assignments")
      .select("assignment_id")
      .eq("employee_id", id);
    if (assignmentLookupError) throw new ValidationError("Unable to prepare employee deletion");

    const assignmentIds = (employeeAssignments ?? []).map((assignment) => assignment.assignment_id);
    if (assignmentIds.length > 0) {
      const { error } = await supabase
        .from("assignment_reporting")
        .delete()
        .in("employee_assignment_id", assignmentIds);
      if (error) throw new ValidationError("Unable to remove employee reporting links");
    }

    const cleanup = [
      supabase.from("assignment_reporting").delete().eq("supervisor_employee_id", id),
      supabase.from("agent_assignments").delete().or(
        `agent_employee_id.eq.${id},qa_coach_employee_id.eq.${id},qa_evaluator_employee_id.eq.${id},team_lead_employee_id.eq.${id}`
      ),
      supabase.from("employee_assignments").delete().eq("employee_id", id),
      supabase.from("rm_covers").delete().eq("employee_id", id),
      supabase.from("rm_mqpm_performance").delete().or(`employee_id.eq.${id},qa_coach_employee_id.eq.${id}`),
      supabase.from("evaluations").update({
        agent_employee_id: null,
        qa_coach_employee_id: null,
        qa_evaluator_employee_id: null,
        team_lead_employee_id: null,
      } as never).or(
        `agent_employee_id.eq.${id},qa_coach_employee_id.eq.${id},qa_evaluator_employee_id.eq.${id},team_lead_employee_id.eq.${id}`
      ),
    ];
    const cleanupResults = await Promise.all(cleanup);
    const cleanupError = cleanupResults.find((result) => result.error)?.error;
    if (cleanupError) throw new ValidationError("Unable to remove employee dependencies");

    const { error: deleteError } = await supabase.from("employees").delete().eq("id", id);
    if (deleteError) throw new ValidationError("Unable to delete employee");

    await notifyAllEmployees("Employee deleted", `${employee.employee_name ?? "An employee"} was removed from the employee directory.`);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
