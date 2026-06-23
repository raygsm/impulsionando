
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP TABLE IF EXISTS public.companies_vitrine_public CASCADE;

CREATE VIEW public.companies_vitrine_public
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.name,
  c.trade_name,
  c.logo_url,
  c.cover_image_url,
  c.gallery_urls,
  c.tagline,
  c.description,
  c.public_slug,
  c.segment,
  c.company_type,
  c.primary_color,
  c.secondary_color,
  c.address_city,
  c.address_state,
  c.address_neighborhood,
  c.address_zip,
  c.latitude,
  c.longitude,
  c.website,
  c.instagram,
  c.facebook,
  c.whatsapp,
  c.rating_avg,
  c.rating_count,
  c.updated_at
FROM public.companies c
WHERE c.vitrine_enabled = true;

GRANT SELECT ON public.companies_vitrine_public TO anon, authenticated;
