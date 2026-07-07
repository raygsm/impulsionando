CREATE OR REPLACE VIEW public.companies_vitrine_public
WITH (security_invoker = on) AS
SELECT
  id, name, trade_name, logo_url, cover_image_url, gallery_urls, tagline,
  description, public_slug, segment, company_type, primary_color,
  secondary_color, address_city, address_state, address_neighborhood,
  address_zip, latitude, longitude, website, instagram, facebook, whatsapp,
  rating_avg, rating_count, updated_at, subdomain, domain
FROM public.companies
WHERE vitrine_enabled = true
  AND public_slug IS NOT NULL
  AND COALESCE(is_demo, false) = false
  AND COALESCE(is_active, true) = true;

GRANT SELECT ON public.companies_vitrine_public TO anon, authenticated;