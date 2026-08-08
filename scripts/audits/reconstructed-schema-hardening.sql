-- Hardening applied only to the disposable reconstruction database.
-- The resulting dump is a candidate baseline, never a direct production push.

DROP TRIGGER IF EXISTS companies_seed_impulsionando_test_customer ON public.companies;
DROP FUNCTION IF EXISTS public.tg_companies_seed_test_customer();
DROP FUNCTION IF EXISTS public.ensure_impulsionando_test_customer(uuid);

DO $hardening$
DECLARE
  relation record;
  trigger_function record;
BEGIN
  FOR relation IN
    SELECT n.nspname AS schema_name, c.relname AS relation_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE %I.%I FROM anon, authenticated',
      relation.schema_name,
      relation.relation_name
    );
  END LOOP;

  FOR trigger_function IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
      trigger_function.signature
    );
  END LOOP;
END
$hardening$;

