-- Consolidate account checklists while preserving each account's existing
-- parameter IDs. A composite key keeps checkbox_results compatible with old
-- evaluations whose JSON keys contain the original parameter IDs.
CREATE TABLE IF NOT EXISTS public.evaluation_parameters (
  id bigint NOT NULL,
  lob_name text NOT NULL,
  guideline text,
  attributes text,
  clauses text,
  score numeric,
  compound text,
  description text,
  account_id bigint NOT NULL REFERENCES public.accounts(account_id),
  lob_id bigint REFERENCES public.lobs(lob_id),
  display_order integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, id)
);

ALTER TABLE public.evaluation_parameters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evaluation_parameters_select_authenticated ON public.evaluation_parameters;
CREATE POLICY evaluation_parameters_select_authenticated
  ON public.evaluation_parameters FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_evaluation_parameters_account_lob_active
  ON public.evaluation_parameters(account_id, lob_id, is_active);

INSERT INTO public.evaluation_parameters
  (id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order, is_active, created_at, updated_at)
SELECT id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order, is_active, created_at, updated_at
FROM public.evaluation_param_rm
WHERE account_id IS NOT NULL
UNION ALL
SELECT id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order, is_active, created_at, updated_at
FROM public.evaluation_param_js
WHERE account_id IS NOT NULL
UNION ALL
SELECT id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order, is_active, created_at, updated_at
FROM public.evaluation_param_dft
WHERE account_id IS NOT NULL
UNION ALL
SELECT id, lob_name, guideline, attributes, clauses, score, compound, description, account_id, lob_id, display_order, is_active, created_at, updated_at
FROM public.evaluation_param_cova
WHERE account_id IS NOT NULL
ON CONFLICT (account_id, id) DO UPDATE SET
  lob_name = EXCLUDED.lob_name,
  guideline = EXCLUDED.guideline,
  attributes = EXCLUDED.attributes,
  clauses = EXCLUDED.clauses,
  score = EXCLUDED.score,
  compound = EXCLUDED.compound,
  description = EXCLUDED.description,
  lob_id = EXCLUDED.lob_id,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;
