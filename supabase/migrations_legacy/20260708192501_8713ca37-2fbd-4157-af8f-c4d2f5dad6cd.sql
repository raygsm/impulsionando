-- ============================================================
-- Painel de conversão do core Impulsionando — persistência real
-- ============================================================

-- 1) Tabela de eventos de funil
CREATE TABLE public.painel_funnel_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  session_id    text NOT NULL,
  visitor_id    text,
  event_name    text NOT NULL,
  host          text NOT NULL,
  path          text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  href          text,
  params        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ua            text,
  ip_hash       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX painel_funnel_events_company_created_idx
  ON public.painel_funnel_events (company_id, created_at DESC);
CREATE INDEX painel_funnel_events_host_created_idx
  ON public.painel_funnel_events (host, created_at DESC);
CREATE INDEX painel_funnel_events_session_idx
  ON public.painel_funnel_events (session_id);
CREATE INDEX painel_funnel_events_event_created_idx
  ON public.painel_funnel_events (event_name, created_at DESC);
CREATE INDEX painel_funnel_events_campaign_idx
  ON public.painel_funnel_events (utm_campaign)
  WHERE utm_campaign IS NOT NULL;

GRANT INSERT ON public.painel_funnel_events TO anon, authenticated;
GRANT SELECT ON public.painel_funnel_events TO authenticated;
GRANT ALL    ON public.painel_funnel_events TO service_role;

ALTER TABLE public.painel_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "painel_funnel_events public insert"
  ON public.painel_funnel_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "painel_funnel_events admin read"
  ON public.painel_funnel_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Tabela de hits ao subdomínio legado
CREATE TABLE public.painel_legacy_hits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_host   text NOT NULL,
  to_host     text NOT NULL,
  path        text NOT NULL DEFAULT '/',
  search      text NOT NULL DEFAULT '',
  hash        text NOT NULL DEFAULT '',
  ua          text,
  ip_hash     text,
  referer     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX painel_legacy_hits_from_host_idx
  ON public.painel_legacy_hits (from_host, created_at DESC);
CREATE INDEX painel_legacy_hits_created_idx
  ON public.painel_legacy_hits (created_at DESC);

GRANT INSERT ON public.painel_legacy_hits TO anon, authenticated;
GRANT SELECT ON public.painel_legacy_hits TO authenticated;
GRANT ALL    ON public.painel_legacy_hits TO service_role;

ALTER TABLE public.painel_legacy_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "painel_legacy_hits public insert"
  ON public.painel_legacy_hits
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "painel_legacy_hits admin read"
  ON public.painel_legacy_hits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Função agregadora consumida pelo /colors/painel
CREATE OR REPLACE FUNCTION public.painel_aggregate(
  host_filter text DEFAULT NULL,
  since_ts    timestamptz DEFAULT (now() - interval '7 days'),
  until_ts    timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  funnel_json jsonb;
  campaigns_json jsonb;
  legacy_json jsonb;
  total_events bigint;
BEGIN
  -- Só administradores leem agregados; casa com as políticas de SELECT.
  is_admin := public.has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Funil por host: sessões, CTA, checkout, lead, whatsapp, conv%.
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.host), '[]'::jsonb) INTO funnel_json
  FROM (
    SELECT
      host,
      COUNT(DISTINCT session_id)                                                    AS sessions,
      COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'cta_click')            AS cta,
      COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'checkout_click')       AS checkout,
      COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'lead_submit')          AS lead,
      COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'whatsapp_click')       AS whatsapp,
      COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'ebook_download')       AS ebook,
      CASE
        WHEN COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'cta_click') > 0
        THEN ROUND(
          100.0 * COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'checkout_click')::numeric
               / COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'cta_click')::numeric
        , 1)
        ELSE 0
      END AS conversion_rate
    FROM public.painel_funnel_events
    WHERE created_at >= since_ts
      AND created_at <  until_ts
      AND (host_filter IS NULL OR host = host_filter)
    GROUP BY host
  ) t;

  -- Top campanhas.
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.checkout DESC NULLS LAST), '[]'::jsonb)
    INTO campaigns_json
  FROM (
    SELECT
      COALESCE(NULLIF(utm_campaign, ''), '(none)') AS utm_campaign,
      COUNT(DISTINCT session_id)                                              AS sessions,
      COUNT(*) FILTER (WHERE event_name = 'cta_click')                        AS cta,
      COUNT(*) FILTER (WHERE event_name = 'checkout_click')                   AS checkout,
      COUNT(*) FILTER (WHERE event_name = 'lead_submit')                      AS lead
    FROM public.painel_funnel_events
    WHERE created_at >= since_ts
      AND created_at <  until_ts
      AND (host_filter IS NULL OR host = host_filter)
    GROUP BY 1
    LIMIT 100
  ) t;

  -- Legacy hits por host.
  SELECT COALESCE(jsonb_agg(row_to_json(l)::jsonb ORDER BY l.hits DESC), '[]'::jsonb) INTO legacy_json
  FROM (
    SELECT
      from_host              AS host,
      COUNT(*)               AS hits,
      MAX(created_at)        AS last_hit
    FROM public.painel_legacy_hits
    WHERE created_at >= since_ts
      AND created_at <  until_ts
      AND (host_filter IS NULL OR from_host = host_filter OR to_host = host_filter)
    GROUP BY from_host
  ) l;

  SELECT COUNT(*) INTO total_events
  FROM public.painel_funnel_events
  WHERE created_at >= since_ts
    AND created_at <  until_ts
    AND (host_filter IS NULL OR host = host_filter);

  RETURN jsonb_build_object(
    'generated_at', to_jsonb(now()),
    'since',        to_jsonb(since_ts),
    'until',        to_jsonb(until_ts),
    'host_filter',  to_jsonb(host_filter),
    'total_events', total_events,
    'funnel',       funnel_json,
    'campaigns',    campaigns_json,
    'legacy',       legacy_json
  );
END;
$$;

REVOKE ALL ON FUNCTION public.painel_aggregate(text, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.painel_aggregate(text, timestamptz, timestamptz) TO authenticated, service_role;
