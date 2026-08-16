create or replace function public.validate_wmp_proposal_financials(p_proposal_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public','private'
as $function$
declare
  v_tenant uuid;
  v_total bigint;
  v_internal bigint;
  v_operational bigint;
  v_gross_pct numeric;
  v_net_pct numeric;
  v_version integer;
begin
  select p.tenant_id, pv.total_cents, pv.internal_cost_cents, coalesce(pv.operational_cost_cents,0), pv.version
    into v_tenant,v_total,v_internal,v_operational,v_version
  from public.wmp_proposal_versions pv
  join public.wmp_proposals p on p.id=pv.proposal_id and p.current_version=pv.version
  where pv.proposal_id=p_proposal_id
  order by pv.version desc limit 1;

  if v_tenant is null then raise exception 'proposal_not_found'; end if;
  if not private.is_tenant_member(v_tenant,array['OWNER','ADMIN','EDITOR','OPERATOR']) then raise exception 'not_authorized'; end if;

  if v_total is null or v_total <= 0 then
    return jsonb_build_object('ok',false,'reason','proposal_total_missing','version',v_version);
  end if;

  v_gross_pct := ((v_total-coalesce(v_internal,0))::numeric/v_total::numeric)*100;
  v_net_pct := ((v_total-coalesce(v_internal,0)-coalesce(v_operational,0))::numeric/v_total::numeric)*100;

  return jsonb_build_object(
    'ok', v_gross_pct >= 10 and v_net_pct >= 15,
    'version', v_version,
    'total_cents', v_total,
    'internal_cost_cents', coalesce(v_internal,0),
    'operational_cost_cents', coalesce(v_operational,0),
    'gross_margin_pct', round(v_gross_pct,2),
    'net_operating_margin_pct', round(v_net_pct,2),
    'minimum_gross_margin_pct',10,
    'minimum_net_operating_margin_pct',15
  );
end
$function$;

create or replace function public.wmp_dj_effective_allowances(p_booking_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public','private'
as $function$
declare
  v_tenant uuid;
  v_meal bigint;
  v_parking bigint;
  v_meal_provided boolean;
  v_parking_provided boolean;
begin
  select tenant_id, meal_allowance_cents, parking_allowance_cents, meal_provided_by_contractor, parking_provided_by_contractor
    into v_tenant,v_meal,v_parking,v_meal_provided,v_parking_provided
  from public.wmp_dj_bookings where id=p_booking_id;

  if v_tenant is null then raise exception 'booking_not_found'; end if;
  if not private.is_tenant_member(v_tenant,array['OWNER','ADMIN','EDITOR','OPERATOR']) then raise exception 'not_authorized'; end if;

  v_meal := case when v_meal_provided then 0 else coalesce(v_meal,0) end;
  v_parking := case when v_parking_provided then 0 else coalesce(v_parking,0) end;
  return jsonb_build_object('meal_cents',v_meal,'parking_cents',v_parking,'total_cents',v_meal+v_parking);
end
$function$;

revoke all on function public.validate_wmp_proposal_financials(uuid) from public, anon;
grant execute on function public.validate_wmp_proposal_financials(uuid) to authenticated, service_role;

revoke all on function public.wmp_dj_effective_allowances(uuid) from public, anon;
grant execute on function public.wmp_dj_effective_allowances(uuid) to authenticated, service_role;

revoke all on function public.wmp_claim_wagner_member() from public, anon, authenticated;
grant execute on function public.wmp_claim_wagner_member() to service_role;
