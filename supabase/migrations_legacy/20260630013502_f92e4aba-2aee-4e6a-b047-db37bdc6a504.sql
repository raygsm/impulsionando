SELECT cron.unschedule('status_webhooks_auto_disable_tick') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='status_webhooks_auto_disable_tick');

SELECT cron.schedule(
  'status_webhooks_auto_disable_tick',
  '7 * * * *',
  $$ SELECT net.http_post(
    url := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/status-webhook-auto-disable',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  ); $$
);

INSERT INTO public.core_settings (key, value, label, category)
VALUES
  ('status_webhook_auto_disable_enabled', 'true'::jsonb, 'Auto-desativar webhooks degradados', 'status'),
  ('status_webhook_auto_disable_hours', '24'::jsonb, 'Janela (h) para avaliação de saúde', 'status'),
  ('status_webhook_auto_disable_min_total', '10'::jsonb, 'Mín. de disparos para avaliar', 'status'),
  ('status_webhook_auto_disable_threshold', '50'::jsonb, '% mínimo de sucesso', 'status')
ON CONFLICT (key) DO NOTHING;