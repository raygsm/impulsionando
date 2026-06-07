
-- ============================================================
-- BILLING MODULE — Recurring billing, dunning & auto-suspension
-- ============================================================

CREATE TABLE public.billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  setup_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
  recurring_amount NUMERIC(14,2) NOT NULL,
  cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (cycle IN ('monthly','quarterly','yearly')),
  due_day SMALLINT NOT NULL DEFAULT 5 CHECK (due_day BETWEEN 1 AND 28),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_plans TO authenticated;
GRANT ALL ON public.billing_plans TO service_role;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read active plans"
  ON public.billing_plans FOR SELECT TO authenticated USING (is_active = true OR public.is_impulsionando_staff(auth.uid()));
CREATE POLICY "Only staff manages plans"
  ON public.billing_plans FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TABLE public.billing_dunning_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  suspend_offset_days INT NOT NULL DEFAULT 1,
  suspend_time TIME NOT NULL DEFAULT '00:01',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_dunning_policy TO authenticated;
GRANT ALL ON public.billing_dunning_policy TO service_role;
ALTER TABLE public.billing_dunning_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read dunning policy"
  ON public.billing_dunning_policy FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage dunning policy"
  ON public.billing_dunning_policy FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TABLE public.billing_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.billing_plans(id) ON DELETE RESTRICT,
  policy_id UUID REFERENCES public.billing_dunning_policy(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  due_day SMALLINT NOT NULL DEFAULT 5 CHECK (due_day BETWEEN 1 AND 28),
  next_due_date DATE NOT NULL,
  recurring_amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','cancelled')),
  setup_paid_at TIMESTAMPTZ,
  setup_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  nfe_issued_at TIMESTAMPTZ,
  last_paid_at TIMESTAMPTZ,
  notes TEXT,
  pix_key TEXT,
  pix_copy_paste TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);
GRANT SELECT ON public.billing_contracts TO authenticated;
GRANT ALL ON public.billing_contracts TO service_role;
ALTER TABLE public.billing_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company can read own contract"
  ON public.billing_contracts FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Staff manage contracts"
  ON public.billing_contracts FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TABLE public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.billing_contracts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','overdue','cancelled')),
  paid_at TIMESTAMPTZ,
  pix_key TEXT,
  pix_copy_paste TEXT,
  pix_qr_url TEXT,
  fin_transaction_id UUID REFERENCES public.fin_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_id, due_date)
);
GRANT SELECT ON public.billing_invoices TO authenticated;
GRANT ALL ON public.billing_invoices TO service_role;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company reads own invoices"
  ON public.billing_invoices FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Staff manage invoices"
  ON public.billing_invoices FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TABLE public.billing_dunning_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','email','in_app')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  detail TEXT,
  UNIQUE (invoice_id, step, channel)
);
GRANT SELECT ON public.billing_dunning_runs TO authenticated;
GRANT ALL ON public.billing_dunning_runs TO service_role;
ALTER TABLE public.billing_dunning_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read dunning runs"
  ON public.billing_dunning_runs FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())
         OR EXISTS (SELECT 1 FROM public.billing_invoices i WHERE i.id = invoice_id
                    AND public.user_belongs_to_company(auth.uid(), i.company_id)));

CREATE TABLE public.billing_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.billing_contracts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  suspended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  reactivated_at TIMESTAMPTZ,
  reactivated_reason TEXT
);
GRANT SELECT ON public.billing_suspensions TO authenticated;
GRANT ALL ON public.billing_suspensions TO service_role;
ALTER TABLE public.billing_suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read suspensions"
  ON public.billing_suspensions FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

