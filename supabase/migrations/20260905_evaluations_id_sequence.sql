-- Ensure manually-created evaluations receive a unique primary key.
CREATE SEQUENCE IF NOT EXISTS public.evaluations_evaluation_id_seq;

ALTER SEQUENCE public.evaluations_evaluation_id_seq
  OWNED BY public.evaluations.evaluation_id;

SELECT setval(
  'public.evaluations_evaluation_id_seq',
  COALESCE((SELECT MAX(evaluation_id) FROM public.evaluations), 0) + 1,
  false
);

ALTER TABLE public.evaluations
  ALTER COLUMN evaluation_id
  SET DEFAULT nextval('public.evaluations_evaluation_id_seq');
