-- Disposable restore only.
-- The Core dump intentionally excludes Supabase-managed auth data, while public
-- tables may contain UUID foreign-key references to auth.users. Seed opaque
-- placeholder IDs from the restored snapshot before post-data constraints run.
-- No email, password, token or user metadata is copied.
DO $seed$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, a.attname AS column_name
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_type t ON t.oid = a.atttypid
    WHERE n.nspname IN ('public','private')
      AND c.relkind IN ('r','p')
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND t.typname = 'uuid'
  LOOP
    EXECUTE format(
      'insert into auth.users(id) select distinct %1$I from %2$I.%3$I where %1$I is not null on conflict(id) do nothing',
      r.column_name,
      r.schema_name,
      r.table_name
    );
  END LOOP;
END
$seed$;

DO $verify$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users) THEN
    RAISE EXCEPTION 'restore auth placeholder set is unexpectedly empty';
  END IF;
END
$verify$;
