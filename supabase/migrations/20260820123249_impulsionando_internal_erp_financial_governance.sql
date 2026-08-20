-- Impulsionando Tecnologia - internal ERP financial governance
-- Mirrors production migration applied on 2026-08-20.

create table if not exists public.core_financial_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_code text not null,
  display_name text not null,
  institution_name text not null,
  account_type text not null default 'managerial',
  purpose text not null,
  allocation_pct numeric(7,4),
  bank_branch text,
  bank_account text,
  pix_key text,
  is_real_configured boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, account_code)
);

create table if not exists public.core_financial_governance_policy (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  commercial_go_live date not null,
  minimum_wage numeric(12,2) not null,
  tax_pct numeric(7,4) not null default 16,
  technology_pct numeric(7,4) not null default 10,
  marketing_commercial_pct numeric(7,4) not null default 10,
  structural_reserve_pct numeric(7,4) not null default 10,
  structural_reserve_starts_day integer not null default 91,
  hiring_client_block integer not null default 8,
  hiring_revenue_sm_block numeric(8,2) not null default 8,
  employee_cost_sm numeric(8,2) not null default 2,
  base_partner_prolabore_sm numeric(8,2) not null default 1,
  raygs_reimbursement_sm numeric(8,2) not null default 1,
  raygs_reimbursement_total numeric(12,2) not null default 15000,
  profit_distribution_pct numeric(7,4) not null default 50,
  profit_retention_pct numeric(7,4) not null default 50,
  profit_close_months int[] not null default array[1,4,7,10],
  default_new_clients_per_week numeric(8,2) not null default 1,
  projected_initial_showcase_clients integer not null default 15,
  projected_initial_conversion_clients integer not null default 8,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.core_partner_governance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_name text not null,
  role_title text not null,
  equity_pct numeric(7,4) not null,
  responsibility_summary text not null,
  base_prolabore_sm numeric(8,2) not null default 1,
  commercial_only boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, partner_name)
);

create table if not exists public.core_capital_reimbursements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  beneficiary_name text not null,
  original_amount numeric(12,2) not null,
  reimbursed_amount numeric(12,2) not null default 0,
  monthly_target_sm numeric(8,2) not null default 1,
  start_condition text not null,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reimbursed_amount >= 0 and reimbursed_amount <= original_amount)
);

create table if not exists public.core_workforce_capacity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  operational_headcount integer not null default 0,
  last_reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (operational_headcount >= 0)
);

alter table public.core_financial_accounts enable row level security;
alter table public.core_financial_governance_policy enable row level security;
alter table public.core_partner_governance enable row level security;
alter table public.core_capital_reimbursements enable row level security;
alter table public.core_workforce_capacity enable row level security;

drop policy if exists core_financial_accounts_staff on public.core_financial_accounts;
create policy core_financial_accounts_staff on public.core_financial_accounts for all to authenticated using (public.is_impulsionando_staff(auth.uid())) with check (public.is_impulsionando_staff(auth.uid()));
drop policy if exists core_financial_policy_staff on public.core_financial_governance_policy;
create policy core_financial_policy_staff on public.core_financial_governance_policy for all to authenticated using (public.is_impulsionando_staff(auth.uid())) with check (public.is_impulsionando_staff(auth.uid()));
drop policy if exists core_partner_governance_staff on public.core_partner_governance;
create policy core_partner_governance_staff on public.core_partner_governance for all to authenticated using (public.is_impulsionando_staff(auth.uid())) with check (public.is_impulsionando_staff(auth.uid()));
drop policy if exists core_capital_reimbursements_staff on public.core_capital_reimbursements;
create policy core_capital_reimbursements_staff on public.core_capital_reimbursements for all to authenticated using (public.is_impulsionando_staff(auth.uid())) with check (public.is_impulsionando_staff(auth.uid()));
drop policy if exists core_workforce_capacity_staff on public.core_workforce_capacity;
create policy core_workforce_capacity_staff on public.core_workforce_capacity for all to authenticated using (public.is_impulsionando_staff(auth.uid())) with check (public.is_impulsionando_staff(auth.uid()));

insert into public.core_financial_accounts(company_id,account_code,display_name,institution_name,account_type,purpose,allocation_pct,metadata)
select public.master_company_id(),'GIRO_MERCADO_PAGO','Conta Giro Operacional - Mercado Pago','Mercado Pago','managerial','Conta principal de recebimento do checkout transparente e giro operacional. Dados bancarios reais pendentes de configuracao.',null,jsonb_build_object('checkout_transparente',true,'canonical',true)
on conflict(company_id,account_code) do update set display_name=excluded.display_name,institution_name=excluded.institution_name,purpose=excluded.purpose,metadata=excluded.metadata,updated_at=now();

insert into public.core_financial_accounts(company_id,account_code,display_name,institution_name,account_type,purpose,allocation_pct,metadata)
select public.master_company_id(),'FUNDO_COMERCIAL_INTER_PJ','Fundo Comercial e Marketing - Banco Inter PJ','Banco Inter PJ','managerial','Conta dedicada exclusivamente ao fundo comercial e de marketing.',10,jsonb_build_object('restricted_purpose','commercial_marketing','canonical',true)
on conflict(company_id,account_code) do update set display_name=excluded.display_name,institution_name=excluded.institution_name,purpose=excluded.purpose,allocation_pct=excluded.allocation_pct,metadata=excluded.metadata,updated_at=now();

