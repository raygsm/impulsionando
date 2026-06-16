
-- Retention function: purge smoke runs older than N days (default 180)
CREATE OR REPLACE FUNCTION public.purge_smoke_runs(days integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.core_smoke_runs
  WHERE created_at < (now() - make_interval(days => days));
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_smoke_runs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_smoke_runs(integer) TO service_role;

-- Inspection helper exposed to the app to show retention/cron info
CREATE OR REPLACE FUNCTION public.get_smoke_retention_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  retention_days integer := 180;
  job_row record;
  result jsonb;
BEGIN
  SELECT jobname, schedule, active
    INTO job_row
  FROM cron.job
  WHERE jobname = 'purge-core-smoke-runs'
  LIMIT 1;

  result := jsonb_build_object(
    'retentionDays', retention_days,
    'jobName', COALESCE(job_row.jobname, 'purge-core-smoke-runs'),
    'schedule', COALESCE(job_row.schedule, '0 3 * * *'),
    'active', COALESCE(job_row.active, true),
    'scheduleLabel', 'Todos os dias às 03:00 UTC'
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_smoke_retention_info() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_smoke_retention_info() TO authenticated, service_role;

-- Ensure pg_cron extension is enabled (no-op if already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- (Re)schedule the daily purge job at 03:00 UTC, retention = 180 days
DO $$
BEGIN
  PERFORM cron.unschedule('purge-core-smoke-runs')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-core-smoke-runs');
EXCEPTION WHEN OTHERS THEN
  -- ignore if cron schema not available in this env
  NULL;
END $$;

SELECT cron.schedule(
  'purge-core-smoke-runs',
  '0 3 * * *',
  $cron$ SELECT public.purge_smoke_runs(180); $cron$
);
