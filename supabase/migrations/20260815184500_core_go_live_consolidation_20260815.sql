-- Core Impulsionando — consolidação de GO-LIVE 2026-08-15
-- Migration idempotente para manter replay de schema alinhado ao estado homologado.

-- 1) Billing policy: vencimento dia 5, pré-pago, pro rata recorrente e setup integral.
create table if not exists public.core_billing_policy (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null unique,
  due_day smallint not null default 5 check (due_day = 5),
  prepaid boolean not null default true check (prepaid = true),
  recurring_prorata boolean not null default true,
  setup_prorata boolean not null default false check (setup_prorata = false),
  setup_is_full_amount boolean not null default true check (setup_is_full_amount = true),
  requires_explicit_upgrade_acceptance boolean not null default true,
  effective_from date not null default current_date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.core_billing_policy(policy_key,due_day,prepaid,recurring_prorata,setup_prorata,setup_is_full_amount,requires_explicit_upgrade_acceptance,metadata)
values('default',5,true,true,false,true,true,'{"source":"canonical_2026_08_15"}'::jsonb)
on conflict(policy_key) do update set due_day=5,prepaid=true,recurring_prorata=true,setup_prorata=false,setup_is_full_amount=true,requires_explicit_upgrade_acceptance=true,updated_at=now();

-- 2) White Label — preços permanecem nulos até aprovação comercial explícita.
create table if not exists public.core_whitelabel_tiers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  client_limit integer not null check (client_limit in (50,100,500,1000)),
  monthly_salary_multiple numeric(10,2),
  setup_salary_multiple numeric(10,2),
  pricing_status text not null default 'pending_confirmation' check (pricing_status in ('confirmed','pending_confirmation','inactive')),
  all_products_enabled boolean not null default true,
  owner_controls_resale_strategy boolean not null default true,
  due_day smallint not null default 5 check (due_day=5),
  prepaid boolean not null default true,
  recurring_prorata boolean not null default true,
  setup_prorata boolean not null default false,
  upgrade_requires_acceptance boolean not null default true,
  sort_order integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.core_whitelabel_tiers(code,name,client_limit,sort_order,metadata) values
('WHITE_LABEL_50','White Label 50',50,10,'{"pricing":"pending"}'::jsonb),
('WHITE_LABEL_100','White Label 100',100,20,'{"pricing":"pending"}'::jsonb),
('WHITE_LABEL_500','White Label 500',500,30,'{"pricing":"pending"}'::jsonb),
('WHITE_LABEL_1000','White Label 1.000',1000,40,'{"pricing":"pending"}'::jsonb)
on conflict(code) do update set name=excluded.name,client_limit=excluded.client_limit,sort_order=excluded.sort_order,updated_at=now();

create table if not exists public.core_upgrade_acceptances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  from_plan_code text,
  to_plan_code text not null,
  contract_id uuid references public.billing_contracts(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  terms_version text not null,
  terms_hash text not null,
  accepted_at timestamptz not null default now(),
  source_ip inet,
  user_agent text,
  previous_recurring_amount numeric(14,2),
  new_recurring_amount numeric(14,2),
  prorata_amount numeric(14,2),
  next_due_date date,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists core_upgrade_acceptances_company_idx on public.core_upgrade_acceptances(company_id,accepted_at desc);

-- 3) Capability Registry e evidências.
create table if not exists public.core_capability_registry (
  id uuid primary key default gen_random_uuid(),
  capability_key text not null unique,
  name text not null,
  domain text not null,
  description text,
  commercial_status text not null default 'development',
  technical_status text not null default 'partial',
  version text not null default '1.0.0',
  dependencies jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  last_tested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.core_capability_registry add column if not exists commercial_copy_allowed boolean not null default false;
alter table public.core_capability_registry add column if not exists limitations jsonb not null default '[]'::jsonb;
alter table public.core_capability_registry add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.core_capability_evidence (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.core_capability_registry(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('functional','authorization','isolation','negative','recovery','e2e','external_integration','load','security','deployment')),
  environment text not null default 'production',
  version text,
  status text not null check (status in ('passed','failed','pending','blocked')),
  evidence_ref text,
  notes text,
  tested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists core_capability_evidence_cap_idx on public.core_capability_evidence(capability_id,tested_at desc);

create table if not exists public.core_go_live_checks (
  id uuid primary key default gen_random_uuid(),
  check_key text not null unique,
  category text not null,
  title text not null,
  severity text not null default 'P1' check (severity in ('P0','P1','P2')),
  status text not null default 'pending' check (status in ('passed','failed','pending','blocked')),
  evidence_ref text,
  notes text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) Pulsonitor.
create table if not exists public.imp_monitoring_targets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  label text not null,
  target_type text not null check (target_type in ('https','http','tcp','dns','health_endpoint')),
  target text not null,
  interval_seconds integer not null default 30 check (interval_seconds>=30),
  timeout_ms integer not null default 10000 check (timeout_ms between 1000 and 60000),
  consecutive_failures_to_incident integer not null default 3 check (consecutive_failures_to_incident between 1 and 10),
  is_active boolean not null default true,
  expected_status integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,target_type,target)
);
create table if not exists public.imp_monitoring_checks (
  id bigint generated always as identity primary key,
  target_id uuid not null references public.imp_monitoring_targets(id) on delete cascade,
  probe_region text not null,
  checked_at timestamptz not null default now(),
  success boolean not null,
  status_code integer,
  latency_ms integer,
  error_code text,
  error_message text,
  response_meta jsonb not null default '{}'::jsonb
);
create index if not exists imp_monitoring_checks_target_time_idx on public.imp_monitoring_checks(target_id,checked_at desc);
create index if not exists imp_monitoring_checks_failures_idx on public.imp_monitoring_checks(checked_at desc) where success=false;

