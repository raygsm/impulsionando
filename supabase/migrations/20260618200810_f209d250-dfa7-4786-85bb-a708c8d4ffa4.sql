
-- ========================================================================
-- MARKETPLACE B2B — espinha dorsal
-- ========================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Helper de membership (escopo Marketplace; nome próprio para evitar colisão)
CREATE OR REPLACE FUNCTION public.mp_user_in_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = _user_id AND up.company_id = _company_id
  );
$$;

-- ------------------------------------------------------------------------ mp_suppliers
CREATE TABLE public.mp_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_type text NOT NULL CHECK (supplier_type IN (
    'microcervejaria','distribuidor','vinicola','cafe_especial','destilaria','alimentos_artesanais','outros'
  )),
  display_name text NOT NULL,
  description text,
  regions_served text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','blocked')),
  custom_fee_pct numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_suppliers TO authenticated;
GRANT ALL ON public.mp_suppliers TO service_role;
ALTER TABLE public.mp_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_suppliers public read" ON public.mp_suppliers FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "mp_suppliers owner manage" ON public.mp_suppliers FOR ALL TO authenticated
  USING (public.mp_user_in_company(auth.uid(), company_id))
  WITH CHECK (public.mp_user_in_company(auth.uid(), company_id));
CREATE TRIGGER mp_suppliers_updated BEFORE UPDATE ON public.mp_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------ mp_buyers
CREATE TABLE public.mp_buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  buyer_type text NOT NULL CHECK (buyer_type IN ('bar','restaurante','hotel','eventos','outros')),
  display_name text NOT NULL,
  delivery_address jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_buyers TO authenticated;
GRANT ALL ON public.mp_buyers TO service_role;
ALTER TABLE public.mp_buyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_buyers owner manage" ON public.mp_buyers FOR ALL TO authenticated
  USING (public.mp_user_in_company(auth.uid(), company_id))
  WITH CHECK (public.mp_user_in_company(auth.uid(), company_id));
CREATE TRIGGER mp_buyers_updated BEFORE UPDATE ON public.mp_buyers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------ mp_catalog_items
CREATE TABLE public.mp_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.mp_suppliers(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  description text,
  unit text NOT NULL DEFAULT 'un',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  min_order_qty numeric(12,3) NOT NULL DEFAULT 1,
  stock_qty numeric(12,3),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_catalog_items TO authenticated;
GRANT ALL ON public.mp_catalog_items TO service_role;
ALTER TABLE public.mp_catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_catalog public read active" ON public.mp_catalog_items FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "mp_catalog supplier manage" ON public.mp_catalog_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mp_suppliers s WHERE s.id = supplier_id AND public.mp_user_in_company(auth.uid(), s.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mp_suppliers s WHERE s.id = supplier_id AND public.mp_user_in_company(auth.uid(), s.company_id)));
CREATE TRIGGER mp_catalog_updated BEFORE UPDATE ON public.mp_catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------ mp_orders
CREATE TABLE public.mp_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.mp_suppliers(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES public.mp_buyers(id) ON DELETE RESTRICT,
  order_number bigserial,
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN (
    'pending_approval','approved','in_production','in_delivery','completed','canceled'
  )),
  subtotal_cents integer NOT NULL DEFAULT 0,
  fee_pct numeric(5,4) NOT NULL DEFAULT 0.005,
  fee_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  supplier_net_cents integer NOT NULL DEFAULT 0,
  placed_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mp_orders_supplier_idx ON public.mp_orders(supplier_id, status);
CREATE INDEX mp_orders_buyer_idx ON public.mp_orders(buyer_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_orders TO authenticated;
GRANT ALL ON public.mp_orders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE mp_orders_order_number_seq TO authenticated;
ALTER TABLE public.mp_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_orders read by both sides" ON public.mp_orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mp_suppliers s WHERE s.id = supplier_id AND public.mp_user_in_company(auth.uid(), s.company_id))
  OR EXISTS (SELECT 1 FROM public.mp_buyers b WHERE b.id = buyer_id AND public.mp_user_in_company(auth.uid(), b.company_id))
);
CREATE POLICY "mp_orders buyer creates" ON public.mp_orders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.mp_buyers b WHERE b.id = buyer_id AND public.mp_user_in_company(auth.uid(), b.company_id))
);
CREATE POLICY "mp_orders supplier updates" ON public.mp_orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mp_suppliers s WHERE s.id = supplier_id AND public.mp_user_in_company(auth.uid(), s.company_id))
);
CREATE POLICY "mp_orders buyer updates own pending" ON public.mp_orders FOR UPDATE TO authenticated USING (
  status IN ('pending_approval','canceled')
  AND EXISTS (SELECT 1 FROM public.mp_buyers b WHERE b.id = buyer_id AND public.mp_user_in_company(auth.uid(), b.company_id))
);
CREATE TRIGGER mp_orders_updated BEFORE UPDATE ON public.mp_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------ mp_order_items
CREATE TABLE public.mp_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.mp_orders(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.mp_catalog_items(id),
  name_snapshot text NOT NULL,
  unit text NOT NULL DEFAULT 'un',
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  qty numeric(12,3) NOT NULL CHECK (qty > 0),
  line_total_cents integer NOT NULL CHECK (line_total_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mp_order_items_order_idx ON public.mp_order_items(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_order_items TO authenticated;
GRANT ALL ON public.mp_order_items TO service_role;
ALTER TABLE public.mp_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_order_items follow order" ON public.mp_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mp_orders o WHERE o.id = order_id AND (
    EXISTS (SELECT 1 FROM public.mp_suppliers s WHERE s.id = o.supplier_id AND public.mp_user_in_company(auth.uid(), s.company_id))
    OR EXISTS (SELECT 1 FROM public.mp_buyers b WHERE b.id = o.buyer_id AND public.mp_user_in_company(auth.uid(), b.company_id))
  )))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mp_orders o WHERE o.id = order_id AND (
    EXISTS (SELECT 1 FROM public.mp_suppliers s WHERE s.id = o.supplier_id AND public.mp_user_in_company(auth.uid(), s.company_id))
    OR EXISTS (SELECT 1 FROM public.mp_buyers b WHERE b.id = o.buyer_id AND public.mp_user_in_company(auth.uid(), b.company_id))
  )));

