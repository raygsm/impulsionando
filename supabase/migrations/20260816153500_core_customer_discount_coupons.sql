-- Core universal: cupons nominais por cliente/paciente cadastrado.
-- Gestão restrita a admin/master ou financeiro da empresa.
-- Cadastro elegível: contato Core vinculado a auth user; CHRISMED também aceita perfil de paciente.

alter type public.app_role add value if not exists 'financeiro';

create table if not exists public.core_customer_discount_coupons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid null references public.communication_contacts(id) on delete set null,
  service_ref text not null,
  service_name_snapshot text not null,
  original_price_cents bigint not null check (original_price_cents >= 0),
  discount_type text not null check (discount_type in ('PERCENT','FIXED_PRICE')),
  discount_percent numeric(5,2),
  fixed_price_cents bigint,
  validity_type text not null check (validity_type in ('INDETERMINATE','DAYS_30')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED','EXPIRED','REVOKED')),
  reason text,
  created_by uuid not null references auth.users(id),
  suspended_by uuid references auth.users(id),
  suspended_at timestamptz,
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_coupon_discount_shape check (
    (discount_type='PERCENT' and discount_percent > 0 and discount_percent <= 100 and fixed_price_cents is null)
    or
    (discount_type='FIXED_PRICE' and fixed_price_cents >= 0 and discount_percent is null)
  ),
  constraint core_coupon_expiry_shape check (
    (validity_type='INDETERMINATE' and expires_at is null)
    or
    (validity_type='DAYS_30' and expires_at is not null)
  )
);

