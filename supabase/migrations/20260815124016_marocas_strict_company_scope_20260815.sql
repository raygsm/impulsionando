create or replace function public.marocas_enforce_company_scope()
returns trigger
language plpgsql
security definer
set search_path='public','pg_temp'
as $$
declare v_company uuid;
begin
  v_company := public.marocas_company_id();
  if v_company is null then raise exception 'marocas_company_not_found'; end if;
  if new.company_id is null then new.company_id := v_company; end if;
  if new.company_id <> v_company then raise exception 'invalid_marocas_company_scope'; end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array[
    'marocas_apartments','marocas_maintenance_quotes','marocas_maintenance_requests','marocas_owner_statements',
    'marocas_owners','marocas_professionals','marocas_report_runs','marocas_report_schedules','marocas_services','marocas_supplies'
  ] loop
    execute format('drop trigger if exists trg_marocas_strict_company_scope on public.%I', t);
    execute format('create trigger trg_marocas_strict_company_scope before insert or update of company_id on public.%I for each row execute function public.marocas_enforce_company_scope()', t);
  end loop;
end $$;

revoke all on function public.marocas_enforce_company_scope() from public,anon,authenticated;
grant execute on function public.marocas_enforce_company_scope() to service_role;

comment on function public.marocas_enforce_company_scope() is 'Impede que tabelas exclusivas Marocas recebam company_id de outro cliente, inclusive em operacoes administrativas.';