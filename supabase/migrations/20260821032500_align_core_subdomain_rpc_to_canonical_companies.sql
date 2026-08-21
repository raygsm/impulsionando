-- Align subdomain/onboarding RPCs with the current canonical companies schema.
-- Domain identity lives exclusively in core_tenant_identity / communication_tenants.

create or replace function public.core_set_company_subdomain(
  p_company_id uuid,
  p_requested_slug text
)
returns text
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_company public.companies%rowtype;
  v_slug text;
  v_tenant_id uuid;
  v_old_slug text;
begin
  select * into v_company from public.companies where id=p_company_id for update;
  if not found then raise exception 'company_not_found'; end if;
  if coalesce(v_company.is_master,false) or coalesce(v_company.is_demo,false)
     or not coalesce(v_company.is_active,false)
     or lower(coalesce(v_company.status,'')) in ('archived','cancelled') then
    raise exception 'company_not_eligible_for_public_subdomain';
  end if;

  v_slug := lower(trim(coalesce(p_requested_slug,'')));
  if length(v_slug) < 3 or length(v_slug) > 40
     or v_slug !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
     or v_slug like '%--%' then raise exception 'invalid_subdomain'; end if;
  if v_slug in ('www','app','api','admin','auth','mail','smtp','imap','pop','status','impulsionando') then
    raise exception 'reserved_subdomain';
  end if;
  if exists(select 1 from public.core_tenant_identity i where i.subdomain=v_slug and i.company_id is distinct from p_company_id)
     or exists(select 1 from public.communication_tenants t where t.slug=v_slug and t.company_id is distinct from p_company_id and t.deleted_at is null) then
    raise exception 'subdomain_already_in_use';
  end if;

  select t.id into v_tenant_id from public.communication_tenants t
  where t.company_id=p_company_id and t.active=true and t.deleted_at is null
  order by t.created_at limit 1;
  if v_tenant_id is null then
    perform public.core_enroll_company(p_company_id,null);
    select t.id into v_tenant_id from public.communication_tenants t
    where t.company_id=p_company_id and t.active=true and t.deleted_at is null
    order by t.created_at limit 1;
  end if;
  if v_tenant_id is null then raise exception 'communication_tenant_missing'; end if;

  select i.subdomain into v_old_slug from public.core_tenant_identity i where i.company_id=p_company_id;

  update public.communication_tenants
  set slug=v_slug, display_name=v_company.name, legal_name=v_company.legal_name,
      active=true, deleted_at=null,
      settings=coalesce(settings,'{}'::jsonb)||jsonb_build_object('core_auto_enrolled',true,'canonical_subdomain',v_slug),
      updated_at=now()
  where id=v_tenant_id;

  insert into public.core_tenant_identity(
    company_id,subdomain,root_domain,dns_status,ssl_status,provisioned_at,dns_error,metadata,updated_at
  ) values(
    p_company_id,v_slug,'impulsionando.com.br','pending','pending',null,null,
    jsonb_build_object('source','core_canonical_subdomain','tenant_id',v_tenant_id,'auto_provision',true,'client_managed_subdomain',true),now()
  )
  on conflict(company_id) do update set
    subdomain=excluded.subdomain,
    root_domain=excluded.root_domain,
    dns_status=case when public.core_tenant_identity.subdomain is distinct from excluded.subdomain then 'pending' else public.core_tenant_identity.dns_status end,
    ssl_status=case when public.core_tenant_identity.subdomain is distinct from excluded.subdomain then 'pending' else public.core_tenant_identity.ssl_status end,
    dns_last_checked_at=case when public.core_tenant_identity.subdomain is distinct from excluded.subdomain then null else public.core_tenant_identity.dns_last_checked_at end,
    ssl_issued_at=case when public.core_tenant_identity.subdomain is distinct from excluded.subdomain then null else public.core_tenant_identity.ssl_issued_at end,
    ssl_expires_at=case when public.core_tenant_identity.subdomain is distinct from excluded.subdomain then null else public.core_tenant_identity.ssl_expires_at end,
    provisioned_at=case when public.core_tenant_identity.subdomain is distinct from excluded.subdomain then null else public.core_tenant_identity.provisioned_at end,
    dns_error=null,
    metadata=coalesce(public.core_tenant_identity.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  update public.core_client_enrollment
  set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
        'tenant_id',v_tenant_id,
        'subdomain',v_slug,
        'subdomain_changed_at',case when v_old_slug is distinct from v_slug then now() else null end
      ),
      updated_at=now()
  where company_id=p_company_id;

  insert into public.audit_logs(company_id,action,entity,entity_id,before,after,metadata)
  values(p_company_id,
    case when v_old_slug is null then 'core.subdomain.assigned' else 'core.subdomain.changed' end,
    'core_tenant_identity',p_company_id::text,
    jsonb_build_object('subdomain',v_old_slug),
    jsonb_build_object('subdomain',v_slug,'root_domain','impulsionando.com.br'),
    jsonb_build_object('source','core_set_company_subdomain','automatic_dns_reconcile',true));

  return v_slug;
