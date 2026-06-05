-- Histórico de verificações
CREATE TABLE public.uptime_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  is_up BOOLEAN NOT NULL,
  http_status INTEGER,
  response_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX uptime_checks_url_checked_idx ON public.uptime_checks(url, checked_at DESC);

GRANT SELECT ON public.uptime_checks TO authenticated;
GRANT ALL ON public.uptime_checks TO service_role;
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read uptime checks"
  ON public.uptime_checks FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

-- Estado atual por URL (usado para detectar transições e throttling de alertas)
CREATE TABLE public.uptime_state (
  url TEXT NOT NULL PRIMARY KEY,
  is_up BOOLEAN NOT NULL,
  since TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_alert_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  alert_emails TEXT[] NOT NULL DEFAULT ARRAY['sac@impulsionando.com.br']
);

GRANT SELECT ON public.uptime_state TO authenticated;
GRANT ALL ON public.uptime_state TO service_role;
ALTER TABLE public.uptime_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read uptime state"
  ON public.uptime_state FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

-- Seed da URL monitorada
INSERT INTO public.uptime_state (url, is_up, alert_emails)
VALUES ('https://impulsionando.com.br', true, ARRAY['sac@impulsionando.com.br'])
ON CONFLICT (url) DO NOTHING;