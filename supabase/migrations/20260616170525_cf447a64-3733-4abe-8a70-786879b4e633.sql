
CREATE OR REPLACE FUNCTION public.get_smoke_retention_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  retention_days integer := 180;
  job_row record;
  last_run record;
  removed_count integer;
  next_run timestamptz;
  result jsonb;
BEGIN
  SELECT jobid, jobname, schedule, active
    INTO job_row
  FROM cron.job
  WHERE jobname = 'purge-core-smoke-runs'
  LIMIT 1;

  BEGIN
    SELECT start_time, end_time, status, return_message
      INTO last_run
    FROM cron.job_run_details
    WHERE jobid = job_row.jobid
    ORDER BY start_time DESC
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    last_run := NULL;
  END;

  removed_count := NULL;
  IF last_run.return_message IS NOT NULL THEN
    -- return_message looks like "SELECT 1" or contains the integer purge_smoke_runs returns
    BEGIN
      removed_count := (regexp_match(last_run.return_message, '(\d+)'))[1]::integer;
    EXCEPTION WHEN OTHERS THEN
      removed_count := NULL;
    END;
  END IF;

  -- Compute next run conservatively for canonical "0 3 * * *"
  IF COALESCE(job_row.schedule, '0 3 * * *') = '0 3 * * *' THEN
    next_run := date_trunc('day', now() at time zone 'UTC') + interval '3 hours';
    IF next_run <= now() THEN
      next_run := next_run + interval '1 day';
    END IF;
  ELSE
    next_run := NULL;
  END IF;

  result := jsonb_build_object(
    'retentionDays', retention_days,
    'jobName', COALESCE(job_row.jobname, 'purge-core-smoke-runs'),
    'schedule', COALESCE(job_row.schedule, '0 3 * * *'),
    'active', COALESCE(job_row.active, true),
    'scheduleLabel', 'Todos os dias às 03:00 UTC',
    'lastRunAt', last_run.start_time,
    'lastRunEndAt', last_run.end_time,
    'lastRunStatus', last_run.status,
    'lastRemovedCount', removed_count,
    'nextRunAt', next_run
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_smoke_retention_info() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_smoke_retention_info() TO authenticated, service_role;
