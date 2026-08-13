alter table public.companies add column if not exists legal_name text;
alter table public.companies add column if not exists document text;
alter table public.companies add column if not exists phone text;
alter table public.companies add column if not exists logo_url text;
alter table public.companies add column if not exists is_demo boolean not null default false;

insert into public.companies(name,email,is_master,is_active,status,legal_name)
select 'Impulsionando Tecnologia',null,true,true,'active','Impulsionando Tecnologia'
where not exists(select 1 from public.companies where is_master=true or lower(name)=lower('Impulsionando Tecnologia'));

create unique index if not exists one_master_company on public.companies(is_master) where is_master=true;

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;

create or replace function public.user_belongs_to_company(_user uuid,_company uuid)
returns boolean language sql stable security definer set search_path='public','auth' as $$
  select _user is not null and _user=auth.uid() and (
    public.is_super_admin(_user)
    or exists(select 1 from public.user_roles r where r.user_id=_user and r.company_id=_company)
  )
$$;
revoke all on function public.user_belongs_to_company(uuid,uuid) from public,anon;
grant execute on function public.user_belongs_to_company(uuid,uuid) to authenticated,service_role;

create or replace function public.master_company_id()
returns uuid language sql stable security definer set search_path=public as $$
  select id from public.companies where is_master=true and is_active=true order by created_at limit 1
$$;
revoke all on function public.master_company_id() from public,anon;
grant execute on function public.master_company_id() to authenticated,service_role;

create table if not exists public.audit_logs(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  action text not null,
  entity text,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  metadata jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now(),
  constraint audit_logs_entity_present check(entity is not null or entity_type is not null)
);
create index if not exists idx_audit_logs_company_created on public.audit_logs(company_id,created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(coalesce(entity,entity_type),entity_id);
alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon;
grant select,insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
drop policy if exists audit_logs_staff_select on public.audit_logs;
create policy audit_logs_staff_select on public.audit_logs for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or (company_id is not null and public.user_belongs_to_company(auth.uid(),company_id)));
drop policy if exists audit_logs_authenticated_insert on public.audit_logs;
create policy audit_logs_authenticated_insert on public.audit_logs for insert to authenticated with check(user_id is null or user_id=auth.uid() or public.is_impulsionando_staff(auth.uid()));

create table if not exists public.modules(
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  category text,
  is_core boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  current_version text not null default '1.0.0',
  last_version_at timestamptz not null default now(),
  dependencies text[] not null default '{}',
  owner text not null default 'Impulsionando Tecnologia',
  status text not null default 'active',
  status_tecnico text not null default 'rascunho',
  status_comercial text not null default 'oculto',
  monthly_price numeric(14,2) not null default 0,
  setup_fee numeric(14,2) not null default 0,
  min_contract_days integer not null default 0,
  min_installments integer not null default 0,
  show_on_site boolean not null default false,
  show_in_checkout boolean not null default false,
  show_in_plans boolean not null default true,
  show_price boolean not null default false,
  allow_standalone boolean not null default false,
  cta_primary text,
  commercial_url text,
  readiness_status text not null default 'em_desenvolvimento',
  readiness_checklist jsonb not null default '{}'::jsonb,
  demo_url text,
  docs_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.module_versions(
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  version text not null,
  released_at timestamptz not null default now(),
  notes text,
  released_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id,version)
);
create table if not exists public.company_modules(
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  is_enabled boolean not null default true,
  enabled_at timestamptz default now(),
  installed_version text,
  installed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,module_id)
);
create index if not exists idx_company_modules_company on public.company_modules(company_id,is_enabled);
create index if not exists idx_company_modules_module on public.company_modules(module_id,is_enabled);
create index if not exists idx_module_versions_module on public.module_versions(module_id,released_at desc);

