-- Self-service commercial onboarding.
-- Authenticated users can create their own first commercial company. The Core
-- trigger immediately enrolls it in billing, relationship, access and subdomain governance.

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
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if public.is_impulsionando_staff(v_user) or public.is_super_admin(v_user) then
    raise exception 'staff_must_use_core_admin_provisioning';
  end if;

  if nullif(trim(p_name),'') is null or length(trim(p_name)) < 2 then raise exception 'company_name_required'; end if;
  if length(trim(p_name)) > 160 then raise exception 'company_name_too_long'; end if;

  select u.email into v_email from auth.users u where u.id=v_user;
  if nullif(trim(v_email),'') is null then raise exception 'authenticated_email_required'; end if;

  select ur.company_id into v_existing_company
  from public.user_roles ur
  where ur.user_id=v_user and ur.company_id is not null
  order by ur.created_at asc limit 1;

  if v_existing_company is null then
    select ct.company_id into v_existing_company
    from public.communication_tenant_members m
    join public.communication_tenants ct on ct.id=m.tenant_id
    where m.user_id=v_user and ct.company_id is not null and ct.active=true and ct.deleted_at is null
    order by m.created_at asc limit 1;
  end if;

  if v_existing_company is not null then
    select * into v_company from public.companies where id=v_existing_company;
    if not found then raise exception 'existing_company_membership_invalid'; end if;
    select t.id into v_tenant_id from public.communication_tenants t where t.company_id=v_existing_company and t.active=true and t.deleted_at is null order by t.created_at limit 1;
    return jsonb_build_object(
      'created',false,
      'company_id',v_company.id,
      'company_name',v_company.name,
      'tenant_id',v_tenant_id,
      'subdomain',(select i.subdomain from public.core_tenant_identity i where i.company_id=v_company.id),
      'reason','existing_company_membership'
    );
  end if;

  v_requested := nullif(regexp_replace(lower(coalesce(p_requested_slug,'')),'[^a-z0-9-]','','g'),'');

  insert into public.companies(name,legal_name,document,email,phone,is_master,is_active,is_demo,status)
  values(
    trim(p_name),
    nullif(trim(p_legal_name),''),
    nullif(regexp_replace(coalesce(p_document,''),'[^0-9]','','g'),''),
    lower(trim(v_email)),
    nullif(trim(p_phone),''),
    false,true,false,'active'
  ) returning * into v_company;

  -- Direct role is intentionally the ordinary company role, never admin/staff.
  insert into public.user_roles(user_id,role,company_id)
  values(v_user,'empresa'::public.app_role,v_company.id)
  on conflict(user_id,role,company_id) do nothing;

  -- Re-run enrollment with requested slug after the generic insert trigger.
  v_enrollment := public.core_enroll_company(v_company.id,v_requested);
  v_tenant_id := nullif(v_enrollment->>'tenant_id','')::uuid;

  if v_tenant_id is null then
    select t.id into v_tenant_id from public.communication_tenants t where t.company_id=v_company.id and t.active=true and t.deleted_at is null order by t.created_at limit 1;
  end if;

  if v_tenant_id is null then raise exception 'tenant_provisioning_failed'; end if;

  insert into public.communication_tenant_members(tenant_id,user_id,role)
  values(v_tenant_id,v_user,'OWNER')
  on conflict(tenant_id,user_id) do update set role='OWNER';

  insert into public.audit_logs(company_id,action,entity,entity_id,after,metadata)
  values(
    v_company.id,
    'core.self_service_company.created',
    'companies',
    v_company.id::text,
    jsonb_build_object('name',v_company.name,'email',v_company.email,'subdomain',v_enrollment->>'subdomain'),
    jsonb_build_object('actor_user_id',v_user,'source','self_service_onboarding','billing_required',true,'relationship_required',true)
  );

  return jsonb_build_object(
    'created',true,
    'company_id',v_company.id,
    'company_name',v_company.name,
    'tenant_id',v_tenant_id,
    'subdomain',v_enrollment->>'subdomain',
    'lifecycle_status',v_enrollment->>'lifecycle_status',
    'access_mode','financial_onboarding_only',
    'due_day',5
  );
end;
$$;

grant execute on function public.core_self_service_create_company(text,text,text,text,text) to authenticated;
