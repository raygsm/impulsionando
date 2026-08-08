
-- Allow anonymous read-back of unconsumed intents by ID (the UUID is the secret)
CREATE POLICY "catalog intents read by id unconsumed"
ON public.catalog_intents
FOR SELECT
USING (consumed_at IS NULL);

-- Tracking table for catalog funnel events
CREATE TABLE public.catalog_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  macro_slug text,
  subnicho_slug text,
  plan_tier text,
  selected_modules text[] DEFAULT '{}',
  intent_id uuid REFERENCES public.catalog_intents(id) ON DELETE SET NULL,
  session_token text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.catalog_events TO anon, authenticated;
GRANT SELECT ON public.catalog_events TO authenticated;
GRANT ALL ON public.catalog_events TO service_role;

ALTER TABLE public.catalog_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog events anyone can insert"
ON public.catalog_events FOR INSERT WITH CHECK (true);

CREATE POLICY "catalog events staff can read"
ON public.catalog_events FOR SELECT
USING (public.is_impulsionando_staff(auth.uid()));

CREATE INDEX idx_catalog_events_created_at ON public.catalog_events(created_at DESC);
CREATE INDEX idx_catalog_events_macro ON public.catalog_events(macro_slug, subnicho_slug, plan_tier);
CREATE INDEX idx_catalog_events_name ON public.catalog_events(event_name);
