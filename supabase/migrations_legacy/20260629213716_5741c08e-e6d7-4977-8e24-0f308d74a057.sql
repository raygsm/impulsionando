CREATE OR REPLACE VIEW public.v_core_uptime_daily WITH (security_invoker = true) AS
SELECT
  url,
  (date_trunc('day', checked_at AT TIME ZONE 'UTC'))::date AS day,
  count(*) AS checks,
  count(*) FILTER (WHERE is_up) AS up_checks,
  CASE WHEN count(*) > 0
    THEN ROUND((count(*) FILTER (WHERE is_up))::numeric / count(*)::numeric, 4)
    ELSE NULL END AS up_ratio
FROM public.uptime_checks
WHERE checked_at >= (now() - interval '90 days')
GROUP BY url, day;

GRANT SELECT ON public.v_core_uptime_daily TO authenticated, service_role;