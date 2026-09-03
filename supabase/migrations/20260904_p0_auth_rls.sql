begin;

create extension if not exists pgcrypto;

create or replace function public.current_employee_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.current_employee_id()
returns integer
language sql
stable
as $$
  select e.id
  from public.employees e
  where lower(coalesce(e.employee_email, '')) = public.current_employee_email()
  limit 1
$$;

create or replace function public.has_account_access(target_account_id integer)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.employee_assignments ea
    join public.roles r on r.role_id = ea.role_id
    where ea.employee_id = public.current_employee_id()
      and ea.account_id = target_account_id
  )
  or exists (
    select 1
    from public.employee_assignments ea
    join public.roles r on r.role_id = ea.role_id
    where ea.employee_id = public.current_employee_id()
      and lower(r.role_name) in ('admin', 'account manager', 'quality coordinator', 'qa supervisor')
  )
$$;

create or replace function public.has_assignment_management_permission()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.employee_assignments ea
    join public.roles r on r.role_id = ea.role_id
    where ea.employee_id = public.current_employee_id()
      and lower(r.role_name) in ('admin', 'account manager', 'quality coordinator', 'qa supervisor')
  )
$$;

create or replace function public.has_evaluation_create_permission(target_account_id integer)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.employee_assignments ea
    join public.roles r on r.role_id = ea.role_id
    where ea.employee_id = public.current_employee_id()
      and (
        lower(r.role_name) in ('admin', 'account manager', 'quality coordinator', 'qa supervisor')
        or (lower(r.role_name) = 'qa' and ea.account_id = target_account_id)
      )
  )
$$;

alter table public.employees enable row level security;
alter table public.accounts enable row level security;
alter table public.roles enable row level security;
alter table public.lobs enable row level security;
alter table public.employee_assignments enable row level security;
alter table public.agent_assignments enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_parameters enable row level security;
alter table public.rm_mqpm_performance enable row level security;
alter table public.assignment_reporting enable row level security;

drop policy if exists employees_select_self_or_visible on public.employees;
create policy employees_select_self_or_visible
on public.employees
for select
to authenticated
using (
  id = public.current_employee_id()
  or exists (
    select 1
    from public.employee_assignments ea
    where ea.employee_id = employees.id
      and public.has_account_access(ea.account_id)
  )
);

drop policy if exists employees_update_self on public.employees;
create policy employees_update_self
on public.employees
for update
to authenticated
using (id = public.current_employee_id())
with check (id = public.current_employee_id());

drop policy if exists accounts_select_visible on public.accounts;
create policy accounts_select_visible
on public.accounts
for select
to authenticated
using (public.has_account_access(account_id));

drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated
on public.roles
for select
to authenticated
using (true);

drop policy if exists lobs_select_visible on public.lobs;
create policy lobs_select_visible
on public.lobs
for select
to authenticated
using (public.has_account_access(account_id));

drop policy if exists employee_assignments_select_visible on public.employee_assignments;
create policy employee_assignments_select_visible
on public.employee_assignments
for select
to authenticated
using (
  employee_id = public.current_employee_id()
  or public.has_account_access(account_id)
);

drop policy if exists employee_assignments_manage on public.employee_assignments;
create policy employee_assignments_manage
on public.employee_assignments
for all
to authenticated
using (public.has_assignment_management_permission() and public.has_account_access(account_id))
with check (public.has_assignment_management_permission() and public.has_account_access(account_id));

drop policy if exists agent_assignments_select_visible on public.agent_assignments;
create policy agent_assignments_select_visible
on public.agent_assignments
for select
to authenticated
using (
  public.has_account_access(account_id)
  and (
    public.has_assignment_management_permission()
    or qa_coach_employee_id = public.current_employee_id()
    or qa_evaluator_employee_id = public.current_employee_id()
    or team_lead_employee_id = public.current_employee_id()
    or agent_employee_id = public.current_employee_id()
  )
);

drop policy if exists agent_assignments_manage on public.agent_assignments;
create policy agent_assignments_manage
on public.agent_assignments
for all
to authenticated
using (public.has_assignment_management_permission() and public.has_account_access(account_id))
with check (public.has_assignment_management_permission() and public.has_account_access(account_id));

drop policy if exists evaluations_select_visible on public.evaluations;
create policy evaluations_select_visible
on public.evaluations
for select
to authenticated
using (
  public.has_account_access(account_id)
  and (
    public.has_assignment_management_permission()
    or qa_evaluator_employee_id = public.current_employee_id()
    or qa_coach_employee_id = public.current_employee_id()
    or team_lead_employee_id = public.current_employee_id()
    or agent_employee_id = public.current_employee_id()
  )
);

drop policy if exists evaluations_insert_controlled on public.evaluations;
create policy evaluations_insert_controlled
on public.evaluations
for insert
to authenticated
with check (
  public.has_evaluation_create_permission(account_id)
  and public.has_account_access(account_id)
  and qa_evaluator_employee_id = public.current_employee_id()
  and exists (
    select 1
    from public.agent_assignments aa
    where aa.account_id = evaluations.account_id
      and aa.agent_employee_id = evaluations.agent_employee_id
      and (
        aa.qa_evaluator_employee_id = public.current_employee_id()
        or public.has_assignment_management_permission()
      )
  )
);

drop policy if exists evaluation_parameters_select_visible on public.evaluation_parameters;
create policy evaluation_parameters_select_visible
on public.evaluation_parameters
for select
to authenticated
using (public.has_account_access(account_id));

drop policy if exists rm_mqpm_performance_select_visible on public.rm_mqpm_performance;
create policy rm_mqpm_performance_select_visible
on public.rm_mqpm_performance
for select
to authenticated
using (public.has_account_access(account_id));

drop policy if exists assignment_reporting_select_visible on public.assignment_reporting;
create policy assignment_reporting_select_visible
on public.assignment_reporting
for select
to authenticated
using (
  exists (
    select 1
    from public.employee_assignments ea
    where ea.assignment_id = assignment_reporting.employee_assignment_id
      and public.has_account_access(ea.account_id)
  )
);

commit;
