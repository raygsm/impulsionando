
-- ============================================================
-- 1) Tabela de mapeamento Macro Nicho × Plano × Módulos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.core_niche_plan_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_slug TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('essencial','ideal','full')),
  choose_limit INTEGER NOT NULL DEFAULT 1 CHECK (choose_limit >= 0),
  modules TEXT[] NOT NULL DEFAULT '{}'::text[],
  base_price_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(macro_slug, plan_tier)
);

GRANT SELECT ON public.core_niche_plan_modules TO anon, authenticated;
GRANT ALL ON public.core_niche_plan_modules TO service_role;

ALTER TABLE public.core_niche_plan_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "niche plan modules public read"
  ON public.core_niche_plan_modules FOR SELECT
  USING (true);

CREATE POLICY "niche plan modules staff write"
  ON public.core_niche_plan_modules FOR ALL
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_core_niche_plan_modules_touch ON public.core_niche_plan_modules;
CREATE TRIGGER trg_core_niche_plan_modules_touch
  BEFORE UPDATE ON public.core_niche_plan_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 2) Tabela de captura de intenção (catálogo → onboarding/checkout)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.catalog_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_token TEXT,
  macro_slug TEXT NOT NULL,
  subnicho_slug TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('essencial','ideal','full')),
  selected_modules TEXT[] NOT NULL DEFAULT '{}'::text[],
  source TEXT NOT NULL DEFAULT 'catalogo',
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days')
);

GRANT SELECT, INSERT, UPDATE ON public.catalog_intents TO anon, authenticated;
GRANT ALL ON public.catalog_intents TO service_role;

ALTER TABLE public.catalog_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog intents anyone can insert"
  ON public.catalog_intents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "catalog intents owner reads"
  ON public.catalog_intents FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR public.is_impulsionando_staff(auth.uid())
  );

CREATE POLICY "catalog intents owner updates"
  ON public.catalog_intents FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR public.is_impulsionando_staff(auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_catalog_intents_user ON public.catalog_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_intents_expires ON public.catalog_intents(expires_at);

-- ============================================================
-- 3) Seed do catálogo de planos por nicho (idempotente)
-- ============================================================
INSERT INTO public.core_niche_plan_modules (macro_slug, plan_tier, choose_limit, modules, base_price_label) VALUES
  -- Saúde
  ('saude','essencial',1, ARRAY['Agenda','Prontuário Eletrônico','Teleconsulta','CRM Saúde'], '0,5 Salário Mínimo'),
  ('saude','ideal',3,     ARRAY['Agenda','Prontuário','Teleconsulta','CRM','Prescrição','Exames','Faturamento'], '1 Salário Mínimo'),
  ('saude','full',0,      ARRAY['Agenda','Prontuário','Teleconsulta','CRM','Prescrição','Exames','Faturamento','Convênios','Telemetria','Indicadores Clínicos'], '2 Salários Mínimos'),
  -- Imobiliário
  ('imobiliario','essencial',1, ARRAY['CRM Imobiliário','Vitrine Imobiliária','Captação','Locação'], '0,5 Salário Mínimo'),
  ('imobiliario','ideal',3,     ARRAY['CRM','Vitrine','Locação','Visitas','Funis','Propostas'], '1 Salário Mínimo'),
  ('imobiliario','full',0,      ARRAY['CRM','Vitrine','Locação','Visitas','Funis','Propostas','Captação','Contratos','Vistorias','Repasse'], '2 Salários Mínimos'),
  -- Alimentação
  ('alimentacao','essencial',1, ARRAY['PDV','Cardápio Digital','Reservas','Delivery'], '0,5 Salário Mínimo'),
  ('alimentacao','ideal',3,     ARRAY['PDV','Delivery','Eventos','Clube','Fidelidade','Reservas','QR Code'], '1 Salário Mínimo'),
  ('alimentacao','full',0,      ARRAY['PDV','Delivery','Eventos','Clube','Fidelidade','Reservas','QR Code','Cardápio Digital','Estoque','Comandas','Fiscal'], '2 Salários Mínimos'),
  -- Fornecedores
  ('fornecedores','essencial',1, ARRAY['Catálogo Digital','Pedidos B2B','CRM Comercial','Estoque'], '0,5 Salário Mínimo'),
  ('fornecedores','ideal',3,     ARRAY['Catálogo','Pedidos B2B','Estoque','Produção','CRM Comercial','Faturamento'], '1 Salário Mínimo'),
  ('fornecedores','full',0,      ARRAY['Catálogo','Pedidos B2B','Estoque','Produção','CRM Comercial','Faturamento','Rotas','Comissões','SFA','Distribuição'], '2 Salários Mínimos'),
  -- Serviços
  ('servicos','essencial',1, ARRAY['Agenda','CRM','Contratos','Propostas'], '0,5 Salário Mínimo'),
  ('servicos','ideal',3,     ARRAY['Agenda','CRM','Contratos','Propostas','Projetos','Time Tracking','Faturamento'], '1 Salário Mínimo'),
  ('servicos','full',0,      ARRAY['Agenda','CRM','Contratos','Propostas','Projetos','Time Tracking','Faturamento','OS','SLA','Helpdesk'], '2 Salários Mínimos'),
  -- Educação
  ('educacao','essencial',1, ARRAY['Matrículas','Sala Virtual','CRM Acadêmico','Financeiro Educacional'], '0,5 Salário Mínimo'),
  ('educacao','ideal',3,     ARRAY['Matrículas','Sala Virtual','Notas','Frequência','CRM','Polos','Certificados'], '1 Salário Mínimo'),
  ('educacao','full',0,      ARRAY['Matrículas','Sala Virtual','Notas','Frequência','CRM','Polos','Certificados','Biblioteca','Avaliações','Mentoria'], '2 Salários Mínimos'),
  -- Eventos
  ('eventos','essencial',1, ARRAY['Ingressos','Check-in','CRM de Eventos','Vitrine de Eventos'], '0,5 Salário Mínimo'),
  ('eventos','ideal',3,     ARRAY['Ingressos','Check-in','Patrocinadores','Programação','Credenciamento','Streaming'], '1 Salário Mínimo'),
  ('eventos','full',0,      ARRAY['Ingressos','Check-in','Patrocinadores','Programação','Credenciamento','Streaming','Networking','App do Evento','Relatórios'], '2 Salários Mínimos')
ON CONFLICT (macro_slug, plan_tier) DO NOTHING;
