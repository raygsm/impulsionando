
DO $mig$
DECLARE
  v_plan_id uuid;
  v_niche RECORD;
  v_company_id uuid;
  v_contract_id uuid;
  v_today date := CURRENT_DATE;
  v_due date;
  v_due_day int;
  v_setup numeric := 0;
  v_recurring numeric := 99.90;
BEGIN
  SELECT id, setup_fee, recurring_amount, due_day
    INTO v_plan_id, v_setup, v_recurring, v_due_day
  FROM public.billing_plans
  WHERE is_active = true
  ORDER BY is_default DESC, recurring_amount ASC
  LIMIT 1;

  IF v_plan_id IS NULL THEN RETURN; END IF;

  v_due_day := LEAST(COALESCE(v_due_day, 10), 28);
  v_due := (date_trunc('month', v_today) + interval '1 month' + (v_due_day - 1) * interval '1 day')::date;

  FOR v_niche IN
    SELECT id, slug, name FROM public.niches WHERE is_active = true ORDER BY name
  LOOP
    SELECT id INTO v_company_id
    FROM public.companies
    WHERE is_demo = true AND niche_id = v_niche.id
    LIMIT 1;

    IF v_company_id IS NULL THEN
      INSERT INTO public.companies (
        name, trade_name, legal_name, email,
        is_demo, is_active, is_master, status, niche_id, segment,
        owner_name, primary_color, secondary_color, environment
      ) VALUES (
        'Demo ' || v_niche.name,
        'Demo ' || v_niche.name,
        'Demonstração Impulsionando — ' || v_niche.name,
        'demo+' || v_niche.slug || '@impulsionando.com.br',
        true, true, false, 'active', v_niche.id, v_niche.slug,
        'Demonstração',
        '#0F2A57', '#F37021', 'demo'
      ) RETURNING id INTO v_company_id;
    END IF;

    SELECT id INTO v_contract_id
    FROM public.billing_contracts
    WHERE company_id = v_company_id
    LIMIT 1;

    IF v_contract_id IS NULL THEN
      INSERT INTO public.billing_contracts (
        company_id, plan_id, start_date, due_day, next_due_date,
        recurring_amount, setup_amount, status, notes
      ) VALUES (
        v_company_id, v_plan_id, v_today, v_due_day::smallint,
        v_due, v_recurring, COALESCE(v_setup,0), 'active',
        'Contrato de demonstração — ' || v_niche.name
      ) RETURNING id INTO v_contract_id;
    END IF;

    INSERT INTO public.billing_invoices (
      contract_id, company_id, period_start, period_end, due_date, amount, status
    )
    SELECT v_contract_id, v_company_id, v_today, v_due, v_due,
           v_recurring + COALESCE(v_setup,0), 'open'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.billing_invoices
      WHERE contract_id = v_contract_id AND due_date = v_due
    );
  END LOOP;
END
$mig$;
