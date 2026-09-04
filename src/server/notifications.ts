import { createAdminClient } from "@/lib/supabase/server";

// Broadcasts activity to every employee so notifications are not limited to a
// single account or the user who performed the action.
export async function notifyAllEmployees(title: string, description: string, excludeEmployeeId?: number) {
  const admin = createAdminClient();
  const { data: employees, error: employeeError } = await admin.from("employees").select("id");
  if (employeeError || !employees?.length) return;

  const rows = employees
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
