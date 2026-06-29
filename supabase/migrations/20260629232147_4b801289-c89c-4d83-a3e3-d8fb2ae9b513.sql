ALTER TABLE public.core_status_webhooks
  ADD COLUMN IF NOT EXISTS categories text[] NULL;

COMMENT ON COLUMN public.core_status_webhooks.categories IS
  'Optional list of uptime_state.category values to restrict dispatches. NULL or [] = all categories.';