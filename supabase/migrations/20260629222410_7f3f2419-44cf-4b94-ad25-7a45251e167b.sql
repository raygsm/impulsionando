
CREATE TABLE IF NOT EXISTS public.core_status_subscriber_services (
  subscriber_id uuid NOT NULL REFERENCES public.core_status_subscribers(id) ON DELETE CASCADE,
  service_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subscriber_id, service_slug)
);

GRANT ALL ON public.core_status_subscriber_services TO service_role;

ALTER TABLE public.core_status_subscriber_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role manages subscriber services"
  ON public.core_status_subscriber_services
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_status_sub_services_slug
  ON public.core_status_subscriber_services(service_slug);
