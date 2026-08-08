
CREATE TABLE public.n8n_workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  workflow_version TEXT,
  regua TEXT NOT NULL CHECK (regua IN ('captacao','conversao','relacionamento','retencao','outro')),
  event_name TEXT NOT NULL,
  step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('received','ok','retry','failed','skipped','suppressed')),
  channel TEXT CHECK (channel IN ('email','whatsapp','slack','internal','api','sms')),
  http_status INT,
  latency_ms INT,
  contact_email TEXT,
  contact_phone TEXT,
  lead_id UUID,
  tenant_id UUID,
  entity_type TEXT,
  entity_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX n8n_workflow_runs_idemp_idx
  ON public.n8n_workflow_runs (workflow_name, step, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX n8n_workflow_runs_email_idx   ON public.n8n_workflow_runs (lower(contact_email), created_at DESC);
CREATE INDEX n8n_workflow_runs_workflow_idx ON public.n8n_workflow_runs (workflow_name, created_at DESC);
CREATE INDEX n8n_workflow_runs_status_idx   ON public.n8n_workflow_runs (status, created_at DESC);
CREATE INDEX n8n_workflow_runs_regua_idx    ON public.n8n_workflow_runs (regua, created_at DESC);
CREATE INDEX n8n_workflow_runs_tenant_idx   ON public.n8n_workflow_runs (tenant_id, created_at DESC) WHERE tenant_id IS NOT NULL;

GRANT SELECT ON public.n8n_workflow_runs TO authenticated;
GRANT ALL ON public.n8n_workflow_runs TO service_role;

ALTER TABLE public.n8n_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "n8n_runs_staff_select"
  ON public.n8n_workflow_runs FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "n8n_runs_service_all"
  ON public.n8n_workflow_runs FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE VIEW public.n8n_lead_journey AS
SELECT
  lower(contact_email) AS contact_email,
  min(created_at)      AS first_seen_at,
  max(created_at)      AS last_seen_at,
  count(*)             AS events,
  count(*) FILTER (WHERE status = 'failed')  AS failures,
  count(*) FILTER (WHERE status = 'ok')      AS successes,
  array_agg(DISTINCT workflow_name)          AS workflows,
  array_agg(DISTINCT regua)                  AS reguas,
  jsonb_agg(
    jsonb_build_object(
      'at', created_at, 'workflow', workflow_name, 'step', step,
      'status', status, 'channel', channel, 'error', error
    ) ORDER BY created_at
  ) AS timeline
FROM public.n8n_workflow_runs
WHERE contact_email IS NOT NULL
GROUP BY lower(contact_email);

GRANT SELECT ON public.n8n_lead_journey TO authenticated;
