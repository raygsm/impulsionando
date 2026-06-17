
CREATE OR REPLACE FUNCTION public.get_niche_template(p_niche_slug text)
RETURNS TABLE (module_slug text, module_name text, is_recommended boolean, is_optional boolean, sort_order int)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT cnm.module_slug, m.name, cnm.is_recommended, cnm.is_optional, cnm.sort_order
    FROM public.core_niche_modules cnm
    JOIN public.niches n ON n.id = cnm.niche_id
    JOIN public.modules m ON m.slug = cnm.module_slug
   WHERE n.slug = p_niche_slug
   ORDER BY cnm.sort_order, m.name;
$$;

REVOKE EXECUTE ON FUNCTION public.get_niche_template(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_niche_template(text) TO authenticated, service_role;
