
CREATE TABLE public.sales_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.company_units(id) ON DELETE SET NULL,
  number BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','cancelled')),
  customer_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_doc TEXT,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT ALL ON public.sales_orders TO service_role;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sales_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.inv_products(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_order_items TO authenticated;
GRANT ALL ON public.sales_order_items TO service_role;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_items_order ON public.sales_order_items(order_id);

CREATE TABLE public.sales_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.fin_payment_methods(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.fin_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  fin_transaction_id UUID REFERENCES public.fin_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_payments TO authenticated;
GRANT ALL ON public.sales_payments TO service_role;
ALTER TABLE public.sales_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_payments_order ON public.sales_payments(order_id);

CREATE OR REPLACE FUNCTION public.tg_sales_orders_assign_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.number IS NULL OR NEW.number = 0 THEN
    SELECT COALESCE(MAX(number),0)+1 INTO NEW.number
      FROM public.sales_orders WHERE company_id = NEW.company_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tg_sales_orders_assign_number
BEFORE INSERT ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION public.tg_sales_orders_assign_number();

CREATE TRIGGER tg_sales_orders_updated_at
BEFORE UPDATE ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_sales_orders_apply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  it RECORD; pay RECORD; v_tx UUID; v_cat UUID;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status <> 'confirmed' AND NEW.status = 'confirmed')
     OR (TG_OP = 'INSERT' AND NEW.status = 'confirmed') THEN
    NEW.confirmed_at := COALESCE(NEW.confirmed_at, now());
    FOR it IN SELECT * FROM public.sales_order_items WHERE order_id = NEW.id LOOP
      IF it.product_id IS NOT NULL THEN
        INSERT INTO public.inv_movements (company_id, product_id, kind, quantity, unit_cost, reason, reference_type, reference_id, created_by)
        VALUES (NEW.company_id, it.product_id, 'out', it.quantity, NULL, 'Venda #'||NEW.number, 'sales_order', NEW.id, NEW.created_by);
      END IF;
    END LOOP;
    SELECT id INTO v_cat FROM public.fin_categories
      WHERE company_id = NEW.company_id AND kind = 'income' AND is_active = true ORDER BY created_at LIMIT 1;
    FOR pay IN SELECT * FROM public.sales_payments WHERE order_id = NEW.id LOOP
      INSERT INTO public.fin_transactions
        (company_id, unit_id, account_id, category_id, payment_method_id, kind, status,
         description, amount, net_amount, due_date, paid_at,
         reference_type, reference_id, customer_name, customer_doc, created_by)
      VALUES (NEW.company_id, NEW.unit_id, pay.account_id, v_cat, pay.payment_method_id,
              'income', 'paid', 'Venda #'||NEW.number, pay.amount, pay.amount, CURRENT_DATE, now(),
              'sales_order', NEW.id, NEW.customer_name, NEW.customer_doc, NEW.created_by)
      RETURNING id INTO v_tx;
      UPDATE public.sales_payments SET fin_transaction_id = v_tx WHERE id = pay.id;
    END LOOP;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
    FOR it IN SELECT * FROM public.sales_order_items WHERE order_id = NEW.id LOOP
      IF it.product_id IS NOT NULL THEN
        INSERT INTO public.inv_movements (company_id, product_id, kind, quantity, unit_cost, reason, reference_type, reference_id, created_by)
        VALUES (NEW.company_id, it.product_id, 'in', it.quantity, NULL, 'Estorno venda #'||NEW.number, 'sales_order_cancel', NEW.id, NEW.created_by);
      END IF;
    END LOOP;
    UPDATE public.fin_transactions SET status = 'refunded'
      WHERE reference_type = 'sales_order' AND reference_id = NEW.id AND status = 'paid';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_sales_orders_apply
BEFORE INSERT OR UPDATE OF status ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION public.tg_sales_orders_apply();

INSERT INTO public.permissions (code, module, description) VALUES
  ('sales.order.read',   'sales', 'Visualizar pedidos de venda'),
  ('sales.order.write',  'sales', 'Criar/editar pedidos de venda'),
  ('sales.order.cancel', 'sales', 'Cancelar pedidos de venda confirmados')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT ap.id, p.id
FROM public.profiles ap
CROSS JOIN public.permissions p
WHERE ap.is_system = true
  AND ap.slug IN ('gestor','admin','recepcao','operador','financeiro')
  AND p.code IN ('sales.order.read','sales.order.write','sales.order.cancel')
ON CONFLICT DO NOTHING;

CREATE POLICY "sales_orders_select" ON public.sales_orders FOR SELECT TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'sales.order.read'));
CREATE POLICY "sales_orders_insert" ON public.sales_orders FOR INSERT TO authenticated
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'sales.order.write'));
CREATE POLICY "sales_orders_update" ON public.sales_orders FOR UPDATE TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'sales.order.write'))
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'sales.order.write'));
CREATE POLICY "sales_orders_delete" ON public.sales_orders FOR DELETE TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'sales.order.cancel'));

CREATE POLICY "sales_items_select" ON public.sales_order_items FOR SELECT TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'sales.order.read'));
CREATE POLICY "sales_items_write" ON public.sales_order_items FOR ALL TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'sales.order.write'))
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'sales.order.write'));

CREATE POLICY "sales_pay_select" ON public.sales_payments FOR SELECT TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'sales.order.read'));
CREATE POLICY "sales_pay_write" ON public.sales_payments FOR ALL TO authenticated
  USING (public.user_has_permission(auth.uid(), company_id, 'sales.order.write'))
  WITH CHECK (public.user_has_permission(auth.uid(), company_id, 'sales.order.write'));
