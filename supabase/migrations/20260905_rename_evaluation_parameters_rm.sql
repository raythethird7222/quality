-- The checklist table currently contains RM account parameters only.
ALTER TABLE IF EXISTS public.evaluation_parameters
  RENAME TO evaluation_param_rm;
