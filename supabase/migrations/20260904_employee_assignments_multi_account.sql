-- Employees can be assigned to more than one account, but only once per account.
DROP INDEX IF EXISTS public.ux_employee_assignments_employee;

CREATE UNIQUE INDEX IF NOT EXISTS ux_employee_assignments_employee_account
ON public.employee_assignments (employee_id, account_id);
