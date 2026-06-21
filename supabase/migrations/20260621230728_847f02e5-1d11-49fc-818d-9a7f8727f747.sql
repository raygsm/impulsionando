
DO $$ BEGIN
  CREATE TYPE public.core_funnel_stage AS ENUM ('capture','convert','relate','retain','expand');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.core_funnel_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage public.core_funnel_stage NOT NULL,
  event_name text NOT NULL,
  niche_slug text,
  workflow_name text NOT NULL,
  delay_minutes integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  description text,
  payload_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS core_funnel_rules_uniq
  ON public.core_funnel_rules (stage, event_name, COALESCE(niche_slug,''), workflow_name);
CREATE INDEX IF NOT EXISTS core_funnel_rules_event_idx
  ON public.core_funnel_rules (event_name, stage) WHERE active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_funnel_rules TO authenticated;
GRANT ALL ON public.core_funnel_rules TO service_role;
ALTER TABLE public.core_funnel_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS funnel_rules_read ON public.core_funnel_rules;
CREATE POLICY funnel_rules_read ON public.core_funnel_rules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS funnel_rules_admin ON public.core_funnel_rules;
CREATE POLICY funnel_rules_admin ON public.core_funnel_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.core_funnel_dispatch_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.core_funnel_rules(id) ON DELETE CASCADE,
  stage public.core_funnel_stage NOT NULL,
  event_name text NOT NULL,
  workflow_name text NOT NULL,
  niche_slug text,
  company_id uuid,
  lead_id uuid,
  entity_type text,
  entity_id text,
  contact_email text,
  contact_phone text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  last_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funnel_dispatch_status_chk CHECK (status IN ('queued','sent','failed','skipped','cancelled'))
);
CREATE INDEX IF NOT EXISTS funnel_dispatch_due_idx
  ON public.core_funnel_dispatch_queue (status, scheduled_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS funnel_dispatch_entity_idx
  ON public.core_funnel_dispatch_queue (entity_type, entity_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_funnel_dispatch_queue TO authenticated;
GRANT ALL ON public.core_funnel_dispatch_queue TO service_role;
ALTER TABLE public.core_funnel_dispatch_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS funnel_dispatch_read ON public.core_funnel_dispatch_queue;
CREATE POLICY funnel_dispatch_read ON public.core_funnel_dispatch_queue FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS funnel_dispatch_admin ON public.core_funnel_dispatch_queue;
CREATE POLICY funnel_dispatch_admin ON public.core_funnel_dispatch_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_funnel_rules_touch ON public.core_funnel_rules;
CREATE TRIGGER trg_funnel_rules_touch BEFORE UPDATE ON public.core_funnel_rules
FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
DROP TRIGGER IF EXISTS trg_funnel_dispatch_touch ON public.core_funnel_dispatch_queue;
CREATE TRIGGER trg_funnel_dispatch_touch BEFORE UPDATE ON public.core_funnel_dispatch_queue
FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

CREATE OR REPLACE FUNCTION public.enqueue_funnel_event(
  _stage public.core_funnel_stage,
  _event_name text,
  _niche_slug text DEFAULT NULL,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _company_id uuid DEFAULT NULL,
  _lead_id uuid DEFAULT NULL,
  _contact_email text DEFAULT NULL,
  _contact_phone text DEFAULT NULL,
  _payload jsonb DEFAULT '{}'::jsonb
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rule record; _count integer := 0;
BEGIN
  FOR _rule IN
    SELECT * FROM public.core_funnel_rules
    WHERE active = true
      AND stage = _stage
      AND event_name = _event_name
      AND (niche_slug IS NULL OR niche_slug = _niche_slug)
  LOOP
    INSERT INTO public.core_funnel_dispatch_queue (
      rule_id, stage, event_name, workflow_name, niche_slug,
      company_id, lead_id, entity_type, entity_id,
      contact_email, contact_phone, payload, scheduled_at
    ) VALUES (
      _rule.id, _stage, _event_name, _rule.workflow_name, _niche_slug,
      _company_id, _lead_id, _entity_type, _entity_id,
      _contact_email, _contact_phone,
      _rule.payload_template || _payload,
      now() + make_interval(mins => _rule.delay_minutes)
    );
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END $$;

REVOKE ALL ON FUNCTION public.enqueue_funnel_event(public.core_funnel_stage, text, text, text, text, uuid, uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_funnel_event(public.core_funnel_stage, text, text, text, text, uuid, uuid, text, text, jsonb) TO authenticated, service_role;

-- Trigger marketing_leads → capture/lead_created
CREATE OR REPLACE FUNCTION public.trg_funnel_lead_created_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _niche text;
BEGIN
  _niche := COALESCE(NEW.answers->>'niche_slug', NEW.answers->>'segmento', NEW.utm_campaign);
  PERFORM public.enqueue_funnel_event(
    'capture'::core_funnel_stage, 'lead_created', _niche,
    'marketing_lead', NEW.id::text, NULL, NEW.id,
    NEW.email, NEW.phone,
    jsonb_build_object(
      'name', NEW.name, 'company', NEW.company, 'source', NEW.source,
      'utm_source', NEW.utm_source, 'utm_medium', NEW.utm_medium, 'utm_campaign', NEW.utm_campaign,
      'recommended_plan', NEW.recommended_plan
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.runtime_events (scope, level, message, context)
  VALUES ('funnel.lead_created', 'error', 'falha ao enfileirar régua: ' || SQLERRM,
          jsonb_build_object('lead_id', NEW.id, 'sqlstate', SQLSTATE));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_funnel_lead_created ON public.marketing_leads;
CREATE TRIGGER trg_funnel_lead_created AFTER INSERT ON public.marketing_leads
FOR EACH ROW EXECUTE FUNCTION public.trg_funnel_lead_created_fn();

-- Trigger crm_opportunities status → convert/opp_won ou retain/opp_lost
CREATE OR REPLACE FUNCTION public.trg_funnel_opp_status_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _niche text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  SELECT n.slug INTO _niche FROM public.companies c LEFT JOIN public.niches n ON n.id = c.niche_id WHERE c.id = NEW.company_id;

  IF NEW.status = 'won' THEN
    PERFORM public.enqueue_funnel_event(
      'convert'::core_funnel_stage, 'opp_won', _niche,
      'crm_opportunity', NEW.id::text, NEW.company_id, NEW.lead_id, NULL, NULL,
      jsonb_build_object('title', NEW.title, 'value', NEW.value, 'currency', NEW.currency)
    );
  ELSIF NEW.status = 'lost' THEN
    PERFORM public.enqueue_funnel_event(
      'retain'::core_funnel_stage, 'opp_lost', _niche,
      'crm_opportunity', NEW.id::text, NEW.company_id, NEW.lead_id, NULL, NULL,
      jsonb_build_object('title', NEW.title, 'value', NEW.value, 'lost_reason', NEW.lost_reason)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.runtime_events (scope, level, message, context)
  VALUES ('funnel.opp_status', 'error', 'falha ao enfileirar régua: ' || SQLERRM,
          jsonb_build_object('opp_id', NEW.id, 'sqlstate', SQLSTATE));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_funnel_opp_status ON public.crm_opportunities;
CREATE TRIGGER trg_funnel_opp_status AFTER INSERT OR UPDATE OF status ON public.crm_opportunities
FOR EACH ROW EXECUTE FUNCTION public.trg_funnel_opp_status_fn();

-- Seeds idempotentes — regras globais por evento
INSERT INTO public.core_funnel_rules (stage, event_name, workflow_name, delay_minutes, description)
SELECT 'capture', 'lead_created', '01-captacao-lead-nurturing', 0,
       'Régua de nurturing inicial para novos leads (global)'
WHERE NOT EXISTS (SELECT 1 FROM public.core_funnel_rules WHERE stage='capture' AND event_name='lead_created' AND niche_slug IS NULL AND workflow_name='01-captacao-lead-nurturing');

INSERT INTO public.core_funnel_rules (stage, event_name, workflow_name, delay_minutes, description)
SELECT 'convert', 'opp_won', '04-relacionamento-onboarding-pago', 5,
       'Onboarding pago: dispara 5min após oportunidade ganha'
WHERE NOT EXISTS (SELECT 1 FROM public.core_funnel_rules WHERE stage='convert' AND event_name='opp_won' AND niche_slug IS NULL AND workflow_name='04-relacionamento-onboarding-pago');

INSERT INTO public.core_funnel_rules (stage, event_name, workflow_name, delay_minutes, description)
SELECT 'retain', 'opp_lost', '06-retencao-winback-cancelados', 60,
       'Winback de oportunidades perdidas após 1h'
WHERE NOT EXISTS (SELECT 1 FROM public.core_funnel_rules WHERE stage='retain' AND event_name='opp_lost' AND niche_slug IS NULL AND workflow_name='06-retencao-winback-cancelados');
