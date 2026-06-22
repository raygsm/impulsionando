
-- Contas a Receber
CREATE TABLE public.riomed_ar_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  hospital_id uuid REFERENCES public.riomed_hospital_accounts(id) ON DELETE SET NULL,
  number text,
  description text,
  amount numeric(14,2) NOT NULL,
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BOB',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  paid_at timestamptz,
  payment_method text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','paid','overdue','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_ar_invoices TO authenticated;
GRANT ALL ON public.riomed_ar_invoices TO service_role;
ALTER TABLE public.riomed_ar_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY rar_admin_all ON public.riomed_ar_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_ar_invoices.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_ar_invoices.company_id));
CREATE INDEX rar_status_idx ON public.riomed_ar_invoices(company_id, status, due_date);
CREATE TRIGGER trg_rar_updated_at BEFORE UPDATE ON public.riomed_ar_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contas a Pagar
CREATE TABLE public.riomed_ap_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.riomed_suppliers(id) ON DELETE SET NULL,
  category text,
  number text,
  description text NOT NULL,
  amount numeric(14,2) NOT NULL,
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BOB',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  paid_at timestamptz,
  payment_method text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','paid','overdue','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_ap_invoices TO authenticated;
GRANT ALL ON public.riomed_ap_invoices TO service_role;
ALTER TABLE public.riomed_ap_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY rap_admin_all ON public.riomed_ap_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_ap_invoices.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_ap_invoices.company_id));
CREATE INDEX rap_status_idx ON public.riomed_ap_invoices(company_id, status, due_date);
CREATE TRIGGER trg_rap_updated_at BEFORE UPDATE ON public.riomed_ap_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Regras de comissão (por usuário/vendedor, % padrão)
CREATE TABLE public.riomed_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'default' CHECK (scope IN ('default','user','category')),
  category text,
  rate_pct numeric(6,3) NOT NULL DEFAULT 3.0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_commission_rules TO authenticated;
GRANT ALL ON public.riomed_commission_rules TO service_role;
ALTER TABLE public.riomed_commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rcr_admin_all ON public.riomed_commission_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_commission_rules.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_commission_rules.company_id));
CREATE TRIGGER trg_rcr_updated_at BEFORE UPDATE ON public.riomed_commission_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comissões apuradas
CREATE TABLE public.riomed_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  base_amount numeric(14,2) NOT NULL,
  rate_pct numeric(6,3) NOT NULL,
  amount numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'accrued' CHECK (status IN ('accrued','approved','paid','cancelled')),
  period text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, order_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_commissions TO authenticated;
GRANT ALL ON public.riomed_commissions TO service_role;
ALTER TABLE public.riomed_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rcom_admin_all ON public.riomed_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_commissions.company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id=auth.uid() AND up.company_id=riomed_commissions.company_id));
CREATE TRIGGER trg_rcom_updated_at BEFORE UPDATE ON public.riomed_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função: gerar AR a partir de pedido confirmado
CREATE OR REPLACE FUNCTION public.riomed_ar_from_order(p_order_id uuid, p_due_days int DEFAULT 30)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.sales_orders; v_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.sales_orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF EXISTS (SELECT 1 FROM public.riomed_ar_invoices WHERE order_id = p_order_id) THEN
    SELECT id INTO v_id FROM public.riomed_ar_invoices WHERE order_id = p_order_id LIMIT 1;
    RETURN v_id;
  END IF;
  INSERT INTO public.riomed_ar_invoices (company_id, order_id, customer_id, number, description, amount, due_date)
  VALUES (v_order.company_id, v_order.id, v_order.customer_id,
          'AR-' || substr(v_order.id::text, 1, 8),
          COALESCE(v_order.notes, 'Pedido ' || v_order.id::text),
          COALESCE(v_order.total_amount, 0),
          (CURRENT_DATE + p_due_days))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.riomed_ar_from_order(uuid, int) TO authenticated;

-- Função: apurar comissão de um pedido
CREATE OR REPLACE FUNCTION public.riomed_accrue_commission(p_order_id uuid, p_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.sales_orders; v_rate numeric; v_amount numeric; v_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.sales_orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  SELECT rate_pct INTO v_rate FROM public.riomed_commission_rules
   WHERE company_id = v_order.company_id AND active AND (user_id = p_user_id OR scope = 'default')
   ORDER BY (user_id = p_user_id) DESC LIMIT 1;
  v_rate := COALESCE(v_rate, 3.0);
  v_amount := ROUND(COALESCE(v_order.total_amount,0) * v_rate / 100.0, 2);
  INSERT INTO public.riomed_commissions (company_id, user_id, order_id, base_amount, rate_pct, amount, period)
  VALUES (v_order.company_id, p_user_id, v_order.id, COALESCE(v_order.total_amount,0), v_rate, v_amount,
          to_char(now(),'YYYY-MM'))
  ON CONFLICT (company_id, order_id, user_id) DO UPDATE
    SET base_amount = EXCLUDED.base_amount, rate_pct = EXCLUDED.rate_pct, amount = EXCLUDED.amount
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.riomed_accrue_commission(uuid, uuid) TO authenticated;

-- Atualizar overdue automaticamente quando consultado
CREATE OR REPLACE FUNCTION public.riomed_refresh_overdue(p_company_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.riomed_ar_invoices SET status = 'overdue'
   WHERE company_id = p_company_id AND status IN ('open','partial') AND due_date < CURRENT_DATE;
  UPDATE public.riomed_ap_invoices SET status = 'overdue'
   WHERE company_id = p_company_id AND status IN ('open','partial') AND due_date < CURRENT_DATE;
$$;
GRANT EXECUTE ON FUNCTION public.riomed_refresh_overdue(uuid) TO authenticated;
