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

  -- PostgreSQL grants EXECUTE to PUBLIC by default. Keep every application RPC
  -- opt-in via the explicit anon/authenticated grants already in migrations.
  FOR trigger_function IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC',
      trigger_function.signature
    );
  END LOOP;
END
$hardening$;

-- These helpers accept arbitrary user IDs. Policies use them only for signed-in
-- requests, so anonymous RPC execution is unnecessary and leaks authorization
-- membership as a boolean oracle. Host resolution remains anonymously callable.
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_impulsionando_staff(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_belongs_to_company(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.core_user_belongs_to_company(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mp_user_in_company(uuid, uuid) FROM anon;
