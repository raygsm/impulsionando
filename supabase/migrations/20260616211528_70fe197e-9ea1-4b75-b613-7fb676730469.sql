-- Substitui o índice único parcial por uma constraint única "real" para que
-- o upsert via PostgREST (onConflict=workflow_name,step,idempotency_key) funcione.
-- NULLs continuam distintos por padrão no Postgres, então múltiplas linhas sem
-- idempotency_key seguem permitidas — comportamento equivalente ao índice parcial.

DROP INDEX IF EXISTS public.n8n_workflow_runs_idemp_idx;

ALTER TABLE public.n8n_workflow_runs
  ADD CONSTRAINT n8n_workflow_runs_idemp_uk
  UNIQUE (workflow_name, step, idempotency_key);