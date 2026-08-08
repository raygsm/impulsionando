ALTER TABLE public.core_macro_nichos
  ADD COLUMN IF NOT EXISTS recommendation_slug text;

ALTER TABLE public.core_subnichos
  ADD COLUMN IF NOT EXISTS recommendation_slug text;

COMMENT ON COLUMN public.core_macro_nichos.recommendation_slug IS
  'Slug usado em /recomendacao/$nicho e /escolher-nicho. Mantém o frontend e o banco alinhados.';
COMMENT ON COLUMN public.core_subnichos.recommendation_slug IS
  'Slug do frontend para onde o subnicho aponta no funil de recomendação. Sempre preenchido — sobe para o macro quando não há card próprio.';

-- Novos macros — usam UNIQUE(slug)
INSERT INTO public.core_macro_nichos (slug, nome, ordem, recommendation_slug)
VALUES
  ('varejo',    'Varejo, E-commerce e Veículos', 80, 'ecommerce'),
  ('parceiros', 'White Label e Parceiros',        90, 'white-label')
ON CONFLICT (slug) DO UPDATE
  SET nome = EXCLUDED.nome,
      ordem = EXCLUDED.ordem,
      recommendation_slug = EXCLUDED.recommendation_slug;

-- Macros legados
UPDATE public.core_macro_nichos SET recommendation_slug = 'clinicas'            WHERE slug = 'saude'        AND recommendation_slug IS NULL;
UPDATE public.core_macro_nichos SET recommendation_slug = 'bares-restaurantes'  WHERE slug = 'alimentacao'  AND recommendation_slug IS NULL;
UPDATE public.core_macro_nichos SET recommendation_slug = 'microcervejarias'    WHERE slug = 'fornecedores' AND recommendation_slug IS NULL;
UPDATE public.core_macro_nichos SET recommendation_slug = 'imobiliaria'         WHERE slug = 'imobiliario'  AND recommendation_slug IS NULL;
UPDATE public.core_macro_nichos SET recommendation_slug = 'servicos'            WHERE slug = 'servicos'     AND recommendation_slug IS NULL;
UPDATE public.core_macro_nichos SET recommendation_slug = 'educacao'            WHERE slug = 'educacao'     AND recommendation_slug IS NULL;
UPDATE public.core_macro_nichos SET recommendation_slug = 'eventos'             WHERE slug = 'eventos'      AND recommendation_slug IS NULL;

-- Novos subnichos — UNIQUE é (macro_id, slug)
WITH macro_saude AS (SELECT id FROM public.core_macro_nichos WHERE slug = 'saude'),
     macro_varejo AS (SELECT id FROM public.core_macro_nichos WHERE slug = 'varejo'),
     macro_parceiros AS (SELECT id FROM public.core_macro_nichos WHERE slug = 'parceiros')
INSERT INTO public.core_subnichos (macro_id, slug, nome, ordem, recommendation_slug)
VALUES
  ((SELECT id FROM macro_saude),    'fitness',     'Fitness e Performance',  70, 'fitness'),
  ((SELECT id FROM macro_varejo),   'ecommerce',   'E-commerce e Varejo',    10, 'ecommerce'),
  ((SELECT id FROM macro_varejo),   'veiculos',    'Revenda de Veículos',    20, 'veiculos'),
  ((SELECT id FROM macro_parceiros),'white-label', 'White Label',            10, 'white-label')
ON CONFLICT (macro_id, slug) DO UPDATE
  SET nome     = EXCLUDED.nome,
      ordem    = EXCLUDED.ordem,
      recommendation_slug = EXCLUDED.recommendation_slug;

-- Subnichos legados → recommendation_slug
UPDATE public.core_subnichos SET recommendation_slug = 'clinicas'           WHERE slug IN ('clinicas-medicas','consultorios','fisioterapia','nutricao','psiquiatria','saude-ocupacional','laboratorios','diagnostico-imagem','telemedicina') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'psicologia'         WHERE slug IN ('psicologia','terapias') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'bares-restaurantes' WHERE slug IN ('restaurantes','bares','gastrobares','hamburguerias','pizzarias','cafeterias','adegas','casas-de-chopp','food-trucks','dark-kitchens') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'microcervejarias'   WHERE slug IN ('microcervejarias','distribuidoras','vinicolas','destilarias','torrefacoes','atacadistas','importadoras','industrias-alimenticias') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'imobiliaria'        WHERE slug IN ('imobiliarias','corretores','administradoras','temporada','condominios','incorporadoras') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'juridico'           WHERE slug IN ('advocacia') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'contabilidade'      WHERE slug IN ('contabilidade') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'servicos'           WHERE slug IN ('marketing','tecnologia','rh','engenharia','arquitetura','consultoria') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'educacao'           WHERE slug IN ('escolas','cursos-livres','idiomas','faculdades','pos-graduacao','educacao-corporativa') AND recommendation_slug IS NULL;
UPDATE public.core_subnichos SET recommendation_slug = 'eventos'            WHERE slug IN ('casas-de-eventos','congressos','feiras','casamentos','formaturas','shows','organizadores') AND recommendation_slug IS NULL;

-- Trava NOT NULL (todos os registros já preenchidos)
ALTER TABLE public.core_subnichos
  ALTER COLUMN recommendation_slug SET NOT NULL;
ALTER TABLE public.core_macro_nichos
  ALTER COLUMN recommendation_slug SET NOT NULL;