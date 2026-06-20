
CREATE TABLE IF NOT EXISTS public.fiscal_email_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  recipient text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','sent','failed')),
  triggered_by text NOT NULL CHECK (triggered_by IN ('user','cron','retry')),
  email_mode text NOT NULL DEFAULT 'link' CHECK (email_mode IN ('link','inline')),
  message_id uuid,
  csv_path text,
  signed_url_expires_at timestamptz,
  attempt int NOT NULL DEFAULT 1,
  error_message text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiscal_email_runs_period_idx
  ON public.fiscal_email_runs (year DESC, month DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS fiscal_email_runs_status_idx
  ON public.fiscal_email_runs (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.fiscal_email_runs TO authenticated;
GRANT ALL ON public.fiscal_email_runs TO service_role;

ALTER TABLE public.fiscal_email_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read fiscal email runs" ON public.fiscal_email_runs;
CREATE POLICY "Admins read fiscal email runs" ON public.fiscal_email_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins write fiscal email runs" ON public.fiscal_email_runs;
CREATE POLICY "Admins write fiscal email runs" ON public.fiscal_email_runs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update fiscal email runs" ON public.fiscal_email_runs;
CREATE POLICY "Admins update fiscal email runs" ON public.fiscal_email_runs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_fiscal_email_runs_updated ON public.fiscal_email_runs;
CREATE TRIGGER trg_fiscal_email_runs_updated
  BEFORE UPDATE ON public.fiscal_email_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  PERFORM cron.unschedule('fiscal-monthly-email');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'fiscal-monthly-email',
  '5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/fiscal-monthly-email',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXd2bGhzZmR0enRrYm5jbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjQ3MzEsImV4cCI6MjA5NjA0MDczMX0.Buo6dQXlBMqMWQe8-0-mnESAz8Vu4dNCKWyzts6N4aI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
