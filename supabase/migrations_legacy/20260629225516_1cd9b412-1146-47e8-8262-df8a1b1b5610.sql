ALTER TABLE public.core_status_subscribers
  ADD COLUMN IF NOT EXISTS notify_incidents boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_maintenance boolean NOT NULL DEFAULT true;