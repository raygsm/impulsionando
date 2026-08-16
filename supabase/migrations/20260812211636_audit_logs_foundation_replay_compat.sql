-- Replay compatibility for historical audit_logs shapes.
-- Additive/no-op on environments where the modern columns already exist.
DO $compat$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity text;
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type text;
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id text;
  END IF;
END
$compat$;
