
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
  cycle_interval INTERVAL;
BEGIN
  FOR c IN
    SELECT bc.*, bp.cycle AS plan_cycle
    FROM public.billing_contracts bc
    JOIN public.billing_plans bp ON bp.id = bc.plan_id
    WHERE bc.status IN ('active','suspended')
      AND bc.next_due_date <= today + interval '7 days'
  LOOP
    cycle_interval := CASE c.plan_cycle
      WHEN 'quarterly' THEN interval '3 months'
      WHEN 'yearly'    THEN interval '12 months'
      ELSE                  interval '1 month'
    END;

    INSERT INTO public.billing_invoices(contract_id, company_id, period_start, period_end, due_date, amount, pix_key, pix_copy_paste)
    SELECT c.id, c.company_id,
           (c.next_due_date - cycle_interval)::date,
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
DECLARE
  inv RECORD; c RECORD; v_tx UUID; v_cat UUID; v_acc UUID; v_pm UUID;
  cycle_interval INTERVAL;
BEGIN
  SELECT * INTO inv FROM public.billing_invoices WHERE id = _invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura não encontrada'; END IF;
  IF inv.status = 'paid' THEN RETURN inv.id; END IF;

  SELECT bc.*, bp.cycle AS plan_cycle
    INTO c
    FROM public.billing_contracts bc
    JOIN public.billing_plans bp ON bp.id = bc.plan_id
   WHERE bc.id = inv.contract_id;

  cycle_interval := CASE c.plan_cycle
    WHEN 'quarterly' THEN interval '3 months'
    WHEN 'yearly'    THEN interval '12 months'
    ELSE                  interval '1 month'
  END;

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
        next_due_date = (inv.due_date + cycle_interval)::date
    WHERE id = c.id;

  UPDATE public.billing_suspensions
    SET reactivated_at = now(), reactivated_reason = 'Pagamento identificado fatura ' || inv.id
    WHERE contract_id = c.id AND reactivated_at IS NULL;

  UPDATE public.company_modules SET is_enabled = true WHERE company_id = c.company_id;

  RETURN inv.id;
END $$;
