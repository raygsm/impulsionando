
-- Drop the broad anon policy; anon will read only via the safe view (which runs as owner)
DROP POLICY IF EXISTS companies_public_vitrine_safe_read ON public.companies;
REVOKE ALL ON public.companies FROM anon;

-- Make the view run as owner so it can read the base table with anon entirely revoked
DROP VIEW IF EXISTS public.public_companies_vitrine;
CREATE VIEW public.public_companies_vitrine AS
SELECT
  id, name, trade_name, logo_url, public_slug,
  segment, company_type, primary_color, secondary_color,
  address_city, address_state, website, instagram, facebook
FROM public.companies
WHERE vitrine_enabled = true AND public_slug IS NOT NULL;

GRANT SELECT ON public.public_companies_vitrine TO anon, authenticated;
