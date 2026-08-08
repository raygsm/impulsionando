-- Revoke anonymous EXECUTE on SECURITY DEFINER functions that have no public/anon use case.
-- All callers use either supabaseAdmin (service_role, bypasses) or authenticated session.
-- Functions remain available to `authenticated` and `service_role`.

DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'billing_check_company_status(uuid)',
    'billing_mark_paid(uuid, timestamptz)',
    'billing_run_cycle()',
    'company_identity_payload(uuid)',
    'core_user_belongs_to_company(uuid, uuid)',
    'delete_email(text, bigint)',
    'enqueue_email(text, jsonb)',
    'has_active_subscription(uuid, text)',
    'master_company_id()',
    'move_to_dlq(text, text, bigint, jsonb)',
    'read_email_batch(text, integer, integer)',
    'trial_cancel(uuid, text)',
    'trial_check_abuse(text, text, text, text)',
    'trial_create(text, text, text, text, text, trial_plan_choice, text, text, uuid, text)',
    'trial_extend(uuid, integer, text)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon, PUBLIC', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'function not found, skipping: %', fn;
    END;
  END LOOP;
END $$;

-- is_patient_of_record has two overloads; lock both down.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='is_patient_of_record'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.is_patient_of_record(%s) FROM anon, PUBLIC', r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.is_patient_of_record(%s) TO authenticated, service_role', r.args);
  END LOOP;
END $$;