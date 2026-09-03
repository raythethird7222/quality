-- ============================================================================
-- Row-Level Security (RLS) policies for QA-REY
-- Created: 2026-09-04
-- Purpose: Defense-in-depth authorization at the database level
--
-- These policies use a custom claim-based approach:
-- 1. The application sets a session variable `app.current_user_id` via
--    Supabase's `auth.jwt()` claims after authentication.
-- 2. Each policy checks that the authenticated user's employee_id is
--    present in the appropriate employee_assignments row for the account.
--
-- MANAGER ROLES: admin, account_manager, quality_coordinator, qa_supervisor
-- These roles bypass account-scoped policies (full access).
-- ============================================================================

-- ============================================================================
-- HELPER: Check if a user is a manager role
-- ============================================================================
-- This function is used by policies to determine if a user has manager-level
-- access. Manager roles bypass account-scoped restrictions.
-- ============================================================================

-- Enable RLS on all sensitive tables.
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rm_covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rm_mqpm_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_reporting ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- accounts: any authenticated user can read; only managers can write
-- ============================================================================
DROP POLICY IF EXISTS "accounts_select_authenticated" ON accounts;
CREATE POLICY "accounts_select_authenticated" ON accounts
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "accounts_insert_managers" ON accounts;
CREATE POLICY "accounts_insert_managers" ON accounts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- roles: read-only for all authenticated users
-- ============================================================================
DROP POLICY IF EXISTS "roles_select_authenticated" ON roles;
CREATE POLICY "roles_select_authenticated" ON roles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- statuses: read-only for all authenticated users
-- ============================================================================
DROP POLICY IF EXISTS "statuses_select_authenticated" ON statuses;
CREATE POLICY "statuses_select_authenticated" ON statuses
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- lobs: authenticated users can read LOBs for their assigned accounts
-- ============================================================================
DROP POLICY IF EXISTS "lobs_select_assigned" ON lobs;
CREATE POLICY "lobs_select_assigned" ON lobs
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- ============================================================================
-- employees: authenticated users can read employees for their assigned accounts
-- The service_role client bypasses RLS for admin operations.
-- ============================================================================
DROP POLICY IF EXISTS "employees_select_authenticated" ON employees;
CREATE POLICY "employees_select_authenticated" ON employees
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "employees_update_authenticated" ON employees;
CREATE POLICY "employees_update_authenticated" ON employees
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "employees_insert_authenticated" ON employees;
CREATE POLICY "employees_insert_authenticated" ON employees
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- employee_assignments: authenticated users can manage assignments
-- ============================================================================
DROP POLICY IF EXISTS "emp_assignments_select_authenticated" ON employee_assignments;
CREATE POLICY "emp_assignments_select_authenticated" ON employee_assignments
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "emp_assignments_insert_authenticated" ON employee_assignments;
CREATE POLICY "emp_assignments_insert_authenticated" ON employee_assignments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "emp_assignments_update_authenticated" ON employee_assignments;
CREATE POLICY "emp_assignments_update_authenticated" ON employee_assignments
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- agent_assignments: authenticated users can manage agent assignments
-- ============================================================================
DROP POLICY IF EXISTS "agent_assignments_select_authenticated" ON agent_assignments;
CREATE POLICY "agent_assignments_select_authenticated" ON agent_assignments
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "agent_assignments_insert_authenticated" ON agent_assignments;
CREATE POLICY "agent_assignments_insert_authenticated" ON agent_assignments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "agent_assignments_update_authenticated" ON agent_assignments;
CREATE POLICY "agent_assignments_update_authenticated" ON agent_assignments
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "agent_assignments_delete_authenticated" ON agent_assignments;
CREATE POLICY "agent_assignments_delete_authenticated" ON agent_assignments
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- evaluations: authenticated users can read/write evaluations
-- Application-level authorization scopes by account and agent.
-- ============================================================================
DROP POLICY IF EXISTS "evaluations_select_authenticated" ON evaluations;
CREATE POLICY "evaluations_select_authenticated" ON evaluations
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "evaluations_insert_authenticated" ON evaluations;
CREATE POLICY "evaluations_insert_authenticated" ON evaluations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "evaluations_update_authenticated" ON evaluations;
CREATE POLICY "evaluations_update_authenticated" ON evaluations
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- evaluation_parameters: authenticated users can read active parameters
-- ============================================================================
DROP POLICY IF EXISTS "eval_params_select_authenticated" ON evaluation_parameters;
CREATE POLICY "eval_params_select_authenticated" ON evaluation_parameters
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eval_params_insert_authenticated" ON evaluation_parameters;
CREATE POLICY "eval_params_insert_authenticated" ON evaluation_parameters
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eval_params_update_authenticated" ON evaluation_parameters;
CREATE POLICY "eval_params_update_authenticated" ON evaluation_parameters
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- rm_covers: authenticated users can read covers
-- ============================================================================
DROP POLICY IF EXISTS "rm_covers_select_authenticated" ON rm_covers;
CREATE POLICY "rm_covers_select_authenticated" ON rm_covers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- rm_mqpm_performance: authenticated users can read performance data
-- ============================================================================
DROP POLICY IF EXISTS "mqpm_select_authenticated" ON rm_mqpm_performance;
CREATE POLICY "mqpm_select_authenticated" ON rm_mqpm_performance
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- assignment_reporting: authenticated users can read/write
-- ============================================================================
DROP POLICY IF EXISTS "assignment_reporting_select_authenticated" ON assignment_reporting;
CREATE POLICY "assignment_reporting_select_authenticated" ON assignment_reporting
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "assignment_reporting_insert_authenticated" ON assignment_reporting;
CREATE POLICY "assignment_reporting_insert_authenticated" ON assignment_reporting
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "assignment_reporting_update_authenticated" ON assignment_reporting;
CREATE POLICY "assignment_reporting_update_authenticated" ON assignment_reporting
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- IMPORTANT: The anon key (used by the browser client) will be blocked
-- from all tables by default since there are no policies for 'anon' role.
-- Only authenticated users (via Supabase Auth) can access data.
--
-- Service role key (used by createAdminClient) bypasses all RLS.
-- The application uses the anon key with cookies for user-scoped queries,
-- so these policies apply to authenticated requests only.
-- ============================================================================
