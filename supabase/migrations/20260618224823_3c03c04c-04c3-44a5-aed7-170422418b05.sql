
-- Seed default templates: 1 "Operacional" per subnicho
INSERT INTO public.core_templates (subnicho_id, slug, nome, descricao, modulos, destaque)
SELECT s.id,
       s.slug || '-operacional',
       'Operacional ' || s.nome,
       'Template base para ' || s.nome || ': módulos essenciais para começar a operar em 24h.',
       ARRAY['crm','agenda','customers','finance']::text[],
       true
FROM public.core_subnichos s
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_templates t WHERE t.subnicho_id = s.id AND t.slug = s.slug || '-operacional'
);

-- A second "Crescimento" template per subnicho
INSERT INTO public.core_templates (subnicho_id, slug, nome, descricao, modulos, destaque)
SELECT s.id,
       s.slug || '-crescimento',
       'Crescimento ' || s.nome,
       'Operacional + marketing, vitrine pública e automações de fidelização.',
       ARRAY['crm','agenda','customers','finance','marketing','vitrine','clube']::text[],
       false
FROM public.core_subnichos s
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_templates t WHERE t.subnicho_id = s.id AND t.slug = s.slug || '-crescimento'
);
