
CREATE TABLE public.core_status_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  kind text NOT NULL DEFAULT 'generic' CHECK (kind IN ('slack','discord','generic')),
  secret text,
  notify_incidents boolean NOT NULL DEFAULT true,
  notify_maintenance boolean NOT NULL DEFAULT true,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  last_dispatch_at timestamptz,
  last_status_code int,
  last_error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_status_webhooks TO authenticated;
GRANT ALL ON public.core_status_webhooks TO service_role;
ALTER TABLE public.core_status_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage status webhooks" ON public.core_status_webhooks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.core_status_webhook_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.core_status_webhooks(id) ON DELETE CASCADE,
  reference_key text NOT NULL,
  event_kind text NOT NULL,
  status_code int,
  ok boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (webhook_id, reference_key)
);
CREATE INDEX core_status_webhook_dispatches_webhook_idx ON public.core_status_webhook_dispatches(webhook_id, created_at DESC);
GRANT SELECT ON public.core_status_webhook_dispatches TO authenticated;
GRANT ALL ON public.core_status_webhook_dispatches TO service_role;
ALTER TABLE public.core_status_webhook_dispatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read webhook dispatches" ON public.core_status_webhook_dispatches FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

SELECT cron.schedule(
  'status_webhooks_tick',
  '*/5 * * * *',
  $$ SELECT net.http_post(
    url := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/status-webhooks',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  ); $$
);