-- 5) RLS/governança das novas estruturas.
alter table public.core_billing_policy enable row level security;
alter table public.core_whitelabel_tiers enable row level security;
alter table public.core_upgrade_acceptances enable row level security;
alter table public.core_capability_registry enable row level security;
alter table public.core_capability_evidence enable row level security;
alter table public.core_go_live_checks enable row level security;
alter table public.imp_monitoring_targets enable row level security;
alter table public.imp_monitoring_checks enable row level security;

revoke all on public.core_billing_policy,public.core_whitelabel_tiers,public.core_upgrade_acceptances,public.core_capability_registry,public.core_capability_evidence,public.core_go_live_checks,public.imp_monitoring_targets,public.imp_monitoring_checks from anon;
grant select,insert,update,delete on public.core_billing_policy,public.core_whitelabel_tiers,public.core_upgrade_acceptances,public.core_capability_registry,public.core_capability_evidence,public.core_go_live_checks,public.imp_monitoring_targets,public.imp_monitoring_checks to authenticated;

do $$
begin
  if to_regprocedure('public.is_impulsionando_staff(uuid)') is not null then
    execute 'drop policy if exists core_billing_policy_staff_all on public.core_billing_policy';
    execute 'create policy core_billing_policy_staff_all on public.core_billing_policy for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
    execute 'drop policy if exists core_whitelabel_tiers_staff_all on public.core_whitelabel_tiers';
    execute 'create policy core_whitelabel_tiers_staff_all on public.core_whitelabel_tiers for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
    execute 'drop policy if exists core_upgrade_acceptances_staff_all on public.core_upgrade_acceptances';
    execute 'create policy core_upgrade_acceptances_staff_all on public.core_upgrade_acceptances for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
    execute 'drop policy if exists core_capability_registry_staff_all on public.core_capability_registry';
    execute 'create policy core_capability_registry_staff_all on public.core_capability_registry for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
    execute 'drop policy if exists core_capability_evidence_staff on public.core_capability_evidence';
    execute 'create policy core_capability_evidence_staff on public.core_capability_evidence for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
    execute 'drop policy if exists core_go_live_checks_staff on public.core_go_live_checks';
    execute 'create policy core_go_live_checks_staff on public.core_go_live_checks for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
    execute 'drop policy if exists imp_monitoring_targets_staff_all on public.imp_monitoring_targets';
    execute 'create policy imp_monitoring_targets_staff_all on public.imp_monitoring_targets for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
    execute 'drop policy if exists imp_monitoring_checks_staff_all on public.imp_monitoring_checks';
    execute 'create policy imp_monitoring_checks_staff_all on public.imp_monitoring_checks for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
  end if;
end $$;

-- 6) Hardening universal de tabelas previamente RLS-sem-policy.
do $$
declare t text;
begin
  if to_regprocedure('private.is_tenant_member(uuid,text[])') is not null then
    foreach t in array array[
      'communication_brand_profiles','communication_channel_endpoints','communication_contact_identities',
      'communication_contacts','communication_conversation_export_requests','communication_conversation_messages',
      'communication_conversation_tickets','communication_conversations','tenant_workflow_state'
    ] loop
      if to_regclass('public.'||t) is not null then
        execute format('alter table public.%I enable row level security',t);
        execute format('drop policy if exists %I_member_all on public.%I',t,t);
        execute format('create policy %I_member_all on public.%I for all to authenticated using (private.is_tenant_member(tenant_id)) with check (private.is_tenant_member(tenant_id))',t,t);
      end if;
    end loop;
  end if;
end $$;

-- Localidades são referência pública somente para leitura ativa; escrita permanece staff-only.
do $$
begin
  if to_regclass('public.core_localities') is not null then
    execute 'alter table public.core_localities enable row level security';
    execute 'drop policy if exists core_localities_public_read on public.core_localities';
    execute 'create policy core_localities_public_read on public.core_localities for select to anon, authenticated using (active=true)';
    if to_regprocedure('public.is_impulsionando_staff(uuid)') is not null then
      execute 'drop policy if exists core_localities_staff_write on public.core_localities';
      execute 'create policy core_localities_staff_write on public.core_localities for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))';
    end if;
  end if;
end $$;

-- N8N registry e runtime do agente: somente equipe Impulsionando.
do $$
declare t text;
begin
  if to_regprocedure('public.is_impulsionando_staff(uuid)') is not null then
    foreach t in array array['n8n_workflow_registry','communication_agent_runtime'] loop
      if to_regclass('public.'||t) is not null then
        execute format('alter table public.%I enable row level security',t);
        execute format('drop policy if exists %I_staff_all on public.%I',t,t);
        execute format('create policy %I_staff_all on public.%I for all to authenticated using (public.is_impulsionando_staff((select auth.uid()))) with check (public.is_impulsionando_staff((select auth.uid())))',t,t);
      end if;
    end loop;
  end if;
end $$;

-- Nunca recriar o helper público redundante de membership.
drop function if exists public.communication_is_tenant_member(uuid);
