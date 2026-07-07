
-- 1) Recreate vitrine view as SECURITY DEFINER so anon can read the safe columns
--    without requiring SELECT on the base companies table.
DROP VIEW IF EXISTS public.companies_vitrine_public CASCADE;
CREATE VIEW public.companies_vitrine_public
WITH (security_invoker = false) AS
SELECT
  id, name, trade_name, logo_url, cover_image_url, gallery_urls,
  tagline, description, public_slug, segment, company_type,
  primary_color, secondary_color, address_city, address_state,
  address_neighborhood, address_zip, latitude, longitude,
  website, instagram, facebook, whatsapp,
  rating_avg, rating_count, updated_at
FROM public.companies
WHERE vitrine_enabled = true
  AND public_slug IS NOT NULL;

GRANT SELECT ON public.companies_vitrine_public TO anon, authenticated;

-- 2) Enable vitrine + assign public_slug for existing real tenants that were
--    hidden (skip E2E test fixtures identified by name pattern).
WITH candidates AS (
  SELECT id, name,
         lower(regexp_replace(regexp_replace(coalesce(trade_name, name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) AS slug
  FROM public.companies
  WHERE (public_slug IS NULL OR vitrine_enabled = false)
    AND name !~* 'E2E'
    AND name !~* 'homolog'
)
UPDATE public.companies c
SET
  public_slug = COALESCE(c.public_slug, cand.slug),
  vitrine_enabled = true
FROM candidates cand
WHERE c.id = cand.id
  AND cand.slug IS NOT NULL
  AND length(cand.slug) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.companies c2
    WHERE c2.public_slug = cand.slug AND c2.id <> c.id
  );
