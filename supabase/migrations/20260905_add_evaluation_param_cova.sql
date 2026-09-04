-- COVA-only evaluation checklist. Keep it separate from other account tables.
CREATE TABLE IF NOT EXISTS public.evaluation_param_cova (
  id bigint PRIMARY KEY,
  lob_name text NOT NULL,
  guideline text,
  attributes text,
  clauses text,
  score numeric,
  compound text,
  description text,
  account_id bigint REFERENCES public.accounts(account_id),
  lob_id bigint REFERENCES public.lobs(lob_id),
  display_order integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_param_cova ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evaluation_param_cova_select_authenticated ON public.evaluation_param_cova;
CREATE POLICY evaluation_param_cova_select_authenticated
  ON public.evaluation_param_cova FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_evaluation_param_cova_account_lob_active
  ON public.evaluation_param_cova(account_id, lob_id, is_active);

INSERT INTO public.evaluation_param_cova
  (id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order)
VALUES
  (1, 'MAIN', 'MAIN', 'ARRIVAL MANAGEMENT', 'ARRIVAL MANAGEMENT 1', 10, 'NO', 'Reservation details verified (guest name, dates, room type, rate, no. of guests) from PMS to OTA sites.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 1),
  (2, 'MAIN', 'MAIN', 'ARRIVAL MANAGEMENT', 'ARRIVAL MANAGEMENT 2', 5, 'NO', 'Special requests noted (extra bed, early check, room preference, etc.)', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 2),
  (3, 'MAIN', 'MAIN', 'ARRIVAL MANAGEMENT', 'ARRIVAL MANAGEMENT 3', 10, 'NO', 'Payment details confirmed', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 3),
  (4, 'MAIN', 'MAIN', 'ARRIVAL MANAGEMENT', 'ARRIVAL MANAGEMENT 4', 5, 'NO', 'Guest contact information correct', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 4),
  (5, 'MAIN', 'MAIN', 'ARRIVAL MANAGEMENT', 'ARRIVAL MANAGEMENT 5', 5, 'NO', 'Notes updated in the system for front desk or operations.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 5),
  (6, 'MAIN', 'MAIN', 'CANCELLATION AND MODIFICATION HANDLING', 'CANCELLATION AND MODIFICATION 1', 5, 'NO', 'Cancellation policy correctly applied', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 6),
  (7, 'MAIN', 'MAIN', 'CANCELLATION AND MODIFICATION HANDLING', 'CANCELLATION AND MODIFICATION 2', 5, 'NO', 'Cancellation done within the system immediately', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 7),
  (8, 'MAIN', 'MAIN', 'CANCELLATION AND MODIFICATION HANDLING', 'CANCELLATION AND MODIFICATION 3', 5, 'NO', 'Refund or penalty properly explained.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 8),
  (9, 'MAIN', 'MAIN', 'CANCELLATION AND MODIFICATION HANDLING', 'CANCELLATION AND MODIFICATION 4', 5, 'NO', 'Modification requests updated correctly.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 9),
  (10, 'MAIN', 'MAIN', 'GUEST EXPERIENCE AND COMMUNICATION', 'GUEST EXPERIENCE AND COMMUNICATION 1', 5, 'NO', 'Professional greeting and closing.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 10),
  (11, 'MAIN', 'MAIN', 'GUEST EXPERIENCE AND COMMUNICATION', 'GUEST EXPERIENCE AND COMMUNICATION 2', 5, 'NO', 'Correct grammar and polite tone.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 11),
  (12, 'MAIN', 'MAIN', 'GUEST EXPERIENCE AND COMMUNICATION', 'GUEST EXPERIENCE AND COMMUNICATION 3', 5, 'NO', 'Quick response time.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 12),
  (13, 'MAIN', 'MAIN', 'GUEST EXPERIENCE AND COMMUNICATION', 'GUEST EXPERIENCE AND COMMUNICATION 4', 5, 'NO', 'Clear and helpful information provided.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 13),
  (14, 'MAIN', 'MAIN', 'GUEST EXPERIENCE AND COMMUNICATION', 'GUEST EXPERIENCE AND COMMUNICATION 5', 5, 'NO', 'Ownership of guest issues until resolved.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 14),
  (15, 'MAIN', 'MAIN', 'GUEST EXPERIENCE AND COMMUNICATION', 'GUEST EXPERIENCE AND COMMUNICATION 6', 10, 'NO', 'Proper escalation when needed.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 15),
  (16, 'MAIN', 'MAIN', 'DOCUMENTATION', 'DOCUMENTATION 1', 5, 'NO', 'Daily tracker has been updated.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 16),
  (17, 'MAIN', 'MAIN', 'DOCUMENTATION', 'DOCUMENTATION 2', 5, 'NO', 'MOD/ Daily Report has been delivered correctly.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'COVA') AND upper(lob_name) = 'MAIN' LIMIT 1), 17)
ON CONFLICT (id) DO UPDATE SET
  lob_name = EXCLUDED.lob_name,
  guideline = EXCLUDED.guideline,
  attributes = EXCLUDED.attributes,
  clauses = EXCLUDED.clauses,
  score = EXCLUDED.score,
  compound = EXCLUDED.compound,
  description = EXCLUDED.description,
  account_id = EXCLUDED.account_id,
  lob_id = EXCLUDED.lob_id,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = now();
