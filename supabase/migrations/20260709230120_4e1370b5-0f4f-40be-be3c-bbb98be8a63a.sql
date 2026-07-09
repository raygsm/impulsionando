
-- Fase 3.3 — Cortesia Full 30 dias

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS full_courtesy_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS full_courtesy_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_courtesy_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_courtesy_days integer,
  ADD COLUMN IF NOT EXISTS full_courtesy_plan_id uuid REFERENCES public.billing_plans(id) ON DELETE SET NULL;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_full_courtesy_status_chk;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_full_courtesy_status_chk
  CHECK (full_courtesy_status IN ('none','active','converted','expired','revoked'));

COMMENT ON COLUMN public.companies.full_courtesy_status IS 'Cortesia Full (Onda 3.3): none|active|converted|expired|revoked.';
COMMENT ON COLUMN public.companies.full_courtesy_started_at IS 'Início da cortesia Full aplicada ao cliente.';
COMMENT ON COLUMN public.companies.full_courtesy_ends_at IS 'Fim previsto da cortesia Full.';
COMMENT ON COLUMN public.companies.full_courtesy_days IS 'Duração (dias) aplicada na concessão.';
COMMENT ON COLUMN public.companies.full_courtesy_plan_id IS 'Plano Full vigente durante a cortesia.';

INSERT INTO public.core_settings (key, value, label, category)
VALUES (
  'full_courtesy_days_default',
  '30'::jsonb,
  'Cortesia Full — dias padrão',
  'billing'
)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.core_courtesy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  days integer,
  plan_id uuid REFERENCES public.billing_plans(id) ON DELETE SET NULL,
  previous_status text,
  new_status text,
  starts_at timestamptz,
  ends_at timestamptz,
  note text,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.core_courtesy_events
  DROP CONSTRAINT IF EXISTS core_courtesy_events_event_type_chk;
ALTER TABLE public.core_courtesy_events
  ADD CONSTRAINT core_courtesy_events_event_type_chk
  CHECK (event_type IN ('grant','extend','convert','revoke','expire','sync'));

CREATE INDEX IF NOT EXISTS core_courtesy_events_company_idx
  ON public.core_courtesy_events (company_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_courtesy_events TO authenticated;
GRANT ALL ON public.core_courtesy_events TO service_role;

ALTER TABLE public.core_courtesy_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff Impulsionando lê cortesia" ON public.core_courtesy_events;
CREATE POLICY "Staff Impulsionando lê cortesia"
  ON public.core_courtesy_events FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff Impulsionando grava cortesia" ON public.core_courtesy_events;
CREATE POLICY "Staff Impulsionando grava cortesia"
  ON public.core_courtesy_events FOR ALL
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));
