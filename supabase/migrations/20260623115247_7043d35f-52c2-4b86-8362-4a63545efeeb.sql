
-- =========================================================================
-- 1) Extensões em support_tickets
-- =========================================================================
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS reopened_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reopened_at timestamptz,
  ADD COLUMN IF NOT EXISTS waiting_customer_since timestamptz,
  ADD COLUMN IF NOT EXISTS crm_lead_id uuid,
  ADD COLUMN IF NOT EXISTS crm_opportunity_id uuid,
  ADD COLUMN IF NOT EXISTS ai_topic text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

CREATE INDEX IF NOT EXISTS support_tickets_company_status_idx
  ON public.support_tickets(company_id, status);
CREATE INDEX IF NOT EXISTS support_tickets_ai_topic_idx
  ON public.support_tickets(ai_topic) WHERE ai_topic IS NOT NULL;
CREATE INDEX IF NOT EXISTS support_tickets_tags_idx
  ON public.support_tickets USING GIN(tags);

-- =========================================================================
-- 2) SLA policies
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.support_sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  plan_code text,
  priority support_ticket_priority NOT NULL,
  first_response_minutes int NOT NULL,
  resolution_minutes int NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, plan_code, priority)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_sla_policies TO authenticated;
GRANT ALL ON public.support_sla_policies TO service_role;
ALTER TABLE public.support_sla_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sla read company or staff" ON public.support_sla_policies FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "sla manage staff" ON public.support_sla_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Defaults globais (company_id NULL = fallback)
INSERT INTO public.support_sla_policies (company_id, plan_code, priority, first_response_minutes, resolution_minutes)
VALUES
  (NULL, 'default', 'low',      720,  10080),  -- 12h / 7d
  (NULL, 'default', 'medium',   240,  2880),   -- 4h  / 2d
  (NULL, 'default', 'high',     60,   480),    -- 1h  / 8h
  (NULL, 'default', 'critical', 15,   120)     -- 15m / 2h
ON CONFLICT (company_id, plan_code, priority) DO NOTHING;

-- =========================================================================
-- 3) Eventos do ticket (audit)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.support_ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_user_id uuid,
  event_type text NOT NULL,     -- status_changed, assigned, reopened, message_sent, ai_summary, sla_breach
  from_value text,
  to_value text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_ticket_events_ticket_idx ON public.support_ticket_events(ticket_id, created_at DESC);
GRANT SELECT, INSERT ON public.support_ticket_events TO authenticated;
GRANT ALL ON public.support_ticket_events TO service_role;
ALTER TABLE public.support_ticket_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events read via ticket" ON public.support_ticket_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_ticket_events.ticket_id
        AND (
          t.company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
          OR t.requester_user_id = auth.uid()
          OR t.consumer_user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );
CREATE POLICY "events insert authenticated" ON public.support_ticket_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- =========================================================================
-- 4) Agregado diário de temas (IA)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.support_ticket_topics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  day date NOT NULL,
  topic text NOT NULL,
  ticket_count int NOT NULL DEFAULT 0,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, day, topic)
);
CREATE INDEX IF NOT EXISTS support_topics_company_day_idx ON public.support_ticket_topics_daily(company_id, day DESC);
GRANT SELECT ON public.support_ticket_topics_daily TO authenticated;
GRANT ALL ON public.support_ticket_topics_daily TO service_role;
ALTER TABLE public.support_ticket_topics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics read company or staff" ON public.support_ticket_topics_daily FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================================
-- 5) CSAT detalhado
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.support_csat_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  company_id uuid,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  nps int CHECK (nps BETWEEN 0 AND 10),
  comment text,
  responded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_id)
);
GRANT SELECT, INSERT ON public.support_csat_responses TO authenticated;
GRANT ALL ON public.support_csat_responses TO service_role;
ALTER TABLE public.support_csat_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "csat read company or staff" ON public.support_csat_responses FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    OR responded_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "csat insert by requester" ON public.support_csat_responses FOR INSERT TO authenticated
  WITH CHECK (responded_by = auth.uid());

