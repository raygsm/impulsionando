ALTER TABLE public.core_status_subscribers
  ADD COLUMN IF NOT EXISTS categories text[] NULL;

COMMENT ON COLUMN public.core_status_subscribers.categories IS
  'Optional list of uptime_state.category values to restrict notifications. NULL or [] = all categories.';