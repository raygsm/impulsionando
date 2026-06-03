
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'user_profiles','user_permission_overrides',
      'companies','company_settings','company_modules','company_units',
      'customers',
      'fin_transactions','fin_payments','fin_commissions',
      'sales_orders','sales_cash_sessions',
      'agenda_appointments','agenda_blocks',
      'inv_movements'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.tg_audit();', t, t);
  END LOOP;
END $$;