alter table public.modules enable row level security;
alter table public.module_versions enable row level security;
alter table public.company_modules enable row level security;
revoke all on public.modules,public.module_versions,public.company_modules from anon;
grant select on public.modules,public.module_versions,public.company_modules to authenticated;
grant insert,update,delete on public.modules,public.module_versions,public.company_modules to authenticated;
grant all on public.modules,public.module_versions,public.company_modules to service_role;
drop policy if exists modules_read on public.modules;
create policy modules_read on public.modules for select to authenticated using(true);
drop policy if exists modules_write on public.modules;
create policy modules_write on public.modules for all to authenticated using(public.is_super_admin(auth.uid())) with check(public.is_super_admin(auth.uid()));
drop policy if exists module_versions_read on public.module_versions;
create policy module_versions_read on public.module_versions for select to authenticated using(true);
drop policy if exists module_versions_write on public.module_versions;
create policy module_versions_write on public.module_versions for all to authenticated using(public.is_super_admin(auth.uid())) with check(public.is_super_admin(auth.uid()));
drop policy if exists company_modules_read on public.company_modules;
create policy company_modules_read on public.company_modules for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or public.user_belongs_to_company(auth.uid(),company_id));
drop policy if exists company_modules_write on public.company_modules;
create policy company_modules_write on public.company_modules for all to authenticated using(public.is_super_admin(auth.uid())) with check(public.is_super_admin(auth.uid()));

insert into public.modules(slug,name,description,category,is_core,sort_order,status_tecnico,status_comercial,readiness_status)
values
 ('crm','CRM','Gestão centralizada de leads, clientes, pipeline e relacionamento.','growth',true,10,'em_homologacao','oculto','em_testes'),
 ('agenda','Agenda','Agenda, disponibilidade, reservas e jornadas de atendimento.','operations',true,20,'em_homologacao','oculto','em_testes'),
 ('agente-virtual','Agente Virtual','Agentes de IA conectados ao Core e aos canais de atendimento.','ai',true,30,'em_homologacao','oculto','em_testes'),
 ('omnichannel','Omnichannel','Conversas centralizadas entre web, WhatsApp, Instagram e novos canais.','communication',true,40,'em_homologacao','oculto','em_testes'),
 ('automacao','Automação','Jornadas e automações operacionais com execução desacoplada.','automation',true,50,'em_desenvolvimento','oculto','em_desenvolvimento'),
 ('eventos','Eventos','Convites, inscrições, check-in, confirmação, CRM e pós-evento.','operations',false,60,'em_homologacao','oculto','em_testes'),
 ('financeiro','Financeiro e Cobrança','Planos, recorrência, cobrança, inadimplência, suspensão e reativação.','finance',true,70,'em_desenvolvimento','oculto','em_desenvolvimento'),
 ('analytics','Analytics','Indicadores executivos, funil, conversão, retenção e saúde da operação.','analytics',true,80,'em_desenvolvimento','oculto','em_desenvolvimento'),
 ('support','Central de Suporte','Tickets, SLA, base de conhecimento e acompanhamento.','support',true,90,'em_desenvolvimento','oculto','em_desenvolvimento'),
 ('cp','CP — Chat Privado','Comunicação privada com retenção parametrizável, sem exportação nativa e conteúdo cifrado.','privacy',false,100,'em_desenvolvimento','oculto','em_desenvolvimento'),
 ('saude','Saúde','Recursos especializados para clínicas e profissionais da saúde.','vertical',false,110,'em_homologacao','oculto','em_testes')
on conflict(slug) do update set name=excluded.name,description=excluded.description,category=excluded.category,is_core=excluded.is_core,sort_order=excluded.sort_order,updated_at=now();

