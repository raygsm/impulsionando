ALTER TABLE public.core_status_subscribers
  ADD COLUMN IF NOT EXISTS min_severity text NOT NULL DEFAULT 'info'
    CHECK (min_severity IN ('info','minor','major','critical'));
COMMENT ON COLUMN public.core_status_subscribers.min_severity IS 'Minimum incident severity for email notifications. Maintenance and confirm emails ignore this filter.';