insert into public.core_financial_accounts(company_id,account_code,display_name,institution_name,account_type,purpose,allocation_pct,metadata)
select public.master_company_id(),'FUNDO_JURIDICO_INFINITYPAY','Fundo Juridico - InfinitePay','InfinitePay','managerial','Conta dedicada exclusivamente a despesas e reservas juridicas. Equipamentos, contratacoes e contingencias permanecem como envelopes gerenciais separados ate definicao de conta propria.',null,jsonb_build_object('restricted_purpose','legal_only','canonical',true)
on conflict(company_id,account_code) do update set display_name=excluded.display_name,institution_name=excluded.institution_name,purpose=excluded.purpose,metadata=excluded.metadata,updated_at=now();

insert into public.core_financial_governance_policy(company_id,commercial_go_live,minimum_wage,tax_pct,technology_pct,marketing_commercial_pct,structural_reserve_pct,structural_reserve_starts_day,hiring_client_block,hiring_revenue_sm_block,employee_cost_sm,base_partner_prolabore_sm,raygs_reimbursement_sm,raygs_reimbursement_total,profit_distribution_pct,profit_retention_pct,profit_close_months,default_new_clients_per_week,projected_initial_showcase_clients,projected_initial_conversion_clients,notes)
values(public.master_company_id(),'2026-08-20',1621,16,10,10,10,91,8,8,2,1,1,15000,50,50,array[1,4,7,10],1,15,8,'Politica inicial da Impulsionando Tecnologia. Reserva estrutural de 10% inicia no dia 91; a conta InfinitePay e restrita ao juridico, enquanto equipamentos/contratacoes/contingencias ficam em envelopes gerenciais dentro do giro ate nova conta ser definida.')
on conflict(company_id) do update set commercial_go_live=excluded.commercial_go_live,minimum_wage=excluded.minimum_wage,tax_pct=excluded.tax_pct,technology_pct=excluded.technology_pct,marketing_commercial_pct=excluded.marketing_commercial_pct,structural_reserve_pct=excluded.structural_reserve_pct,structural_reserve_starts_day=excluded.structural_reserve_starts_day,hiring_client_block=excluded.hiring_client_block,hiring_revenue_sm_block=excluded.hiring_revenue_sm_block,employee_cost_sm=excluded.employee_cost_sm,base_partner_prolabore_sm=excluded.base_partner_prolabore_sm,raygs_reimbursement_sm=excluded.raygs_reimbursement_sm,raygs_reimbursement_total=excluded.raygs_reimbursement_total,profit_distribution_pct=excluded.profit_distribution_pct,profit_retention_pct=excluded.profit_retention_pct,profit_close_months=excluded.profit_close_months,default_new_clients_per_week=excluded.default_new_clients_per_week,projected_initial_showcase_clients=excluded.projected_initial_showcase_clients,projected_initial_conversion_clients=excluded.projected_initial_conversion_clients,notes=excluded.notes,updated_at=now();

insert into public.core_partner_governance(company_id,partner_name,role_title,equity_pct,responsibility_summary,base_prolabore_sm,commercial_only,metadata)
values
(public.master_company_id(),'Raygs Monnerat','Diretor de Tecnologia, Produto e Operacoes',50,'Desenvolvimento, implantacao, onboarding, atendimento, suporte, infraestrutura, automacao, produto e operacao.',1,false,jsonb_build_object('delivery_owner',true)),
(public.master_company_id(),'Priscilla Caldas','Diretora Comercial',50,'Vendas, prospeccao, relacionamento, negociacao, fechamento, parcerias, canais, metas, marketing comercial e geracao de receita.',1,true,jsonb_build_object('primary_mission','sell','commercial_owner',true))
on conflict(company_id,partner_name) do update set role_title=excluded.role_title,equity_pct=excluded.equity_pct,responsibility_summary=excluded.responsibility_summary,base_prolabore_sm=excluded.base_prolabore_sm,commercial_only=excluded.commercial_only,metadata=excluded.metadata,updated_at=now();

insert into public.core_capital_reimbursements(company_id,beneficiary_name,original_amount,reimbursed_amount,monthly_target_sm,start_condition,status,metadata)
select public.master_company_id(),'Raygs Monnerat',15000,0,1,'Iniciar quando o caixa comportar simultaneamente 1 salario minimo de pro-labore para cada socio e 1 salario minimo mensal de reembolso.','pending',jsonb_build_object('labor_excluded',true,'cash_expenses_only',true)
where not exists (select 1 from public.core_capital_reimbursements where company_id=public.master_company_id() and beneficiary_name='Raygs Monnerat' and status in ('pending','active'));

insert into public.core_workforce_capacity(company_id,operational_headcount,notes)
values(public.master_company_id(),0,'Regra: 1 profissional operacional a cada bloco de 8 clientes pagantes e pelo menos 8 salarios minimos de MRR. Custo medio planejado: 2 salarios minimos por profissional.')
on conflict(company_id) do nothing;
