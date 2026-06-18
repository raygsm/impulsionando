
ALTER TABLE public.catalog_intents
  ADD COLUMN IF NOT EXISTS reuse_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reuse_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS conversion_kind text;

CREATE INDEX IF NOT EXISTS catalog_intents_converted_at_idx
  ON public.catalog_intents (converted_at);
CREATE INDEX IF NOT EXISTS catalog_events_event_name_created_idx
  ON public.catalog_events (event_name, created_at);
