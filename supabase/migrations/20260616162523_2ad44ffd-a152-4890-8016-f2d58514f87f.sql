
CREATE TABLE public.core_smoke_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  label text,
  niche_slug text,
  success boolean NOT NULL,
  duration_ms integer NOT NULL DEFAULT 0,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  batch_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.core_smoke_runs TO authenticated;
GRANT ALL ON public.core_smoke_runs TO service_role;

ALTER TABLE public.core_smoke_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff Impulsionando lê histórico smoke"
  ON public.core_smoke_runs FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff Impulsionando insere histórico smoke"
  ON public.core_smoke_runs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE INDEX idx_core_smoke_runs_created_at ON public.core_smoke_runs (created_at DESC);
CREATE INDEX idx_core_smoke_runs_batch ON public.core_smoke_runs (batch_id);
