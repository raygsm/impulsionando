
-- =========================================================================
-- Nicho Microcervejarias — Fase 1 (Fundação)
-- =========================================================================

INSERT INTO public.niches (slug, name, description, icon, is_active)
VALUES ('microcervejarias', 'Microcervejarias', 'Marcas, rótulos, PDVs, sell-out e relacionamento com consumidor final', 'Beer', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = true;

-- BRANDS
CREATE TABLE public.brewery_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  cnpj text,
  city text,
  state text,
  founded_year integer,
  brewer_name text,
  logo_url text,
  cover_url text,
  bio text,
  website_url text,
  instagram text,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brewery_brands TO authenticated;
GRANT SELECT ON public.brewery_brands TO anon;
GRANT ALL ON public.brewery_brands TO service_role;
ALTER TABLE public.brewery_brands ENABLE ROW LEVEL SECURITY;

-- Helper (sem novos enums — Fase 2 estende)
CREATE OR REPLACE FUNCTION public.has_brewery_access(_user_id uuid, _brand_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brewery_brands b
    WHERE b.id = _brand_id
      AND (
        b.owner_user_id = _user_id
        OR public.has_role(_user_id, 'admin'::public.app_role)
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_brewery_access(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Public can read active brands"
  ON public.brewery_brands FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Owner/admin manage brands"
  ON public.brewery_brands FOR ALL TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- PRODUCTS
CREATE TABLE public.brewery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brewery_brands(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  style text NOT NULL,
  description text,
  abv numeric(4,2),
  ibu integer,
  volume_ml integer,
  package_type text,
  photo_url text,
  is_seasonal boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brewery_products TO authenticated;
GRANT SELECT ON public.brewery_products TO anon;
GRANT ALL ON public.brewery_products TO service_role;
ALTER TABLE public.brewery_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active products"
  ON public.brewery_products FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Brand owner manages products"
  ON public.brewery_products FOR ALL TO authenticated
  USING (public.has_brewery_access(auth.uid(), brand_id))
  WITH CHECK (public.has_brewery_access(auth.uid(), brand_id));

-- PDV LINKS
CREATE TABLE public.brewery_pdv_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brewery_brands(id) ON DELETE CASCADE,
  pdv_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  pdv_name text NOT NULL,
  pdv_city text,
  pdv_state text,
  contact_name text,
  contact_phone text,
  contract_status text NOT NULL DEFAULT 'pending',
  contract_started_at date,
  contract_ended_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, pdv_company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brewery_pdv_links TO authenticated;
GRANT ALL ON public.brewery_pdv_links TO service_role;
ALTER TABLE public.brewery_pdv_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand owner manages pdv links"
  ON public.brewery_pdv_links FOR ALL TO authenticated
  USING (public.has_brewery_access(auth.uid(), brand_id))
  WITH CHECK (public.has_brewery_access(auth.uid(), brand_id));

-- SELLOUTS
CREATE TABLE public.brewery_sellouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brewery_brands(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.brewery_products(id) ON DELETE CASCADE,
  pdv_link_id uuid REFERENCES public.brewery_pdv_links(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  units integer NOT NULL DEFAULT 0,
  gross_revenue_cents bigint NOT NULL DEFAULT 0,
  avg_ticket_cents bigint,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brewery_sellouts_brand_period_idx ON public.brewery_sellouts (brand_id, period_start);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brewery_sellouts TO authenticated;
GRANT ALL ON public.brewery_sellouts TO service_role;
ALTER TABLE public.brewery_sellouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand owner manages sellouts"
  ON public.brewery_sellouts FOR ALL TO authenticated
  USING (public.has_brewery_access(auth.uid(), brand_id))
  WITH CHECK (public.has_brewery_access(auth.uid(), brand_id));

-- CAMPAIGNS
CREATE TABLE public.brewery_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brewery_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  voucher_code text,
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  target_pdv_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  kpi_target_units integer,
  kpi_target_leads integer,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brewery_campaigns TO authenticated;
GRANT ALL ON public.brewery_campaigns TO service_role;
ALTER TABLE public.brewery_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand owner manages campaigns"
  ON public.brewery_campaigns FOR ALL TO authenticated
  USING (public.has_brewery_access(auth.uid(), brand_id))
  WITH CHECK (public.has_brewery_access(auth.uid(), brand_id));

-- TASTINGS
CREATE TABLE public.brewery_tastings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brewery_brands(id) ON DELETE CASCADE,
  pdv_link_id uuid REFERENCES public.brewery_pdv_links(id) ON DELETE SET NULL,
  event_at timestamptz NOT NULL,
  duration_minutes integer,
  products_showcased uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  participants integer NOT NULL DEFAULT 0,
  leads_captured integer NOT NULL DEFAULT 0,
  units_sold integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brewery_tastings TO authenticated;
GRANT ALL ON public.brewery_tastings TO service_role;
ALTER TABLE public.brewery_tastings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand owner manages tastings"
  ON public.brewery_tastings FOR ALL TO authenticated
  USING (public.has_brewery_access(auth.uid(), brand_id))
  WITH CHECK (public.has_brewery_access(auth.uid(), brand_id));

-- LEAD PREFERENCES
CREATE TABLE public.brewery_lead_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brewery_brands(id) ON DELETE CASCADE,
  consumer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  masked_name text,
  masked_whatsapp text,
  favorite_styles text[] NOT NULL DEFAULT ARRAY[]::text[],
  favorite_brand_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  frequency text,
  interests text[] NOT NULL DEFAULT ARRAY[]::text[],
  consent_marketing boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brewery_lead_pref_brand_idx ON public.brewery_lead_preferences (brand_id);
CREATE INDEX brewery_lead_pref_user_idx  ON public.brewery_lead_preferences (consumer_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brewery_lead_preferences TO authenticated;
GRANT ALL ON public.brewery_lead_preferences TO service_role;
ALTER TABLE public.brewery_lead_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consumer manages own preferences"
  ON public.brewery_lead_preferences FOR ALL TO authenticated
  USING (consumer_user_id = auth.uid())
  WITH CHECK (consumer_user_id = auth.uid());
CREATE POLICY "Brand owner reads brand preferences"
  ON public.brewery_lead_preferences FOR SELECT TO authenticated
  USING (brand_id IS NOT NULL AND public.has_brewery_access(auth.uid(), brand_id));

-- Triggers updated_at
CREATE TRIGGER trg_brewery_brands_updated BEFORE UPDATE ON public.brewery_brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_brewery_products_updated BEFORE UPDATE ON public.brewery_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_brewery_pdv_links_updated BEFORE UPDATE ON public.brewery_pdv_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_brewery_sellouts_updated BEFORE UPDATE ON public.brewery_sellouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_brewery_campaigns_updated BEFORE UPDATE ON public.brewery_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_brewery_tastings_updated BEFORE UPDATE ON public.brewery_tastings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_brewery_lead_pref_updated BEFORE UPDATE ON public.brewery_lead_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
