-- Record a universal coupon as effectively used only after an approved payment.
-- Idempotent by payment id; this feeds applied_discount_cents in Core BI.

create or replace function public.core_record_coupon_payment_redemption()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_appointment public.chrismed_appointments%rowtype;
  v_coupon jsonb;
  v_coupon_id uuid;
  v_discount bigint;
  v_base bigint;
  v_final bigint;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  if tg_op='UPDATE' and old.status='approved' then
    return new;
  end if;

  if new.context_type <> 'chrismed_appointment' or new.context_id is null then
    return new;
  end if;

  select * into v_appointment
    from public.chrismed_appointments
   where id=new.context_id::uuid
     and company_id=new.company_id
   limit 1;

  if v_appointment.id is null then
    return new;
  end if;

  v_coupon := v_appointment.metadata->'universal_coupon';
  if v_coupon is null or jsonb_typeof(v_coupon) <> 'object' or nullif(v_coupon->>'coupon_id','') is null then
    return new;
  end if;

  v_coupon_id := (v_coupon->>'coupon_id')::uuid;
  v_base := coalesce((v_coupon->>'base_price_cents')::bigint,new.amount_cents);
  v_final := coalesce((v_coupon->>'final_price_cents')::bigint,new.amount_cents);
  v_discount := greatest(0,coalesce((v_coupon->>'discount_cents')::bigint,v_base-v_final));

  if not exists (
    select 1 from public.core_coupon_events e
     where e.coupon_id=v_coupon_id
       and e.event_type='APPLIED'
       and e.metadata->>'payment_id'=new.id::text
  ) then
    insert into public.core_coupon_events(
      company_id,coupon_id,customer_user_id,event_type,
      original_price_cents,final_price_cents,discount_amount_cents,actor_user_id,metadata
    ) values (
      new.company_id,v_coupon_id,v_appointment.patient_user_id,'APPLIED',
      v_base,v_final,v_discount,v_appointment.patient_user_id,
      jsonb_build_object('payment_id',new.id,'appointment_id',v_appointment.id,'provider','mercadopago')
    );
  end if;

  return new;
end $$;

revoke all on function public.core_record_coupon_payment_redemption() from public,anon,authenticated;
grant execute on function public.core_record_coupon_payment_redemption() to service_role;

drop trigger if exists trg_core_record_coupon_payment_redemption on public.mpago_payments;
create trigger trg_core_record_coupon_payment_redemption
after insert or update of status on public.mpago_payments
for each row execute function public.core_record_coupon_payment_redemption();

comment on function public.core_record_coupon_payment_redemption() is
  'Writes one APPLIED coupon event per approved CHRISMED payment, so BI reports actual discount usage rather than checkout attempts.';
