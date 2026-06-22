
-- ============================================================
-- 1) brewery_brands — remover SELECT público amplo, criar view pública projetada
-- ============================================================
DROP POLICY IF EXISTS "Public can read active brands" ON public.brewery_brands;

CREATE POLICY "Authenticated read active brands"
ON public.brewery_brands
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE OR REPLACE VIEW public.brewery_brands_public
WITH (security_invoker = true) AS
SELECT id, company_id, name, slug, city, state, founded_year,
       brewer_name, logo_url, cover_url, bio, website_url, instagram,
       created_at, updated_at
FROM public.brewery_brands
WHERE is_active = true;

GRANT SELECT ON public.brewery_brands_public TO anon, authenticated;

-- ============================================================
-- 2) chrismed_service_offerings — idem, projeção pública sem campos sensíveis
-- ============================================================
DROP POLICY IF EXISTS "Public reads active offerings" ON public.chrismed_service_offerings;

CREATE POLICY "Authenticated reads active offerings"
ON public.chrismed_service_offerings
FOR SELECT
TO authenticated
USING (active = true);

CREATE OR REPLACE VIEW public.chrismed_service_offerings_public
WITH (security_invoker = true) AS
SELECT id, company_id, slug, name, description, modality,
       price_cents, duration_minutes, display_order,
       created_at, updated_at
FROM public.chrismed_service_offerings
WHERE active = true;

GRANT SELECT ON public.chrismed_service_offerings_public TO anon, authenticated;

-- ============================================================
-- 3) companies — restringir GRANT por coluna para anon (somente vitrine segura)
-- ============================================================
REVOKE SELECT ON public.companies FROM anon;

GRANT SELECT (
  id, name, trade_name, logo_url, public_slug, segment, niche_id,
  address_city, address_state, rating_avg, rating_count,
  vitrine_enabled, subdomain
) ON public.companies TO anon;

-- ============================================================
-- 4) Views sem security_invoker — corrigir as 4 remanescentes
-- ============================================================
ALTER VIEW public.v_company_compliance_status SET (security_invoker = true);
ALTER VIEW public.v_funnel_dispatch_stats     SET (security_invoker = true);
ALTER VIEW public.v_funnel_conversion         SET (security_invoker = true);
ALTER VIEW public.v_funnel_recent_failures    SET (security_invoker = true);
