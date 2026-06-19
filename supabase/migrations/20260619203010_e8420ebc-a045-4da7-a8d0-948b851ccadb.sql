
-- Vitrine pública: anon pode ler apenas colunas seguras de companies com vitrine_enabled
GRANT SELECT (id, name, trade_name, logo_url, public_slug, segment, company_type, primary_color, secondary_color, address_city, address_state, website, instagram, facebook, vitrine_enabled, updated_at) ON public.companies TO anon;

CREATE POLICY "anon reads vitrine companies" ON public.companies
  FOR SELECT TO anon
  USING (vitrine_enabled IS TRUE);
