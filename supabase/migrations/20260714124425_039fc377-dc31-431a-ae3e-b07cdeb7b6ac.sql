
-- ============================================================
-- COLORS — Fase 1: base do CRM próprio (pré-checkout + funil + afiliados)
-- ============================================================

-- Contatos capturados no pré-checkout Colors (antes do redirect Maisfy).
CREATE TABLE public.colors_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  email_normalized TEXT GENERATED ALWAYS AS (lower(trim(email))) STORED,
  whatsapp TEXT,
  whatsapp_normalized TEXT GENERATED ALWAYS AS (regexp_replace(coalesce(whatsapp,''), '\D', '', 'g')) STORED,
  cpf_hash TEXT,
  cep TEXT,
  address_line1 TEXT,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  consent_lgpd BOOLEAN NOT NULL DEFAULT false,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX colors_contacts_email_uidx ON public.colors_contacts (email_normalized) WHERE email_normalized IS NOT NULL;
CREATE INDEX colors_contacts_whatsapp_idx ON public.colors_contacts (whatsapp_normalized) WHERE whatsapp_normalized IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colors_contacts TO authenticated;
GRANT ALL ON public.colors_contacts TO service_role;
ALTER TABLE public.colors_contacts ENABLE ROW LEVEL SECURITY;
-- Admin master total; usuário comum só vê o próprio registro se vinculado (fase 3)
CREATE POLICY "colors_contacts_admin_all"
  ON public.colors_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Afiliados Colors (Fase 4 — cadastro básico já disponível para atribuição)
CREATE TABLE public.colors_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  public_name TEXT,
  document TEXT,
  email TEXT,
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'pre_cadastrado',
  external_platform TEXT,
  external_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX colors_affiliates_external_uidx
  ON public.colors_affiliates (external_platform, external_id)
  WHERE external_platform IS NOT NULL AND external_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colors_affiliates TO authenticated;
GRANT ALL ON public.colors_affiliates TO service_role;
ALTER TABLE public.colors_affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colors_affiliates_admin_all"
  ON public.colors_affiliates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Oportunidades = uma tentativa de compra iniciada no site Colors.
-- Cada mudança de stage gera evento em colors_opportunity_events.
CREATE TABLE public.colors_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colors_checkout_id TEXT NOT NULL UNIQUE, -- referência externa enviada ao checkout Maisfy
  contact_id UUID REFERENCES public.colors_contacts(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES public.colors_affiliates(id) ON DELETE SET NULL,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  kit_size INTEGER NOT NULL DEFAULT 1,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER,
  total_price_cents INTEGER,
  coupon TEXT,
  offer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  origin TEXT,
  device TEXT,
  browser TEXT,
  session_id TEXT,
  stage TEXT NOT NULL DEFAULT 'checkout_iniciado',
  external_platform TEXT,           -- ex.: 'maisfy'
  external_sale_id TEXT,            -- preenchido pela reconciliação
  external_order_id TEXT,
  external_status TEXT,
  reconciled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX colors_opps_contact_idx ON public.colors_opportunities (contact_id);
CREATE INDEX colors_opps_affiliate_idx ON public.colors_opportunities (affiliate_id);
CREATE INDEX colors_opps_stage_idx ON public.colors_opportunities (stage);
CREATE UNIQUE INDEX colors_opps_external_sale_uidx
  ON public.colors_opportunities (external_platform, external_sale_id)
  WHERE external_platform IS NOT NULL AND external_sale_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colors_opportunities TO authenticated;
GRANT ALL ON public.colors_opportunities TO service_role;
ALTER TABLE public.colors_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colors_opps_admin_all"
  ON public.colors_opportunities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Histórico imutável de transições de estado + eventos livres da oportunidade.
CREATE TABLE public.colors_opportunity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.colors_opportunities(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,        -- 'stage_change' | 'iris_note' | 'webhook' | 'import' ...
  from_stage TEXT,
  to_stage TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor TEXT,                       -- 'system' | 'iris' | user email etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX colors_opp_events_opp_idx ON public.colors_opportunity_events (opportunity_id, created_at DESC);

GRANT SELECT, INSERT ON public.colors_opportunity_events TO authenticated;
GRANT ALL ON public.colors_opportunity_events TO service_role;
ALTER TABLE public.colors_opportunity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colors_opp_events_admin_read"
  ON public.colors_opportunity_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "colors_opp_events_admin_insert"
  ON public.colors_opportunity_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cliques em links de afiliado (atribuição first-touch/last-touch — regra na app).
CREATE TABLE public.colors_affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.colors_affiliates(id) ON DELETE SET NULL,
  affiliate_code TEXT,
  session_id TEXT,
  landing_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX colors_aff_clicks_session_idx ON public.colors_affiliate_clicks (session_id);
CREATE INDEX colors_aff_clicks_code_idx ON public.colors_affiliate_clicks (affiliate_code);

GRANT SELECT, INSERT ON public.colors_affiliate_clicks TO authenticated;
GRANT ALL ON public.colors_affiliate_clicks TO service_role;
ALTER TABLE public.colors_affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colors_aff_clicks_admin_read"
  ON public.colors_affiliate_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "colors_aff_clicks_public_insert"
  ON public.colors_affiliate_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Triggers de updated_at (reusa função global se existir; senão cria)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER colors_contacts_updated_at BEFORE UPDATE ON public.colors_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER colors_affiliates_updated_at BEFORE UPDATE ON public.colors_affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER colors_opps_updated_at BEFORE UPDATE ON public.colors_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger que registra automaticamente a mudança de estágio em colors_opportunity_events.
CREATE OR REPLACE FUNCTION public.colors_track_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.colors_opportunity_events (opportunity_id, event_type, from_stage, to_stage, actor)
    VALUES (NEW.id, 'stage_change', NULL, NEW.stage, 'system');
  ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.colors_opportunity_events (opportunity_id, event_type, from_stage, to_stage, actor)
    VALUES (NEW.id, 'stage_change', OLD.stage, NEW.stage, 'system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER colors_opps_stage_track
  AFTER INSERT OR UPDATE OF stage ON public.colors_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.colors_track_stage_change();
