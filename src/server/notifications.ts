import { createAdminClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/server/auth/roles";

const NOTIFICATION_ROLES = new Set(["qa", "qa_supervisor", "team_lead"]);

// Broadcasts activity to every employee so notifications are not limited to a
// single account or the user who performed the action.
export async function notifyAllEmployees(title: string, description: string, excludeEmployeeId?: number) {
  const admin = createAdminClient();
  const { data: employees, error: employeeError } = await admin
    .from("employees")
    .select("id, role_id");
  if (employeeError || !employees?.length) return;

  const roleIds = [...new Set(employees.map((employee) => employee.role_id).filter((id): id is number => id != null))];
  const { data: roles } = await admin.from("roles").select("role_id, role_name").in("role_id", roleIds);
  const roleNames = new Map((roles ?? []).map((role) => [role.role_id, role.role_name]));

  const rows = employees
    .filter((employee) => {
      return NOTIFICATION_ROLES.has(normalizeRole(roleNames.get(employee.role_id ?? -1) ?? "") ?? "");
    })
    .filter((employee) => employee.id !== excludeEmployeeId)
    .map((employee) => ({
      recipient_employee_id: employee.id,
      title,
      description,
    }));
  if (rows.length === 0) return;

  const { error } = await admin.from("notifications").insert(rows);
  if (error) console.error("[notifications] broadcast failed:", error.message);
}
