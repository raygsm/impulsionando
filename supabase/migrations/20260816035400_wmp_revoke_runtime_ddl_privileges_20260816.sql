do $$
declare r record;
begin
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p') and c.relname like 'wmp_%'
  loop
    execute format('revoke truncate, trigger, references on table public.%I from anon', r.table_name);
    execute format('revoke truncate, trigger, references on table public.%I from authenticated', r.table_name);
  end loop;
end $$;
