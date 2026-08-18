-- CHRISMED Saúde Corporativa — P0
-- Camada aditiva sobre Core CRM/omnichannel existente. Não duplica contatos, empresas ou pipeline core.

create table if not exists public.chrismed_corporate_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  cnpj text,
  segment text,
  cnae text,
  employee_count integer check (employee_count is null or employee_count >= 0),
  unit_count integer check (unit_count is null or unit_count >= 0),
  cities jsonb not null default '[]'::jsonb,
  shifts jsonb not null default '[]'::jsonb,
  risk_profile jsonb not null default '{}'::jsonb,
  current_provider text,
  implementation_target_date date,
  lifecycle_status text not null default 'prospect' check (lifecycle_status in ('prospect','qualification','proposal','contracting','onboarding','active','paused','closed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_chrismed_corporate_accounts_tenant_cnpj
  on public.chrismed_corporate_accounts(tenant_id,cnpj)
  where cnpj is not null;
create index if not exists idx_chrismed_corporate_accounts_status
  on public.chrismed_corporate_accounts(tenant_id,lifecycle_status,updated_at desc);

create table if not exists public.chrismed_corporate_contact_roles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.chrismed_corporate_accounts(id) on delete cascade,
  contact_id uuid not null references public.communication_contacts(id) on delete cascade,
  role_type text not null check (role_type in ('executive','hr','sst','procurement','finance','legal_compliance','operations','employee','other')),
  job_title text,
  decision_role text check (decision_role is null or decision_role in ('decision_maker','influencer','technical','user','gatekeeper')),
  primary_contact boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,contact_id,role_type)
);
create index if not exists idx_chrismed_corporate_contact_roles_account
  on public.chrismed_corporate_contact_roles(account_id,role_type,active);

create table if not exists public.chrismed_corporate_workers (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.chrismed_corporate_accounts(id) on delete cascade,
  contact_id uuid references public.communication_contacts(id) on delete set null,
  external_employee_code text,
  unit_name text,
  department text,
  job_role text,
  employment_status text not null default 'active' check (employment_status in ('pre_hire','active','leave','terminated')),
  occupational_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,external_employee_code)
);
create index if not exists idx_chrismed_corporate_workers_account_status
  on public.chrismed_corporate_workers(account_id,employment_status,unit_name);

create table if not exists public.chrismed_corporate_programs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.chrismed_corporate_accounts(id) on delete cascade,
  program_type text not null,
  name text not null,
  status text not null default 'planned' check (status in ('planned','active','paused','completed','cancelled')),
  starts_on date,
  ends_on date,
  sla jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_chrismed_corporate_programs_account
  on public.chrismed_corporate_programs(account_id,status,program_type);

-- Pipeline comercial específico do tenant CHRISMED, reutilizando o Core CRM.
insert into public.crm_pipelines(company_id,name,is_default)
select t.company_id,'CHRISMED Saúde Corporativa',false
from public.communication_tenants t
where t.slug='chrismed' and t.company_id is not null
on conflict(company_id,name) do nothing;

insert into public.crm_pipeline_stages(pipeline_id,code,name,sort_order,is_won,is_lost)
select p.id,s.code,s.name,s.ord,s.won,s.lost
from public.crm_pipelines p
join public.communication_tenants t on t.company_id=p.company_id and t.slug='chrismed'
cross join (values
 ('lead','Lead',10,false,false),
 ('qualification','Qualificação',20,false,false),
 ('diagnosis','Diagnóstico',30,false,false),
 ('sizing','Dimensionamento',40,false,false),
 ('proposal','Proposta',50,false,false),
 ('accepted','Aceite',60,false,false),
 ('contracting','Contrato',70,false,false),
 ('onboarding','Onboarding',80,false,false),
 ('active','Operação ativa',90,true,false),
 ('lost','Perdido',100,false,true)
) as s(code,name,ord,won,lost)
where p.name='CHRISMED Saúde Corporativa'
on conflict(pipeline_id,code) do update set
  name=excluded.name,
  sort_order=excluded.sort_order,
  is_won=excluded.is_won,
  is_lost=excluded.is_lost,
  active=true;

-- Tags de qualificação B2B no CRM universal.
insert into public.crm_tags(company_id,name,slug)
select t.company_id,x.name,x.slug
from public.communication_tenants t
cross join (values
 ('CHRISMED · Diretoria','chrismed-diretoria'),
 ('CHRISMED · RH','chrismed-rh'),
 ('CHRISMED · SST','chrismed-sst'),
 ('CHRISMED · Compras','chrismed-compras'),
 ('CHRISMED · Financeiro','chrismed-financeiro'),
 ('CHRISMED · Jurídico e Compliance','chrismed-juridico-compliance'),
 ('CHRISMED · Operações','chrismed-operacoes'),
 ('CHRISMED · Colaborador','chrismed-colaborador')
) as x(name,slug)
where t.slug='chrismed' and t.company_id is not null
on conflict(company_id,slug) do nothing;

alter table public.chrismed_corporate_accounts enable row level security;
alter table public.chrismed_corporate_contact_roles enable row level security;
alter table public.chrismed_corporate_workers enable row level security;
alter table public.chrismed_corporate_programs enable row level security;

revoke all on public.chrismed_corporate_accounts,public.chrismed_corporate_contact_roles,public.chrismed_corporate_workers,public.chrismed_corporate_programs from anon;
grant all on public.chrismed_corporate_accounts,public.chrismed_corporate_contact_roles,public.chrismed_corporate_workers,public.chrismed_corporate_programs to service_role;
grant select,insert,update on public.chrismed_corporate_accounts,public.chrismed_corporate_contact_roles,public.chrismed_corporate_workers,public.chrismed_corporate_programs to authenticated;

create policy chrismed_corporate_accounts_access on public.chrismed_corporate_accounts
for all to authenticated
using (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),tenant_id))
with check (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),tenant_id));

create policy chrismed_corporate_contact_roles_access on public.chrismed_corporate_contact_roles
for all to authenticated
using (exists(select 1 from public.chrismed_corporate_accounts a where a.id=account_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),a.tenant_id))))
with check (exists(select 1 from public.chrismed_corporate_accounts a where a.id=account_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),a.tenant_id))));

create policy chrismed_corporate_workers_access on public.chrismed_corporate_workers
for all to authenticated
using (exists(select 1 from public.chrismed_corporate_accounts a where a.id=account_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),a.tenant_id))))
with check (exists(select 1 from public.chrismed_corporate_accounts a where a.id=account_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),a.tenant_id))));

create policy chrismed_corporate_programs_access on public.chrismed_corporate_programs
for all to authenticated
using (exists(select 1 from public.chrismed_corporate_accounts a where a.id=account_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),a.tenant_id))))
with check (exists(select 1 from public.chrismed_corporate_accounts a where a.id=account_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),a.tenant_id))));

comment on table public.chrismed_corporate_accounts is 'Contas B2B de Saúde Corporativa CHRISMED; dados clínicos individuais não pertencem a esta tabela.';
comment on table public.chrismed_corporate_workers is 'Vínculo operacional do colaborador com conta corporativa; não armazenar prontuário ou conteúdo clínico neste registro.';
