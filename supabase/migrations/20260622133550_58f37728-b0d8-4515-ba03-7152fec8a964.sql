
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.core_schedule_cron(
  p_job_name text,
  p_schedule text,
  p_path text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  jid bigint;
  v_base_url text := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app';
  v_sql text;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = p_job_name;
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;

  v_sql := format($job$
    SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', COALESCE(
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1),
          current_setting('app.settings.anon_key', true),
          ''
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $job$, v_base_url || p_path);

  PERFORM cron.schedule(p_job_name, p_schedule, v_sql);
END;
$fn$;

REVOKE ALL ON FUNCTION public.core_schedule_cron(text, text, text) FROM PUBLIC;

SELECT public.core_schedule_cron('core-agenda-tick-1min',           '* * * * *',     '/api/public/cron/agenda-tick');
SELECT public.core_schedule_cron('core-funnel-dispatch-1min',       '* * * * *',     '/api/public/cron/funnel-dispatch');
SELECT public.core_schedule_cron('core-billing-tick-5min',          '*/5 * * * *',   '/api/public/hooks/billing-tick');
SELECT public.core_schedule_cron('core-payouts-consolidate-daily',  '0 2 * * *',     '/api/public/cron/payouts-consolidate');
SELECT public.core_schedule_cron('core-dispatch-fiscal-hourly',     '0 * * * *',     '/api/public/hooks/dispatch-fiscal');
SELECT public.core_schedule_cron('core-marketing-lead-notify-15min','*/15 * * * *',  '/api/public/hooks/marketing-lead-notify');
SELECT public.core_schedule_cron('core-marocas-report-monthly',     '0 6 1 * *',     '/api/public/hooks/marocas-report');
SELECT public.core_schedule_cron('core-notif-log-cleanup-daily',    '0 4 * * *',     '/api/public/hooks/notification-log-cleanup');
SELECT public.core_schedule_cron('core-retention-sweep-daily',      '30 4 * * *',    '/api/public/hooks/retention-sweep');
SELECT public.core_schedule_cron('core-uptime-check-5min',          '*/5 * * * *',   '/api/public/hooks/uptime-check');
SELECT public.core_schedule_cron('core-uptime-whatsapp-30min',      '*/30 * * * *',  '/api/public/hooks/uptime-whatsapp-test');
SELECT public.core_schedule_cron('core-comms-self-test-daily',      '0 6 * * *',     '/api/public/hooks/comms-self-test');

INSERT INTO public.audit_logs (action, entity, entity_id, metadata)
VALUES (
  'cron.bulk_schedule',
  'pg_cron',
  NULL,
  jsonb_build_object(
    'phase', 'M7',
    'jobs_scheduled', 12,
    'scheduled_at', now()
  )
);
