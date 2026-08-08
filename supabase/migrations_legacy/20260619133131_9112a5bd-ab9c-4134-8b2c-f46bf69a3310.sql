-- Recria a view com security_invoker para respeitar RLS do usuário (corrige lint 0010)
DROP VIEW IF EXISTS public.v_company_macro;
CREATE VIEW public.v_company_macro
WITH (security_invoker = true)
AS
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