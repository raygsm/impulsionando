
ALTER TABLE public.core_smoke_purge_log
  ADD COLUMN IF NOT EXISTS removed_samples jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.purge_smoke_runs_detailed(
  days integer DEFAULT 180,
  trigger_source text DEFAULT 'scheduled',
  triggered_by_user uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz := now() - make_interval(days => days);
  total integer;
  by_niche jsonb;
  by_status jsonb;
  samples jsonb;
  log_id uuid;
BEGIN
  SELECT COUNT(*) INTO total
    FROM public.core_smoke_runs WHERE created_at < cutoff;

  SELECT COALESCE(jsonb_object_agg(k, c), '{}'::jsonb) INTO by_niche
  FROM (
    SELECT COALESCE(niche_slug, '—') AS k, COUNT(*) AS c
    FROM public.core_smoke_runs WHERE created_at < cutoff
    GROUP BY 1
  ) t;

  SELECT COALESCE(jsonb_object_agg(k, c), '{}'::jsonb) INTO by_status
  FROM (
    SELECT CASE WHEN success THEN 'success' ELSE 'failure' END AS k, COUNT(*) AS c
    FROM public.core_smoke_runs WHERE created_at < cutoff
    GROUP BY 1
  ) t;

  -- Capture a sample (up to 500 rows) of what is about to be removed
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'niche', COALESCE(niche_slug, '—'),
        'status', CASE WHEN success THEN 'success' ELSE 'failure' END,
        'label', label,
        'createdAt', created_at
      )
      ORDER BY created_at ASC
    ),
    '[]'::jsonb
  )
  INTO samples
  FROM (
    SELECT id, niche_slug, success, label, created_at
    FROM public.core_smoke_runs
    WHERE created_at < cutoff
    ORDER BY created_at ASC
    LIMIT 500
  ) s;

  DELETE FROM public.core_smoke_runs WHERE created_at < cutoff;

  INSERT INTO public.core_smoke_purge_log(
    retention_days, trigger, triggered_by, total_removed, by_niche, by_status, removed_samples
  )
  VALUES (days, trigger_source, triggered_by_user, total, by_niche, by_status, samples)
  RETURNING id INTO log_id;

  RETURN jsonb_build_object(
    'id', log_id,
    'totalRemoved', total,
    'byNiche', by_niche,
    'byStatus', by_status,
    'samples', samples,
    'sampleCount', jsonb_array_length(samples),
    'retentionDays', days,
    'trigger', trigger_source,
    'ranAt', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_smoke_runs_detailed(integer, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_smoke_runs_detailed(integer, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.get_smoke_retention_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  retention_days integer := 180;
  job_row record;
  last_log record;
  next_run timestamptz;
BEGIN
  SELECT jobid, jobname, schedule, active
    INTO job_row
  FROM cron.job
  WHERE jobname = 'purge-core-smoke-runs'
  LIMIT 1;

  SELECT id, ran_at, trigger, total_removed, by_niche, by_status, removed_samples
    INTO last_log
  FROM public.core_smoke_purge_log
  ORDER BY ran_at DESC
  LIMIT 1;

  IF COALESCE(job_row.schedule, '0 3 * * *') = '0 3 * * *' THEN
    next_run := date_trunc('day', now() at time zone 'UTC') + interval '3 hours';
    IF next_run <= now() THEN
      next_run := next_run + interval '1 day';
    END IF;
  ELSE
    next_run := NULL;
  END IF;

  RETURN jsonb_build_object(
    'retentionDays', retention_days,
    'jobName', COALESCE(job_row.jobname, 'purge-core-smoke-runs'),
    'schedule', COALESCE(job_row.schedule, '0 3 * * *'),
    'active', COALESCE(job_row.active, true),
    'scheduleLabel', 'Todos os dias às 03:00 UTC',
    'nextRunAt', next_run,
    'lastRunAt', last_log.ran_at,
    'lastRunStatus', CASE WHEN last_log.id IS NULL THEN NULL ELSE 'succeeded' END,
    'lastRemovedCount', last_log.total_removed,
    'lastTrigger', last_log.trigger,
    'lastByNiche', COALESCE(last_log.by_niche, '{}'::jsonb),
    'lastByStatus', COALESCE(last_log.by_status, '{}'::jsonb),
    'lastSamples', COALESCE(last_log.removed_samples, '[]'::jsonb),
    'lastSampleCount', jsonb_array_length(COALESCE(last_log.removed_samples, '[]'::jsonb)),
    'lastLogId', last_log.id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_smoke_retention_info() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_smoke_retention_info() TO authenticated, service_role;
