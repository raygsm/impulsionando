
CREATE TABLE public.notification_retention_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email TEXT,
  previous_days INTEGER,
  new_days INTEGER NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notification_retention_audit_created_idx
  ON public.notification_retention_audit (created_at DESC);

GRANT SELECT ON public.notification_retention_audit TO authenticated;
GRANT ALL ON public.notification_retention_audit TO service_role;

ALTER TABLE public.notification_retention_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read audit"
  ON public.notification_retention_audit FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service role writes audit"
  ON public.notification_retention_audit FOR ALL
  TO service_role USING (true) WITH CHECK (true);
