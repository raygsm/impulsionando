ALTER TABLE public.uptime_state
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100;

CREATE INDEX IF NOT EXISTS idx_uptime_state_public ON public.uptime_state(show_on_public, sort_order);