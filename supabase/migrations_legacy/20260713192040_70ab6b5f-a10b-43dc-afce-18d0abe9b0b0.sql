
-- ========== n8n_workflows ==========
CREATE TABLE public.n8n_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funil TEXT NOT NULL CHECK (funil IN ('captacao','conversao','relacionamento')),
  event_code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  last_dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.n8n_workflows TO authenticated;
GRANT ALL ON public.n8n_workflows TO service_role;

ALTER TABLE public.n8n_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lê n8n_workflows" ON public.n8n_workflows
  FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff escreve n8n_workflows" ON public.n8n_workflows
  FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TRIGGER trg_n8n_workflows_updated
  BEFORE UPDATE ON public.n8n_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== n8n_dispatch_log ==========
CREATE TABLE public.n8n_dispatch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  payload JSONB,
  status_code INTEGER,
  response_body TEXT,
  error TEXT,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_n8n_dispatch_log_event ON public.n8n_dispatch_log(event_code, dispatched_at DESC);
CREATE INDEX idx_n8n_dispatch_log_company ON public.n8n_dispatch_log(company_id, dispatched_at DESC);

GRANT SELECT, INSERT ON public.n8n_dispatch_log TO authenticated;
GRANT ALL ON public.n8n_dispatch_log TO service_role;

ALTER TABLE public.n8n_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lê n8n_dispatch_log" ON public.n8n_dispatch_log
  FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

-- ========== Seed 26 fluxos ==========
INSERT INTO public.n8n_workflows (funil, event_code, label, webhook_url) VALUES
  -- Captação (7)
  ('captacao','captacao.lead-captado','Lead captado','https://n8n.impulsionando.com.br/webhook/captacao-lead-captado'),
  ('captacao','captacao.lead-qualificado','Lead qualificado','https://n8n.impulsionando.com.br/webhook/captacao-lead-qualificado'),
  ('captacao','captacao.lead-quiz','Lead via quiz','https://n8n.impulsionando.com.br/webhook/captacao-lead-quiz'),
  ('captacao','captacao.lead-vitrine','Lead via vitrine','https://n8n.impulsionando.com.br/webhook/captacao-lead-vitrine'),
  ('captacao','captacao.lead-whatsapp','Lead via WhatsApp','https://n8n.impulsionando.com.br/webhook/captacao-lead-whatsapp'),
  ('captacao','captacao.lead-redes-sociais','Lead via redes sociais','https://n8n.impulsionando.com.br/webhook/captacao-lead-redes-sociais'),
  ('captacao','captacao.lead-sem-resposta','Lead sem resposta','https://n8n.impulsionando.com.br/webhook/captacao-lead-sem-resposta'),
  -- Conversão (10)
  ('conversao','conversao.cadastro-iniciado','Cadastro iniciado','https://n8n.impulsionando.com.br/webhook/conversao-cadastro-iniciado'),
  ('conversao','conversao.cadastro-abandonado','Cadastro abandonado','https://n8n.impulsionando.com.br/webhook/conversao-cadastro-abandonado'),
  ('conversao','conversao.cadastro-concluido','Cadastro concluído','https://n8n.impulsionando.com.br/webhook/conversao-cadastro-concluido'),
  ('conversao','conversao.checkout-iniciado','Checkout iniciado','https://n8n.impulsionando.com.br/webhook/conversao-checkout-iniciado'),
  ('conversao','conversao.pix-gerado','PIX gerado','https://n8n.impulsionando.com.br/webhook/conversao-pix-gerado'),
  ('conversao','conversao.boleto-emitido','Boleto emitido','https://n8n.impulsionando.com.br/webhook/conversao-boleto-emitido'),
  ('conversao','conversao.boleto-pago','Boleto pago','https://n8n.impulsionando.com.br/webhook/conversao-boleto-pago'),
  ('conversao','conversao.cartao-recusado','Cartão recusado','https://n8n.impulsionando.com.br/webhook/conversao-cartao-recusado'),
  ('conversao','conversao.pagamento-aprovado','Pagamento aprovado','https://n8n.impulsionando.com.br/webhook/conversao-pagamento-aprovado'),
  ('conversao','conversao.trial-premium-iniciado','Trial premium iniciado','https://n8n.impulsionando.com.br/webhook/conversao-trial-premium-iniciado'),
  -- Relacionamento (9)
  ('relacionamento','relacionamento.onboarding-d0','Onboarding D0','https://n8n.impulsionando.com.br/webhook/relacionamento-onboarding-d0'),
  ('relacionamento','relacionamento.onboarding-d1','Onboarding D1','https://n8n.impulsionando.com.br/webhook/relacionamento-onboarding-d1'),
  ('relacionamento','relacionamento.onboarding-d3','Onboarding D3','https://n8n.impulsionando.com.br/webhook/relacionamento-onboarding-d3'),
  ('relacionamento','relacionamento.onboarding-d7','Onboarding D7','https://n8n.impulsionando.com.br/webhook/relacionamento-onboarding-d7'),
  ('relacionamento','relacionamento.cliente-sem-uso','Cliente sem uso','https://n8n.impulsionando.com.br/webhook/relacionamento-cliente-sem-uso'),
  ('relacionamento','relacionamento.cliente-engajado','Cliente engajado','https://n8n.impulsionando.com.br/webhook/relacionamento-cliente-engajado'),
  ('relacionamento','relacionamento.sugestao-recurso','Sugestão de recurso','https://n8n.impulsionando.com.br/webhook/relacionamento-sugestao-recurso'),
  ('relacionamento','relacionamento.tutorial-automatico','Tutorial automático','https://n8n.impulsionando.com.br/webhook/relacionamento-tutorial-automatico'),
  ('relacionamento','relacionamento.impulsionito-proativo','Impulsionito proativo','https://n8n.impulsionando.com.br/webhook/relacionamento-impulsionito-proativo');

-- ========== Menu admin ==========
INSERT INTO public.core_admin_menu
  (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
VALUES
  ('impulsionando','integracoes','Integrações',80,'n8n','Integração n8n',10,
   '/admin/integracoes/n8n','Workflow','Fluxos de automação do n8n conectados às jornadas Impulsionando','super',true)
ON CONFLICT (vertente, group_key, item_key) DO UPDATE
  SET item_label = EXCLUDED.item_label,
      route = EXCLUDED.route,
      icon = EXCLUDED.icon,
      description = EXCLUDED.description,
      enabled = true;
