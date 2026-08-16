-- CHRISMED consumes the universal Core customer-specific coupon engine.
-- The discount is resolved server-side while the booking hold is created.
-- Anonymous/unregistered patients never receive a nominal coupon.

create or replace function public.chrismed_apply_universal_coupon_to_hold()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_offering public.chrismed_service_offerings%rowtype;
  v_price jsonb;
begin
  if new.patient_user_id is null then
    return new;
  end if;

  select * into v_offering
    from public.chrismed_service_offerings
   where id=new.offering_id
     and company_id=new.company_id
     and active=true;

  if v_offering.id is null then
    return new;
  end if;

  v_price := public.core_resolve_customer_price(
    new.company_id,
    new.patient_user_id,
    v_offering.slug,
    v_offering.price_cents,
    false
  );

  if coalesce((v_price->>'eligible')::boolean,false) then
    new.metadata := coalesce(new.metadata,'{}'::jsonb) || jsonb_build_object(
      'checkout_amount_cents',(v_price->>'final_price_cents')::bigint,
      'universal_coupon',jsonb_build_object(
        'coupon_id',v_price->>'coupon_id',
        'discount_type',v_price->>'discount_type',
        'discount_percent',v_price->>'discount_percent',
        'fixed_price_cents',v_price->>'fixed_price_cents',
        'base_price_cents',v_price->>'base_price_cents',
        'final_price_cents',v_price->>'final_price_cents',
        'discount_cents',v_price->>'discount_cents',
        'expires_at',v_price->>'expires_at'
      )
    );
  end if;

  return new;
end $$;

revoke all on function public.chrismed_apply_universal_coupon_to_hold() from public,anon,authenticated;
grant execute on function public.chrismed_apply_universal_coupon_to_hold() to service_role;

drop trigger if exists trg_chrismed_apply_universal_coupon_to_hold on public.chrismed_appointments;
create trigger trg_chrismed_apply_universal_coupon_to_hold
before insert on public.chrismed_appointments
for each row execute function public.chrismed_apply_universal_coupon_to_hold();

comment on function public.chrismed_apply_universal_coupon_to_hold() is
  'Resolves a registered patient nominal Core coupon against the exact CHRISMED offering before checkout. The browser cannot choose the discounted amount.';
