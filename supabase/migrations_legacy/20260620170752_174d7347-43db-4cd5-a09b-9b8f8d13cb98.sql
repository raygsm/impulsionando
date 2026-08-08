ALTER TABLE public.uptime_state
  ADD COLUMN IF NOT EXISTS first_failure_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS alert_after_seconds INTEGER NOT NULL DEFAULT 120;

INSERT INTO public.uptime_state (url, is_up, alert_emails, alert_after_seconds)
VALUES ('https://impulsionando.com.br/api/public/health', true, ARRAY['sac@impulsionando.com.br'], 120)
ON CONFLICT (url) DO UPDATE SET alert_after_seconds = EXCLUDED.alert_after_seconds;