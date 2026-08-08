
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'customers','ehr_records','ehr_evolutions','ehr_documents','ehr_opinions',
    'agenda_appointments','agenda_professionals','agenda_services','agenda_locations','agenda_rooms',
    'sales_orders','sales_order_items','sales_payments',
    'crm_leads','crm_opportunities','crm_pipelines','crm_stages','crm_activities',
    'fin_transactions','fin_accounts','fin_categories','fin_payment_methods','fin_payments',
    'inv_products','inv_suppliers','inv_categories','inv_movements',
    'realestate_properties','realestate_interests',
    'company_units','company_modules','company_settings',
    'marketing_leads'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name='company_id'
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_demo_read', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = %I.company_id AND c.is_demo = true))',
        t || '_demo_read', t, t
      );
    END IF;
  END LOOP;
END $$;
