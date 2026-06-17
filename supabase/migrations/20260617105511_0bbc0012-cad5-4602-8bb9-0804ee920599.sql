-- Permitir captura pública de leads de feira/demo
GRANT INSERT ON public.demo_leads TO anon;
GRANT INSERT ON public.demo_leads TO authenticated;
GRANT ALL ON public.demo_leads TO service_role;

GRANT INSERT, UPDATE ON public.demo_visit_sessions TO anon;
GRANT INSERT, UPDATE, SELECT ON public.demo_visit_sessions TO authenticated;
GRANT ALL ON public.demo_visit_sessions TO service_role;

-- Função para staff/admin contar leads e calcular score por sessão (heurística simples)
CREATE OR REPLACE FUNCTION public.demo_feira_overview()
RETURNS TABLE(
  total_leads bigint,
  leads_24h bigint,
  leads_7d bigint,
  total_sessions bigint,
  sessions_converted bigint,
  avg_modules_viewed numeric,
  by_niche jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      (SELECT count(*) FROM public.demo_leads) AS total_leads,
      (SELECT count(*) FROM public.demo_leads WHERE created_at > now() - interval '24 hours') AS leads_24h,
      (SELECT count(*) FROM public.demo_leads WHERE created_at > now() - interval '7 days') AS leads_7d,
      (SELECT count(*) FROM public.demo_visit_sessions) AS total_sessions,
      (SELECT count(*) FROM public.demo_visit_sessions WHERE converted_lead_id IS NOT NULL) AS sessions_converted,
      (SELECT COALESCE(avg(array_length(viewed_modules,1))::numeric,0) FROM public.demo_visit_sessions) AS avg_modules_viewed
  ),
  niches AS (
    SELECT jsonb_object_agg(niche, c) AS by_niche FROM (
      SELECT COALESCE(niche,'desconhecido') AS niche, count(*) AS c
      FROM public.demo_leads GROUP BY niche
    ) t
  )
  SELECT b.total_leads, b.leads_24h, b.leads_7d, b.total_sessions, b.sessions_converted,
         b.avg_modules_viewed, COALESCE(n.by_niche,'{}'::jsonb)
  FROM base b CROSS JOIN niches n;
$$;

REVOKE ALL ON FUNCTION public.demo_feira_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.demo_feira_overview() TO authenticated, service_role;