-- Impulsionando recurring costs + read-only master observer.

create table if not exists public.core_recurring_costs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_name text not null,
  service_name text not null,
  plan_name text,
  amount_original numeric(14,2) not null,
  currency text not null default 'BRL',
  fx_rate_to_brl numeric(14,6),
  monthly_brl numeric(14,2) not null,
  billing_cycle text not null default 'monthly',
  cost_class text not null,
  evidence_type text not null,
  evidence_reference text,
  payment_status text,
  confidence text not null default 'estimated',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,supplier_name,service_name)
);

create table if not exists public.core_master_observer_entitlements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  user_id uuid,
  role_key text not null default 'master_observer',
  access_mode text not null default 'read_only',
  scope jsonb not null default '{"erp":true,"crm":true,"dashboards":true,"commercial":true,"operations":true,"analytics":true,"customer_portfolio":true,"secrets":false,"credential_vault":false,"clinical_records":false}'::jsonb,
  active boolean not null default true,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,email),
  check(access_mode='read_only')
);

alter table public.core_recurring_costs enable row level security;
alter table public.core_master_observer_entitlements enable row level security;

drop policy if exists core_recurring_costs_staff_manage on public.core_recurring_costs;
create policy core_recurring_costs_staff_manage on public.core_recurring_costs for all to authenticated using (public.is_impulsionando_staff(auth.uid())) with check (public.is_impulsionando_staff(auth.uid()));
drop policy if exists core_master_observer_entitlements_staff_manage on public.core_master_observer_entitlements;
create policy core_master_observer_entitlements_staff_manage on public.core_master_observer_entitlements for all to authenticated using (public.is_impulsionando_staff(auth.uid())) with check (public.is_impulsionando_staff(auth.uid()));

