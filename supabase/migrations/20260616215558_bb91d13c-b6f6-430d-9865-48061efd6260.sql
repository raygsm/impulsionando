
-- 1) Nicho marketing-tecnologia
INSERT INTO public.niches (slug, name)
VALUES ('marketing-tecnologia', 'Marketing & Tecnologia')
ON CONFLICT (slug) DO NOTHING;

-- 2) Empresa Impulsionando Brasil
INSERT INTO public.companies (
  name, legal_name, trade_name, subdomain, status,
  niche_id, is_active, is_demo, environment,
  primary_color, secondary_color,
  email, commercial_email, website
)
SELECT
  'Impulsionando Brasil',
  'Impulsionando Brasil Marketing e Tecnologia Ltda',
  'Impulsionando Brasil',
  'impulsionando-brasil',
  'active',
  (SELECT id FROM public.niches WHERE slug='marketing-tecnologia'),
  true, false, 'real'::company_environment,
  '#3B82F6', '#0F172A',
  'contato@impulsionando.com.br',
  'comercial@impulsionando.com.br',
  'https://impulsionando.com.br'
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies WHERE subdomain = 'impulsionando-brasil'
);

-- 3) Política pública de leitura para páginas publicadas dessa empresa
DROP POLICY IF EXISTS "Public read impulsionando brasil pages" ON public.generated_pages;
CREATE POLICY "Public read impulsionando brasil pages"
  ON public.generated_pages FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND company_id = (SELECT id FROM public.companies WHERE subdomain = 'impulsionando-brasil' LIMIT 1)
  );
GRANT SELECT ON public.generated_pages TO anon;

-- 4) Páginas publicadas — 4 serviços
WITH ib AS (SELECT id FROM public.companies WHERE subdomain='impulsionando-brasil' LIMIT 1)
INSERT INTO public.generated_pages (company_id, name, slug, status, content)
SELECT ib.id, p.name, p.slug, 'published', p.content::jsonb
FROM ib, (VALUES
  ('Agente Virtual de Atendimento', 'agente-virtual', $json$
    {
      "hero": {
        "eyebrow": "Atendimento 24/7",
        "title": "Agente Virtual que vende, qualifica e agenda por você",
        "subtitle": "Atende no WhatsApp, Instagram e site em segundos, com a voz da sua marca. Integra com agenda, CRM e financeiro.",
        "cta": "Quero meu Agente Virtual",
        "tag": "interesse_agente_virtual"
      },
      "benefits": [
        "Respostas em segundos, 24/7, sem perder lead",
        "Qualifica, agenda e envia para o time humano apenas o que vale",
        "Treinado com sua base, seus produtos e seu tom de voz",
        "Integra com WhatsApp Oficial, CRM e agenda da Impulsionando"
      ],
      "process": [
        "Diagnóstico do funil e bases de conhecimento",
        "Treinamento do agente com produtos, FAQ e regras de venda",
        "Integração com WhatsApp, Instagram e CRM",
        "Acompanhamento mensal de qualidade e melhorias"
      ],
      "priceRange": "A partir de R$ 1.490/mês",
      "leadSource": "contato"
    }
    $json$),
  ('Gestão de Social Media', 'social-media', $json$
    {
      "hero": {
        "eyebrow": "Conteúdo que converte",
        "title": "Social Media estratégico, com planejamento, criação e métricas",
        "subtitle": "Calendário editorial mensal, criação de posts, reels e stories alinhados à régua comercial. Sem terceirização sem direção.",
        "cta": "Quero meu plano de Social Media",
        "tag": "interesse_social_media"
      },
      "benefits": [
        "Planejamento mensal com objetivos comerciais claros",
        "Criação de feed, stories, reels e copy de captação",
        "Régua de relacionamento com seguidores e clientes ativos",
        "Relatórios quinzenais com leitura de métricas e ajustes"
      ],
      "process": [
        "Briefing de marca, persona e calendário do negócio",
        "Aprovação mensal de pauta e linha criativa",
        "Produção, postagem e gestão da comunidade",
        "Revisão de resultados e plano do próximo ciclo"
      ],
      "priceRange": "A partir de R$ 1.890/mês",
      "leadSource": "contato"
    }
    $json$),
  ('Google Ads de Performance', 'google-ads', $json$
    {
      "hero": {
        "eyebrow": "Mídia paga",
        "title": "Google Ads que entrega lead qualificado, não clique vazio",
        "subtitle": "Campanhas de Pesquisa, Performance Max e remarketing com leitura semanal de funil e CPL alvo definido com você.",
        "cta": "Quero campanha de Google Ads",
        "tag": "interesse_google_ads"
      },
      "benefits": [
        "CPL alvo definido antes de subir a campanha",
        "Estrutura de palavras-chave, anúncios e extensões revisada toda semana",
        "Integração com CRM para medir lead → reunião → venda",
        "Relatório executivo mensal com próximo passo claro"
      ],
      "process": [
        "Diagnóstico de oferta, página e funil de conversão",
        "Estruturação de campanhas, públicos e criativos",
        "Otimização semanal por palavra, anúncio e horário",
        "Reunião mensal de resultados e plano do próximo mês"
      ],
      "priceRange": "A partir de R$ 1.690/mês + verba de mídia",
      "leadSource": "contato"
    }
    $json$),
  ('Assessoria de Marketing 360', 'assessoria-marketing', $json$
    {
      "hero": {
        "eyebrow": "Marketing como sócio",
        "title": "Assessoria de marketing que cuida da régua comercial inteira",
        "subtitle": "Estratégia, social, mídia, CRM, automações e relatórios em um único ponto de contato. Um time de marketing inteiro pelo preço de um profissional.",
        "cta": "Quero a assessoria completa",
        "tag": "interesse_assessoria_marketing"
      },
      "benefits": [
        "Time multidisciplinar: estrategista, social, mídia, CRM e dados",
        "Reunião quinzenal de leitura de funil e ajustes de plano",
        "Régua de relacionamento, e-mail, WhatsApp e remarketing alinhados",
        "Painel da Impulsionando com receita, leads e custo por canal"
      ],
      "process": [
        "Diagnóstico 360 do funil, marca e operação",
        "Plano trimestral com metas, KPIs e responsáveis",
        "Execução integrada com seu time e nossos especialistas",
        "Leitura quinzenal de resultados e reciclagem do plano"
      ],
      "priceRange": "A partir de R$ 4.490/mês",
      "leadSource": "contato"
    }
    $json$)
) AS p(name, slug, content)
ON CONFLICT (company_id, slug) DO UPDATE
SET content = EXCLUDED.content, status = EXCLUDED.status, name = EXCLUDED.name;

