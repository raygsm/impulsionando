CREATE TABLE public.fin_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income','expense')),
  color text DEFAULT '#64748b',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_categories TO authenticated;
GRANT ALL ON public.fin_categories TO service_role;
ALTER TABLE public.fin_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.fin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.company_units(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash','bank','card','wallet','other')),
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  current_balance numeric(14,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_accounts TO authenticated;
GRANT ALL ON public.fin_accounts TO service_role;
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.fin_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  provider text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_payment_methods TO authenticated;
GRANT ALL ON public.fin_payment_methods TO service_role;
ALTER TABLE public.fin_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.fin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.company_units(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.fin_accounts(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.fin_categories(id) ON DELETE SET NULL,
  payment_method_id uuid REFERENCES public.fin_payment_methods(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('income','expense')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','canceled','refunded')),
  description text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  fee numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) GENERATED ALWAYS AS (amount - fee) STORED,
  due_date date NOT NULL,
  paid_at timestamptz,
  reference_type text,
  reference_id uuid,
  customer_name text,
  customer_doc text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_transactions TO authenticated;
GRANT ALL ON public.fin_transactions TO service_role;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fin_tx_company_due ON public.fin_transactions(company_id, due_date);
CREATE INDEX idx_fin_tx_status ON public.fin_transactions(company_id, status);
CREATE INDEX idx_fin_tx_ref ON public.fin_transactions(reference_type, reference_id);

CREATE TABLE public.fin_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.fin_transactions(id) ON DELETE SET NULL,
  provider text NOT NULL,
  provider_payment_id text,
  status text NOT NULL DEFAULT 'pending',
  amount numeric(14,2) NOT NULL,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_payments TO authenticated;
GRANT ALL ON public.fin_payments TO service_role;
ALTER TABLE public.fin_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fin_payments_provider ON public.fin_payments(provider, provider_payment_id);

CREATE TABLE public.fin_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  beneficiary_user_id uuid,
  beneficiary_name text NOT NULL,
  reference_type text NOT NULL,
  reference_id uuid NOT NULL,
  base_amount numeric(14,2) NOT NULL,
  percentage numeric(6,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','canceled')),
  paid_at timestamptz,
  transaction_id uuid REFERENCES public.fin_transactions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_commissions TO authenticated;
GRANT ALL ON public.fin_commissions TO service_role;
ALTER TABLE public.fin_commissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_fin_categories_updated BEFORE UPDATE ON public.fin_categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_fin_accounts_updated BEFORE UPDATE ON public.fin_accounts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_fin_transactions_updated BEFORE UPDATE ON public.fin_transactions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_fin_payments_updated BEFORE UPDATE ON public.fin_payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_fin_commissions_updated BEFORE UPDATE ON public.fin_commissions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_fin_update_account_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta numeric(14,2) := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'paid' AND COALESCE(OLD.status,'') <> 'paid' AND NEW.account_id IS NOT NULL THEN
      delta := CASE WHEN NEW.kind = 'income' THEN NEW.net_amount ELSE -NEW.net_amount END;
      UPDATE public.fin_accounts SET current_balance = current_balance + delta WHERE id = NEW.account_id;
      IF NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
    ELSIF OLD.status = 'paid' AND NEW.status <> 'paid' AND OLD.account_id IS NOT NULL THEN
      delta := CASE WHEN OLD.kind = 'income' THEN -OLD.net_amount ELSE OLD.net_amount END;
      UPDATE public.fin_accounts SET current_balance = current_balance + delta WHERE id = OLD.account_id;
      NEW.paid_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_fin_tx_balance BEFORE UPDATE ON public.fin_transactions FOR EACH ROW EXECUTE FUNCTION public.tg_fin_update_account_balance();

CREATE POLICY "fin_categories_select" ON public.fin_categories FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "fin_categories_insert" ON public.fin_categories FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.category.write'));
CREATE POLICY "fin_categories_update" ON public.fin_categories FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.category.write'));
CREATE POLICY "fin_categories_delete" ON public.fin_categories FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.category.write'));

CREATE POLICY "fin_accounts_select" ON public.fin_accounts FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "fin_accounts_insert" ON public.fin_accounts FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.account.write'));
CREATE POLICY "fin_accounts_update" ON public.fin_accounts FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.account.write'));
CREATE POLICY "fin_accounts_delete" ON public.fin_accounts FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.account.write'));

CREATE POLICY "fin_pm_select" ON public.fin_payment_methods FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "fin_pm_insert" ON public.fin_payment_methods FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.method.write'));
CREATE POLICY "fin_pm_update" ON public.fin_payment_methods FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.method.write'));
CREATE POLICY "fin_pm_delete" ON public.fin_payment_methods FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.method.write'));

CREATE POLICY "fin_tx_select" ON public.fin_transactions FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'finance.transaction.read')));
CREATE POLICY "fin_tx_insert" ON public.fin_transactions FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.transaction.write'));
CREATE POLICY "fin_tx_update" ON public.fin_transactions FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.transaction.write'));
CREATE POLICY "fin_tx_delete" ON public.fin_transactions FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.transaction.delete'));

CREATE POLICY "fin_payments_select" ON public.fin_payments FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'finance.payment.read')));
CREATE POLICY "fin_payments_insert" ON public.fin_payments FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.payment.write'));
CREATE POLICY "fin_payments_update" ON public.fin_payments FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.payment.write'));