create table if not exists public.core_coupon_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  coupon_id uuid not null references public.core_customer_discount_coupons(id) on delete cascade,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('CREATED','APPLIED','SUSPENDED','REACTIVATED','EXPIRED','REVOKED')),
  original_price_cents bigint,
  final_price_cents bigint,
  discount_amount_cents bigint,
  actor_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.core_coupon_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  coupon_id uuid not null references public.core_customer_discount_coupons(id) on delete cascade,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null check (notification_type in ('COUPON_CREATED','COUPON_SUSPENDED','COUPON_REACTIVATED','COUPON_EXPIRING','COUPON_EXPIRED','COUPON_REVOKED')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','SENT','FAILED','CANCELLED')),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_core_customer_discount_coupons_company on public.core_customer_discount_coupons(company_id,status,created_at desc);
create index if not exists idx_core_customer_discount_coupons_customer on public.core_customer_discount_coupons(company_id,customer_user_id,status);
create index if not exists idx_core_customer_discount_coupons_service on public.core_customer_discount_coupons(company_id,customer_user_id,service_ref,status);
create index if not exists idx_core_coupon_events_company on public.core_coupon_events(company_id,created_at desc);
create index if not exists idx_core_coupon_notification_outbox_pending on public.core_coupon_notification_outbox(status,available_at) where status in ('PENDING','FAILED');

create or replace function public.core_financial_can_manage_coupons(p_company_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public,auth as $$
  select p_user_id is not null and (
    public.is_super_admin(p_user_id)
    or public.is_impulsionando_staff(p_user_id)
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id=p_user_id and ur.company_id=p_company_id and ur.role::text in ('admin','financeiro')
    )
  )
$$;
revoke all on function public.core_financial_can_manage_coupons(uuid,uuid) from public;
grant execute on function public.core_financial_can_manage_coupons(uuid,uuid) to authenticated,service_role;

create or replace function public.core_coupon_registered_customer(p_company_id uuid,p_customer_user_id uuid)
returns boolean language plpgsql stable security definer set search_path=public,auth as $$
declare ok boolean:=false;
begin
  select exists(
    select 1
    from public.communication_contacts cc
    join public.communication_tenants ct on ct.id=cc.tenant_id
    where cc.user_id=p_customer_user_id
      and ct.company_id=p_company_id
      and ct.active=true
      and ct.deleted_at is null
  ) into ok;
  if ok then return true; end if;
  if to_regclass('public.chrismed_patient_profiles') is not null then
    execute 'select exists(select 1 from public.chrismed_patient_profiles where user_id=$1 and company_id=$2 and coalesce(status,''active'') not in (''rejected'',''inactive''))'
      into ok using p_customer_user_id,p_company_id;
  end if;
  return coalesce(ok,false);
end $$;
revoke all on function public.core_coupon_registered_customer(uuid,uuid) from public;
grant execute on function public.core_coupon_registered_customer(uuid,uuid) to authenticated,service_role;

create or replace function public.core_coupon_search_customers(p_company_id uuid,p_query text)
returns table(user_id uuid,display_name text,cpf_masked text,email text,contact_id uuid)
language plpgsql stable security definer set search_path=public,auth as $$
declare q text:=trim(coalesce(p_query,'')); digits text:=regexp_replace(coalesce(p_query,''),'[^0-9]','','g');
begin
  if not public.core_financial_can_manage_coupons(p_company_id,auth.uid()) then raise exception 'forbidden'; end if;
  if length(q)<2 then return; end if;
  return query
  with candidates as (
    select cc.user_id,
           coalesce(cc.display_name,cc.attributes->>'name',cc.attributes->>'email','Cliente')::text display_name,
           nullif(regexp_replace(coalesce(cc.attributes->>'cpf',''),'[^0-9]','','g'),'') cpf,
           coalesce(cc.attributes->>'email','')::text email,
           cc.id contact_id
    from public.communication_contacts cc
    join public.communication_tenants ct on ct.id=cc.tenant_id
    where ct.company_id=p_company_id and ct.active=true and ct.deleted_at is null and cc.user_id is not null
    union all
    select cp.user_id,coalesce(cp.full_name,cp.email,'Paciente')::text,
           nullif(regexp_replace(coalesce(cp.cpf,''),'[^0-9]','','g'),'') cpf,
           coalesce(cp.email,'')::text,null::uuid
    from public.chrismed_patient_profiles cp
    where to_regclass('public.chrismed_patient_profiles') is not null and cp.company_id=p_company_id and cp.user_id is not null
  ), ranked as (
    select distinct on (c.user_id) c.*
    from candidates c
    where c.user_id is not null and (
      c.display_name ilike '%'||q||'%' or c.email ilike '%'||q||'%'
      or (length(digits)>=3 and coalesce(c.cpf,'') like '%'||digits||'%')
    )
    order by c.user_id,c.contact_id nulls last
  )
  select r.user_id,r.display_name,
         case when length(coalesce(r.cpf,''))=11 then '***.'||substr(r.cpf,4,3)||'.'||substr(r.cpf,7,3)||'-**' else null end,
         r.email,r.contact_id
  from ranked r order by r.display_name limit 25;
end $$;
revoke all on function public.core_coupon_search_customers(uuid,text) from public;
grant execute on function public.core_coupon_search_customers(uuid,text) to authenticated,service_role;

create or replace function public.core_coupon_create(
  p_company_id uuid,p_customer_user_id uuid,p_contact_id uuid,p_service_ref text,p_service_name text,
  p_original_price_cents bigint,p_discount_type text,p_discount_value numeric,p_validity_type text,p_reason text default null
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_id uuid; v_expires timestamptz; v_percent numeric(5,2); v_fixed bigint;
begin
  if not public.core_financial_can_manage_coupons(p_company_id,auth.uid()) then raise exception 'forbidden'; end if;
  if not public.core_coupon_registered_customer(p_company_id,p_customer_user_id) then raise exception 'customer_must_be_registered'; end if;
  if nullif(trim(p_service_ref),'') is null or nullif(trim(p_service_name),'') is null then raise exception 'service_required'; end if;
  if p_original_price_cents<0 then raise exception 'invalid_original_price'; end if;
  if p_discount_type='PERCENT' then
    if p_discount_value<=0 or p_discount_value>100 then raise exception 'invalid_percent'; end if;
    v_percent:=p_discount_value;
  elsif p_discount_type='FIXED_PRICE' then
    if p_discount_value<0 then raise exception 'invalid_fixed_price'; end if;
    v_fixed:=round(p_discount_value)::bigint;
  else raise exception 'invalid_discount_type'; end if;
  if p_validity_type='DAYS_30' then v_expires:=now()+interval '30 days';
  elsif p_validity_type='INDETERMINATE' then v_expires:=null;
  else raise exception 'invalid_validity_type'; end if;
  insert into public.core_customer_discount_coupons(company_id,customer_user_id,contact_id,service_ref,service_name_snapshot,original_price_cents,discount_type,discount_percent,fixed_price_cents,validity_type,expires_at,reason,created_by)
  values(p_company_id,p_customer_user_id,p_contact_id,trim(p_service_ref),trim(p_service_name),p_original_price_cents,p_discount_type,v_percent,v_fixed,p_validity_type,v_expires,nullif(trim(p_reason),''),auth.uid()) returning id into v_id;
  insert into public.core_coupon_events(company_id,coupon_id,customer_user_id,event_type,actor_user_id) values(p_company_id,v_id,p_customer_user_id,'CREATED',auth.uid());
  insert into public.core_coupon_notification_outbox(company_id,coupon_id,customer_user_id,notification_type,payload)
    values(p_company_id,v_id,p_customer_user_id,'COUPON_CREATED',jsonb_build_object('service_ref',p_service_ref,'service_name',p_service_name,'expires_at',v_expires));
  if v_expires is not null then
    insert into public.core_coupon_notification_outbox(company_id,coupon_id,customer_user_id,notification_type,payload,available_at)
      values(p_company_id,v_id,p_customer_user_id,'COUPON_EXPIRING',jsonb_build_object('expires_at',v_expires),greatest(now(),v_expires-interval '3 days'));
  end if;
  return v_id;
end $$;
revoke all on function public.core_coupon_create(uuid,uuid,uuid,text,text,bigint,text,numeric,text,text) from public;
grant execute on function public.core_coupon_create(uuid,uuid,uuid,text,text,bigint,text,numeric,text,text) to authenticated,service_role;

create or replace function public.core_coupon_set_status(p_coupon_id uuid,p_status text,p_reason text default null)
returns boolean language plpgsql security definer set search_path=public,auth as $$
declare c public.core_customer_discount_coupons%rowtype; et text; nt text;
begin
  select * into c from public.core_customer_discount_coupons where id=p_coupon_id for update;
  if c.id is null then raise exception 'coupon_not_found'; end if;
  if not public.core_financial_can_manage_coupons(c.company_id,auth.uid()) then raise exception 'forbidden'; end if;
  if p_status not in ('ACTIVE','SUSPENDED','REVOKED') then raise exception 'invalid_status'; end if;
  if p_status='ACTIVE' and c.expires_at is not null and c.expires_at<=now() then raise exception 'coupon_expired'; end if;
  update public.core_customer_discount_coupons
     set status=p_status,reason=coalesce(nullif(trim(p_reason),''),reason),
         suspended_at=case when p_status='SUSPENDED' then now() else null end,
         suspended_by=case when p_status='SUSPENDED' then auth.uid() else null end,
         revoked_at=case when p_status='REVOKED' then now() else revoked_at end,
         revoked_by=case when p_status='REVOKED' then auth.uid() else revoked_by end,updated_at=now()
   where id=p_coupon_id;
  et:=case p_status when 'ACTIVE' then 'REACTIVATED' when 'SUSPENDED' then 'SUSPENDED' else 'REVOKED' end;
  nt:=case p_status when 'ACTIVE' then 'COUPON_REACTIVATED' when 'SUSPENDED' then 'COUPON_SUSPENDED' else 'COUPON_REVOKED' end;
  insert into public.core_coupon_events(company_id,coupon_id,customer_user_id,event_type,actor_user_id,metadata)
    values(c.company_id,c.id,c.customer_user_id,et,auth.uid(),jsonb_build_object('reason',p_reason));
  insert into public.core_coupon_notification_outbox(company_id,coupon_id,customer_user_id,notification_type,payload)
    values(c.company_id,c.id,c.customer_user_id,nt,jsonb_build_object('service_name',c.service_name_snapshot,'reason',p_reason));
  return true;
end $$;
revoke all on function public.core_coupon_set_status(uuid,text,text) from public;
grant execute on function public.core_coupon_set_status(uuid,text,text) to authenticated,service_role;

create or replace function public.core_coupon_lifecycle_tick()
returns integer language plpgsql security definer set search_path=public,auth as $$
declare r record; n integer:=0;
begin
  for r in select * from public.core_customer_discount_coupons where status='ACTIVE' and expires_at is not null and expires_at<=now() for update skip locked loop
    update public.core_customer_discount_coupons set status='EXPIRED',updated_at=now() where id=r.id;
    insert into public.core_coupon_events(company_id,coupon_id,customer_user_id,event_type) values(r.company_id,r.id,r.customer_user_id,'EXPIRED');
    insert into public.core_coupon_notification_outbox(company_id,coupon_id,customer_user_id,notification_type,payload)
      values(r.company_id,r.id,r.customer_user_id,'COUPON_EXPIRED',jsonb_build_object('service_name',r.service_name_snapshot));
    n:=n+1;
  end loop;
  return n;
end $$;
revoke all on function public.core_coupon_lifecycle_tick() from public,anon,authenticated;
grant execute on function public.core_coupon_lifecycle_tick() to service_role;

create or replace function public.core_resolve_customer_price(p_company_id uuid,p_customer_user_id uuid,p_service_ref text,p_base_price_cents bigint,p_record_application boolean default false)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare c public.core_customer_discount_coupons%rowtype; final_cents bigint; discount_cents bigint;
begin
  if p_customer_user_id is null or not public.core_coupon_registered_customer(p_company_id,p_customer_user_id) then
    return jsonb_build_object('eligible',false,'reason','CUSTOMER_NOT_REGISTERED','base_price_cents',p_base_price_cents,'final_price_cents',p_base_price_cents,'discount_cents',0);
  end if;
  update public.core_customer_discount_coupons set status='EXPIRED',updated_at=now()
   where company_id=p_company_id and customer_user_id=p_customer_user_id and service_ref=p_service_ref and status='ACTIVE' and expires_at is not null and expires_at<=now();
  select * into c from public.core_customer_discount_coupons
   where company_id=p_company_id and customer_user_id=p_customer_user_id and service_ref=p_service_ref
     and status='ACTIVE' and starts_at<=now() and (expires_at is null or expires_at>now())
   order by created_at desc limit 1;
  if c.id is null then
    return jsonb_build_object('eligible',false,'reason','NO_ACTIVE_COUPON','base_price_cents',p_base_price_cents,'final_price_cents',p_base_price_cents,'discount_cents',0);
  end if;
  if c.discount_type='PERCENT' then final_cents:=greatest(0,round(p_base_price_cents*(1-(c.discount_percent/100)))::bigint);
  else final_cents:=greatest(0,c.fixed_price_cents); end if;
  discount_cents:=greatest(0,p_base_price_cents-final_cents);
  if p_record_application then
    insert into public.core_coupon_events(company_id,coupon_id,customer_user_id,event_type,original_price_cents,final_price_cents,discount_amount_cents,actor_user_id)
      values(c.company_id,c.id,c.customer_user_id,'APPLIED',p_base_price_cents,final_cents,discount_cents,auth.uid());
  end if;
  return jsonb_build_object('eligible',true,'coupon_id',c.id,'discount_type',c.discount_type,'discount_percent',c.discount_percent,
    'fixed_price_cents',c.fixed_price_cents,'base_price_cents',p_base_price_cents,'final_price_cents',final_cents,'discount_cents',discount_cents,'expires_at',c.expires_at);
end $$;
revoke all on function public.core_resolve_customer_price(uuid,uuid,text,bigint,boolean) from public,anon;
grant execute on function public.core_resolve_customer_price(uuid,uuid,text,bigint,boolean) to authenticated,service_role;

create or replace function public.core_coupon_bi(p_company_id uuid,p_from timestamptz default null,p_to timestamptz default null)
returns jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare result jsonb;
begin
  if not public.core_financial_can_manage_coupons(p_company_id,auth.uid()) then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'total_coupons',count(*),
    'active_coupons',count(*) filter(where c.status='ACTIVE' and (c.expires_at is null or c.expires_at>now())),
    'suspended_coupons',count(*) filter(where c.status='SUSPENDED'),
    'expired_coupons',count(*) filter(where c.status='EXPIRED' or (c.expires_at is not null and c.expires_at<=now())),
    'customers_with_coupon',count(distinct c.customer_user_id),
    'nominal_discount_cents',coalesce(sum(case when c.discount_type='FIXED_PRICE' then greatest(0,c.original_price_cents-c.fixed_price_cents) else round(c.original_price_cents*(c.discount_percent/100))::bigint end),0),
    'applied_discount_cents',(select coalesce(sum(e.discount_amount_cents),0) from public.core_coupon_events e where e.company_id=p_company_id and e.event_type='APPLIED' and (p_from is null or e.created_at>=p_from) and (p_to is null or e.created_at<p_to)),
    'applications',(select count(*) from public.core_coupon_events e where e.company_id=p_company_id and e.event_type='APPLIED' and (p_from is null or e.created_at>=p_from) and (p_to is null or e.created_at<p_to))
  ) into result
  from public.core_customer_discount_coupons c
  where c.company_id=p_company_id and (p_from is null or c.created_at>=p_from) and (p_to is null or c.created_at<p_to);
  return result;
end $$;
revoke all on function public.core_coupon_bi(uuid,timestamptz,timestamptz) from public;
grant execute on function public.core_coupon_bi(uuid,timestamptz,timestamptz) to authenticated,service_role;

alter table public.core_customer_discount_coupons enable row level security;
alter table public.core_coupon_events enable row level security;
alter table public.core_coupon_notification_outbox enable row level security;

drop policy if exists core_coupons_financial_manage on public.core_customer_discount_coupons;
create policy core_coupons_financial_manage on public.core_customer_discount_coupons for all to authenticated
using (public.core_financial_can_manage_coupons(company_id,auth.uid()) or customer_user_id=auth.uid())
with check (public.core_financial_can_manage_coupons(company_id,auth.uid()));

drop policy if exists core_coupon_events_financial_read on public.core_coupon_events;
create policy core_coupon_events_financial_read on public.core_coupon_events for select to authenticated
using (public.core_financial_can_manage_coupons(company_id,auth.uid()) or customer_user_id=auth.uid());

drop policy if exists core_coupon_outbox_financial_read on public.core_coupon_notification_outbox;
create policy core_coupon_outbox_financial_read on public.core_coupon_notification_outbox for select to authenticated
using (public.core_financial_can_manage_coupons(company_id,auth.uid()));

grant select on public.core_customer_discount_coupons,public.core_coupon_events,public.core_coupon_notification_outbox to authenticated;
grant all on public.core_customer_discount_coupons,public.core_coupon_events,public.core_coupon_notification_outbox to service_role;