CREATE TRIGGER tg_billing_plans_upd BEFORE UPDATE ON public.billing_plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_billing_dunning_upd BEFORE UPDATE ON public.billing_dunning_policy
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_billing_contracts_upd BEFORE UPDATE ON public.billing_contracts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_billing_invoices_upd BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.billing_check_company_status(_company UUID)
RETURNS TABLE (status TEXT, contract_id UUID, next_due_date DATE, overdue_invoice_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.status, c.id, c.next_due_date,
         (SELECT id FROM public.billing_invoices i
          WHERE i.contract_id = c.id AND i.status IN ('open','overdue')
          ORDER BY i.due_date LIMIT 1)
  FROM public.billing_contracts c
  WHERE c.company_id = _company
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.billing_run_cycle()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  c RECORD; inv RECORD; pol RECORD; v_step JSONB;
  channels TEXT[]; ch TEXT; tplcode TEXT; offs INT;
  today DATE := CURRENT_DATE;
  generated INT := 0; sent INT := 0; suspended INT := 0;
  owner_user UUID; owner_email TEXT; owner_phone TEXT; owner_name TEXT;
  cust_payload JSONB;
BEGIN
  FOR c IN
    SELECT bc.*
    FROM public.billing_contracts bc
    WHERE bc.status IN ('active','suspended')
      AND bc.next_due_date <= today + interval '7 days'
  LOOP
    INSERT INTO public.billing_invoices(contract_id, company_id, period_start, period_end, due_date, amount, pix_key, pix_copy_paste)
    SELECT c.id, c.company_id,
           (c.next_due_date - interval '1 month')::date,
           (c.next_due_date - interval '1 day')::date,
           c.next_due_date, c.recurring_amount, c.pix_key, c.pix_copy_paste
    WHERE NOT EXISTS (SELECT 1 FROM public.billing_invoices i
                      WHERE i.contract_id = c.id AND i.due_date = c.next_due_date);
    generated := generated + 1;
  END LOOP;

  FOR inv IN
    SELECT i.*, c.policy_id, c.status AS contract_status, c.company_id AS comp_id
    FROM public.billing_invoices i
    JOIN public.billing_contracts c ON c.id = i.contract_id
    WHERE i.status IN ('open','overdue')
  LOOP
    SELECT * INTO pol FROM public.billing_dunning_policy
    WHERE id = COALESCE(inv.policy_id, (SELECT id FROM public.billing_dunning_policy WHERE is_default = true LIMIT 1));
    IF NOT FOUND THEN CONTINUE; END IF;

    SELECT user_id, email, display_name INTO owner_user, owner_email, owner_name
    FROM public.user_profiles
    WHERE company_id = inv.comp_id AND is_active = true
    ORDER BY created_at LIMIT 1;

    cust_payload := jsonb_build_object(
      'invoice_amount', to_char(inv.amount, 'FM999G990D00'),
      'invoice_due_date', to_char(inv.due_date, 'DD/MM/YYYY'),
      'pix_key', COALESCE(inv.pix_key,''),
      'pix_copy_paste', COALESCE(inv.pix_copy_paste,''),
      'company_name', (SELECT name FROM public.companies WHERE id = inv.comp_id)
    );

    FOR v_step IN SELECT value FROM jsonb_array_elements(pol.steps) LOOP
      offs := (v_step->>'offset_days')::int;
      IF (inv.due_date + (offs || ' days')::interval)::date = today THEN
        tplcode := v_step->>'template_code';
        channels := ARRAY(SELECT jsonb_array_elements_text(v_step->'channels'));
        FOREACH ch IN ARRAY channels LOOP
          IF NOT EXISTS (
            SELECT 1 FROM public.billing_dunning_runs r
            WHERE r.invoice_id = inv.id AND r.step = (v_step->>'code') AND r.channel = ch
          ) THEN
            PERFORM public.enqueue_message(
              tplcode, inv.comp_id, owner_user, owner_email, owner_phone, owner_name,
              cust_payload, ARRAY[ch]::text[], 'billing_invoice', inv.id::text
            );
            INSERT INTO public.billing_dunning_runs(invoice_id, step, channel)
            VALUES (inv.id, v_step->>'code', ch);
            sent := sent + 1;
          END IF;
        END LOOP;
      END IF;
    END LOOP;

    IF today > inv.due_date AND inv.status <> 'overdue' THEN
      UPDATE public.billing_invoices SET status = 'overdue' WHERE id = inv.id;
    END IF;

    IF today >= (inv.due_date + (pol.suspend_offset_days || ' days')::interval)::date
       AND inv.contract_status = 'active' THEN
      UPDATE public.billing_contracts SET status = 'suspended' WHERE id = inv.contract_id;
      INSERT INTO public.billing_suspensions(contract_id, company_id, invoice_id, reason)
      VALUES (inv.contract_id, inv.comp_id, inv.id, 'Fatura vencida ' || inv.due_date);
      UPDATE public.company_modules SET is_enabled = false WHERE company_id = inv.comp_id;
      suspended := suspended + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('generated', generated, 'sent', sent, 'suspended', suspended, 'at', now());
END $$;

CREATE OR REPLACE FUNCTION public.billing_mark_paid(_invoice_id UUID, _paid_at TIMESTAMPTZ DEFAULT now())
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE inv RECORD; c RECORD; v_tx UUID; v_cat UUID; v_acc UUID; v_pm UUID;
BEGIN
  SELECT * INTO inv FROM public.billing_invoices WHERE id = _invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura não encontrada'; END IF;
  IF inv.status = 'paid' THEN RETURN inv.id; END IF;

  SELECT * INTO c FROM public.billing_contracts WHERE id = inv.contract_id;

  SELECT id INTO v_cat FROM public.fin_categories
   WHERE company_id = public.master_company_id() AND kind='income' AND name='Vendas' LIMIT 1;
  SELECT id INTO v_acc FROM public.fin_accounts WHERE company_id = public.master_company_id() ORDER BY created_at LIMIT 1;
  SELECT id INTO v_pm  FROM public.fin_payment_methods WHERE company_id = public.master_company_id() AND code='pix' LIMIT 1;

  IF v_cat IS NOT NULL AND v_acc IS NOT NULL THEN
    INSERT INTO public.fin_transactions(
      company_id, account_id, category_id, payment_method_id, kind, status,
      description, amount, net_amount, due_date, paid_at,
      reference_type, reference_id, customer_name
    ) VALUES (
      public.master_company_id(), v_acc, v_cat, v_pm, 'income', 'paid',
      'Mensalidade ' || to_char(inv.due_date,'MM/YYYY'), inv.amount, inv.amount,
      inv.due_date, _paid_at, 'billing_invoice', inv.id::text,
      (SELECT name FROM public.companies WHERE id = inv.company_id)
    ) RETURNING id INTO v_tx;
  END IF;

  UPDATE public.billing_invoices
    SET status='paid', paid_at=_paid_at, fin_transaction_id=v_tx
    WHERE id = inv.id;

  UPDATE public.billing_contracts
    SET status='active',
        last_paid_at=_paid_at,
        next_due_date = (inv.due_date + interval '1 month')::date
    WHERE id = c.id;

  UPDATE public.billing_suspensions
    SET reactivated_at = now(), reactivated_reason = 'Pagamento identificado fatura ' || inv.id
    WHERE contract_id = c.id AND reactivated_at IS NULL;

  UPDATE public.company_modules SET is_enabled = true WHERE company_id = c.company_id;

  RETURN inv.id;
END $$;

GRANT EXECUTE ON FUNCTION public.billing_run_cycle() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.billing_mark_paid(UUID, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.billing_check_company_status(UUID) TO authenticated, service_role;

-- Seeds
INSERT INTO public.billing_dunning_policy (name, is_default, steps, suspend_offset_days, suspend_time)
VALUES (
  'Régua Padrão Impulsionando',
  true,
  '[
    {"code":"d_minus_7","offset_days":-7,"channels":["whatsapp","email"],"template_code":"billing_reminder_7d"},
    {"code":"d_minus_1","offset_days":-1,"channels":["whatsapp","email"],"template_code":"billing_reminder_1d"},
    {"code":"d_zero","offset_days":0,"channels":["whatsapp","email"],"template_code":"billing_due_today"},
    {"code":"d_plus_1","offset_days":1,"channels":["whatsapp","email"],"template_code":"billing_overdue"}
  ]'::jsonb,
  1, '00:01'
);

INSERT INTO public.billing_plans (code, name, description, setup_fee, recurring_amount, cycle, due_day, is_default)
VALUES ('licenca-mensal', 'Mensal — Licença de Uso', 'Plano mensal de licença de uso do sistema Impulsionando', 307.00, 99.90, 'monthly', 5, true);

INSERT INTO public.message_templates(event_code, channel, subject, body, is_active, company_id) VALUES
('billing_reminder_7d','whatsapp',NULL,
 'Olá! 👋 Sua mensalidade da Impulsionando vence em 7 dias ({{invoice_due_date}}) no valor de R$ {{invoice_amount}}. PIX (copia e cola): {{pix_copy_paste}}. Chave PIX: {{pix_key}}.',true,NULL),
('billing_reminder_7d','email','Sua mensalidade vence em 7 dias',
 'Olá, sua mensalidade Impulsionando ({{company_name}}) vence em {{invoice_due_date}} — R$ {{invoice_amount}}. PIX copia e cola: {{pix_copy_paste}}. Chave PIX: {{pix_key}}.',true,NULL),
('billing_reminder_1d','whatsapp',NULL,
 'Oi! ⏰ Sua mensalidade vence amanhã ({{invoice_due_date}}) — R$ {{invoice_amount}}. PIX: {{pix_copy_paste}}. Chave: {{pix_key}}.',true,NULL),
('billing_reminder_1d','email','Sua mensalidade vence amanhã',
 'Olá, sua mensalidade vence amanhã ({{invoice_due_date}}) — R$ {{invoice_amount}}. PIX copia e cola: {{pix_copy_paste}}. Chave: {{pix_key}}.',true,NULL),
('billing_due_today','whatsapp',NULL,
 'Hoje é o dia! 📅 Sua mensalidade Impulsionando vence hoje no valor de R$ {{invoice_amount}}. PIX: {{pix_copy_paste}}. Chave: {{pix_key}}.',true,NULL),
('billing_due_today','email','Sua mensalidade vence hoje',
 'Olá, sua mensalidade vence hoje no valor de R$ {{invoice_amount}}. PIX copia e cola: {{pix_copy_paste}}. Chave PIX: {{pix_key}}.',true,NULL),
('billing_overdue','whatsapp',NULL,
 '⚠️ Sua mensalidade venceu em {{invoice_due_date}} e ainda não identificamos o pagamento. Valor: R$ {{invoice_amount}}. Regularize pelo PIX para evitar suspensão. PIX: {{pix_copy_paste}}. Chave: {{pix_key}}.',true,NULL),
('billing_overdue','email','Pagamento não identificado',
 'Olá, sua mensalidade venceu em {{invoice_due_date}} (R$ {{invoice_amount}}) e ainda não identificamos o pagamento. Solicitamos a regularização imediata. PIX copia e cola: {{pix_copy_paste}}. Chave: {{pix_key}}.',true,NULL),
('billing_suspended','email','Acesso temporariamente suspenso',
 'Olá, identificamos pendência financeira no contrato da Impulsionando referente a {{invoice_due_date}}. O acesso foi temporariamente suspenso. Após a confirmação do pagamento via PIX, o acesso é reativado automaticamente. PIX: {{pix_copy_paste}}.',true,NULL),
('billing_reactivated','email','Tudo certo — acesso reativado',
 'Olá, identificamos seu pagamento. O acesso foi reativado automaticamente. Obrigado por seguir com a gente!',true,NULL);