-- 5) Templates de e-mail por serviço (vinculados à empresa Impulsionando Brasil)
WITH ib AS (SELECT id FROM public.companies WHERE subdomain='impulsionando-brasil' LIMIT 1)
INSERT INTO public.message_templates (company_id, event_code, channel, locale, subject, body, variables, is_active)
SELECT ib.id, t.event_code, 'email', 'pt-BR', t.subject, t.body, '["nome","servico"]'::jsonb, true
FROM ib, (VALUES
  ('mkt_interest_agente_virtual',
   'Recebemos seu interesse no Agente Virtual',
   'Olá {{nome}}, obrigado por se interessar pelo nosso Agente Virtual de Atendimento. Em até 1 dia útil enviaremos um diagnóstico inicial do seu funil e uma proposta sob medida. Equipe Impulsionando.'),
  ('mkt_interest_social_media',
   'Sua solicitação de Social Media foi recebida',
   'Olá {{nome}}, recebemos seu interesse na gestão de Social Media. Vamos revisar suas redes e te mandar uma análise rápida com sugestões e a proposta comercial em até 1 dia útil. Equipe Impulsionando.'),
  ('mkt_interest_google_ads',
   'Recebemos seu pedido sobre Google Ads',
   'Olá {{nome}}, obrigado por buscar a Impulsionando para Google Ads. Vamos analisar sua oferta, página e CPL desejado e te procurar com diagnóstico e proposta em até 1 dia útil. Equipe Impulsionando.'),
  ('mkt_interest_assessoria_marketing',
   'Sua solicitação de Assessoria de Marketing foi recebida',
   'Olá {{nome}}, recebemos seu interesse na Assessoria de Marketing 360. Em até 1 dia útil agendamos uma conversa de diagnóstico com nosso time estrategista. Equipe Impulsionando.')
) AS t(event_code, subject, body)
ON CONFLICT DO NOTHING;
