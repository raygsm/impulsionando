-- Regras canônicas, puras e sem efeito financeiro externo.
create or replace function public.billing_next_anchor_day5(p_from date)
returns date language sql immutable set search_path to 'pg_catalog' as $$
  select case when extract(day from p_from)::int < 5
    then make_date(extract(year from p_from)::int,extract(month from p_from)::int,5)
    else (date_trunc('month',p_from::timestamp)+interval '1 month'+interval '4 day')::date end
$$;

create or replace function public.billing_prorata_until_day5(p_old_monthly numeric,p_new_monthly numeric,p_effective_date date)
returns numeric language plpgsql immutable set search_path to 'pg_catalog' as $$
declare v_anchor date; v_cycle_start date; v_cycle_days integer; v_remaining_days integer; v_delta numeric;
begin
  if p_old_monthly is null or p_new_monthly is null or p_effective_date is null then raise exception 'invalid_arguments'; end if;
  if p_old_monthly < 0 or p_new_monthly < 0 then raise exception 'invalid_amount'; end if;
  v_delta:=greatest(p_new_monthly-p_old_monthly,0); if v_delta=0 then return 0; end if;
  v_anchor:=public.billing_next_anchor_day5(p_effective_date);
  v_cycle_start:=(v_anchor-interval '1 month')::date;
  v_cycle_days:=v_anchor-v_cycle_start;
  v_remaining_days:=greatest(v_anchor-p_effective_date,0);
  return round(v_delta*v_remaining_days::numeric/nullif(v_cycle_days,0),2);
end $$;

create or replace function public.whitelabel_next_tier(p_current_code text)
returns table(code text,name text,client_limit integer)
language sql stable security definer set search_path to 'pg_catalog','public' as $$
  with c as (select sort_order from public.core_whitelabel_tiers where code=p_current_code and pricing_status<>'inactive')
  select t.code,t.name,t.client_limit from public.core_whitelabel_tiers t,c
  where t.sort_order>c.sort_order and t.pricing_status<>'inactive' order by t.sort_order limit 1
$$;

create or replace function public.whitelabel_capacity_decision(p_current_code text,p_active_clients integer,p_requested_additions integer default 1)
returns jsonb language plpgsql stable security definer set search_path to 'pg_catalog','public' as $$
declare v_current public.core_whitelabel_tiers%rowtype; v_next record; v_requested_total integer;
begin
  if p_active_clients<0 or p_requested_additions<1 then raise exception 'invalid_capacity_input'; end if;
  select * into v_current from public.core_whitelabel_tiers where code=p_current_code and pricing_status<>'inactive';
  if v_current.id is null then raise exception 'unknown_whitelabel_tier'; end if;
  v_requested_total:=p_active_clients+p_requested_additions;
  if v_requested_total<=v_current.client_limit then
    return jsonb_build_object('allowed',true,'upgrade_required',false,'current_code',v_current.code,'client_limit',v_current.client_limit,'requested_total',v_requested_total);
  end if;
  select * into v_next from public.whitelabel_next_tier(v_current.code);
  if v_next.code is null then
    return jsonb_build_object('allowed',false,'upgrade_required',true,'current_code',v_current.code,'client_limit',v_current.client_limit,'requested_total',v_requested_total,'next_tier',null,'reason','custom_capacity_required');
  end if;
  return jsonb_build_object('allowed',false,'upgrade_required',true,'current_code',v_current.code,'client_limit',v_current.client_limit,'requested_total',v_requested_total,'next_tier',jsonb_build_object('code',v_next.code,'name',v_next.name,'client_limit',v_next.client_limit),'requires_explicit_acceptance',true);
end $$;

revoke all on function public.billing_next_anchor_day5(date) from anon;
revoke all on function public.billing_prorata_until_day5(numeric,numeric,date) from anon;
revoke all on function public.whitelabel_next_tier(text) from anon;
revoke all on function public.whitelabel_capacity_decision(text,integer,integer) from anon;
grant execute on function public.billing_next_anchor_day5(date) to authenticated;
grant execute on function public.billing_prorata_until_day5(numeric,numeric,date) to authenticated;
grant execute on function public.whitelabel_next_tier(text) to authenticated;
grant execute on function public.whitelabel_capacity_decision(text,integer,integer) to authenticated;