create table if not exists public.billing_plans(
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  setup_fee numeric(14,2) not null default 0 check(setup_fee>=0),
  recurring_amount numeric(14,2) not null default 0 check(recurring_amount>=0),
  cycle text not null default 'monthly' check(cycle in('monthly','quarterly','yearly')),
  due_day smallint not null default 5 check(due_day between 1 and 28),
  is_active boolean not null default true,
  is_default boolean not null default false,
  status_comercial text not null default 'oculto' check(status_comercial in('disponivel_contratacao','sob_consulta','em_breve','oculto','exclusivo_interno','exclusivo_white_label')),
  min_contract_days integer not null default 0,
  min_installments integer not null default 0,
  included_module_count integer not null default 0,
  extra_module_price numeric(14,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  show_on_site boolean not null default false,
  show_in_checkout boolean not null default false,
  allow_direct_checkout boolean not null default false,
  route_to_quote boolean not null default true,
  route_to_whatsapp boolean not null default false,
  cta text,
  legal_text text,
  internal_notes text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.billing_plan_modules(
  plan_id uuid not null references public.billing_plans(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  is_included boolean not null default true,
  limits jsonb not null default '{}'::jsonb,
  primary key(plan_id,module_id)
);
create table if not exists public.billing_dunning_policy(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  steps jsonb not null default '[]'::jsonb,
  suspend_offset_days integer not null default 10,
  suspend_time time not null default '00:01',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_billing_default_dunning on public.billing_dunning_policy(is_default) where is_default=true;
create table if not exists public.billing_contracts(
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid not null references public.billing_plans(id) on delete restrict,
  policy_id uuid references public.billing_dunning_policy(id) on delete set null,
  start_date date not null default current_date,
  due_day smallint not null default 5 check(due_day between 1 and 28),
  next_due_date date not null,
  recurring_amount numeric(14,2) not null,
  status text not null default 'active' check(status in('active','past_due','grace_period','restricted','suspended','cancelled','archived')),
  setup_paid_at timestamptz,
  setup_amount numeric(14,2) not null default 0,
  nfe_issued_at timestamptz,
  last_paid_at timestamptz,
  notes text,
  pix_key text,
  pix_copy_paste text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_billing_active_contract_company on public.billing_contracts(company_id) where status not in('cancelled','archived');
create table if not exists public.billing_invoices(
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.billing_contracts(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  due_date date not null,
  amount numeric(14,2) not null check(amount>=0),
  status text not null default 'open' check(status in('open','paid','overdue','cancelled','refunded')),
  paid_at timestamptz,
  pix_key text,
  pix_copy_paste text,
  pix_qr_url text,
  mp_payment_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contract_id,due_date)
);
create table if not exists public.billing_dunning_runs(
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.billing_invoices(id) on delete cascade,
  step text not null,
  channel text not null check(channel in('whatsapp','email','in_app')),
  sent_at timestamptz not null default now(),
  status text not null default 'queued',
  detail text,
  unique(invoice_id,step,channel)
);
create table if not exists public.billing_suspensions(
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.billing_contracts(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid references public.billing_invoices(id) on delete set null,
  suspended_at timestamptz not null default now(),
  reason text,
  disabled_module_ids uuid[] not null default '{}',
  reactivated_at timestamptz,
  reactivated_reason text
);
create index if not exists idx_billing_contracts_company_status on public.billing_contracts(company_id,status);
create index if not exists idx_billing_invoices_company_status_due on public.billing_invoices(company_id,status,due_date);
create index if not exists idx_billing_invoices_contract on public.billing_invoices(contract_id,due_date);
create index if not exists idx_billing_dunning_invoice on public.billing_dunning_runs(invoice_id);
create index if not exists idx_billing_suspensions_contract on public.billing_suspensions(contract_id,reactivated_at);

create table if not exists public.message_outbox(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  event_code text not null,
  channel text not null check(channel in('email','whatsapp','instagram','in_app')),
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text,
  recipient_phone text,
  recipient_name text,
  subject text,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check(status in('queued','processing','sent','failed','dead_letter','cancelled')),
  attempts integer not null default 0,
  scheduled_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  reference_type text,
  reference_id text,
  idempotency_key text,
  correlation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_message_outbox_idempotency on public.message_outbox(idempotency_key) where idempotency_key is not null;
create index if not exists idx_message_outbox_due on public.message_outbox(status,available_at,created_at);

alter table public.billing_plans enable row level security;
alter table public.billing_plan_modules enable row level security;
alter table public.billing_dunning_policy enable row level security;
alter table public.billing_contracts enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.billing_dunning_runs enable row level security;
alter table public.billing_suspensions enable row level security;
alter table public.message_outbox enable row level security;
revoke all on public.billing_plans,public.billing_plan_modules,public.billing_dunning_policy,public.billing_contracts,public.billing_invoices,public.billing_dunning_runs,public.billing_suspensions,public.message_outbox from anon;
grant select on public.billing_plans,public.billing_plan_modules,public.billing_dunning_policy,public.billing_contracts,public.billing_invoices,public.billing_dunning_runs,public.billing_suspensions to authenticated;
grant all on public.billing_plans,public.billing_plan_modules,public.billing_dunning_policy,public.billing_contracts,public.billing_invoices,public.billing_dunning_runs,public.billing_suspensions,public.message_outbox to service_role;

drop policy if exists billing_plans_read on public.billing_plans;
create policy billing_plans_read on public.billing_plans for select to authenticated using(is_active=true or public.is_impulsionando_staff(auth.uid()));
drop policy if exists billing_plans_staff_write on public.billing_plans;
create policy billing_plans_staff_write on public.billing_plans for all to authenticated using(public.is_impulsionando_staff(auth.uid())) with check(public.is_impulsionando_staff(auth.uid()));
drop policy if exists billing_plan_modules_read on public.billing_plan_modules;
create policy billing_plan_modules_read on public.billing_plan_modules for select to authenticated using(true);
drop policy if exists billing_plan_modules_staff_write on public.billing_plan_modules;
create policy billing_plan_modules_staff_write on public.billing_plan_modules for all to authenticated using(public.is_impulsionando_staff(auth.uid())) with check(public.is_impulsionando_staff(auth.uid()));
drop policy if exists billing_policy_read on public.billing_dunning_policy;
create policy billing_policy_read on public.billing_dunning_policy for select to authenticated using(true);
drop policy if exists billing_policy_staff_write on public.billing_dunning_policy;
create policy billing_policy_staff_write on public.billing_dunning_policy for all to authenticated using(public.is_impulsionando_staff(auth.uid())) with check(public.is_impulsionando_staff(auth.uid()));
drop policy if exists billing_contracts_read on public.billing_contracts;
create policy billing_contracts_read on public.billing_contracts for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or public.user_belongs_to_company(auth.uid(),company_id));
drop policy if exists billing_contracts_staff_write on public.billing_contracts;
create policy billing_contracts_staff_write on public.billing_contracts for all to authenticated using(public.is_impulsionando_staff(auth.uid())) with check(public.is_impulsionando_staff(auth.uid()));
drop policy if exists billing_invoices_read on public.billing_invoices;
create policy billing_invoices_read on public.billing_invoices for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or public.user_belongs_to_company(auth.uid(),company_id));
drop policy if exists billing_invoices_staff_write on public.billing_invoices;
create policy billing_invoices_staff_write on public.billing_invoices for all to authenticated using(public.is_impulsionando_staff(auth.uid())) with check(public.is_impulsionando_staff(auth.uid()));
drop policy if exists billing_runs_read on public.billing_dunning_runs;
create policy billing_runs_read on public.billing_dunning_runs for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or exists(select 1 from public.billing_invoices i where i.id=invoice_id and public.user_belongs_to_company(auth.uid(),i.company_id)));
drop policy if exists billing_suspensions_read on public.billing_suspensions;
create policy billing_suspensions_read on public.billing_suspensions for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or public.user_belongs_to_company(auth.uid(),company_id));

insert into public.billing_dunning_policy(name,is_default,steps,suspend_offset_days)
select 'Régua Padrão Impulsionando',true,'[{"code":"d_minus_5","offset_days":-5,"channels":["email","whatsapp"],"template_code":"billing.reminder.5d"},{"code":"d_minus_1","offset_days":-1,"channels":["email","whatsapp"],"template_code":"billing.reminder.1d"},{"code":"d_zero","offset_days":0,"channels":["email","whatsapp"],"template_code":"billing.due.today"},{"code":"d_plus_1","offset_days":1,"channels":["email","whatsapp"],"template_code":"billing.overdue.1d"},{"code":"d_plus_3","offset_days":3,"channels":["email","whatsapp"],"template_code":"billing.overdue.3d"},{"code":"d_plus_5","offset_days":5,"channels":["email","whatsapp"],"template_code":"billing.overdue.5d"},{"code":"d_plus_7","offset_days":7,"channels":["email","whatsapp"],"template_code":"billing.restricted"},{"code":"d_plus_10","offset_days":10,"channels":["email","whatsapp"],"template_code":"billing.suspended"},{"code":"d_plus_15","offset_days":15,"channels":["email","whatsapp"],"template_code":"billing.recovery"}]'::jsonb,10
where not exists(select 1 from public.billing_dunning_policy where is_default=true);

insert into public.billing_plans(code,name,description,status_comercial,recurring_amount,setup_fee,route_to_quote,sort_order,metadata)
values
 ('ESSENCIAL','Essencial','Plano base configurável do ecossistema Impulsionando. Preço e composição devem ser definidos pela gestão antes da publicação.','oculto',0,0,true,10,jsonb_build_object('seed','safe_no_public_price')),
 ('PRO','Pro','Plano de expansão configurável com módulos adicionais e automações. Preço e composição devem ser definidos pela gestão antes da publicação.','oculto',0,0,true,20,jsonb_build_object('seed','safe_no_public_price')),
 ('ENTERPRISE','Enterprise','Plano sob medida para operações de maior complexidade, integrações e governança.','sob_consulta',0,0,true,30,jsonb_build_object('seed','safe_no_public_price')),
 ('WHITE_LABEL','White Label','Plano dedicado a operações white label, configurado sob proposta.','exclusivo_white_label',0,0,true,40,jsonb_build_object('seed','safe_no_public_price'))
on conflict(code) do nothing;

create or replace function public.billing_check_company_status(_company uuid)
returns table(status text,contract_id uuid,next_due_date date,overdue_invoice_id uuid)
language plpgsql stable security definer set search_path='public','auth' as $$
begin
  if not (public.is_impulsionando_staff(auth.uid()) or public.user_belongs_to_company(auth.uid(),_company)) then raise exception 'not_authorized'; end if;
  return query
  select c.status,c.id,c.next_due_date,(select i.id from public.billing_invoices i where i.contract_id=c.id and i.status in('open','overdue') order by i.due_date limit 1)
  from public.billing_contracts c where c.company_id=_company order by c.created_at desc limit 1;
end $$;
revoke all on function public.billing_check_company_status(uuid) from public,anon;
grant execute on function public.billing_check_company_status(uuid) to authenticated,service_role;

create or replace function public.billing_mark_paid(_invoice_id uuid,_paid_at timestamptz default now())
returns uuid language plpgsql security definer set search_path=public as $$
declare v_inv public.billing_invoices%rowtype; v_contract public.billing_contracts%rowtype; v_restore uuid[];
begin
  select * into v_inv from public.billing_invoices where id=_invoice_id for update;
  if v_inv.id is null then raise exception 'invoice_not_found'; end if;
  if v_inv.status='paid' then return v_inv.id; end if;
  select * into v_contract from public.billing_contracts where id=v_inv.contract_id for update;
  update public.billing_invoices set status='paid',paid_at=_paid_at,updated_at=now() where id=v_inv.id;
  update public.billing_contracts set status='active',last_paid_at=_paid_at,next_due_date=(v_inv.due_date+interval '1 month')::date,updated_at=now() where id=v_contract.id;
  select disabled_module_ids into v_restore from public.billing_suspensions where contract_id=v_contract.id and reactivated_at is null order by suspended_at desc limit 1;
  if coalesce(array_length(v_restore,1),0)>0 then update public.company_modules set is_enabled=true,enabled_at=coalesce(enabled_at,now()),updated_at=now() where company_id=v_contract.company_id and module_id=any(v_restore); end if;
  update public.billing_suspensions set reactivated_at=now(),reactivated_reason='payment_identified' where contract_id=v_contract.id and reactivated_at is null;
  insert into public.audit_logs(company_id,action,entity,entity_id,after,metadata) values(v_contract.company_id,'billing.invoice.paid','billing_invoices',v_inv.id::text,jsonb_build_object('paid_at',_paid_at),jsonb_build_object('source','billing_mark_paid'));
  return v_inv.id;
end $$;
revoke all on function public.billing_mark_paid(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.billing_mark_paid(uuid,timestamptz) to service_role;

create or replace function public.billing_run_cycle()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_contract public.billing_contracts%rowtype; v_inv public.billing_invoices%rowtype; v_policy public.billing_dunning_policy%rowtype; v_step jsonb; v_ch text; v_offset int; v_generated int:=0; v_queued int:=0; v_suspended int:=0; v_disabled uuid[]; v_company public.companies%rowtype;
begin
  for v_contract in select * from public.billing_contracts where status not in('cancelled','archived') loop
    if v_contract.next_due_date<=current_date+5 then
      insert into public.billing_invoices(contract_id,company_id,period_start,period_end,due_date,amount,pix_key,pix_copy_paste)
      values(v_contract.id,v_contract.company_id,(v_contract.next_due_date-interval '1 month')::date,(v_contract.next_due_date-interval '1 day')::date,v_contract.next_due_date,v_contract.recurring_amount,v_contract.pix_key,v_contract.pix_copy_paste)
      on conflict(contract_id,due_date) do nothing;
      if found then v_generated:=v_generated+1; end if;
    end if;
  end loop;

  for v_inv in select * from public.billing_invoices where status in('open','overdue') loop
    select * into v_contract from public.billing_contracts where id=v_inv.contract_id;
    select * into v_company from public.companies where id=v_inv.company_id;
    select * into v_policy from public.billing_dunning_policy where id=coalesce(v_contract.policy_id,(select id from public.billing_dunning_policy where is_default=true limit 1));
    if v_policy.id is null then continue; end if;
    if current_date>v_inv.due_date and v_inv.status='open' then update public.billing_invoices set status='overdue',updated_at=now() where id=v_inv.id; end if;

    for v_step in select value from jsonb_array_elements(v_policy.steps) loop
      v_offset:=(v_step->>'offset_days')::int;
      if (v_inv.due_date+v_offset)=current_date then
        for v_ch in select jsonb_array_elements_text(v_step->'channels') loop
          if not exists(select 1 from public.billing_dunning_runs r where r.invoice_id=v_inv.id and r.step=v_step->>'code' and r.channel=v_ch) then
            insert into public.billing_dunning_runs(invoice_id,step,channel,status) values(v_inv.id,v_step->>'code',v_ch,'queued');
            if v_ch='email' and v_company.email is not null then
              insert into public.message_outbox(company_id,event_code,channel,recipient_email,recipient_name,subject,body,payload,status,reference_type,reference_id,idempotency_key)
              values(v_inv.company_id,v_step->>'template_code','email',v_company.email,v_company.name,'Cobrança Impulsionando — '||to_char(v_inv.due_date,'DD/MM/YYYY'),'Olá '||v_company.name||'. Existe uma cobrança de R$ '||to_char(v_inv.amount,'FM999999990D00')||' com vencimento em '||to_char(v_inv.due_date,'DD/MM/YYYY')||'. Consulte sua área para os dados atualizados de pagamento.',jsonb_build_object('invoice_id',v_inv.id,'due_date',v_inv.due_date,'amount',v_inv.amount),'queued','billing_invoices',v_inv.id::text,'billing:'||v_inv.id::text||':'||(v_step->>'code')||':email') on conflict(idempotency_key) do nothing;
              v_queued:=v_queued+1;
            elsif v_ch='whatsapp' and v_company.phone is not null then
              insert into public.message_outbox(company_id,event_code,channel,recipient_phone,recipient_name,body,payload,status,reference_type,reference_id,idempotency_key)
              values(v_inv.company_id,v_step->>'template_code','whatsapp',v_company.phone,v_company.name,'Olá '||v_company.name||'. Sua cobrança Impulsionando de R$ '||to_char(v_inv.amount,'FM999999990D00')||' vence/venceu em '||to_char(v_inv.due_date,'DD/MM/YYYY')||'. Consulte sua área para pagamento.',jsonb_build_object('invoice_id',v_inv.id,'due_date',v_inv.due_date,'amount',v_inv.amount),'queued','billing_invoices',v_inv.id::text,'billing:'||v_inv.id::text||':'||(v_step->>'code')||':whatsapp') on conflict(idempotency_key) do nothing;
              v_queued:=v_queued+1;
            end if;
          end if;
        end loop;
      end if;
    end loop;

    if current_date>=v_inv.due_date+v_policy.suspend_offset_days and v_contract.status not in('suspended','cancelled','archived') then
      select coalesce(array_agg(module_id),'{}'::uuid[]) into v_disabled from public.company_modules where company_id=v_inv.company_id and is_enabled=true;
      update public.company_modules set is_enabled=false,updated_at=now() where company_id=v_inv.company_id and is_enabled=true;
      update public.billing_contracts set status='suspended',updated_at=now() where id=v_contract.id;
      insert into public.billing_suspensions(contract_id,company_id,invoice_id,reason,disabled_module_ids) values(v_contract.id,v_inv.company_id,v_inv.id,'invoice_overdue',v_disabled);
      v_suspended:=v_suspended+1;
    elsif current_date>v_inv.due_date and v_contract.status='active' then
      update public.billing_contracts set status='past_due',updated_at=now() where id=v_contract.id;
    end if;
  end loop;
  return jsonb_build_object('generated',v_generated,'queued',v_queued,'suspended',v_suspended,'at',now());
end $$;
revoke all on function public.billing_run_cycle() from public,anon,authenticated;
grant execute on function public.billing_run_cycle() to service_role;

create or replace function public.tg_core_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['modules','module_versions','company_modules','billing_plans','billing_dunning_policy','billing_contracts','billing_invoices','message_outbox'] loop execute format('drop trigger if exists trg_%I_updated_at on public.%I',t,t); execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.tg_core_updated_at()',t,t); end loop; end $$;