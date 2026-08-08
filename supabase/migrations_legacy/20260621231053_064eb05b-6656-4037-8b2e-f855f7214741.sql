
-- Phase 11: Funnel telemetry views (cross-tenant)

CREATE OR REPLACE VIEW public.v_funnel_dispatch_stats AS
SELECT
  q.stage,
  COALESCE(q.niche_slug, 'global') AS niche_slug,
  q.workflow_name,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE q.status = 'queued')::int AS queued,
  COUNT(*) FILTER (WHERE q.status = 'sent')::int AS sent,
  COUNT(*) FILTER (WHERE q.status = 'failed')::int AS failed,
  COUNT(*) FILTER (WHERE q.status = 'skipped')::int AS skipped,
  COUNT(*) FILTER (WHERE q.status = 'cancelled')::int AS cancelled,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE q.status = 'sent')
    / NULLIF(COUNT(*) FILTER (WHERE q.status IN ('sent','failed')), 0),
    2
  ) AS delivery_rate_pct,
  AVG(EXTRACT(EPOCH FROM (q.sent_at - q.scheduled_at)))
    FILTER (WHERE q.sent_at IS NOT NULL) AS avg_latency_seconds,
  MAX(q.updated_at) AS last_activity_at
FROM public.core_funnel_dispatch_queue q
WHERE q.created_at >= now() - INTERVAL '30 days'
GROUP BY q.stage, COALESCE(q.niche_slug, 'global'), q.workflow_name;

GRANT SELECT ON public.v_funnel_dispatch_stats TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_funnel_conversion AS
WITH per_stage AS (
  SELECT
    COALESCE(niche_slug, 'global') AS niche_slug,
    stage,
    COUNT(DISTINCT COALESCE(entity_id, lead_id::text))::int AS entities
  FROM public.core_funnel_dispatch_queue
  WHERE created_at >= now() - INTERVAL '90 days'
  GROUP BY 1, 2
)
SELECT
  niche_slug,
  COALESCE(SUM(entities) FILTER (WHERE stage = 'capture'), 0)::int AS capture,
  COALESCE(SUM(entities) FILTER (WHERE stage = 'convert'), 0)::int AS convert,
  COALESCE(SUM(entities) FILTER (WHERE stage = 'relate'),  0)::int AS relate,
  COALESCE(SUM(entities) FILTER (WHERE stage = 'retain'),  0)::int AS retain,
  COALESCE(SUM(entities) FILTER (WHERE stage = 'expand'),  0)::int AS expand,
  ROUND(
    100.0 * COALESCE(SUM(entities) FILTER (WHERE stage = 'convert'), 0)
    / NULLIF(COALESCE(SUM(entities) FILTER (WHERE stage = 'capture'), 0), 0),
    2
  ) AS capture_to_convert_pct,
  ROUND(
    100.0 * COALESCE(SUM(entities) FILTER (WHERE stage = 'retain'), 0)
    / NULLIF(COALESCE(SUM(entities) FILTER (WHERE stage = 'convert'), 0), 0),
    2
  ) AS convert_to_retain_pct
FROM per_stage
GROUP BY niche_slug;

GRANT SELECT ON public.v_funnel_conversion TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_funnel_recent_failures AS
SELECT
  q.id,
  q.stage,
  q.event_name,
  q.workflow_name,
  COALESCE(q.niche_slug, 'global') AS niche_slug,
  q.entity_type,
  q.entity_id,
  q.attempts,
  q.last_error,
  q.scheduled_at,
  q.updated_at
FROM public.core_funnel_dispatch_queue q
WHERE q.status = 'failed'
  AND q.updated_at >= now() - INTERVAL '7 days'
ORDER BY q.updated_at DESC
LIMIT 50;

GRANT SELECT ON public.v_funnel_recent_failures TO authenticated, service_role;
