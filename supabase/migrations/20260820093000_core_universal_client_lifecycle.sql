-- Universal client lifecycle enrollment
-- Every active non-master, non-demo company is part of the Core and subject to billing/access governance.
-- No commercial price/plan is invented: companies without a billing contract remain financial/onboarding-only
-- until an explicit plan is selected and accepted.

create table if not exists public.core_client_enrollment (
  company_id uuid primary key references public.companies(id) on delete restrict,
  lifecycle_status text not null default 'plan_required' check (lifecycle_status in ('plan_required','contract_active','past_due','suspended','cancelled','archived')),
  billing_required boolean not null default true,
  relationship_required boolean not null default true,
  core_required boolean not null default true,
  subdomain_required boolean not null default true,
  plan_id uuid null references public.billing_plans(id) on delete restrict,
  contract_id uuid null references public.billing_contracts(id) on delete set null,
  source text not null default 'core_universal_policy',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_core_client_enrollment_lifecycle on public.core_client_enrollment(lifecycle_status);

create or replace function public.core_slugify_company_name(p_name text)
returns text
language plpgsql
immutable
set search_path to 'pg_catalog'
as $$
declare v text;
begin
  v := lower(coalesce(p_name,''));
  v := translate(v,'áàãâäéèêëíìîïóòõôöúùûüçñ','aaaaaeeeeiiiiooooouuuucn');
  v := regexp_replace(v,'[^a-z0-9]+','-','g');
  v := trim(both '-' from v);
  if v = '' then v := 'cliente'; end if;
  return left(v,48);
end;
$$;

create or replace function public.core_unique_company_slug(p_company_id uuid, p_name text)
returns text
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_base text := public.core_slugify_company_name(p_name);
  v_slug text;
  v_i integer := 0;
begin
  v_slug := v_base;
  while exists(select 1 from public.communication_tenants t where t.slug=v_slug and t.company_id is distinct from p_company_id) loop
    v_i := v_i + 1;
    v_slug := left(v_base,42) || '-' || v_i::text;
  end loop;
  return v_slug;
end;
$$;

create or replace function public.core_enroll_company(p_company_id uuid, p_requested_slug text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_company public.companies%rowtype;
  v_slug text;
  v_tenant_id uuid;
  v_contract public.billing_contracts%rowtype;
  v_lifecycle text;
begin
  select * into v_company from public.companies where id=p_company_id for update;
  if not found then raise exception 'company_not_found'; end if;

  if coalesce(v_company.is_master,false) or coalesce(v_company.is_demo,false) or not coalesce(v_company.is_active,false) or lower(coalesce(v_company.status,'')) in ('archived','cancelled') then
    return jsonb_build_object('enrolled',false,'reason','company_not_billable_active_client');
  end if;

  v_slug := nullif(regexp_replace(lower(coalesce(p_requested_slug,'')),'[^a-z0-9-]','','g'),'');
  if v_slug is null then
    select t.slug into v_slug from public.communication_tenants t where t.company_id=p_company_id and t.active=true and t.deleted_at is null order by t.created_at limit 1;
  end if;
  if v_slug is null then v_slug := public.core_unique_company_slug(p_company_id,v_company.name); end if;

  insert into public.communication_tenants(kind,slug,legal_name,display_name,locale,timezone,settings,active,company_id)
  values('COMPANY',v_slug,v_company.legal_name,v_company.name,'pt-BR','America/Sao_Paulo',jsonb_build_object('core_auto_enrolled',true),true,p_company_id)
  on conflict(slug) do update set
    company_id=excluded.company_id, display_name=excluded.display_name, legal_name=excluded.legal_name,
    active=true, deleted_at=null, updated_at=now()
  returning id into v_tenant_id;

  insert into public.core_tenant_identity(company_id,subdomain,root_domain,dns_status,ssl_status,metadata,updated_at)
  values(p_company_id,v_slug,'impulsionando.com.br','pending','pending',jsonb_build_object('source','core_universal_enrollment','tenant_id',v_tenant_id,'auto_provision',true,'client_managed_subdomain',true),now())
  on conflict(company_id) do update set
    subdomain=coalesce(public.core_tenant_identity.subdomain,excluded.subdomain),
    root_domain='impulsionando.com.br',
    metadata=coalesce(public.core_tenant_identity.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  select * into v_contract from public.billing_contracts
  where company_id=p_company_id and status not in ('cancelled','archived')
  order by created_at desc limit 1;

  v_lifecycle := case
    when v_contract.id is null then 'plan_required'
    when v_contract.status='suspended' then 'suspended'
    when v_contract.status='past_due' then 'past_due'
    else 'contract_active'
  end;

  insert into public.core_client_enrollment(company_id,lifecycle_status,plan_id,contract_id,metadata,updated_at)
  values(p_company_id,v_lifecycle,v_contract.plan_id,v_contract.id,jsonb_build_object('tenant_id',v_tenant_id,'subdomain',v_slug,'due_day',5),now())
  on conflict(company_id) do update set
    lifecycle_status=excluded.lifecycle_status,
    plan_id=excluded.plan_id,
    contract_id=excluded.contract_id,
    billing_required=true, relationship_required=true, core_required=true, subdomain_required=true,
    metadata=coalesce(public.core_client_enrollment.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  insert into public.core_service_access_state(company_id,state,reason,metadata,updated_at)
  values(
    p_company_id,
    case when v_contract.id is null then 'warning' when v_contract.status='suspended' then 'suspended_nonpayment' when v_contract.status='past_due' then 'past_due' else 'active' end,
    case when v_contract.id is null then 'commercial_plan_required' else 'core_universal_enrollment' end,
    jsonb_build_object('access_mode',case when v_contract.id is null then 'financial_onboarding_only' when v_contract.status in ('suspended','past_due') then 'financial_only' else 'full' end,'due_day',5),
    now()
  )
  on conflict(company_id) do update set
    metadata=coalesce(public.core_service_access_state.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  return jsonb_build_object('enrolled',true,'company_id',p_company_id,'tenant_id',v_tenant_id,'subdomain',v_slug,'lifecycle_status',v_lifecycle,'contract_id',v_contract.id);
end;
$$;

create or replace function public.core_company_after_insert_enroll()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
begin
  if coalesce(new.is_active,false) and not coalesce(new.is_master,false) and not coalesce(new.is_demo,false) and lower(coalesce(new.status,'')) not in ('archived','cancelled') then
    perform public.core_enroll_company(new.id,null);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_core_company_after_insert_enroll on public.companies;
create trigger trg_core_company_after_insert_enroll
after insert on public.companies
for each row execute function public.core_company_after_insert_enroll();

create or replace function public.core_refresh_client_enrollment_from_contract()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare v_status text; v_access text; v_reason text;
begin
  v_status := case when new.status='suspended' then 'suspended' when new.status='past_due' then 'past_due' when new.status in ('cancelled','archived') then new.status else 'contract_active' end;
  v_access := case when new.status='suspended' then 'suspended_nonpayment' when new.status='past_due' then 'past_due' when new.status in ('cancelled','archived') then 'maintenance' else 'active' end;
  v_reason := case when new.status='suspended' then 'invoice_overdue' when new.status='past_due' then 'payment_past_due' when new.status in ('cancelled','archived') then 'contract_'||new.status else 'contract_active' end;

  insert into public.core_client_enrollment(company_id,lifecycle_status,plan_id,contract_id,metadata,updated_at)
  values(new.company_id,v_status,new.plan_id,new.id,jsonb_build_object('due_day',5),now())
  on conflict(company_id) do update set lifecycle_status=excluded.lifecycle_status,plan_id=excluded.plan_id,contract_id=excluded.contract_id,updated_at=now();

  insert into public.core_service_access_state(company_id,state,reason,metadata,updated_at)
  values(new.company_id,v_access,v_reason,jsonb_build_object('access_mode',case when v_access='active' then 'full' else 'financial_only' end,'contract_id',new.id,'due_day',5),now())
  on conflict(company_id) do update set state=excluded.state,reason=excluded.reason,metadata=coalesce(public.core_service_access_state.metadata,'{}'::jsonb)||excluded.metadata,updated_at=now();
  return new;
end;
$$;

drop trigger if exists trg_core_refresh_client_enrollment_from_contract on public.billing_contracts;
create trigger trg_core_refresh_client_enrollment_from_contract
after insert or update of status,plan_id,next_due_date on public.billing_contracts
for each row execute function public.core_refresh_client_enrollment_from_contract();

create or replace view public.core_company_access_policy as
select
  c.id as company_id,
  c.name as company_name,
  e.lifecycle_status,
  e.billing_required,
  e.plan_id,
  e.contract_id,
  s.state as service_state,
  coalesce(s.metadata->>'access_mode',case when s.state='active' then 'full' else 'financial_only' end) as access_mode,
  t.subdomain,
  t.root_domain,
  case when coalesce(s.metadata->>'access_mode','financial_only')='full' then false else true end as watermark_required,
  case when coalesce(s.metadata->>'access_mode','financial_only')='full' then false else true end as finance_only
from public.companies c
join public.core_client_enrollment e on e.company_id=c.id
left join public.core_service_access_state s on s.company_id=c.id
left join public.core_tenant_identity t on t.company_id=c.id
where c.is_active=true and coalesce(c.is_master,false)=false and coalesce(c.is_demo,false)=false;

-- Backfill every real active client currently represented by an active communication tenant.
do $$
declare r record;
begin
  for r in
    select distinct c.id,ct.slug
    from public.companies c
    join public.communication_tenants ct on ct.company_id=c.id and ct.active=true and ct.deleted_at is null
    where c.is_active=true and coalesce(c.is_master,false)=false and coalesce(c.is_demo,false)=false and lower(coalesce(c.status,'')) not in ('archived','cancelled')
  loop
    perform public.core_enroll_company(r.id,r.slug);
  end loop;
end;
$$;
