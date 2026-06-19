ALTER TABLE public.catalog_intents
  ADD COLUMN IF NOT EXISTS validated_fields jsonb;

COMMENT ON COLUMN public.catalog_intents.validated_fields IS
  'Snapshot of the exact required fields that were valid when conversion was marked (e.g. {"goal":true,"niche":true,"mainPain":true,"metric":true,"target":true}).';

CREATE INDEX IF NOT EXISTS idx_catalog_intents_conversion_kind
  ON public.catalog_intents(conversion_kind)
  WHERE conversion_kind IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_intents_converted_at
  ON public.catalog_intents(converted_at DESC)
  WHERE converted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_events_event_name_created
  ON public.catalog_events(event_name, created_at DESC);