CREATE POLICY "fin_comm_select" ON public.fin_commissions FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR (public.user_belongs_to_company(auth.uid(), company_id) AND public.user_has_permission(auth.uid(), company_id, 'finance.commission.read')));
CREATE POLICY "fin_comm_insert" ON public.fin_commissions FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.commission.write'));
CREATE POLICY "fin_comm_update" ON public.fin_commissions FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.commission.write'));
CREATE POLICY "fin_comm_delete" ON public.fin_commissions FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.user_has_permission(auth.uid(), company_id, 'finance.commission.write'));

INSERT INTO public.permissions (code, module, description) VALUES
  ('finance.account.write','finance','Criar, editar e remover contas'),
  ('finance.category.write','finance','Criar, editar e remover categorias'),
  ('finance.method.write','finance','Criar, editar e remover métodos'),
  ('finance.transaction.read','finance','Visualizar contas a pagar e receber'),
  ('finance.transaction.write','finance','Lançar e quitar contas'),
  ('finance.transaction.delete','finance','Remover lançamentos'),
  ('finance.payment.read','finance','Visualizar pagamentos externos'),
  ('finance.payment.write','finance','Registrar pagamentos externos'),
  ('finance.commission.read','finance','Visualizar comissões'),
  ('finance.commission.write','finance','Criar, aprovar e pagar comissões')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE p.slug IN ('gestor-empresa','admin-impulsionando','super-admin-impulsionando','admin-unidade','financeiro')
  AND perm.code LIKE 'finance.%'
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE p.slug IN ('recepcao','operador') AND perm.code IN ('finance.transaction.read','finance.transaction.write')
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE p.slug = 'auditor' AND perm.code IN ('finance.transaction.read','finance.payment.read','finance.commission.read')
ON CONFLICT DO NOTHING;

INSERT INTO public.modules (slug, name, description, icon, category, is_active)
VALUES ('financeiro','Financeiro','Contas a pagar/receber, pagamentos e comissões','wallet','operacional', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.company_modules (company_id, module_id, is_enabled)
SELECT c.id, m.id, true FROM public.companies c CROSS JOIN public.modules m
WHERE m.slug = 'financeiro' AND c.is_master = false
ON CONFLICT (company_id, module_id) DO UPDATE SET is_enabled = true;

CREATE OR REPLACE FUNCTION public.tg_bootstrap_company_finance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_master THEN RETURN NEW; END IF;
  INSERT INTO public.fin_accounts (company_id, name, type) VALUES (NEW.id,'Caixa','cash') ON CONFLICT DO NOTHING;
  INSERT INTO public.fin_payment_methods (company_id, name, code) VALUES
    (NEW.id,'Dinheiro','cash'),(NEW.id,'Pix','pix'),(NEW.id,'Cartão de Crédito','credit_card'),
    (NEW.id,'Cartão de Débito','debit_card'),(NEW.id,'Boleto','boleto')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.fin_categories (company_id, name, kind, color) VALUES
    (NEW.id,'Vendas','income','#10b981'),(NEW.id,'Serviços','income','#3b82f6'),
    (NEW.id,'Outras receitas','income','#22c55e'),(NEW.id,'Fornecedores','expense','#ef4444'),
    (NEW.id,'Folha de pagamento','expense','#f97316'),(NEW.id,'Impostos','expense','#a855f7'),
    (NEW.id,'Despesas operacionais','expense','#64748b')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_bootstrap_company_finance ON public.companies;
CREATE TRIGGER trg_bootstrap_company_finance AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.tg_bootstrap_company_finance();

DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN SELECT id FROM public.companies WHERE is_master = false LOOP
    INSERT INTO public.fin_accounts (company_id, name, type) VALUES (c.id,'Caixa','cash') ON CONFLICT DO NOTHING;
    INSERT INTO public.fin_payment_methods (company_id, name, code) VALUES
      (c.id,'Dinheiro','cash'),(c.id,'Pix','pix'),(c.id,'Cartão de Crédito','credit_card'),
      (c.id,'Cartão de Débito','debit_card'),(c.id,'Boleto','boleto')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.fin_categories (company_id, name, kind, color) VALUES
      (c.id,'Vendas','income','#10b981'),(c.id,'Serviços','income','#3b82f6'),
      (c.id,'Outras receitas','income','#22c55e'),(c.id,'Fornecedores','expense','#ef4444'),
      (c.id,'Folha de pagamento','expense','#f97316'),(c.id,'Impostos','expense','#a855f7'),
      (c.id,'Despesas operacionais','expense','#64748b')
    ON CONFLICT DO NOTHING;
  END LOOP;
END$$;