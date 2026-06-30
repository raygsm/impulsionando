ALTER TABLE public.core_status_webhooks
  ADD COLUMN IF NOT EXISTS max_retries int NOT NULL DEFAULT 3;

ALTER TABLE public.core_status_webhook_dispatches
  ADD COLUMN IF NOT EXISTS retry_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_dispatch_id uuid REFERENCES public.core_status_webhook_dispatches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_status_webhook_dispatches_due_retries
  ON public.core_status_webhook_dispatches (next_retry_at)
  WHERE ok = false AND next_retry_at IS NOT NULL;

SELECT cron.schedule(
  'status_webhooks_retries_tick',
  '2-59/5 * * * *',
  $$ SELECT net.http_post(
    url := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/status-webhook-retries',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  ); $$
);