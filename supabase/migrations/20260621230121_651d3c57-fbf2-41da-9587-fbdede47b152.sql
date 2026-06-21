
DO $$ BEGIN
  CREATE TYPE public.core_incident_severity AS ENUM ('sev1','sev2','sev3','sev4');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.core_incident_status AS ENUM ('open','monitoring','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.core_slo_scope AS ENUM ('global','uptime_url','runtime_scope');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.core_slo_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.core_slo_scope NOT NULL DEFAULT 'global',
  url text,
  runtime_scope text,
  name text NOT NULL,
  availability_target_bps integer NOT NULL DEFAULT 9950,
  latency_p95_target_ms integer NOT NULL DEFAULT 1500,
  window_days integer NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT core_slo_targets_scope_chk CHECK (
    (scope = 'global'        AND url IS NULL AND runtime_scope IS NULL) OR
    (scope = 'uptime_url'    AND url IS NOT NULL) OR
    (scope = 'runtime_scope' AND runtime_scope IS NOT NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS core_slo_targets_uniq_url    ON public.core_slo_targets(url)           WHERE scope = 'uptime_url';
CREATE UNIQUE INDEX IF NOT EXISTS core_slo_targets_uniq_rt     ON public.core_slo_targets(runtime_scope) WHERE scope = 'runtime_scope';
CREATE UNIQUE INDEX IF NOT EXISTS core_slo_targets_uniq_global ON public.core_slo_targets(scope)         WHERE scope = 'global';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_slo_targets TO authenticated;
GRANT ALL ON public.core_slo_targets TO service_role;
ALTER TABLE public.core_slo_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS slo_targets_read ON public.core_slo_targets;
CREATE POLICY slo_targets_read ON public.core_slo_targets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS slo_targets_admin ON public.core_slo_targets;
CREATE POLICY slo_targets_admin ON public.core_slo_targets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.core_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.core_slo_scope NOT NULL,
  url text,
  runtime_scope text,
  severity public.core_incident_severity NOT NULL DEFAULT 'sev3',
  status public.core_incident_status NOT NULL DEFAULT 'open',
  title text NOT NULL,
  description text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  event_count integer NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'uptime',
  postmortem text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS core_incidents_status_idx ON public.core_incidents(status, severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS core_incidents_url_idx    ON public.core_incidents(url) WHERE url IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_incidents TO authenticated;
GRANT ALL ON public.core_incidents TO service_role;
ALTER TABLE public.core_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS incidents_read ON public.core_incidents;
CREATE POLICY incidents_read ON public.core_incidents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS incidents_admin ON public.core_incidents;
CREATE POLICY incidents_admin ON public.core_incidents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public._touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_slo_targets_touch ON public.core_slo_targets;
CREATE TRIGGER trg_slo_targets_touch BEFORE UPDATE ON public.core_slo_targets FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
DROP TRIGGER IF EXISTS trg_incidents_touch ON public.core_incidents;
CREATE TRIGGER trg_incidents_touch BEFORE UPDATE ON public.core_incidents FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

CREATE OR REPLACE FUNCTION public.open_incident(
  _scope public.core_slo_scope, _title text,
  _severity public.core_incident_severity DEFAULT 'sev3',
  _url text DEFAULT NULL, _runtime_scope text DEFAULT NULL,
  _description text DEFAULT NULL, _source text DEFAULT 'uptime',
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _existing uuid;
BEGIN
  SELECT id INTO _existing FROM public.core_incidents
  WHERE status IN ('open','monitoring') AND scope = _scope
    AND COALESCE(url,'') = COALESCE(_url,'')
    AND COALESCE(runtime_scope,'') = COALESCE(_runtime_scope,'')
  ORDER BY detected_at DESC LIMIT 1;
  IF _existing IS NOT NULL THEN
    UPDATE public.core_incidents
       SET event_count = event_count + 1,
           severity = LEAST(severity, _severity),
           metadata = metadata || _metadata
     WHERE id = _existing;
    RETURN _existing;
  END IF;
  INSERT INTO public.core_incidents (scope, url, runtime_scope, severity, status, title, description, source, metadata)
  VALUES (_scope, _url, _runtime_scope, _severity, 'open', _title, _description, _source, _metadata)
  RETURNING id INTO _existing;
  RETURN _existing;
END $$;

CREATE OR REPLACE FUNCTION public.resolve_incident(
  _scope public.core_slo_scope, _url text DEFAULT NULL,
  _runtime_scope text DEFAULT NULL, _note text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  SELECT id INTO _id FROM public.core_incidents
  WHERE status IN ('open','monitoring') AND scope = _scope
    AND COALESCE(url,'') = COALESCE(_url,'')
    AND COALESCE(runtime_scope,'') = COALESCE(_runtime_scope,'')
  ORDER BY detected_at DESC LIMIT 1;
  IF _id IS NULL THEN RETURN NULL; END IF;
  UPDATE public.core_incidents
     SET status='resolved', resolved_at = now(),
         postmortem = COALESCE(postmortem,'') || COALESCE(E'\n[auto] ' || _note,'')
   WHERE id = _id;
  RETURN _id;
END $$;

REVOKE ALL ON FUNCTION public.open_incident(public.core_slo_scope, text, public.core_incident_severity, text, text, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_incident(public.core_slo_scope, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_incident(public.core_slo_scope, text, public.core_incident_severity, text, text, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_incident(public.core_slo_scope, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_uptime_incident_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_up = false AND COALESCE(NEW.consecutive_failures, 0) >= 3
     AND (TG_OP = 'INSERT' OR OLD.consecutive_failures IS DISTINCT FROM NEW.consecutive_failures) THEN
    PERFORM public.open_incident(
      'uptime_url'::core_slo_scope,
      'Indisponibilidade: ' || NEW.url,
      CASE WHEN NEW.consecutive_failures >= 6 THEN 'sev1'::core_incident_severity ELSE 'sev2'::core_incident_severity END,
      NEW.url, NULL, NEW.last_error, 'uptime',
      jsonb_build_object('consecutive_failures', NEW.consecutive_failures, 'first_failure_at', NEW.first_failure_at)
    );
  ELSIF NEW.is_up = true AND (TG_OP='UPDATE' AND OLD.is_up = false) THEN
    PERFORM public.resolve_incident('uptime_url'::core_slo_scope, NEW.url, NULL, 'Serviço recuperou em ' || now()::text);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_uptime_incident ON public.uptime_state;
CREATE TRIGGER trg_uptime_incident AFTER INSERT OR UPDATE OF is_up, consecutive_failures
ON public.uptime_state FOR EACH ROW EXECUTE FUNCTION public.trg_uptime_incident_fn();

CREATE OR REPLACE VIEW public.v_core_slo_status WITH (security_invoker = true) AS
WITH win AS (
  SELECT url, count(*) AS checks_24h, count(*) FILTER (WHERE is_up) AS up_24h,
         percentile_disc(0.95) WITHIN GROUP (ORDER BY response_ms) AS p95_24h
  FROM public.uptime_checks WHERE checked_at >= now() - interval '24 hours' GROUP BY url
),
win7 AS (
  SELECT url, count(*) AS checks_7d, count(*) FILTER (WHERE is_up) AS up_7d
  FROM public.uptime_checks WHERE checked_at >= now() - interval '7 days' GROUP BY url
)
SELECT s.url, s.is_up AS currently_up, s.since, s.consecutive_failures,
  t.availability_target_bps, t.latency_p95_target_ms,
  COALESCE(w.checks_24h,0) AS checks_24h, COALESCE(w.up_24h,0) AS up_24h,
  CASE WHEN COALESCE(w.checks_24h,0)>0 THEN ROUND((w.up_24h::numeric/w.checks_24h::numeric)*10000)::integer END AS availability_bps_24h,
  COALESCE(w.p95_24h,0)::integer AS p95_ms_24h,
  COALESCE(w7.checks_7d,0) AS checks_7d, COALESCE(w7.up_7d,0) AS up_7d,
  CASE WHEN COALESCE(w7.checks_7d,0)>0 THEN ROUND((w7.up_7d::numeric/w7.checks_7d::numeric)*10000)::integer END AS availability_bps_7d,
  CASE WHEN t.availability_target_bps IS NOT NULL AND COALESCE(w7.checks_7d,0)>0
       THEN GREATEST(0, ROUND(((10000 - t.availability_target_bps)::numeric
            - (w7.checks_7d - w7.up_7d)::numeric / w7.checks_7d::numeric * 10000)))::integer END AS error_budget_bps_left_7d
FROM public.uptime_state s
LEFT JOIN public.core_slo_targets t ON (t.scope='uptime_url' AND t.url = s.url AND t.active)
LEFT JOIN win  w  ON w.url  = s.url
LEFT JOIN win7 w7 ON w7.url = s.url;

GRANT SELECT ON public.v_core_slo_status TO authenticated, service_role;

INSERT INTO public.core_slo_targets (scope, name, availability_target_bps, latency_p95_target_ms, window_days, notes)
SELECT 'global', 'SLO global do core Impulsionando', 9950, 1500, 30, 'Disponibilidade 99,5% / p95 1.5s / janela 30d'
WHERE NOT EXISTS (SELECT 1 FROM public.core_slo_targets WHERE scope='global');

INSERT INTO public.core_slo_targets (scope, url, name, availability_target_bps, latency_p95_target_ms, window_days, notes)
SELECT 'uptime_url', s.url, 'SLO ' || s.url, 9950, 1500, 30, 'Auto-seed a partir de uptime_state'
FROM public.uptime_state s
WHERE NOT EXISTS (SELECT 1 FROM public.core_slo_targets t WHERE t.scope='uptime_url' AND t.url = s.url);
