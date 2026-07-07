
-- =====================================================================
-- Etapa 1 — Fundação dos 5 novos módulos do Ecossistema Impulsionando
-- =====================================================================

-- 1) Seed dos 5 novos módulos no catálogo existente (idempotente por slug)
INSERT INTO public.core_module_catalog
  (slug, name, category, short_description, long_description, features, recommended_with, niches, icon, active)
VALUES
  (
    'delivery',
    'Delivery / Entregadores',
    'operations',
    'Entrega própria integrada ao PDV/pedidos com cadastro de entregadores no Core.',
    'Gestão completa de entrega: configuração de raio/taxas/horários por tenant, cadastro global de entregadores aprovado pelo Core, vínculo com tenants, pedidos, tracking, avaliações e repasses. Integra-se a PDV, e-commerce, financeiro e centro de comunicação.',
    '["config_raio_taxas","cadastro_entregadores","aprovacao_core","pedidos","status_tempo_real","tracking","avaliacoes","repasses","area_entregador","area_tenant","area_core"]'::jsonb,
    ARRAY['pdv','commerce','crm','fidelizacao']::text[],
    ARRAY['restaurantes','bares','mercados','farmacias','lojas','ecommerce','eventos']::text[],
    'Truck',
    true
  ),
  (
    'quiz',
    'Quiz / Diagnóstico',
    'growth',
    'Builder de quizzes inteligentes com scoring, recomendação e captura de leads.',
    'Módulo de quiz/diagnóstico com builder de perguntas (múltipla escolha, aberta, escala), scoring configurável, recomendação automática de produto/plano/serviço, captura de lead e disparo para CRM/Comm. Templates globais no Core e por tenant.',
    '["builder","scoring","recomendacao","captura_lead","pagina_publica","integracao_crm","integracao_comm","templates_globais","relatorios"]'::jsonb,
    ARRAY['crm','automacao','area_cliente']::text[],
    ARRAY['clinicas','academias','escolas','imobiliarias','eventos','restaurantes','lojas','servicos','todos']::text[],
    'ClipboardList',
    true
  ),
  (
    'redes_sociais',
    'Redes Sociais',
    'growth',
    'Hub de canais sociais: publicação, agendamento, importação de comentários/DMs e conversão em leads.',
    'Conecta contas Instagram, Facebook, Google Business Profile (fase 1) e TikTok/LinkedIn/YouTube (fase 2). Publicação, agendamento, inbox unificado, captura de leads, métricas de engajamento. Estados explícitos de pendência quando credenciais/App Review não estão prontos.',
    '["conectar_contas","publicar","agendar","inbox_unificado","captura_lead","metricas","pendencias_credenciais"]'::jsonb,
    ARRAY['crm','automacao','commerce']::text[],
    ARRAY['todos']::text[],
    'Share2',
    true
  ),
  (
    'sorteios',
    'Sorteios / Promoções',
    'growth',
    'Campanhas promocionais com regras, múltiplos gatilhos de participação e auditoria verificável.',
    'Sorteios/promoções com aceite LGPD, regulamento obrigatório, participação via compra/cadastro/indicação/compartilhamento, número da sorte, ranking, auditoria e ganhador. Alerta jurídico bloqueando publicação sem aceite explícito (Lei 5.768/71, SECAP).',
    '["builder_sorteio","regulamento","aceite_lgpd","alerta_juridico","participacao_multipla","numero_sorte","ranking","auditoria","pagina_publica","integracao_crm"]'::jsonb,
    ARRAY['crm','automacao','commerce','fidelizacao']::text[],
    ARRAY['bares','restaurantes','lojas','eventos','influenciadores','marcas','produtores','imobiliarias']::text[],
    'Gift',
    true
  ),
  (
    'vaquinha',
    'Vaquinha Online / Arrecadação',
    'growth',
    'Campanhas de arrecadação com página pública, apoiadores, prestação de contas e repasse.',
    'Vaquinha/arrecadação com meta, prazo, mídia, apoiadores, atualizações, prestação de contas, taxa Impulsionando configurável, repasses e NF-e. Integra com Mercado Pago, financeiro, CRM, Comm e Vitrine.',
    '["criar_campanha","meta_prazo","midia","apoiadores","ranking","atualizacoes","prestacao_contas","taxa_configuravel","repasses","nfe","pagina_publica","compartilhamento_social"]'::jsonb,
    ARRAY['commerce','crm','automacao']::text[],
    ARRAY['eventos','ong','igrejas','escolas','saude','clubes','artistas','produtores','causas_sociais']::text[],
    'HeartHandshake',
    true
  )
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      category = EXCLUDED.category,
      short_description = EXCLUDED.short_description,
      long_description = EXCLUDED.long_description,
      features = EXCLUDED.features,
      recommended_with = EXCLUDED.recommended_with,
      niches = EXCLUDED.niches,
      icon = EXCLUDED.icon,
      active = true,
      updated_at = now();

-- 2) Tabela de pendências de integração (credenciais faltantes por tenant/módulo)
CREATE TABLE IF NOT EXISTS public.core_integration_pendencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  integration_key text NOT NULL,
  provider text NULL,
  status text NOT NULL DEFAULT 'pending_credentials'
    CHECK (status IN ('pending_credentials','pending_app_review','pending_oauth_scope','pending_config','resolved','blocked')),
  title text NOT NULL,
  description text NULL,
  action_url text NULL,
  action_label text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz NULL,
  resolved_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, module_slug, integration_key)
);

CREATE INDEX IF NOT EXISTS core_integration_pendencies_company_idx
  ON public.core_integration_pendencies (company_id, status);
CREATE INDEX IF NOT EXISTS core_integration_pendencies_module_idx
  ON public.core_integration_pendencies (module_slug, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_integration_pendencies TO authenticated;
GRANT ALL ON public.core_integration_pendencies TO service_role;

ALTER TABLE public.core_integration_pendencies ENABLE ROW LEVEL SECURITY;

-- Staff Impulsionando: acesso total
CREATE POLICY "staff full access on core_integration_pendencies"
  ON public.core_integration_pendencies
  FOR ALL
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- Admin do tenant: leitura da própria empresa
CREATE POLICY "tenant admin read own pendencies"
  ON public.core_integration_pendencies
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = core_integration_pendencies.company_id
        AND up.is_active = true
    )
    AND public.has_role(auth.uid(), 'admin')
  );

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.core_integration_pendencies_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_core_integration_pendencies_touch ON public.core_integration_pendencies;
CREATE TRIGGER trg_core_integration_pendencies_touch
  BEFORE UPDATE ON public.core_integration_pendencies
  FOR EACH ROW EXECUTE FUNCTION public.core_integration_pendencies_touch();
