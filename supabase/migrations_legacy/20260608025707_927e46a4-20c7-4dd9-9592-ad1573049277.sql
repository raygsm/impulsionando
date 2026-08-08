-- Regression guard: ensure billing tables keep finance.transaction.read enforcement
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('billing_contracts','billing_invoices','billing_suspensions')
    AND cmd = 'SELECT'
    AND qual LIKE '%finance.transaction.read%';
  IF n < 3 THEN
    RAISE EXCEPTION 'SECURITY REGRESSION: billing_* SELECT policies lost finance.transaction.read enforcement (found: %)', n;
  END IF;
END $$;

-- Document the regression check as a reusable function for future migrations / CI
CREATE OR REPLACE FUNCTION public.assert_billing_finance_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('billing_contracts','billing_invoices','billing_suspensions')
    AND cmd = 'SELECT'
    AND qual LIKE '%finance.transaction.read%';
  IF n < 3 THEN
    RAISE EXCEPTION 'SECURITY REGRESSION: billing_* SELECT policies must enforce finance.transaction.read (found: %)', n;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.assert_billing_finance_rls() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_billing_finance_rls() TO authenticated, service_role;