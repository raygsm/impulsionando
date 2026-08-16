-- Route coupon lifecycle notices into the universal Core message_outbox.
-- This makes notice creation automatic and auditable without bypassing the
-- existing communication runtime. Delivery remains fail-safe: if no usable
-- email can be resolved, the coupon notification stays in its native outbox
-- for operational follow-up instead of being falsely marked as sent.

create or replace function public.core_coupon_enqueue_universal_message()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_email text;
  v_name text;
  v_company_name text;
  v_subject text;
  v_body text;
  v_key text;
  v_service text;
begin
  select
    nullif(coalesce(cc.attributes->>'email',''),''),
    nullif(coalesce(cc.display_name,cc.attributes->>'name',''),'')
  into v_email,v_name
  from public.communication_contacts cc
  join public.communication_tenants ct on ct.id=cc.tenant_id
  where cc.user_id=new.customer_user_id
    and ct.company_id=new.company_id
    and ct.active=true
    and ct.deleted_at is null
  order by cc.updated_at desc nulls last,cc.created_at desc
  limit 1;

  if v_email is null and to_regclass('public.chrismed_patient_profiles') is not null then
    execute 'select nullif(email,'''')::text, nullif(full_name,'''')::text from public.chrismed_patient_profiles where user_id=$1 and company_id=$2 order by updated_at desc limit 1'
      into v_email,v_name
      using new.customer_user_id,new.company_id;
  end if;

  if v_email is null then
    return new;
  end if;

  select coalesce(nullif(trade_name,''),nullif(name,''),'Empresa')
    into v_company_name
  from public.companies
  where id=new.company_id;

  select service_name_snapshot
    into v_service
  from public.core_customer_discount_coupons
  where id=new.coupon_id;

  v_subject := case new.notification_type
    when 'COUPON_CREATED' then 'Seu desconto foi concedido'
    when 'COUPON_SUSPENDED' then 'Seu desconto foi suspenso'
    when 'COUPON_REACTIVATED' then 'Seu desconto foi reativado'
    when 'COUPON_EXPIRING' then 'Seu desconto está próximo do vencimento'
    when 'COUPON_EXPIRED' then 'Seu desconto expirou'
    when 'COUPON_REVOKED' then 'Seu desconto foi encerrado'
    else 'Atualização do seu desconto'
  end;

  v_body := case new.notification_type
    when 'COUPON_CREATED' then format('Olá%s. %s concedeu um desconto nominal para %s. Consulte sua área cadastrada para conferir as condições e a validade.',case when v_name is null then '' else ', '||v_name end,v_company_name,coalesce(v_service,'seu serviço'))
    when 'COUPON_SUSPENDED' then format('Olá%s. O desconto nominal vinculado a %s foi suspenso por %s. Ele não será aplicado enquanto estiver suspenso.',case when v_name is null then '' else ', '||v_name end,coalesce(v_service,'seu serviço'),v_company_name)
    when 'COUPON_REACTIVATED' then format('Olá%s. O desconto nominal vinculado a %s foi reativado por %s e voltou a ficar disponível dentro das condições cadastradas.',case when v_name is null then '' else ', '||v_name end,coalesce(v_service,'seu serviço'),v_company_name)
    when 'COUPON_EXPIRING' then format('Olá%s. O desconto nominal vinculado a %s está próximo do vencimento. Consulte sua área cadastrada para verificar a data e as condições.',case when v_name is null then '' else ', '||v_name end,coalesce(v_service,'seu serviço'))
    when 'COUPON_EXPIRED' then format('Olá%s. O desconto nominal vinculado a %s expirou e não será mais aplicado a novas cobranças.',case when v_name is null then '' else ', '||v_name end,coalesce(v_service,'seu serviço'))
    when 'COUPON_REVOKED' then format('Olá%s. O desconto nominal vinculado a %s foi encerrado por %s e não será mais aplicado.',case when v_name is null then '' else ', '||v_name end,coalesce(v_service,'seu serviço'),v_company_name)
    else 'Houve uma atualização no seu desconto nominal. Consulte sua área cadastrada para mais detalhes.'
  end;

  v_key := format('coupon:%s:%s:%s',new.coupon_id,new.notification_type,to_char(new.available_at at time zone 'UTC','YYYYMMDDHH24MISS'));

  if not exists (select 1 from public.message_outbox mo where mo.idempotency_key=v_key) then
    insert into public.message_outbox(
      company_id,event_code,channel,recipient_user_id,recipient_email,recipient_name,
      subject,body,payload,status,scheduled_at,available_at,reference_type,reference_id,
      idempotency_key,correlation_id
    ) values (
      new.company_id,
      lower(new.notification_type),
      'email',
      new.customer_user_id,
      v_email,
      v_name,
      v_subject,
      v_body,
      jsonb_build_object('coupon_id',new.coupon_id,'notification_type',new.notification_type,'coupon_payload',new.payload),
      'queued',
      new.available_at,
      new.available_at,
      'core_customer_discount_coupon',
      new.coupon_id::text,
      v_key,
      'coupon:'||new.coupon_id::text
    );
  end if;

  return new;
end $$;

revoke all on function public.core_coupon_enqueue_universal_message() from public,anon,authenticated;
grant execute on function public.core_coupon_enqueue_universal_message() to service_role;

drop trigger if exists trg_core_coupon_enqueue_universal_message on public.core_coupon_notification_outbox;
create trigger trg_core_coupon_enqueue_universal_message
after insert on public.core_coupon_notification_outbox
for each row execute function public.core_coupon_enqueue_universal_message();

comment on function public.core_coupon_enqueue_universal_message() is
  'Queues coupon lifecycle notices in the universal Core message_outbox using idempotent email delivery when a registered recipient email is available.';
