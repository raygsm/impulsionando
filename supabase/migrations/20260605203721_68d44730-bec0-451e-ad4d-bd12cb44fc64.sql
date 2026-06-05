ALTER TABLE public.uptime_state
  ADD COLUMN IF NOT EXISTS alert_whatsapps text[] NOT NULL DEFAULT '{}';