create or replace function public.is_impulsionando_master_observer(_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='public','auth' as $$
  select case when _user is distinct from auth.uid() then false else exists(
    select 1 from auth.users u
    join public.core_master_observer_entitlements e on e.company_id=public.master_company_id() and e.active=true and lower(e.email)=lower(u.email)
    where u.id=_user
  ) end
$$;
revoke all on function public.is_impulsionando_master_observer(uuid) from public,anon;
grant execute on function public.is_impulsionando_master_observer(uuid) to authenticated;

insert into public.core_master_observer_entitlements(company_id,email,role_key,access_mode,scope,active)
values(public.master_company_id(),'priscilla.caldas@impulsionando.com.br','master_observer','read_only','{"erp":true,"crm":true,"dashboards":true,"commercial":true,"operations":true,"analytics":true,"customer_portfolio":true,"secrets":false,"credential_vault":false,"clinical_records":false}'::jsonb,true)
on conflict(company_id,email) do update set role_key=excluded.role_key,access_mode='read_only',scope=excluded.scope,active=true,updated_at=now();

drop policy if exists core_recurring_costs_master_observer_read on public.core_recurring_costs;
create policy core_recurring_costs_master_observer_read on public.core_recurring_costs for select to authenticated using (company_id=public.master_company_id() and public.is_impulsionando_master_observer(auth.uid()));
drop policy if exists core_financial_accounts_master_observer_read on public.core_financial_accounts;
create policy core_financial_accounts_master_observer_read on public.core_financial_accounts for select to authenticated using (company_id=public.master_company_id() and public.is_impulsionando_master_observer(auth.uid()));
drop policy if exists core_financial_policy_master_observer_read on public.core_financial_governance_policy;
create policy core_financial_policy_master_observer_read on public.core_financial_governance_policy for select to authenticated using (company_id=public.master_company_id() and public.is_impulsionando_master_observer(auth.uid()));
drop policy if exists core_partner_governance_master_observer_read on public.core_partner_governance;
create policy core_partner_governance_master_observer_read on public.core_partner_governance for select to authenticated using (company_id=public.master_company_id() and public.is_impulsionando_master_observer(auth.uid()));
drop policy if exists core_capital_reimbursements_master_observer_read on public.core_capital_reimbursements;
create policy core_capital_reimbursements_master_observer_read on public.core_capital_reimbursements for select to authenticated using (company_id=public.master_company_id() and public.is_impulsionando_master_observer(auth.uid()));
drop policy if exists core_workforce_capacity_master_observer_read on public.core_workforce_capacity;
create policy core_workforce_capacity_master_observer_read on public.core_workforce_capacity for select to authenticated using (company_id=public.master_company_id() and public.is_impulsionando_master_observer(auth.uid()));

insert into public.core_recurring_costs(company_id,supplier_name,service_name,plan_name,amount_original,currency,fx_rate_to_brl,monthly_brl,billing_cycle,cost_class,evidence_type,evidence_reference,payment_status,confidence,metadata)
values
(public.master_company_id(),'OpenAI','ChatGPT Business','Business - 2 seats',406.93,'BRL',1,406.93,'monthly','software_ai','billing_email','Gmail 2026-08-02 renewal + payment attempts 2026-08-09/10/11','payment_issue','actual_recurring',jsonb_build_object('seats',2,'workspace','Impulsionando Tecnologia')),
(public.master_company_id(),'OpenAI','OpenAI API','usage based - last observed recharge',5.01,'USD',5.1925,26.02,'variable','software_ai','billing_email','Gmail 2026-06-17 funded Impulsionando Brasil','paid_observed','actual_usage_observed',jsonb_build_object('usage_based',true,'planning_floor',true)),
(public.master_company_id(),'Supabase','Supabase Platform','Pro',25,'USD',5.1925,129.81,'monthly','infrastructure','official_pricing','supabase.com/pricing checked 2026-08-20','planning_assumption','fallback_paid_plan',jsonb_build_object('minimum_paid_tier',true)),
(public.master_company_id(),'GitHub','GitHub','Team - 1 seat planning floor',4,'USD',5.1925,20.77,'monthly','development','official_pricing','github.com/pricing checked 2026-08-20','planning_assumption','fallback_paid_plan',jsonb_build_object('per_user',true,'assumed_seats',1,'minimum_paid_tier',true)),
(public.master_company_id(),'Cloudflare','Cloudflare Network/CDN','Pro annual-equivalent',20,'USD',5.1925,103.85,'monthly_equivalent','infrastructure_security','official_pricing','cloudflare.com/plans checked 2026-08-20','planning_assumption','fallback_paid_plan',jsonb_build_object('annual_billing_equivalent',true,'monthly_price_if_monthly_usd',25)),
(public.master_company_id(),'n8n','n8n Cloud','Starter annual-equivalent',20,'EUR',6.06797,121.36,'monthly_equivalent','automation','official_pricing','n8n.io/pricing checked 2026-08-20','planning_assumption','fallback_paid_plan',jsonb_build_object('annual_billing_equivalent',true,'minimum_paid_tier',true)),
(public.master_company_id(),'Hostinger','Hostinger VPS','KVM 1 current promotional',29.99,'BRL',1,29.99,'monthly_equivalent','infrastructure','official_pricing','hostinger.com/br/servidor-vps checked 2026-08-20','planning_assumption','fallback_paid_plan',jsonb_build_object('renewal_brl_monthly',59.99,'minimum_paid_tier',true)),
(public.master_company_id(),'Lovable','Lovable Workspace','Assinatura ativa observada',26.60,'BRL',1,26.60,'monthly','development','billing_email','Gmail 2026-08-20 payment to Lovable Labs Incorporated - continue your subscription','payment_issue','actual_recurring',jsonb_build_object('workspace','Raygs''s Lovable','credits_topup_separate',true,'topup_usd_observed',15))
on conflict(company_id,supplier_name,service_name) do update set plan_name=excluded.plan_name,amount_original=excluded.amount_original,currency=excluded.currency,fx_rate_to_brl=excluded.fx_rate_to_brl,monthly_brl=excluded.monthly_brl,billing_cycle=excluded.billing_cycle,cost_class=excluded.cost_class,evidence_type=excluded.evidence_type,evidence_reference=excluded.evidence_reference,payment_status=excluded.payment_status,confidence=excluded.confidence,metadata=excluded.metadata,active=true,updated_at=now();

create or replace function public.impulsionando_cost_snapshot() returns jsonb
language sql stable security definer set search_path='public','auth' as $$
  select case when not (public.is_impulsionando_staff(auth.uid()) or public.is_impulsionando_master_observer(auth.uid())) then null else jsonb_build_object(
    'monthly_total_brl',coalesce(sum(monthly_brl) filter(where active),0),
    'actual_recurring_brl',coalesce(sum(monthly_brl) filter(where active and confidence='actual_recurring'),0),
    'actual_usage_observed_brl',coalesce(sum(monthly_brl) filter(where active and confidence='actual_usage_observed'),0),
    'fallback_paid_plan_brl',coalesce(sum(monthly_brl) filter(where active and confidence='fallback_paid_plan'),0),
    'items',coalesce(jsonb_agg(jsonb_build_object('supplier',supplier_name,'service',service_name,'plan',plan_name,'monthly_brl',monthly_brl,'confidence',confidence,'payment_status',payment_status,'evidence_type',evidence_type) order by supplier_name,service_name) filter(where active),'[]'::jsonb)
  ) end from public.core_recurring_costs where company_id=public.master_company_id()
$$;
revoke all on function public.impulsionando_cost_snapshot() from public,anon;
grant execute on function public.impulsionando_cost_snapshot() to authenticated;
