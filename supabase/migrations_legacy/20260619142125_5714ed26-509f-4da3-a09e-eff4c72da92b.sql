
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove jobs antigos (idempotente)
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'outbox-dispatcher-every-minute';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END $$;

SELECT cron.schedule(
  'outbox-dispatcher-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fpywvlhsfdtztkbncmdt.supabase.co/functions/v1/outbox-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-outbox-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'OUTBOX_PROCESS_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
