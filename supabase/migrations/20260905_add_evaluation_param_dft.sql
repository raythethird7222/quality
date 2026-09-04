-- DFT-only evaluation checklist. Keep it separate from RM and JS parameters.
CREATE TABLE IF NOT EXISTS public.evaluation_param_dft (
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

ALTER TABLE public.evaluation_param_dft ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evaluation_param_dft_select_authenticated ON public.evaluation_param_dft;
CREATE POLICY evaluation_param_dft_select_authenticated
  ON public.evaluation_param_dft FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_evaluation_param_dft_account_lob_active
  ON public.evaluation_param_dft(account_id, lob_id, is_active);

INSERT INTO public.evaluation_param_dft
  (id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order)
VALUES
  (1, 'NEGOT', 'NEGOT', 'CALL AND GREETING', 'CALL AND GREETING 1', 5, 'NO', 'Reviewed customer profile, account details, billing history, previous negotiations', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 1),
  (2, 'NEGOT', 'NEGOT', 'CALL AND GREETING', 'CALL AND GREETING 2', 5, 'NO', 'Used proper greeting', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 2),
  (3, 'NEGOT', 'NEGOT', 'CALL AND GREETING', 'CALL AND GREETING 3', 8, 'NO', 'Clearly stated the reason for the call', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 3),
  (4, 'NEGOT', 'NEGOT', 'CALL AND GREETING', 'CALL AND GREETING 4', 5, 'NO', 'Provides clear and prompt customer information when asked by the representative.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 4),
  (5, 'NEGOT', 'NEGOT', 'NEGOTIATION EFFORT', 'NEGOTIATION EFFORT 1 A', 5, 'NO', 'Savings Identification', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 5),
  (6, 'NEGOT', 'NEGOT', 'NEGOTIATION EFFORT', 'NEGOTIATION EFFORT 1 B', 5, 'NO', 'Savings Execution', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 6),
  (7, 'NEGOT', 'NEGOT', 'NEGOTIATION EFFORT', 'NEGOTIATION EFFORT 2 A', 5, 'NO', 'Call flow management', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 7),
  (8, 'NEGOT', 'NEGOT', 'NEGOTIATION EFFORT', 'NEGOTIATION EFFORT 2 B', 3, 'NO', 'Recap & Confirmation', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 8),
  (9, 'NEGOT', 'NEGOT', 'NEGOTIATION EFFORT', 'NEGOTIATION EFFORT 3', 3, 'NO', 'Called the provider multiple times to make the best attempts to get savings.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 9),
  (10, 'NEGOT', 'NEGOT', 'NEGOTIATION EFFORT', 'NEGOTIATION EFFORT 4', 5, 'NO', 'Agent must personally manage all assigned negotiations.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 10),
  (11, 'NEGOT', 'NEGOT', 'INFORMATION ACCURACY', 'INFORMATION ACCURACY 1', 5, 'NO', 'The agent explained the negotiation details to the customers accurately and clearly, and also answered the customers questions.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 11),
  (12, 'NEGOT', 'NEGOT', 'INFORMATION ACCURACY', 'INFORMATION ACCURACY 2', 2, 'NO', 'At the start of the call, agent informed that the call is being recorded.', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 12),
  (13, 'NEGOT', 'NEGOT', 'COMMUNICATION', 'COMMUNICATION 1', 3, 'NO', 'Clarity and language use', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 13),
  (14, 'NEGOT', 'NEGOT', 'COMMUNICATION', 'COMMUNICATION 2', 3, 'NO', 'Professionalism and tone', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 14),
  (15, 'NEGOT', 'NEGOT', 'COMMUNICATION', 'COMMUNICATION 3', 5, 'NO', 'Empathy and Active Listening', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 15),
  (16, 'NEGOT', 'NEGOT', 'CLOSURE', 'CLOSURE', 5, 'NO', 'Call Closure', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 16),
  (17, 'NEGOT', 'NEGOT', 'DOCUMENTATION', 'DOCUMENTATION 1 A', 5, 'NO', 'Accuracy of details', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 17),
  (18, 'NEGOT', 'NEGOT', 'DOCUMENTATION', 'DOCUMENTATION 1 B', 5, 'NO', 'Completeness of notes', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 18),
  (19, 'NEGOT', 'NEGOT', 'DOCUMENTATION', 'DOCUMENTATION 2', 5, 'NO', 'Disposition', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 19),
  (20, 'NEGOT', 'NEGOT', 'DOCUMENTATION', 'DOCUMENTATION 3 A', 5, 'NO', 'Attachments', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 20),
  (21, 'NEGOT', 'NEGOT', 'DOCUMENTATION', 'DOCUMENTATION 3 B', 5, 'NO', 'Follow-through actions', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 21),
  (22, 'NEGOT', 'NEGOT', 'DOCUMENTATION', 'DOCUMENTATION 4', 3, 'NO', 'System and tracker updates', (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT'), (SELECT lob_id FROM public.lobs WHERE account_id = (SELECT account_id FROM public.accounts WHERE upper(account_code) = 'DFT') AND upper(lob_name) = 'NEGOT' LIMIT 1), 22)
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
