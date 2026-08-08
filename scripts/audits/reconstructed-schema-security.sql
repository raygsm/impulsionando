\pset pager off
\echo === SUMMARY ===
SELECT
  count(*) FILTER (WHERE c.relkind IN ('r', 'p')) AS tables,
  count(*) FILTER (WHERE c.relkind IN ('r', 'p') AND c.relrowsecurity) AS rls_enabled,
  count(*) FILTER (WHERE c.relkind IN ('v', 'm')) AS views
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public';

SELECT count(*) AS policies
FROM pg_policies
WHERE schemaname = 'public';

\echo === TABLES WITHOUT RLS ===
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND NOT c.relrowsecurity
ORDER BY c.relname;

\echo === RLS TABLES WITHOUT POLICIES ===
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relrowsecurity
  AND NOT EXISTS (
    SELECT 1 FROM pg_policy pol WHERE pol.polrelid = c.oid
  )
ORDER BY c.relname;

\echo === SECURITY DEFINER EXPOSED TO PUBLIC OR ANON ===
SELECT
  p.oid::regprocedure AS function,
  EXISTS (
    SELECT 1
    FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
  ) AS public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
  AND (
    EXISTS (
      SELECT 1
      FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
    )
    OR has_function_privilege('anon', p.oid, 'EXECUTE')
  )
ORDER BY 1;

\echo === APPLICATION STRUCTURAL TABLE PRIVILEGES ===
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('TRUNCATE', 'TRIGGER', 'REFERENCES', 'MAINTAIN')
ORDER BY grantee, table_name, privilege_type;

\echo === SECURITY DEFINER WITH SUSPICIOUS EMBEDDED IDENTITIES ===
SELECT p.oid::regprocedure AS function
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
  AND p.prosrc ~* '(example\\.(com|invalid)|hotmail|gmail|yahoo|impulsionando_test|cliente_teste)'
ORDER BY 1;

\echo === VIEWS WITHOUT SECURITY INVOKER ===
SELECT c.relname, c.reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND NOT (
    coalesce(c.reloptions, ARRAY[]::text[]) @> ARRAY['security_invoker=true']
    OR coalesce(c.reloptions, ARRAY[]::text[]) @> ARRAY['security_invoker=on']
  )
ORDER BY c.relname;
