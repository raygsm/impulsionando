
DROP VIEW IF EXISTS public.public_companies_vitrine;
CREATE VIEW public.public_companies_vitrine
WITH (security_invoker = true) AS
SELECT
  id, name, trade_name, logo_url, public_slug,
  segment, company_type, primary_color, secondary_color,
  address_city, address_state, website, instagram, facebook
FROM public.companies
WHERE vitrine_enabled = true AND public_slug IS NOT NULL;

GRANT SELECT ON public.public_companies_vitrine TO anon, authenticated;

DROP POLICY IF EXISTS companies_public_vitrine_safe_read ON public.companies;
CREATE POLICY companies_public_vitrine_safe_read
ON public.companies
FOR SELECT
TO anon
USING (vitrine_enabled = true AND public_slug IS NOT NULL);

-- Column-level grants: anon may only project safe columns from the base table
REVOKE ALL ON public.companies FROM anon;
GRANT SELECT (
  id, name, trade_name, logo_url, public_slug,
  segment, company_type, primary_color, secondary_color,
  address_city, address_state, website, instagram, facebook,
  vitrine_enabled
) ON public.companies TO anon;
