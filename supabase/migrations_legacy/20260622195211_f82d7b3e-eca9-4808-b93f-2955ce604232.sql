-- Onda 12: Public site + WhatsApp + Quote intake

CREATE TABLE public.riomed_site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  slug TEXT NOT NULL DEFAULT 'riomed',
  brand_name TEXT NOT NULL DEFAULT 'RioMed',
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0E7C66',
  accent_color TEXT NOT NULL DEFAULT '#0AB1A0',
  whatsapp_official TEXT NOT NULL DEFAULT '+595000000000',
  whatsapp_message TEXT NOT NULL DEFAULT 'Hola RioMed, me gustaría más información.',
  country_code TEXT NOT NULL DEFAULT 'PY',
  default_language TEXT NOT NULL DEFAULT 'es',
  hero_title TEXT NOT NULL DEFAULT 'Equipamiento médico-hospitalario confiable.',
  hero_subtitle TEXT NOT NULL DEFAULT 'Venta, alquiler y servicio técnico para hospitales, clínicas y pacientes.',
  hero_cta_label TEXT NOT NULL DEFAULT 'Solicitar cotización',
  footer_text TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);
GRANT SELECT ON public.riomed_site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_site_settings TO authenticated;
GRANT ALL ON public.riomed_site_settings TO service_role;
ALTER TABLE public.riomed_site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_site_public_read" ON public.riomed_site_settings FOR SELECT TO anon
  USING (is_published = true);
CREATE POLICY "riomed_site_auth_read" ON public.riomed_site_settings FOR SELECT TO authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "riomed_site_admin_write" ON public.riomed_site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.riomed_whatsapp_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  lead_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.riomed_whatsapp_clicks TO anon;
GRANT SELECT, INSERT ON public.riomed_whatsapp_clicks TO authenticated;
GRANT ALL ON public.riomed_whatsapp_clicks TO service_role;
ALTER TABLE public.riomed_whatsapp_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_wa_clicks_anon_insert" ON public.riomed_whatsapp_clicks FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "riomed_wa_clicks_auth_insert" ON public.riomed_whatsapp_clicks FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "riomed_wa_clicks_admin_select" ON public.riomed_whatsapp_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_riomed_wa_clicks_created ON public.riomed_whatsapp_clicks(company_id, created_at DESC);

ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS riomed_origin TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS riomed_quote_payload JSONB;

CREATE TRIGGER trg_riomed_site_settings_updated_at BEFORE UPDATE ON public.riomed_site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();