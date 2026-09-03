-- ============================================================================
-- Secure employee login: mail + employee-code credential
-- Created: 2026-09-04
-- Purpose: Re-allow email + employee code login in a secure way.
--
-- Design:
--   * A new `password_hash` column holds a bcrypt hash of `CTNP-<employee_code>`.
--   * Passwords are NEVER stored or compared as plaintext in the application.
--   * Verification happens inside the database with pgcrypto `crypt()`, which
--     is performed in constant time and never returns the hash to the client.
--   * Google / corporate SSO remains the primary, no-password sign-in method.
--
-- NOTE (manual provisioning): For the existing Supabase Auth session flow to
-- work, each employee must ALSO have a Supabase Auth (email/password) account
-- whose password equals `CTNP-<employee_code>`, and the "Email" provider must
-- be enabled in the Supabase dashboard. A provisioning script/RPC is provided
-- at the bottom for backfilling the employees table column; the Auth table is
-- provisioned separately via the Supabase Admin API.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. Add the hashed-password column
-- ============================================================================
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS password_hash text;

COMMENT ON COLUMN employees.password_hash IS
  'bcrypt hash of "CTNP-" || employee_code. Never exposed or compared in the app; verified DB-side with crypt().';

-- ============================================================================
-- 2. Backfill bcrypt hashes for existing employees
--    (CTNP-<employee_code>, uppercased to normalize the code)
-- ============================================================================
UPDATE employees
SET password_hash = crypt('CTNP-' || upper(COALESCE(employee_code, '')), gen_salt('bf'))
WHERE employee_code IS NOT NULL
  AND employee_code <> ''
  AND (password_hash IS NULL OR password_hash = '');

-- ============================================================================
-- 3. Secure login verification function
--    Returns only non-sensitive identity columns. Runs as security definer so
--    it can read employees even before a session exists; callers must use the
--    server-side service-role client (the anon key must not invoke this).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verify_employee_login(
  p_email text,
  p_password text
)
RETURNS TABLE (
  employee_id bigint,
  employee_code text,
  employee_name text,
  employee_email text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id AS employee_id,
    e.employee_code,
    e.employee_name,
    e.employee_email,
    e.avatar_url
  FROM public.employees e
  WHERE lower(e.employee_email) = lower(btrim(p_email))
    AND e.password_hash <> ''
    AND e.password_hash = crypt(p_password, e.password_hash)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_employee_login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_employee_login(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_employee_login(text, text) TO service_role;

-- ============================================================================
-- 4. Optional provisioning help (run once via Supabase SQL editor):
--    Ensure every employee has a bcrypt hash of CTNP-<code>.
-- ============================================================================
-- UPDATE employees SET password_hash = crypt('CTNP-' || upper(COALESCE(employee_code,'')), gen_salt('bf'))
-- WHERE employee_code IS NOT NULL AND employee_code <> '';