-- ------------------------------------------------------------------------ mp_fee_policies
CREATE TABLE public.mp_fee_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('default','niche','supplier')),
  niche_slug text,
  supplier_id uuid REFERENCES public.mp_suppliers(id) ON DELETE CASCADE,
  fee_pct numeric(5,4) NOT NULL CHECK (fee_pct >= 0 AND fee_pct <= 0.2),
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mp_fee_policies TO authenticated;
GRANT ALL ON public.mp_fee_policies TO service_role;
ALTER TABLE public.mp_fee_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_fee_policies read all auth" ON public.mp_fee_policies FOR SELECT TO authenticated USING (active = true);
CREATE TRIGGER mp_fee_policies_updated BEFORE UPDATE ON public.mp_fee_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mp_fee_policies (scope, fee_pct, label) VALUES
  ('default', 0.005, 'Taxa de Intermediação Digital — padrão');

-- ------------------------------------------------------------------------ mp_transactions_ledger
CREATE TABLE public.mp_transactions_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.mp_orders(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.mp_suppliers(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.mp_buyers(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  gmv_cents integer NOT NULL,
  fee_pct numeric(5,4) NOT NULL,
  fee_cents integer NOT NULL,
  supplier_net_cents integer NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);
CREATE INDEX mp_ledger_period_idx ON public.mp_transactions_ledger(period_month);
CREATE INDEX mp_ledger_supplier_period_idx ON public.mp_transactions_ledger(supplier_id, period_month);
GRANT SELECT ON public.mp_transactions_ledger TO authenticated;
GRANT ALL ON public.mp_transactions_ledger TO service_role;
ALTER TABLE public.mp_transactions_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_ledger read by order parties" ON public.mp_transactions_ledger FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mp_suppliers s WHERE s.id = supplier_id AND public.mp_user_in_company(auth.uid(), s.company_id))
  OR EXISTS (SELECT 1 FROM public.mp_buyers b WHERE b.id = buyer_id AND public.mp_user_in_company(auth.uid(), b.company_id))
);
