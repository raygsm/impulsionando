
-- 1. Subscribers
CREATE TABLE IF NOT EXISTS public.core_status_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ,
  confirm_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  last_notified_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS core_status_subscribers_email_uidx
  ON public.core_status_subscribers (lower(email));
CREATE INDEX IF NOT EXISTS core_status_subscribers_active_idx
  ON public.core_status_subscribers (confirmed_at)
  WHERE unsubscribed_at IS NULL AND bounced_at IS NULL;

GRANT INSERT (email, source) ON public.core_status_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_status_subscribers TO authenticated;
GRANT ALL ON public.core_status_subscribers TO service_role;

ALTER TABLE public.core_status_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can subscribe"
  ON public.core_status_subscribers FOR INSERT TO anon
  WITH CHECK (email IS NOT NULL AND length(email) <= 320 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

CREATE POLICY "admins manage subscribers"
  ON public.core_status_subscribers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER core_status_subscribers_updated_at
  BEFORE UPDATE ON public.core_status_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Dispatch log
CREATE TABLE IF NOT EXISTS public.core_status_dispatch_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.core_status_subscribers(id) ON DELETE CASCADE,
  incident_id UUID,
  event_kind TEXT NOT NULL,
  reference_key TEXT NOT NULL,
  delivered_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS core_status_dispatch_log_dedup_uidx
  ON public.core_status_dispatch_log (subscriber_id, reference_key);
CREATE INDEX IF NOT EXISTS core_status_dispatch_log_incident_idx
  ON public.core_status_dispatch_log (incident_id);

GRANT SELECT ON public.core_status_dispatch_log TO authenticated;
GRANT ALL ON public.core_status_dispatch_log TO service_role;

ALTER TABLE public.core_status_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read dispatch log"
  ON public.core_status_dispatch_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Cron
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'status_subscribers_tick') THEN
    PERFORM cron.unschedule('status_subscribers_tick');
  END IF;
END $$;

SELECT cron.schedule(
  'status_subscribers_tick',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/status-subscribers',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXd2bGhzZmR0enRrYm5jbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjQ3MzEsImV4cCI6MjA5NjA0MDczMX0.Buo6dQXlBMqMWQe8-0-mnESAz8Vu4dNCKWyzts6N4aI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
