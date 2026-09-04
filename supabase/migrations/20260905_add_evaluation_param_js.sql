-- JS-only evaluation checklist. Keep this separate from the RM parameter table.
CREATE TABLE IF NOT EXISTS public.evaluation_param_js (
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

ALTER TABLE public.evaluation_param_js ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evaluation_param_js_select_authenticated ON public.evaluation_param_js;
CREATE POLICY evaluation_param_js_select_authenticated
  ON public.evaluation_param_js FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_evaluation_param_js_account_lob_active
  ON public.evaluation_param_js(account_id, lob_id, is_active);

INSERT INTO public.evaluation_param_js
  (id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order)
VALUES
  (1, 'MAIN', 'MAIN', 'OPENING', 'OPENING 1', 5, 'NO', 'Did the agent greet the customer professionally and identify themselves as a representative of JustSystem?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 1),
  (2, 'MAIN', 'MAIN', 'OPENING', 'OPENING 2', 5, 'NO', 'Did the agent confirm the reason for the call and show readiness to assist the customer with their concern?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 2),
  (3, 'MAIN', 'MAIN', 'PROBING', 'PROBING 1', 5, 'NO', 'Did the agent ask clarifying or probing questions to better understand the customer''s concern?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 3),
  (4, 'MAIN', 'MAIN', 'PROBING', 'PROBING 2', 5, 'NO', 'Did the agent ask the appropriate questions to accurately identify the customer''s needs or issue?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 4),
  (5, 'MAIN', 'MAIN', 'VERIFICATION', 'VERIFICATION 1', 5, 'NO', 'Did the agent follow the correct verification process before proceeding?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 5),
  (6, 'MAIN', 'MAIN', 'VERIFICATION', 'VERIFICATION 2', 5, 'NO', 'Request alternative verification information, if the customer was unable to provide the initially required details?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 6),
  (7, 'MAIN', 'MAIN', 'KNOWLEDGE', 'KNOWLEDGE 1', 10, 'NO', 'Demonstrate thorough knowledge and provide accurate information based on the latest updates or changes?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 7),
  (8, 'MAIN', 'MAIN', 'KNOWLEDGE', 'KNOWLEDGE 2', 10, 'NO', 'Agent followed the correct holding procedures and minimized dead air effectively.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 8),
  (9, 'MAIN', 'MAIN', 'CLOSING', 'CLOSING 1', 5, 'NO', 'Provide proper instructions and ask if the customer had any additional concerns before ending the call?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 9),
  (10, 'MAIN', 'MAIN', 'CLOSING', 'CLOSING 2', 5, 'NO', 'Effectively deliver the closing spiel, ensuring the customer felt their issue was fully resolved before ending the call?', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 10),
  (11, 'MAIN', 'MAIN', 'PILLAR', 'PILLAR 1', 10, 'NO', 'I DELIVER VALUE TO MY CUSTOMER', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 11),
  (12, 'MAIN', 'MAIN', 'PILLAR', 'PILLAR 2', 5, 'NO', 'I INSPIRE CONFIDENCE AND TAKE OWNERSHIP', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 12),
  (13, 'MAIN', 'MAIN', 'PILLAR', 'PILLAR 3', 10, 'NO', 'I INTERACT PROFESSIONALLY', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 13),
  (14, 'MAIN', 'MAIN', 'PILLAR', 'PILLAR 4', 5, 'NO', 'I AM PROFICIENT WITH OUR TOOLS', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 14),
  (15, 'MAIN', 'MAIN', 'PILLAR', 'PILLAR 5', 10, 'NO', 'I FOLLOW POLICY AND PROCESS', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'JS') AND upper(lob_name) = 'MAIN' LIMIT 1), 15)
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
