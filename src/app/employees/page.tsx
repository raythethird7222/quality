// Manager-only employee directory page.
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getEmployeeManagementRows, getRoles } from "@/lib/db/employees";
import { getStatuses } from "@/lib/db/quality";
import { isManagerRole } from "@/lib/db/helpers";
import EmployeeManagementView from "@/features/employees/components/EmployeeManagementView";

export default async function EmployeesPage() {
  const user = await requireAuth();
  if (!isManagerRole(user.role) && user.role !== "admin") notFound();

  const [employees, statuses, roles] = await Promise.all([
    getEmployeeManagementRows(),
    getStatuses(),
    getRoles(),
  ]);
  return <EmployeeManagementView initialEmployees={employees} statuses={statuses} roles={roles} />;
}
