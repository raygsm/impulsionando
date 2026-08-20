-- Harden universal client enrollment/subdomain lifecycle.

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

  if coalesce(v_company.is_master,false)
     or coalesce(v_company.is_demo,false)
     or not coalesce(v_company.is_active,false)
     or lower(coalesce(v_company.status,'')) in ('archived','cancelled') then
    return jsonb_build_object('enrolled',false,'reason','company_not_billable_active_client');
  end if;

  v_slug := nullif(regexp_replace(lower(coalesce(p_requested_slug,'')),'[^a-z0-9-]','','g'),'');

  if v_slug is not null and exists(
    select 1 from public.communication_tenants t
    where t.slug=v_slug and t.company_id is distinct from p_company_id
  ) then
    v_slug := public.core_unique_company_slug(p_company_id,v_slug);
  end if;

  if v_slug is null then
    select t.slug into v_slug
    from public.communication_tenants t
    where t.company_id=p_company_id and t.active=true and t.deleted_at is null
    order by t.created_at limit 1;
  end if;
  if v_slug is null then v_slug := public.core_unique_company_slug(p_company_id,v_company.name); end if;

  select t.id into v_tenant_id
  from public.communication_tenants t
  where t.company_id=p_company_id and t.active=true and t.deleted_at is null
  order by t.created_at limit 1;

  if v_tenant_id is null then
    insert into public.communication_tenants(kind,slug,legal_name,display_name,locale,timezone,settings,active,company_id)
    values('COMPANY',v_slug,v_company.legal_name,v_company.name,'pt-BR','America/Sao_Paulo',jsonb_build_object('core_auto_enrolled',true),true,p_company_id)
    returning id into v_tenant_id;
  else
    update public.communication_tenants
    set slug=v_slug,
        legal_name=v_company.legal_name,
        display_name=v_company.name,
        active=true,
        deleted_at=null,
        settings=coalesce(settings,'{}'::jsonb)||jsonb_build_object('core_auto_enrolled',true),
        updated_at=now()
    where id=v_tenant_id;
  end if;

  insert into public.core_tenant_identity(company_id,subdomain,root_domain,dns_status,ssl_status,metadata,updated_at)
  values(
    p_company_id,v_slug,'impulsionando.com.br','pending','pending',
    jsonb_build_object(
      'source','core_universal_enrollment',
      'tenant_id',v_tenant_id,
      'auto_provision',true,
      'client_managed_subdomain',true
    ),now()
  )
  on conflict(company_id) do update set
    subdomain=coalesce(public.core_tenant_identity.subdomain,excluded.subdomain),
    root_domain='impulsionando.com.br',
    metadata=coalesce(public.core_tenant_identity.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  select * into v_contract
  from public.billing_contracts
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
    billing_required=true,
    relationship_required=true,
    core_required=true,
    subdomain_required=true,
    metadata=coalesce(public.core_client_enrollment.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  insert into public.core_service_access_state(company_id,state,reason,metadata,updated_at)
  values(
    p_company_id,
    case
      when v_contract.id is null then 'warning'
      when v_contract.status='suspended' then 'suspended_nonpayment'
      when v_contract.status='past_due' then 'past_due'
      else 'active'
    end,
    case when v_contract.id is null then 'commercial_plan_required' else 'core_universal_enrollment' end,
    jsonb_build_object(
      'access_mode',case
        when v_contract.id is null then 'financial_onboarding_only'
        when v_contract.status='suspended' then 'financial_only'
        else 'full'
      end,
      'due_day',5
    ),
    now()
  )
  on conflict(company_id) do update set
    state=excluded.state,
    reason=excluded.reason,
    metadata=coalesce(public.core_service_access_state.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  return jsonb_build_object(
    'enrolled',true,
    'company_id',p_company_id,
    'tenant_id',v_tenant_id,
    'subdomain',v_slug,
    'lifecycle_status',v_lifecycle,
    'contract_id',v_contract.id
  );
end;
$$;

create or replace function public.core_company_lifecycle_sync()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
begin
  if coalesce(new.is_active,false)
     and not coalesce(new.is_master,false)
     and not coalesce(new.is_demo,false)
     and lower(coalesce(new.status,'')) not in ('archived','cancelled') then
    perform public.core_enroll_company(new.id,null);
  elsif exists(select 1 from public.core_client_enrollment e where e.company_id=new.id) then
    update public.core_client_enrollment
    set lifecycle_status='archived',updated_at=now(),
        metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('excluded_from_active_client_policy_at',now())
    where company_id=new.id;

    update public.core_service_access_state
    set state='maintenance',reason='company_not_active_billable_client',updated_at=now(),
        metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('access_mode','financial_only')
    where company_id=new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_core_company_after_insert_enroll on public.companies;
drop trigger if exists trg_core_company_lifecycle_sync on public.companies;
create trigger trg_core_company_lifecycle_sync
after insert or update of is_active,is_master,is_demo,status,name,legal_name
on public.companies
for each row execute function public.core_company_lifecycle_sync();

-- Remove obvious automated test tenants from the production subdomain reconciler.
update public.communication_tenants t
set active=false,deleted_at=coalesce(deleted_at,now()),updated_at=now(),
    settings=coalesce(settings,'{}'::jsonb)||jsonb_build_object('excluded_reason','automated_test_company')
from public.companies c
where t.company_id=c.id and c.is_demo=true
  and (c.name like 'Cross A %' or c.name like 'Cross B %' or c.name like 'Storage Co %');

delete from public.core_tenant_identity i
using public.companies c
where i.company_id=c.id and c.is_demo=true
  and (c.name like 'Cross A %' or c.name like 'Cross B %' or c.name like 'Storage Co %');
