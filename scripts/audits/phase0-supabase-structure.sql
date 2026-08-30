-- Phase 0: read-only Supabase structure inventory.
-- Run ONE numbered SELECT at a time in the Supabase SQL Editor and export each
-- result as CSV. These queries do not select application row data.
-- IMPORTANT: change the SQL Editor result limit from 100 to "No limit".
-- Do not add INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE or function bodies.

-- 01-tables-columns.csv
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  greatest(c.reltuples::bigint, 0) as estimated_rows,
  a.attnum as column_position,
  a.attname as column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
  not a.attnotnull as is_nullable
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
join pg_catalog.pg_attribute a on a.attrelid = c.oid
where c.relkind in ('r', 'p')
  and a.attnum > 0
  and not a.attisdropped
  and n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
  and n.nspname not like 'pg_temp_%'
  and n.nspname not like 'pg_toast_temp_%'
order by n.nspname, c.relname, a.attnum;

-- 02-rls-policies.csv
select
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as check_expression
from pg_catalog.pg_policies
order by schemaname, tablename, policyname;

-- 03-functions.csv
-- Intentionally exports metadata, not function bodies.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
  pg_catalog.pg_get_function_result(p.oid) as result_type,
  p.prosecdef as security_definer,
  p.proleakproof as leakproof,
  p.provolatile as volatility,
  l.lanname as language
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
join pg_catalog.pg_language l on l.oid = p.prolang
where n.nspname not in ('pg_catalog', 'information_schema')
  and n.nspname not like 'pg_temp_%'
order by n.nspname, p.proname, arguments;

-- 04-triggers.csv
-- Intentionally exports trigger/function names, not trigger arguments or bodies.
select
  table_ns.nspname as schema_name,
  table_class.relname as table_name,
  trigger_row.tgname as trigger_name,
  function_ns.nspname as function_schema,
  function_row.proname as function_name,
  trigger_row.tgenabled as enabled_mode
from pg_catalog.pg_trigger trigger_row
join pg_catalog.pg_class table_class on table_class.oid = trigger_row.tgrelid
join pg_catalog.pg_namespace table_ns on table_ns.oid = table_class.relnamespace
join pg_catalog.pg_proc function_row on function_row.oid = trigger_row.tgfoid
join pg_catalog.pg_namespace function_ns on function_ns.oid = function_row.pronamespace
where not trigger_row.tgisinternal
order by table_ns.nspname, table_class.relname, trigger_row.tgname;

-- 05-grants.csv
select distinct
  table_schema as schema_name,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema not in ('pg_catalog', 'information_schema')
order by table_schema, table_name, grantee, privilege_type;

-- 06-storage-buckets.csv
-- Bucket metadata only; no object names or file contents.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
order by name;

-- 07-migration-history.csv
-- Excludes the SQL statements column.
select
  version,
  name
from supabase_migrations.schema_migrations
order by version;

-- 08-extensions.csv
select
  ext.extname as extension_name,
  ext.extversion as extension_version,
  ns.nspname as schema_name
from pg_catalog.pg_extension ext
join pg_catalog.pg_namespace ns on ns.oid = ext.extnamespace
order by ext.extname;

-- 09-security-definer-surface.csv
-- Metadata and execute privileges only; no function bodies.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
  pg_catalog.pg_get_userbyid(p.proowner) as owner,
  p.proconfig as function_settings,
  pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  pg_catalog.has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where p.prosecdef
  and n.nspname in ('public', 'private')
order by n.nspname, p.proname, arguments;

-- 10-summary.csv
-- A single row, so this remains complete even if the editor limit is 100.
select
  now() as collected_at,
  (select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where c.relkind in ('r', 'p') and n.nspname = 'public') as public_tables,
  (select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where c.relkind in ('r', 'p') and n.nspname = 'public' and c.relrowsecurity) as public_tables_rls_enabled,
  (select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where c.relkind in ('r', 'p') and n.nspname = 'public' and not c.relrowsecurity) as public_tables_rls_disabled,
  (select count(*) from pg_catalog.pg_policies where schemaname = 'public') as public_policies,
  (select count(*) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public') as public_functions,
  (select count(*) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'private') and p.prosecdef) as user_security_definer_functions,
  (select count(*) from pg_catalog.pg_trigger t join pg_catalog.pg_class c on c.oid = t.tgrelid join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not t.tgisinternal) as public_triggers,
  (select count(*) from storage.buckets) as storage_buckets,
  (select count(*) from storage.buckets where public) as public_storage_buckets,
  (select count(*) from supabase_migrations.schema_migrations) as migration_history_rows,
  (select min(version) from supabase_migrations.schema_migrations) as first_migration,
  (select max(version) from supabase_migrations.schema_migrations) as last_migration;
