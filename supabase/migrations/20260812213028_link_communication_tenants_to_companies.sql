alter table public.communication_tenants add column if not exists company_id uuid references public.companies(id) on delete set null;

update public.communication_tenants
set company_id=nullif(settings->>'company_id','')::uuid
where company_id is null
  and settings ? 'company_id'
  and nullif(settings->>'company_id','') is not null;

update public.communication_tenants
set company_id=public.master_company_id(),
    settings=coalesce(settings,'{}'::jsonb)||jsonb_build_object('company_id',public.master_company_id())
where slug='impulsionando' and company_id is null;

create index if not exists idx_communication_tenants_company on public.communication_tenants(company_id);

update public.communication_tenants
set settings=coalesce(settings,'{}'::jsonb)||jsonb_build_object('company_id',company_id)
where company_id is not null and coalesce(settings->>'company_id','')<>company_id::text;

drop policy if exists crm_contact_tags_company on public.crm_contact_tags;
create policy crm_contact_tags_company
on public.crm_contact_tags
for all to authenticated
using(
  exists(
    select 1
    from public.crm_tags t
    join public.communication_contacts c on c.id=contact_id
    join public.communication_tenants ct on ct.id=c.tenant_id
    where t.id=tag_id
      and ct.company_id=t.company_id
      and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),t.company_id))
  )
)
with check(
  exists(
    select 1
    from public.crm_tags t
    join public.communication_contacts c on c.id=contact_id
    join public.communication_tenants ct on ct.id=c.tenant_id
    where t.id=tag_id
      and ct.company_id=t.company_id
      and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),t.company_id))
  )
);