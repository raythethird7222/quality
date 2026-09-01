-- Performance indexes for QA-REY application
-- Created: 2026-09-01
-- Purpose: Optimize frequently queried columns across all core tables

-- ============================================================================
-- 1. evaluations (heaviest table, most queries)
-- ============================================================================

-- Primary query pattern: .eq("account_id", X).order("evaluation_date", DESC)
-- Used by: getQaEvaluationsByAccount, getAccountEvaluationAnalytics, getAccountEvaluationsForPeriod, getDashboardChartAnalytics
CREATE INDEX IF NOT EXISTS idx_evaluations_account_date
ON evaluations(account_id, evaluation_date DESC);

-- Agent-scoped queries: .eq("account_id", X).eq("agent_employee_id", Y)
-- Used by: getAgentEvaluations, role-scoped analytics filtering
CREATE INDEX IF NOT EXISTS idx_evaluations_account_agent
ON evaluations(account_id, agent_employee_id);

-- Dashboard chart analytics: multi-account IN query with date ordering
-- Used by: getDashboardChartAnalytics (.in("account_id", [...]))
CREATE INDEX IF NOT EXISTS idx_evaluations_account_date_cover
ON evaluations(account_id, evaluation_date)
INCLUDE (lob_id, qa_score, agent_employee_id);

-- LOB filtering within evaluations
CREATE INDEX IF NOT EXISTS idx_evaluations_lob
ON evaluations(lob_id)
WHERE lob_id IS NOT NULL;

-- Guideline filtering (partial index for non-null guidelines)
CREATE INDEX IF NOT EXISTS idx_evaluations_guideline
ON evaluations(guideline)
WHERE guideline IS NOT NULL AND guideline != '';

-- ============================================================================
-- 2. agent_assignments (second most queried table)
-- ============================================================================

-- Primary query: .eq("account_id", X) - nearly every function queries by account
CREATE INDEX IF NOT EXISTS idx_agent_assignments_account
ON agent_assignments(account_id);

-- Role-scoped OR queries filter by coach/evaluator/team_lead per account
-- Used by: getAccountAgents, getAccountAssignmentRows, getAccountQAs, etc.
CREATE INDEX IF NOT EXISTS idx_agent_assignments_account_coach
ON agent_assignments(account_id, qa_coach_employee_id);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_account_evaluator
ON agent_assignments(account_id, qa_evaluator_employee_id);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_account_teamlead
ON agent_assignments(account_id, team_lead_employee_id);

-- Agent lookup: find assignment for a specific agent in an account
CREATE INDEX IF NOT EXISTS idx_agent_assignments_account_agent
ON agent_assignments(account_id, agent_employee_id);

-- ============================================================================
-- 3. employee_assignments
-- ============================================================================

-- Primary: .eq("account_id", X) used by getEmployeesByAccount, getEnrichedEmployeesByAccount, etc.
CREATE INDEX IF NOT EXISTS idx_emp_assignments_account
ON employee_assignments(account_id);

-- Employee lookup: .eq("employee_id", X) used by getEmployeeAssignment, getEmployeeAllAssignments
CREATE INDEX IF NOT EXISTS idx_emp_assignments_employee
ON employee_assignments(employee_id);

-- Role-scoped: .eq("account_id", X).in("role_id", [...]) used by getAccountCoaches, etc.
CREATE INDEX IF NOT EXISTS idx_emp_assignments_account_role
ON employee_assignments(account_id, role_id);

-- ============================================================================
-- 4. employees
-- ============================================================================

-- Email lookup (case-insensitive via ILIKE): login, auth, avatar
CREATE INDEX IF NOT EXISTS idx_employees_email_lower
ON employees(lower(employee_email));

-- Name lookup (case-insensitive via ILIKE): agent name resolution
CREATE INDEX IF NOT EXISTS idx_employees_name_lower
ON employees(lower(employee_name));

-- Employee code lookup: duplicate checks during assignment creation
CREATE INDEX IF NOT EXISTS idx_employees_code
ON employees(employee_code)
WHERE employee_code IS NOT NULL;

-- ============================================================================
-- 5. evaluation_parameters
-- ============================================================================

-- Account + LOB + is_active filtered parameter queries
-- Used by: getEvaluationParameters, getQaParametersByAccount
CREATE INDEX IF NOT EXISTS idx_evaluation_parameters_account_lob_active
ON evaluation_parameters(account_id, lob_id, is_active)
WHERE is_active = true;

-- ============================================================================
-- 6. rm_mqpm_performance
-- ============================================================================

-- Account-scoped performance queries ordered by month
CREATE INDEX IF NOT EXISTS idx_mqpm_performance_account_month
ON rm_mqpm_performance(account_id, performance_month DESC);

-- ============================================================================
-- 7. rm_covers
-- ============================================================================

-- LOB-scoped cover queries
CREATE INDEX IF NOT EXISTS idx_covers_lob
ON rm_covers(lob_id)
WHERE lob_id IS NOT NULL;

-- ============================================================================
-- 8. lobs
-- ============================================================================

-- Account-scoped LOB queries
CREATE INDEX IF NOT EXISTS idx_lobs_account
ON lobs(account_id);

-- ============================================================================
-- 9. assignment_reporting
-- ============================================================================

-- Employee assignment lookup
CREATE INDEX IF NOT EXISTS idx_assignment_reporting_employee
ON assignment_reporting(employee_assignment_id);
