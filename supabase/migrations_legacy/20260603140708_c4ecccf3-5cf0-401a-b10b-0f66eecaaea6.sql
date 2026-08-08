CREATE TABLE public.inv_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inv_categories TO authenticated;
GRANT ALL ON public.inv_categories TO service_role;
ALTER TABLE public.inv_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_categories_select" ON public.inv_categories FOR SELECT TO authenticated
USING (public.user_has_permission(auth.uid(), company_id, 'inventory.category.read'));
CREATE POLICY "inv_categories_write" ON public.inv_categories FOR ALL TO authenticated
USING (public.user_has_permission(auth.uid(), company_id, 'inventory.category.write'))
WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'inventory.category.write'));

CREATE TABLE public.inv_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, legal_name TEXT, document TEXT, email TEXT, phone TEXT, notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inv_suppliers TO authenticated;
GRANT ALL ON public.inv_suppliers TO service_role;
ALTER TABLE public.inv_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_suppliers_select" ON public.inv_suppliers FOR SELECT TO authenticated
USING (public.user_has_permission(auth.uid(), company_id, 'inventory.supplier.read'));
CREATE POLICY "inv_suppliers_write" ON public.inv_suppliers FOR ALL TO authenticated
USING (public.user_has_permission(auth.uid(), company_id, 'inventory.supplier.write'))
WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'inventory.supplier.write'));

CREATE TABLE public.inv_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.inv_categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.inv_suppliers(id) ON DELETE SET NULL,
  sku TEXT, barcode TEXT, name TEXT NOT NULL, description TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0, sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
  min_stock NUMERIC(14,3) NOT NULL DEFAULT 0, max_stock NUMERIC(14,3),
  track_stock BOOLEAN NOT NULL DEFAULT true, allow_negative BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, sku)
);
CREATE INDEX idx_inv_products_company ON public.inv_products(company_id);
CREATE INDEX idx_inv_products_category ON public.inv_products(category_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inv_products TO authenticated;
GRANT ALL ON public.inv_products TO service_role;
ALTER TABLE public.inv_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_products_select" ON public.inv_products FOR SELECT TO authenticated
USING (public.user_has_permission(auth.uid(), company_id, 'inventory.product.read'));
CREATE POLICY "inv_products_write" ON public.inv_products FOR ALL TO authenticated
USING (public.user_has_permission(auth.uid(), company_id, 'inventory.product.write'))
WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'inventory.product.write'));

CREATE TABLE public.inv_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inv_products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('in','out','adjust')),
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(14,2), reason TEXT, reference TEXT, notes TEXT,
  performed_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_movements_product ON public.inv_movements(product_id);
CREATE INDEX idx_inv_movements_company_date ON public.inv_movements(company_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inv_movements TO authenticated;
GRANT ALL ON public.inv_movements TO service_role;
ALTER TABLE public.inv_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_movements_select" ON public.inv_movements FOR SELECT TO authenticated
USING (public.user_has_permission(auth.uid(), company_id, 'inventory.movement.read'));
CREATE POLICY "inv_movements_write" ON public.inv_movements FOR ALL TO authenticated
USING (public.user_has_permission(auth.uid(), company_id, 'inventory.movement.write'))
WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'inventory.movement.write'));

CREATE OR REPLACE FUNCTION public.tg_inv_apply_movement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_product RECORD; v_delta NUMERIC(14,3); v_new NUMERIC(14,3);
BEGIN
  SELECT id, current_stock, track_stock, allow_negative INTO v_product
  FROM public.inv_products WHERE id = NEW.product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
  IF NOT v_product.track_stock THEN RETURN NEW; END IF;
  v_delta := CASE NEW.kind WHEN 'in' THEN NEW.quantity WHEN 'out' THEN -NEW.quantity
    WHEN 'adjust' THEN NEW.quantity ELSE 0 END;
  v_new := v_product.current_stock + v_delta;
  IF v_new < 0 AND NOT v_product.allow_negative THEN
    RAISE EXCEPTION 'Estoque insuficiente (saldo %, solicitado %)', v_product.current_stock, NEW.quantity;
  END IF;
  UPDATE public.inv_products SET current_stock = v_new, updated_at = now() WHERE id = NEW.product_id;
  RETURN NEW;
END $$;
CREATE TRIGGER tg_inv_movements_apply AFTER INSERT ON public.inv_movements
FOR EACH ROW EXECUTE FUNCTION public.tg_inv_apply_movement();

CREATE TRIGGER tg_inv_categories_updated BEFORE UPDATE ON public.inv_categories
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_inv_suppliers_updated BEFORE UPDATE ON public.inv_suppliers
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_inv_products_updated BEFORE UPDATE ON public.inv_products
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.permissions (code, module, description) VALUES
  ('inventory.category.read','inventory','Visualizar categorias de produto'),
  ('inventory.category.write','inventory','Gerenciar categorias de produto'),
  ('inventory.supplier.read','inventory','Visualizar fornecedores'),
  ('inventory.supplier.write','inventory','Gerenciar fornecedores'),
  ('inventory.product.read','inventory','Visualizar produtos'),
  ('inventory.product.write','inventory','Gerenciar produtos'),
  ('inventory.movement.read','inventory','Visualizar movimentações de estoque'),
  ('inventory.movement.write','inventory','Registrar movimentações de estoque')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p
JOIN public.permissions perm ON perm.code LIKE 'inventory.%'
WHERE p.slug IN ('gestor-empresa','admin-unidade','financeiro')
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p
JOIN public.permissions perm ON perm.code IN (
  'inventory.product.read','inventory.movement.read','inventory.movement.write',
  'inventory.category.read','inventory.supplier.read')
WHERE p.slug = 'operador'
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p
JOIN public.permissions perm ON perm.code IN ('inventory.product.read','inventory.category.read')
WHERE p.slug = 'recepcao'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.tg_bootstrap_company_inventory()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_master THEN RETURN NEW; END IF;
  INSERT INTO public.inv_categories (company_id, name, description)
  VALUES (NEW.id, 'Geral', 'Categoria padrão') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER tg_companies_bootstrap_inventory AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_bootstrap_company_inventory();

INSERT INTO public.inv_categories (company_id, name, description)
SELECT id, 'Geral', 'Categoria padrão' FROM public.companies WHERE is_master = false
ON CONFLICT DO NOTHING;
