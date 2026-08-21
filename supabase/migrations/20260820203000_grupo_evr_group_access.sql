-- Grupo EVR — group-level access without merging company data.
-- The three operating companies remain distinct company records.
-- No generated ids, company ids, or user ids are hardcoded here.

create table if not exists public.evr_group_registry (
  id uuid primary key default gen_random_uuid(),
  group_key text not null unique,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evr_group_companies (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.evr_group_registry(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  context_key text not null check (context_key in ('instituto_evr','dr_responde','ativese_pharma')),
  display_name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(group_id, company_id),
  unique(group_id, context_key)
);

create table if not exists public.evr_group_user_access (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.evr_group_registry(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_level text not null default 'viewer' check (access_level in ('super_master','director','admin','manager','viewer')),
  can_view_consolidated boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create table if not exists public.evr_group_user_company_access (
  id uuid primary key default gen_random_uuid(),
  group_user_access_id uuid not null references public.evr_group_user_access(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  can_view boolean not null default true,
  can_operate boolean not null default false,
  can_view_financial boolean not null default false,
  can_view_clinical boolean not null default false,
  can_view_pharmacy boolean not null default false,
  can_export boolean not null default false,
  created_at timestamptz not null default now(),
  unique(group_user_access_id, company_id)
);

alter table public.evr_group_registry enable row level security;
alter table public.evr_group_companies enable row level security;
alter table public.evr_group_user_access enable row level security;
alter table public.evr_group_user_company_access enable row level security;

create policy evr_group_registry_visible on public.evr_group_registry
for select to authenticated
using (
  exists (
    select 1 from public.evr_group_user_access a
    where a.group_id = evr_group_registry.id
      and a.user_id = auth.uid()
      and a.active = true
  )
);

create policy evr_group_companies_visible on public.evr_group_companies
for select to authenticated
using (
  exists (
    select 1
    from public.evr_group_user_access a
    join public.evr_group_user_company_access ca on ca.group_user_access_id = a.id
    where a.group_id = evr_group_companies.group_id
      and a.user_id = auth.uid()
      and a.active = true
      and ca.company_id = evr_group_companies.company_id
      and ca.can_view = true
  )
  or exists (
    select 1 from public.evr_group_user_access a
    where a.group_id = evr_group_companies.group_id
      and a.user_id = auth.uid()
      and a.active = true
      and a.access_level = 'super_master'
  )
);

create policy evr_group_user_access_self on public.evr_group_user_access
for select to authenticated
using (user_id = auth.uid());

create policy evr_group_user_company_access_self on public.evr_group_user_company_access
for select to authenticated
using (
  exists (
    select 1 from public.evr_group_user_access a
    where a.id = evr_group_user_company_access.group_user_access_id
      and a.user_id = auth.uid()
      and a.active = true
  )
);

grant select on public.evr_group_registry, public.evr_group_companies, public.evr_group_user_access, public.evr_group_user_company_access to authenticated;
grant all on public.evr_group_registry, public.evr_group_companies, public.evr_group_user_access, public.evr_group_user_company_access to service_role;

comment on table public.evr_group_companies is 'Maps the three legally/operationally distinct Grupo EVR companies into one executive portal without merging their data.';
comment on table public.evr_group_user_access is 'Group-level executive access; consolidated view is permission-controlled.';
comment on table public.evr_group_user_company_access is 'Per-company capability matrix inside Grupo EVR.';
