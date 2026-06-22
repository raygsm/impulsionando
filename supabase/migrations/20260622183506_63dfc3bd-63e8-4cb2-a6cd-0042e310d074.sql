
-- Itens curados da vitrine
CREATE TABLE public.riomed_showcase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  showcase_id uuid NOT NULL REFERENCES public.riomed_showcase(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.riomed_product_variants(id) ON DELETE SET NULL,
  position int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  override_price numeric(14,2),
  badge text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (showcase_id, product_id, variant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_showcase_items TO authenticated;
GRANT SELECT ON public.riomed_showcase_items TO anon;
GRANT ALL ON public.riomed_showcase_items TO service_role;
ALTER TABLE public.riomed_showcase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY rsi_company_rw ON public.riomed_showcase_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_showcase_items.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_showcase_items.company_id));
CREATE POLICY rsi_public_read ON public.riomed_showcase_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.riomed_showcase s WHERE s.id = riomed_showcase_items.showcase_id AND s.is_published = true));
CREATE INDEX riomed_showcase_items_pos_idx ON public.riomed_showcase_items(showcase_id, position);

-- Carrinhos públicos
CREATE TABLE public.riomed_public_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','submitted','converted','abandoned','cancelled')),
  modality text NOT NULL DEFAULT 'sale' CHECK (modality IN ('sale','rental','mixed')),
  currency text NOT NULL DEFAULT 'BOB',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  items_count int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_public_carts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.riomed_public_carts TO anon;
GRANT ALL ON public.riomed_public_carts TO service_role;
ALTER TABLE public.riomed_public_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rpc_admin_all ON public.riomed_public_carts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_public_carts.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_public_carts.company_id));
-- Carrinhos públicos são acessados por session_token via server function (não direto pelo PostgREST anon).
-- Permissão mínima para anon: NENHUMA leitura direta. Tudo via server fn.
CREATE INDEX riomed_public_carts_status_idx ON public.riomed_public_carts(company_id, status, updated_at DESC);
CREATE TRIGGER trg_rpc_updated_at BEFORE UPDATE ON public.riomed_public_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Itens do carrinho
CREATE TABLE public.riomed_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.riomed_public_carts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.riomed_product_variants(id) ON DELETE SET NULL,
  modality text NOT NULL DEFAULT 'sale' CHECK (modality IN ('sale','rental_daily','rental_monthly')),
  product_name text NOT NULL,
  sku text,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  qty numeric(14,3) NOT NULL DEFAULT 1,
  rental_days int,
  total numeric(14,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_cart_items TO authenticated;
GRANT ALL ON public.riomed_cart_items TO service_role;
ALTER TABLE public.riomed_cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY rci2_admin_all ON public.riomed_cart_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_cart_items.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_cart_items.company_id));
CREATE INDEX riomed_cart_items_cart_idx ON public.riomed_cart_items(cart_id);

-- Sessões de checkout
CREATE TABLE public.riomed_checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cart_id uuid NOT NULL REFERENCES public.riomed_public_carts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved','rejected','converted','failed','expired')),
  contact_name text NOT NULL,
  contact_email text,
  contact_phone text NOT NULL,
  contact_doc text,
  company_name text,
  audience text NOT NULL DEFAULT 'public' CHECK (audience IN ('public','b2b','hospital','rental')),
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.riomed_quotes(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_checkout_sessions TO authenticated;
GRANT ALL ON public.riomed_checkout_sessions TO service_role;
ALTER TABLE public.riomed_checkout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rcs_admin_all ON public.riomed_checkout_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_checkout_sessions.company_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_checkout_sessions.company_id));
CREATE INDEX riomed_checkout_status_idx ON public.riomed_checkout_sessions(company_id, status, created_at DESC);
CREATE TRIGGER trg_rcs_updated_at BEFORE UPDATE ON public.riomed_checkout_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger recalc totais do carrinho
CREATE OR REPLACE FUNCTION public.riomed_recalc_cart() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid; _sub numeric; _cnt int;
BEGIN
  _cid := COALESCE(NEW.cart_id, OLD.cart_id);
  SELECT COALESCE(SUM(total),0), COUNT(*) INTO _sub, _cnt FROM public.riomed_cart_items WHERE cart_id = _cid;
  UPDATE public.riomed_public_carts SET subtotal = _sub, total = _sub, items_count = _cnt, updated_at = now() WHERE id = _cid;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_riomed_cart_items_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.riomed_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.riomed_recalc_cart();

-- Seed: popular itens da vitrine "ofertas" com até 12 produtos ativos da RioMed
DO $$
DECLARE _cid uuid; _sid uuid;
BEGIN
  SELECT company_id INTO _cid FROM public.core_tenant_identity WHERE subdomain = 'riomed' LIMIT 1;
  IF _cid IS NULL THEN RETURN; END IF;
  SELECT id INTO _sid FROM public.riomed_showcase WHERE company_id = _cid AND slug = 'ofertas' LIMIT 1;
  IF _sid IS NULL THEN RETURN; END IF;
  INSERT INTO public.riomed_showcase_items (company_id, showcase_id, product_id, position, is_featured, badge)
  SELECT _cid, _sid, p.id, ROW_NUMBER() OVER (ORDER BY p.display_order, p.name) - 1,
         (ROW_NUMBER() OVER (ORDER BY p.display_order, p.name) <= 3),
         CASE WHEN ROW_NUMBER() OVER (ORDER BY p.display_order, p.name) <= 3 THEN 'Destaque' ELSE NULL END
  FROM public.riomed_products p
  WHERE p.company_id = _cid AND p.is_active = true
  ORDER BY p.display_order, p.name
  LIMIT 12
  ON CONFLICT DO NOTHING;
END $$;
