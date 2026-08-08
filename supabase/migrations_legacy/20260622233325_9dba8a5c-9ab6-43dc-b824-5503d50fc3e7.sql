CREATE OR REPLACE FUNCTION public.core_list_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  url text,
  last_run timestamptz,
  last_status text,
  ok_24h bigint,
  bad_24h bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
  WITH stats AS (
    SELECT d.jobid,
           max(d.start_time) AS last_run,
           (SELECT d2.status FROM cron.job_run_details d2
              WHERE d2.jobid = d.jobid ORDER BY d2.start_time DESC LIMIT 1) AS last_status,
           count(*) FILTER (WHERE d.status = 'succeeded' AND d.start_time > now() - interval '24 hours') AS ok_24h,
           count(*) FILTER (WHERE d.status <> 'succeeded' AND d.start_time > now() - interval '24 hours') AS bad_24h
    FROM cron.job_run_details d
    GROUP BY d.jobid
  )
  SELECT j.jobid,
         j.jobname,
         j.schedule,
         j.active,
         substring(j.command FROM 'url[^''"]*[''"]([^''"]+)[''"]') AS url,
         s.last_run,
         s.last_status,
         coalesce(s.ok_24h, 0),
         coalesce(s.bad_24h, 0)
  FROM cron.job j
  LEFT JOIN stats s ON s.jobid = j.jobid
  ORDER BY j.jobname;
$$;

REVOKE ALL ON FUNCTION public.core_list_cron_jobs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.core_list_cron_jobs() TO authenticated, service_role;