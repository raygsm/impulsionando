
-- Enums
DO $$ BEGIN
  CREATE TYPE public.comm_channel AS ENUM ('whatsapp','email','impulsionito','notification','push','n8n');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.comm_priority AS ENUM ('low','normal','high','critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.comm_dispatch_status AS ENUM ('queued','processing','sent','delivered','failed','dead_letter','skipped','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.comm_template_scope AS ENUM ('global','niche','tenant');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 1. Events catalog
CREATE TABLE public.core_comm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  label_pt TEXT NOT NULL,
  description TEXT,
  default_priority public.comm_priority NOT NULL DEFAULT 'normal',
  default_channels public.comm_channel[] NOT NULL DEFAULT ARRAY['notification','impulsionito']::public.comm_channel[],
  payload_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  impulsionito_hint TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.core_comm_events TO authenticated;
GRANT ALL ON public.core_comm_events TO service_role;
ALTER TABLE public.core_comm_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_events_select_all" ON public.core_comm_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "comm_events_admin_write" ON public.core_comm_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_comm_events_updated BEFORE UPDATE ON public.core_comm_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 2. Templates
CREATE TABLE public.core_comm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code TEXT NOT NULL REFERENCES public.core_comm_events(code) ON DELETE CASCADE,
  channel public.comm_channel NOT NULL,
  scope public.comm_template_scope NOT NULL DEFAULT 'global',
  niche_code TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  subject TEXT,
  body_md TEXT,
  body_html TEXT,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_comm_templates TO authenticated;
GRANT ALL ON public.core_comm_templates TO service_role;
ALTER TABLE public.core_comm_templates ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX ux_comm_templates_active
  ON public.core_comm_templates (event_code, channel, scope, COALESCE(niche_code,''), COALESCE(company_id,'00000000-0000-0000-0000-000000000000'::uuid), locale)
  WHERE active;
CREATE INDEX ix_comm_templates_event_channel ON public.core_comm_templates (event_code, channel);
CREATE INDEX ix_comm_templates_company ON public.core_comm_templates (company_id) WHERE company_id IS NOT NULL;

CREATE POLICY "comm_templates_select" ON public.core_comm_templates FOR SELECT TO authenticated
  USING (scope = 'global' OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));
CREATE POLICY "comm_templates_admin_write" ON public.core_comm_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_comm_templates_updated BEFORE UPDATE ON public.core_comm_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 3. Channel config
CREATE TABLE public.core_comm_channel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel public.comm_channel NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  provider TEXT,
  provider_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  n8n_webhook_url TEXT,
  n8n_secret_ref TEXT,
  fallback_channel public.comm_channel,
  rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_comm_channel_config TO authenticated;
GRANT ALL ON public.core_comm_channel_config TO service_role;
ALTER TABLE public.core_comm_channel_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_channel_config_admin" ON public.core_comm_channel_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_comm_channel_config_updated BEFORE UPDATE ON public.core_comm_channel_config
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 4. Dispatches (queue + history)
CREATE TABLE public.core_comm_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code TEXT NOT NULL REFERENCES public.core_comm_events(code) ON DELETE RESTRICT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel public.comm_channel NOT NULL,
  status public.comm_dispatch_status NOT NULL DEFAULT 'queued',
  priority public.comm_priority NOT NULL DEFAULT 'normal',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_template_id UUID REFERENCES public.core_comm_templates(id) ON DELETE SET NULL,
  origin TEXT NOT NULL DEFAULT 'system',
  origin_ref TEXT,
  destination TEXT,
  provider_message_id TEXT,
  n8n_execution_id TEXT,
  idempotency_key TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.core_comm_dispatches TO authenticated;
GRANT ALL ON public.core_comm_dispatches TO service_role;
ALTER TABLE public.core_comm_dispatches ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX ux_comm_dispatches_idempotency
  ON public.core_comm_dispatches (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX ix_comm_dispatches_queue ON public.core_comm_dispatches (status, next_retry_at NULLS FIRST, priority);
CREATE INDEX ix_comm_dispatches_company_created ON public.core_comm_dispatches (company_id, created_at DESC);
CREATE INDEX ix_comm_dispatches_event_created ON public.core_comm_dispatches (event_code, created_at DESC);
CREATE INDEX ix_comm_dispatches_user_created ON public.core_comm_dispatches (user_id, created_at DESC);

CREATE POLICY "comm_dispatches_admin_all" ON public.core_comm_dispatches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "comm_dispatches_gestor_read" ON public.core_comm_dispatches FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'gestor'));
CREATE TRIGGER trg_comm_dispatches_updated BEFORE UPDATE ON public.core_comm_dispatches
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 5. Delivery events
CREATE TABLE public.core_comm_delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES public.core_comm_dispatches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  channel public.comm_channel,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.core_comm_delivery_events TO authenticated;
GRANT ALL ON public.core_comm_delivery_events TO service_role;
ALTER TABLE public.core_comm_delivery_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX ix_comm_delivery_events_dispatch ON public.core_comm_delivery_events (dispatch_id, created_at);

