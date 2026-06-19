-- ============================================================
-- Consolidação de nichos no nível MACRO + ativação do Marocas
-- ============================================================

-- 1) Adiciona macro_slug em niches (sem destruir tabela legada)
ALTER TABLE public.niches
  ADD COLUMN IF NOT EXISTS macro_slug TEXT REFERENCES public.core_macro_nichos(slug);

-- Backfill: mapeia cada slug antigo ao macro correto
UPDATE public.niches SET macro_slug = CASE slug
  WHEN 'saude'                     THEN 'saude'
  WHEN 'bares'                     THEN 'alimentacao'
  WHEN 'cervejarias'               THEN 'fornecedores'
  WHEN 'microcervejarias'          THEN 'fornecedores'
  WHEN 'servicos'                  THEN 'servicos'
  WHEN 'ecommerce'                 THEN 'varejo'
  WHEN 'comercio'                  THEN 'varejo'
  WHEN 'eventos'                   THEN 'eventos'
  WHEN 'comunidade'                THEN 'servicos'
  WHEN 'marketing-tecnologia'      THEN 'servicos'
  WHEN 'contabilidade-inteligente' THEN 'servicos'
  WHEN 'imobiliaria'               THEN 'imobiliario'
  WHEN 'juridico'                  THEN 'servicos'
  WHEN 'fitness'                   THEN 'saude'
  WHEN 'psicologia'                THEN 'saude'
  WHEN 'clinicas'                  THEN 'saude'
  WHEN 'white-label'               THEN 'parceiros'
  WHEN 'veiculos'                  THEN 'varejo'
  WHEN 'educacao'                  THEN 'educacao'
  WHEN 'fornecedores'              THEN 'fornecedores'
  ELSE 'servicos'
END
WHERE macro_slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_niches_macro_slug ON public.niches(macro_slug);

-- 2) companies ganha subnicho_slug (opcional)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS subnicho_slug TEXT;

-- 3) View para derivar o macro da empresa sem JOIN manual
CREATE OR REPLACE VIEW public.v_company_macro AS
SELECT
  c.id           AS company_id,
  c.name,
  c.subdomain,
  c.public_slug,
  c.niche_id,
  c.subnicho_slug,
  n.slug         AS niche_slug,
  n.macro_slug,
  m.nome         AS macro_nome,
  s.slug         AS subnicho_slug_canonical,
  s.nome         AS subnicho_nome
FROM public.companies c
LEFT JOIN public.niches n            ON n.id = c.niche_id
LEFT JOIN public.core_macro_nichos m ON m.slug = n.macro_slug
LEFT JOIN public.core_subnichos s    ON s.macro_id = m.id AND s.slug = c.subnicho_slug;
GRANT SELECT ON public.v_company_macro TO authenticated, service_role;

-- 4) Subnicho dedicado ao Marocas dentro de Serviços
INSERT INTO public.core_subnichos (macro_id, slug, nome, ordem, recommendation_slug)
SELECT m.id, 'hospedagem-temporada', 'Hospedagem & Temporada (Marocas)', 95, 'servicos'
FROM public.core_macro_nichos m
WHERE m.slug = 'servicos'
ON CONFLICT (macro_id, slug) DO NOTHING;

-- 5) Garante que o niche legado 'servicos' aponta para macro 'servicos' (já faz, mas idempotente)
UPDATE public.niches SET macro_slug = 'servicos' WHERE slug = 'servicos';

-- 6) Função utilitária: retorna macro do usuário corrente (RLS-friendly)
CREATE OR REPLACE FUNCTION public.current_company_macro()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT n.macro_slug
  FROM public.companies c
  JOIN public.user_profiles up ON up.company_id = c.id
  LEFT JOIN public.niches n ON n.id = c.niche_id
  WHERE up.user_id = auth.uid()
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.current_company_macro() TO authenticated, service_role;