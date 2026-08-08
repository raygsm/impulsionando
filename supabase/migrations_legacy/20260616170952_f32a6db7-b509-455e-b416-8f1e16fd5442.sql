
-- Audit log for each purge run
CREATE TABLE IF NOT EXISTS public.core_smoke_purge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  retention_days integer NOT NULL,
  trigger text NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'manual'
  triggered_by uuid,
  total_removed integer NOT NULL DEFAULT 0,
  by_niche jsonb NOT NULL DEFAULT '{}'::jsonb,
  by_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.core_smoke_purge_log TO authenticated;
GRANT ALL ON public.core_smoke_purge_log TO service_role;

ALTER TABLE public.core_smoke_purge_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view purge log" ON public.core_smoke_purge_log;
CREATE POLICY "Staff can view purge log"
ON public.core_smoke_purge_log
FOR SELECT
TO authenticated
USING (public.is_impulsionando_staff(auth.uid()));

-- Detailed purge: returns total + breakdown, also writes the log row
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

  DELETE FROM public.core_smoke_runs WHERE created_at < cutoff;

  INSERT INTO public.core_smoke_purge_log(retention_days, trigger, triggered_by, total_removed, by_niche, by_status)
  VALUES (days, trigger_source, triggered_by_user, total, by_niche, by_status)
  RETURNING id INTO log_id;

  RETURN jsonb_build_object(
    'id', log_id,
    'totalRemoved', total,
    'byNiche', by_niche,
    'byStatus', by_status,
    'retentionDays', days,
    'trigger', trigger_source,
    'ranAt', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_smoke_runs_detailed(integer, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_smoke_runs_detailed(integer, text, uuid) TO service_role;

-- Keep legacy purge_smoke_runs working (used by pg_cron) — now delegates to detailed
CREATE OR REPLACE FUNCTION public.purge_smoke_runs(days integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  result := public.purge_smoke_runs_detailed(days, 'scheduled', NULL);
  RETURN (result->>'totalRemoved')::integer;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_smoke_runs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_smoke_runs(integer) TO service_role;

-- Staff-callable trigger for manual purge
CREATE OR REPLACE FUNCTION public.trigger_smoke_purge(days integer DEFAULT 180)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.is_impulsionando_staff(uid) THEN
    RAISE EXCEPTION 'Acesso restrito à equipe Impulsionando.';
  END IF;
  RETURN public.purge_smoke_runs_detailed(days, 'manual', uid);
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_smoke_purge(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_smoke_purge(integer) TO authenticated, service_role;

-- Updated retention info: reads from the log for last-purge details
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

  SELECT id, ran_at, trigger, total_removed, by_niche, by_status
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
    'lastLogId', last_log.id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_smoke_retention_info() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_smoke_retention_info() TO authenticated, service_role;