CREATE POLICY "comm_delivery_events_read" ON public.core_comm_delivery_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));
CREATE POLICY "comm_delivery_events_admin_write" ON public.core_comm_delivery_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6. Seed catalog
INSERT INTO public.core_comm_events (code, category, label_pt, description, default_priority, default_channels, impulsionito_hint) VALUES
  ('signup_started','onboarding','Cadastro iniciado','Usuário abriu o formulário de cadastro','low',ARRAY['notification','impulsionito']::public.comm_channel[],'Acompanhar para reduzir abandono'),
  ('signup_completed','onboarding','Cadastro concluído','Cadastro finalizado com sucesso','normal',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Enviar boas-vindas e próximos passos'),
  ('signup_approved','onboarding','Cadastro aprovado','Cadastro do tenant aprovado pelo admin master','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Ambiente liberado — orientar setup inicial'),
  ('payment_started','billing','Pagamento iniciado','Checkout iniciado — aguardando confirmação','normal',ARRAY['notification','impulsionito']::public.comm_channel[],'Se PIX/boleto, lembrar do vencimento'),
  ('payment_approved','billing','Pagamento aprovado','Pagamento confirmado com sucesso','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Confirmar contratação e enviar recibo'),
  ('payment_rejected','billing','Pagamento recusado','Pagamento não foi aprovado pelo provedor','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Oferecer nova tentativa ou troca de método'),
  ('pix_expired','billing','PIX expirado','QR Code PIX venceu sem pagamento','normal',ARRAY['whatsapp','email','notification','impulsionito']::public.comm_channel[],'Gerar novo PIX ou sugerir cartão'),
  ('boleto_issued','billing','Boleto emitido','Boleto gerado e enviado','normal',ARRAY['email','whatsapp','notification']::public.comm_channel[],'Lembrar vencimento em D-3'),
  ('boleto_paid','billing','Boleto pago','Compensação confirmada','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Confirmar contratação e enviar recibo'),
  ('renewal_upcoming','billing','Renovação próxima','Assinatura renova em breve','normal',ARRAY['email','notification','impulsionito']::public.comm_channel[],'Verificar cartão salvo e engajamento'),
  ('trial_started','trial','Teste Premium iniciado','Trial de 15 dias liberado','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Onboarding: primeiros passos do Trial'),
  ('trial_15d','trial','Trial — 15 dias restantes','Marcador inicial do trial','low',ARRAY['notification','impulsionito']::public.comm_channel[],'Sugerir explorar módulo estratégico do nicho'),
  ('trial_7d','trial','Trial — 7 dias restantes','Meio de trial','normal',ARRAY['email','notification','impulsionito']::public.comm_channel[],'Provocar decisão: mostrar valor gerado'),
  ('trial_3d','trial','Trial — 3 dias restantes','Trial acabando','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Oferta de conversão + prova social'),
  ('trial_1d','trial','Trial — 1 dia restante','Último dia','critical',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'CTA direto para /contratar'),
  ('converted_to_paid','trial','Conversão em plano pago','Trial virou assinatura','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Agradecer e ativar jornada de fidelização'),
  ('cancellation','lifecycle','Cancelamento','Assinatura cancelada pelo tenant','high',ARRAY['email','notification','impulsionito']::public.comm_channel[],'Pesquisa de motivo + oferta de retenção'),
  ('downgrade','lifecycle','Downgrade','Tenant trocou para plano inferior','normal',ARRAY['email','notification','impulsionito']::public.comm_channel[],'Registrar motivo e monitorar uso'),
  ('upgrade','lifecycle','Upgrade','Tenant subiu de plano','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Ativar novos módulos e agradecer'),
  ('suspension','lifecycle','Suspensão','Ambiente suspenso por inadimplência ou risco','critical',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Orientar regularização'),
  ('reactivation','lifecycle','Reativação','Ambiente reativado','high',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Boas-vindas de retorno'),
  ('ticket_opened','support','Chamado aberto','Novo chamado no suporte','normal',ARRAY['email','notification','impulsionito']::public.comm_channel[],'SLA e primeira resposta rápida'),
  ('support_replied','support','Resposta do suporte','Equipe respondeu o chamado','normal',ARRAY['email','notification','impulsionito']::public.comm_channel[],'Solicitar avaliação da resposta'),
  ('vitrine_activated','vitrine','Vitrine ativada','Tenant ativou sua vitrine','normal',ARRAY['email','notification','impulsionito']::public.comm_channel[],'Guiar publicação da primeira listagem'),
  ('vitrine_published','vitrine','Vitrine publicada','Listagem aprovada e publicada','normal',ARRAY['notification','impulsionito']::public.comm_channel[],'Divulgar em canais internos'),
  ('new_employee','operations','Novo funcionário','Novo membro adicionado ao tenant','low',ARRAY['email','notification','impulsionito']::public.comm_channel[],'Enviar guia de acesso e treinamento'),
  ('new_customer','operations','Novo cliente','Cliente cadastrado no CRM do tenant','low',ARRAY['notification','impulsionito']::public.comm_channel[],'Sugerir régua inicial do funil'),
  ('new_schedule','operations','Nova agenda criada','Novo compromisso na agenda','low',ARRAY['notification','impulsionito']::public.comm_channel[],'Lembrar em D-1'),
  ('new_order','sales','Novo pedido','Pedido registrado','normal',ARRAY['email','notification','impulsionito']::public.comm_channel[],'Confirmar pedido e status'),
  ('new_sale','sales','Nova venda','Venda concluída','normal',ARRAY['email','whatsapp','notification','impulsionito']::public.comm_channel[],'Enviar recibo + oferta cross-sell')
ON CONFLICT (code) DO NOTHING;
