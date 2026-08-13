ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS full_courtesy_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS full_courtesy_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_courtesy_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_courtesy_days integer,
  ADD COLUMN IF NOT EXISTS full_courtesy_plan_id uuid REFERENCES public.billing_plans(id) ON DELETE SET NULL;

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

CREATE INDEX IF NOT EXISTS core_courtesy_events_company_idx
  ON public.core_courtesy_events(company_id, created_at DESC);
