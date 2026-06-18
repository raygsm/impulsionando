
CREATE TABLE public.notification_attempt_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','push','whatsapp','sms','internal','webhook')),
  event TEXT NOT NULL,
  niche TEXT,
  recipient TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent','queued','blocked','skipped','error')),
  reason TEXT,
  idempotency_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notification_attempt_log_company_created_idx
  ON public.notification_attempt_log (company_id, created_at DESC);
CREATE INDEX notification_attempt_log_request_idx
  ON public.notification_attempt_log (request_id);
CREATE INDEX notification_attempt_log_idemp_idx
  ON public.notification_attempt_log (idempotency_key);

GRANT SELECT ON public.notification_attempt_log TO authenticated;
GRANT ALL ON public.notification_attempt_log TO service_role;

ALTER TABLE public.notification_attempt_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read own company attempts"
  ON public.notification_attempt_log FOR SELECT
  TO authenticated
  USING (
    company_id IS NULL OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.company_id = notification_attempt_log.company_id
    )
  );

CREATE POLICY "service role writes"
  ON public.notification_attempt_log FOR ALL
  TO service_role USING (true) WITH CHECK (true);
