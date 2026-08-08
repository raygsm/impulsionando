
ALTER TABLE public.core_smoke_runs
  ADD COLUMN IF NOT EXISTS replay_of uuid REFERENCES public.core_smoke_runs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_core_smoke_runs_replay ON public.core_smoke_runs(replay_of);
