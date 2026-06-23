
CREATE TABLE IF NOT EXISTS public.impulsionito_training_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  niche TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'cron'
);

CREATE INDEX IF NOT EXISTS impulsionito_training_snapshots_company_captured_idx
  ON public.impulsionito_training_snapshots (company_id, captured_at DESC);

GRANT SELECT ON public.impulsionito_training_snapshots TO authenticated;
GRANT ALL ON public.impulsionito_training_snapshots TO service_role;

ALTER TABLE public.impulsionito_training_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members read own snapshots"
  ON public.impulsionito_training_snapshots
  FOR SELECT TO authenticated
  USING (
    public.user_belongs_to_company(auth.uid(), company_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "service role manages snapshots"
  ON public.impulsionito_training_snapshots
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
