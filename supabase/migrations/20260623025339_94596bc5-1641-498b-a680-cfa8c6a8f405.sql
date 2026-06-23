
CREATE TABLE public.riomed_pos_terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  location text,
  currency text NOT NULL DEFAULT 'BOB',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE TABLE public.riomed_pos_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  terminal_id uuid NOT NULL REFERENCES public.riomed_pos_terminals(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  opening_amount numeric(14,2) NOT NULL DEFAULT 0,
  closed_at timestamptz,
  closed_by uuid,
  closing_amount numeric(14,2),
  expected_amount numeric(14,2),
  difference numeric(14,2),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.riomed_pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.riomed_pos_sessions(id) ON DELETE CASCADE,
  terminal_id uuid NOT NULL REFERENCES public.riomed_pos_terminals(id),
  seller_id uuid,
  customer_name text,
  customer_doc text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BOB',
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','card','qr','transfer','mixed')),
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  change_amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','voided')),
  fiscal_invoice_id uuid,
  fiscal_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.riomed_pos_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.riomed_pos_sales(id) ON DELETE CASCADE,
  product_id uuid,
  description text NOT NULL,
  qty numeric(12,3) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL,
  total numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.riomed_pos_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.riomed_pos_sessions(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('cash_in','cash_out')),
  amount numeric(14,2) NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_pos_terminals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_pos_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_pos_sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_pos_sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_pos_movements TO authenticated;
GRANT ALL ON public.riomed_pos_terminals, public.riomed_pos_sessions, public.riomed_pos_sales, public.riomed_pos_sale_items, public.riomed_pos_movements TO service_role;

ALTER TABLE public.riomed_pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riomed_pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riomed_pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riomed_pos_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riomed_pos_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_terminals tenant" ON public.riomed_pos_terminals FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pos_sessions tenant" ON public.riomed_pos_sessions FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pos_sales tenant" ON public.riomed_pos_sales FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pos_sale_items tenant" ON public.riomed_pos_sale_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.riomed_pos_sales s WHERE s.id = sale_id AND (s.company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.riomed_pos_sales s WHERE s.id = sale_id AND (s.company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "pos_movements tenant" ON public.riomed_pos_movements FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_pos_terminals_updated BEFORE UPDATE ON public.riomed_pos_terminals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pos_sessions_updated BEFORE UPDATE ON public.riomed_pos_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pos_sales_updated BEFORE UPDATE ON public.riomed_pos_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, enabled)
VALUES ('clientes', 'operacoes', 'Operações', 30, 'riomed-pos', 'POS / Caixa Rio Med', 70, '/admin/clientes/riomed/pos', 'Calculator', 'Caixa físico em BOB com emissão fiscal Bolívia', true)
ON CONFLICT DO NOTHING;
