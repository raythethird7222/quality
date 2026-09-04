-- Keep an employee's role available before account-level QA assignment.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS role_id bigint REFERENCES public.roles(role_id);

-- Preserve the existing role where an employee already has an assignment.
UPDATE public.employees e
SET role_id = source.role_id
FROM (
  SELECT DISTINCT ON (employee_id) employee_id, role_id
  FROM public.employee_assignments
  WHERE role_id IS NOT NULL
  ORDER BY employee_id, assignment_id
) source
WHERE e.id = source.employee_id
  AND e.role_id IS NULL;
