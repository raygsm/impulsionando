
ALTER TABLE public.uptime_state
  ADD COLUMN IF NOT EXISTS category text;
CREATE INDEX IF NOT EXISTS uptime_state_category_idx ON public.uptime_state(category);
