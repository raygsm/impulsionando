
ALTER TABLE public.brewery_pdv_links
  ADD COLUMN IF NOT EXISTS portal_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS brewery_pdv_links_portal_token_uidx
  ON public.brewery_pdv_links(portal_token);

CREATE OR REPLACE FUNCTION public.resolve_brewery_portal_token(_token uuid)
RETURNS TABLE (
  pdv_link_id uuid,
  brand_id uuid,
  pdv_name text,
  pdv_city text,
  pdv_state text,
  contact_name text,
  contract_status text,
  brand_name text,
  brand_slug text,
  brand_logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.brand_id, p.pdv_name, p.pdv_city, p.pdv_state,
         p.contact_name, p.contract_status,
         b.name, b.slug, b.logo_url
  FROM public.brewery_pdv_links p
  JOIN public.brewery_brands b ON b.id = p.brand_id
  WHERE p.portal_token = _token
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_brewery_portal_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.resolve_brewery_portal_token(uuid) TO anon, authenticated, service_role;
