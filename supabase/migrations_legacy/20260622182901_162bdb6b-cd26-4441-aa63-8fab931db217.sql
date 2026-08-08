
CREATE TABLE public.riomed_stale_stock_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  days_threshold int NOT NULL DEFAULT 90 CHECK (days_threshold > 0),
  min_qty numeric(14,3) NOT NULL DEFAULT 1,
  suggested_discount_pct numeric(5,2) NOT NULL DEFAULT 15 CHECK (suggested_discount_pct >= 0 AND suggested_discount_pct <= 90),
  category_filter text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_stale_stock_rules TO authenticated;
GRANT ALL ON public.riomed_stale_stock_rules TO service_role;
ALTER TABLE public.riomed_stale_stock_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rssr_company_rw ON public.riomed_stale_stock_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_stale_stock_rules.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_stale_stock_rules.company_id));
CREATE TRIGGER trg_rssr_updated_at BEFORE UPDATE ON public.riomed_stale_stock_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.riomed_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  goal text NOT NULL DEFAULT 'destock' CHECK (goal IN ('destock','launch','seasonal','reactivation','b2b','custom')),
  channel text NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp','showcase','email','b2b','multi')),
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','public','b2b','hospital','rental','customer_segment')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','ready','scheduled','running','completed','cancelled','failed')),
  ai_prompt text, copy_headline text, copy_body text, copy_cta text, banner_url text,
  target_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamptz, sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_campaigns TO authenticated;
GRANT ALL ON public.riomed_campaigns TO service_role;
ALTER TABLE public.riomed_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY rc_company_rw ON public.riomed_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_campaigns.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_campaigns.company_id));
CREATE INDEX riomed_campaigns_company_status_idx ON public.riomed_campaigns(company_id, status, created_at DESC);
CREATE TRIGGER trg_rc_updated_at BEFORE UPDATE ON public.riomed_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.riomed_campaign_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.riomed_campaigns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.riomed_product_variants(id) ON DELETE SET NULL,
  original_price numeric(14,2), discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  promo_price numeric(14,2), stock_qty numeric(14,3),
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_campaign_items TO authenticated;
GRANT ALL ON public.riomed_campaign_items TO service_role;
ALTER TABLE public.riomed_campaign_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY rci_company_rw ON public.riomed_campaign_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_campaign_items.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_campaign_items.company_id));
CREATE INDEX riomed_campaign_items_campaign_idx ON public.riomed_campaign_items(campaign_id, position);

CREATE TABLE public.riomed_showcase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text NOT NULL, title text NOT NULL, subtitle text, banner_url text,
  layout text NOT NULL DEFAULT 'grid' CHECK (layout IN ('grid','carousel','masonry','featured')),
  campaign_id uuid REFERENCES public.riomed_campaigns(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_showcase TO authenticated;
GRANT SELECT ON public.riomed_showcase TO anon;
GRANT ALL ON public.riomed_showcase TO service_role;
ALTER TABLE public.riomed_showcase ENABLE ROW LEVEL SECURITY;
CREATE POLICY rs_company_rw ON public.riomed_showcase FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_showcase.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_showcase.company_id));
CREATE POLICY rs_public_read ON public.riomed_showcase FOR SELECT TO anon USING (is_published = true);
CREATE TRIGGER trg_rs_updated_at BEFORE UPDATE ON public.riomed_showcase FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.riomed_whatsapp_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.riomed_campaigns(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL, recipient_name text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','delivered','read','failed','replied')),
  provider_message_id text, error text,
  sent_at timestamptz, delivered_at timestamptz, replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_whatsapp_broadcasts TO authenticated;
GRANT ALL ON public.riomed_whatsapp_broadcasts TO service_role;
ALTER TABLE public.riomed_whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rwb_company_rw ON public.riomed_whatsapp_broadcasts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_whatsapp_broadcasts.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_whatsapp_broadcasts.company_id));
CREATE INDEX riomed_whatsapp_campaign_status_idx ON public.riomed_whatsapp_broadcasts(campaign_id, status);

CREATE OR REPLACE FUNCTION public.riomed_detect_stale_stock(
  _company_id uuid, _days_threshold int DEFAULT 90, _min_qty numeric DEFAULT 1, _limit int DEFAULT 50
) RETURNS TABLE (
  product_id uuid, variant_id uuid, sku text, product_name text, qty numeric,
  last_movement_at timestamptz, days_stale int, unit_price numeric
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, v.id, v.sku, p.name, sl.qty_available, sl.last_movement_at,
    GREATEST(0, EXTRACT(DAY FROM (now() - COALESCE(sl.last_movement_at, sl.updated_at, p.created_at)))::int),
    COALESCE((SELECT pr.price FROM public.riomed_prices pr JOIN public.riomed_price_lists pl ON pl.id = pr.price_list_id
              WHERE pr.variant_id = v.id AND pl.is_default = true LIMIT 1), p.price_sale)
  FROM public.riomed_stock_levels sl
  JOIN public.riomed_product_variants v ON v.id = sl.variant_id
  JOIN public.riomed_products p ON p.id = v.product_id
  WHERE sl.company_id = _company_id AND sl.qty_available >= _min_qty
    AND COALESCE(sl.last_movement_at, sl.updated_at, p.created_at) < (now() - (_days_threshold || ' days')::interval)
  ORDER BY sl.last_movement_at NULLS FIRST, sl.qty_available DESC LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.riomed_detect_stale_stock(uuid, int, numeric, int) TO authenticated, service_role;

DO $$
DECLARE _cid uuid;
BEGIN
  SELECT company_id INTO _cid FROM public.core_tenant_identity WHERE subdomain = 'riomed' LIMIT 1;
  IF _cid IS NULL THEN RAISE NOTICE 'RioMed company not found; skipping marketing seed.'; RETURN; END IF;
  INSERT INTO public.riomed_stale_stock_rules (company_id, name, days_threshold, min_qty, suggested_discount_pct) VALUES
    (_cid, 'Parado 60+ dias', 60, 1, 10),
    (_cid, 'Parado 90+ dias', 90, 1, 20),
    (_cid, 'Parado 180+ dias', 180, 1, 35)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.riomed_showcase (company_id, slug, title, subtitle, layout, is_published) VALUES
    (_cid, 'ofertas', 'Ofertas Rio Med', 'Equipamentos médicos com condições especiais', 'grid', true),
    (_cid, 'novidades', 'Novidades', 'Últimos lançamentos do nosso catálogo', 'carousel', true)
  ON CONFLICT DO NOTHING;
END $$;