-- =========================================================================
-- 6) RPC: reabrir ticket
-- =========================================================================
CREATE OR REPLACE FUNCTION public.support_reopen_ticket(_ticket_id uuid, _reason text DEFAULT NULL)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t public.support_tickets;
BEGIN
  SELECT * INTO _t FROM public.support_tickets WHERE id = _ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket não encontrado';
  END IF;
  IF _t.status NOT IN ('resolved','closed','cancelled') THEN
    RAISE EXCEPTION 'Ticket não pode ser reaberto (status atual: %)', _t.status;
  END IF;
  UPDATE public.support_tickets
     SET status = 'reopened'::support_ticket_status,
         reopened_at = now(),
         reopened_count = reopened_count + 1,
         resolved_at = NULL,
         closed_at = NULL,
         updated_at = now()
   WHERE id = _ticket_id
   RETURNING * INTO _t;
  INSERT INTO public.support_ticket_events(ticket_id, actor_user_id, event_type, to_value, metadata)
  VALUES (_ticket_id, auth.uid(), 'reopened', 'reopened', jsonb_build_object('reason', _reason));
  RETURN _t;
END;
$$;
GRANT EXECUTE ON FUNCTION public.support_reopen_ticket(uuid, text) TO authenticated;

-- =========================================================================
-- 7) Trigger de eventos em alterações
-- =========================================================================
CREATE OR REPLACE FUNCTION public.support_tickets_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.support_ticket_events(ticket_id, actor_user_id, event_type, from_value, to_value)
      VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status::text, NEW.status::text);
      IF NEW.status = 'waiting_customer' AND OLD.status IS DISTINCT FROM 'waiting_customer' THEN
        NEW.waiting_customer_since := now();
      ELSIF NEW.status <> 'waiting_customer' THEN
        NEW.waiting_customer_since := NULL;
      END IF;
    END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      INSERT INTO public.support_ticket_events(ticket_id, actor_user_id, event_type, from_value, to_value)
      VALUES (NEW.id, auth.uid(), 'assigned', COALESCE(OLD.assigned_to::text,''), COALESCE(NEW.assigned_to::text,''));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS support_tickets_audit_trg ON public.support_tickets;
CREATE TRIGGER support_tickets_audit_trg
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.support_tickets_audit();

-- last_message_at touch
CREATE OR REPLACE FUNCTION public.support_messages_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.support_tickets SET last_message_at = now(), updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS support_messages_touch_trg ON public.support_ticket_messages;
CREATE TRIGGER support_messages_touch_trg
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.support_messages_touch();

-- =========================================================================
-- 8) Catálogo do módulo
-- =========================================================================
INSERT INTO public.core_module_catalog
  (slug, name, category, short_description, long_description, features, recommended_with, niches, base_price_cents, setup_price_cents, icon, active)
VALUES (
  'support-inteligente',
  'Suporte Inteligente',
  'atendimento',
  'Tickets integrados ao CRM, WhatsApp e Email, com SLA, follow-up automático e IA que resume os problemas mais recorrentes em %.',
  'Sistema de tickets que não fica isolado: vive dentro do ecossistema Impulsionando. Cada ticket conversa com o lead/oportunidade do CRM, dispara follow-up por WhatsApp e Email a cada mudança de status, mede tempo até primeiro atendimento e até solução, e usa IA para agrupar os problemas mais recorrentes em percentual para a gestão. Status: aberto, em atendimento, aguardando cliente, resolvido, fechado — reabertura no mesmo protocolo quando o cliente volta.',
  '["Integração nativa com CRM (lead e oportunidade)","Follow-up automático WhatsApp + Email por status","SLA por plano/prioridade com alertas de risco","Reabertura no mesmo protocolo","Painel 360 do solicitante","Métricas: TTFR, TTR, backlog, CSAT","IA agrupa problemas recorrentes em %","Agentes ilimitados (sem cobrar por seat)","Auditoria completa de eventos","Tags e categorização inteligente","Templates de resposta por status","Visão por tenant para staff Impulsionando"]'::jsonb,
  ARRAY['crm','whatsapp','followups']::text[],
  ARRAY['todos']::text[],
  49700,
  0,
  'Headphones',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  features = EXCLUDED.features,
  recommended_with = EXCLUDED.recommended_with,
  base_price_cents = EXCLUDED.base_price_cents,
  icon = EXCLUDED.icon,
  active = true,
  updated_at = now();

-- =========================================================================
-- 9) Item no menu admin (Gestão Clientes → Operação)
-- =========================================================================
INSERT INTO public.core_admin_menu
  (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
VALUES (
  'clientes', 'operation', 'Operação', 40,
  'suporte-pro', 'Suporte Inteligente', 30,
  '/admin/suporte-pro', 'Headphones',
  'Inbox de tickets, métricas, SLA e IA de temas recorrentes.',
  'admin', true
)
ON CONFLICT DO NOTHING;
