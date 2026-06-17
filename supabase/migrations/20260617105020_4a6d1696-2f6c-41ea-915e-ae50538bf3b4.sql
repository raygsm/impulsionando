
DO $$
DECLARE
  v_plat uuid := '1dcc8e53-1478-4440-8ca0-8f0b5ad3b15f';
  v_pat  uuid := 'e334223e-9fa4-46d3-b119-d4359fd953bc';
  v_contract uuid;
BEGIN
  UPDATE public.companies
     SET legal_name = COALESCE(legal_name, 'Patrícia Lenine Psicologia'),
         owner_name = COALESCE(owner_name, 'Patrícia Lenine'),
         segment = COALESCE(segment, 'saude'),
         is_demo = false, status = 'active', is_active = true, updated_at = now()
   WHERE id = v_plat;

  UPDATE public.billing_contracts
     SET company_id = v_plat,
         setup_paid_at = '2026-06-10 12:00:00+00',
         start_date = '2026-06-10',
         next_due_date = '2026-07-05',
         due_day = 5,
         recurring_amount = 99.90,
         setup_amount = 307.00,
         status = 'active',
         updated_at = now()
   WHERE company_id = v_pat
   RETURNING id INTO v_contract;

  IF v_contract IS NULL THEN
    SELECT id INTO v_contract FROM public.billing_contracts WHERE company_id = v_plat LIMIT 1;
  END IF;

  UPDATE public.billing_invoices SET company_id = v_plat WHERE company_id = v_pat;

  IF v_contract IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.billing_invoices
     WHERE company_id = v_plat AND amount = 307.00 AND status = 'paid'
  ) THEN
    INSERT INTO public.billing_invoices
      (contract_id, company_id, period_start, period_end, due_date, amount, status, paid_at)
    VALUES
      (v_contract, v_plat, '2026-06-10', '2026-06-10', '2026-06-10', 307.00, 'paid', '2026-06-10 12:00:00+00');
  END IF;

  IF v_contract IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.billing_invoices
     WHERE company_id = v_plat AND amount = 99.90 AND due_date = '2026-07-05'
  ) THEN
    INSERT INTO public.billing_invoices
      (contract_id, company_id, period_start, period_end, due_date, amount, status)
    VALUES
      (v_contract, v_plat, '2026-07-05', '2026-08-04', '2026-07-05', 99.90, 'open');
  END IF;

  -- Archive duplicate instead of deleting
  UPDATE public.companies
     SET is_active = false,
         status = 'archived',
         name = name || ' (arquivada)',
         updated_at = now()
   WHERE id = v_pat AND is_active = true;
END $$;

UPDATE public.billing_dunning_policy
   SET steps = '[
        {"code":"d_minus_7","offset_days":-7,"channels":["whatsapp","email"],"template_code":"billing_reminder_7d"},
        {"code":"d_minus_1","offset_days":-1,"channels":["whatsapp","email"],"template_code":"billing_reminder_1d"},
        {"code":"d_zero","offset_days":0,"channels":["whatsapp","email"],"template_code":"billing_due_today"},
        {"code":"d_plus_1","offset_days":1,"channels":["whatsapp","email"],"template_code":"billing_overdue_1d"},
        {"code":"d_plus_3","offset_days":3,"channels":["whatsapp","email"],"template_code":"billing_overdue_3d"},
        {"code":"d_plus_7","offset_days":7,"channels":["whatsapp","email"],"template_code":"billing_overdue_7d"}
      ]'::jsonb,
       suspend_offset_days = 10,
       updated_at = now()
 WHERE is_default = true;
