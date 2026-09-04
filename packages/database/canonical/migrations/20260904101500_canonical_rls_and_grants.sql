-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

-- Private-by-default: enable+force RLS; no authenticated/anon policies.
-- Nest/service_role is the intended accessor until T-DB-02 proves otherwise.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname IN (
        'canonical_migration','tenancy','iam','entitlements','contacts','compliance',
        'growth','crm','tasks','eventing','catalog','purchasing','sales','pos',
        'fulfillment','inventory','agenda','finance','accounting','billing','payments',
        'fiscal','commissions','documents','communications','cases','integrations',
        'automation','ai','analytics','vertical_health','vertical_automotive',
        'vertical_representation','vertical_brewery','vertical_restaurant',
        'vertical_events','vertical_tourism','vertical_retail','vertical_education',
        'vertical_services'
      )
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schema_name, r.table_name);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.schema_name, r.table_name);
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC', r.schema_name, r.table_name);
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM anon', r.schema_name, r.table_name);
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM authenticated', r.schema_name, r.table_name);
    EXECUTE format('GRANT ALL ON TABLE %I.%I TO service_role', r.schema_name, r.table_name);
  END LOOP;
END $$;

DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY[
    'canonical_migration','tenancy','iam','entitlements','contacts','compliance',
    'growth','crm','tasks','eventing','catalog','purchasing','sales','pos',
    'fulfillment','inventory','agenda','finance','accounting','billing','payments',
    'fiscal','commissions','documents','communications','cases','integrations',
    'automation','ai','analytics','vertical_health','vertical_automotive',
    'vertical_representation','vertical_brewery','vertical_restaurant',
    'vertical_events','vertical_tourism','vertical_retail','vertical_education',
    'vertical_services'
  ]
  LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO service_role', s);
    EXECUTE format(
      'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO service_role', s
    );
  END LOOP;
END $$;