end;
$$;

revoke all on function public.core_set_company_subdomain(uuid,text) from public,anon,authenticated;
grant execute on function public.core_set_company_subdomain(uuid,text) to service_role;

create or replace function public.core_self_service_create_company(
  p_name text,
  p_legal_name text default null,
  p_document text default null,
  p_phone text default null,
  p_requested_slug text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public','auth'
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_existing_company uuid;
  v_company public.companies%rowtype;
  v_enrollment jsonb;
  v_tenant_id uuid;
  v_requested text;
  v_slug text;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if public.is_impulsionando_staff(v_user) or public.is_super_admin(v_user) then raise exception 'staff_must_use_core_admin_provisioning'; end if;
  if nullif(trim(p_name),'') is null or length(trim(p_name)) < 2 then raise exception 'company_name_required'; end if;
  if length(trim(p_name)) > 160 then raise exception 'company_name_too_long'; end if;

  select u.email into v_email from auth.users u where u.id=v_user;
  if nullif(trim(v_email),'') is null then raise exception 'authenticated_email_required'; end if;

  select ur.company_id into v_existing_company from public.user_roles ur
  where ur.user_id=v_user and ur.company_id is not null order by ur.created_at asc limit 1;
  if v_existing_company is null then
    select ct.company_id into v_existing_company
    from public.communication_tenant_members m join public.communication_tenants ct on ct.id=m.tenant_id
    where m.user_id=v_user and ct.company_id is not null and ct.active=true and ct.deleted_at is null
    order by m.created_at asc limit 1;
  end if;

  if v_existing_company is not null then
    select * into v_company from public.companies where id=v_existing_company;
    if not found then raise exception 'existing_company_membership_invalid'; end if;
    select t.id into v_tenant_id from public.communication_tenants t
      where t.company_id=v_existing_company and t.active=true and t.deleted_at is null order by t.created_at limit 1;
    return jsonb_build_object('created',false,'company_id',v_company.id,'company_name',v_company.name,
      'tenant_id',v_tenant_id,'subdomain',(select i.subdomain from public.core_tenant_identity i where i.company_id=v_company.id),
      'reason','existing_company_membership');
  end if;

  v_requested := nullif(lower(trim(coalesce(p_requested_slug,''))),'');
  insert into public.companies(name,legal_name,document,email,phone,is_master,is_active,is_demo,status)
  values(trim(p_name),nullif(trim(p_legal_name),''),nullif(regexp_replace(coalesce(p_document,''),'[^0-9]','','g'),''),
    lower(trim(v_email)),nullif(trim(p_phone),''),false,true,false,'active')
  returning * into v_company;

  insert into public.user_roles(user_id,role,company_id)
  values(v_user,'empresa'::public.app_role,v_company.id)
  on conflict(user_id,role,company_id) do nothing;

  v_enrollment := public.core_enroll_company(v_company.id,null);
  if v_requested is not null then v_slug := public.core_set_company_subdomain(v_company.id,v_requested);
  else v_slug := v_enrollment->>'subdomain'; end if;

  select t.id into v_tenant_id from public.communication_tenants t
  where t.company_id=v_company.id and t.active=true and t.deleted_at is null order by t.created_at limit 1;
  if v_tenant_id is null then raise exception 'tenant_provisioning_failed'; end if;

  insert into public.communication_tenant_members(tenant_id,user_id,role)
  values(v_tenant_id,v_user,'OWNER')
  on conflict(tenant_id,user_id) do update set role='OWNER';

  insert into public.audit_logs(company_id,action,entity,entity_id,after,metadata)
  values(v_company.id,'core.self_service_company.created','companies',v_company.id::text,
    jsonb_build_object('name',v_company.name,'email',v_company.email,'subdomain',v_slug),
    jsonb_build_object('actor_user_id',v_user,'source','self_service_onboarding','billing_required',true,
      'relationship_required',true,'automatic_dns_reconcile',true));

  return jsonb_build_object('created',true,'company_id',v_company.id,'company_name',v_company.name,'tenant_id',v_tenant_id,
    'subdomain',v_slug,'lifecycle_status',(select lifecycle_status from public.core_client_enrollment where company_id=v_company.id),
    'access_mode','financial_onboarding_only','due_day',5,'dns_status','pending');
end;
$$;

revoke all on function public.core_self_service_create_company(text,text,text,text,text) from public,anon;
grant execute on function public.core_self_service_create_company(text,text,text,text,text) to authenticated;
