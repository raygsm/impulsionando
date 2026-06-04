-- Revoke EXECUTE from anon on SECURITY DEFINER functions in public schema.
-- Trigger functions are called by the engine and do not need any direct grant.
-- The two RPCs (customer_anonymize, sales_cash_session_close) require an authenticated user.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, PUBLIC',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Re-grant explicitly to roles that actually need to call the RPCs.
GRANT EXECUTE ON FUNCTION public.customer_anonymize(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sales_cash_session_close(uuid, jsonb, text) TO authenticated;