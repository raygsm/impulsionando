-- Canonical checkout state + financial access guard

create table if not exists public.billing_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.billing_plans(id),
  customer_company_id uuid null references public.companies(id),
  contact_name text not null,
  contact_company text not null,
  contact_email text not null,
  contact_phone text null,
  contact_doc text null,
  setup_amount numeric(14,2) not null check (setup_amount >= 0),
  recurring_amount numeric(14,2) not null check (recurring_amount >= 0),
  due_day smallint not null check (due_day between 1 and 28),
  cycle text not null,
  terms_version text not null,
  terms_hash text not null,
  accepted_at timestamptz not null,
  accepted_ip inet null,
  accepted_user_id uuid null,
  status text not null default 'created' check (status in ('created','payment_pending','paid','provisioning','completed','cancelled','expired','failed')),
  idempotency_key text not null unique,
  mpago_payment_id uuid null references public.mpago_payments(id),
  billing_contract_id uuid null references public.billing_contracts(id),
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists billing_checkout_sessions_plan_idx on public.billing_checkout_sessions(plan_id);
create index if not exists billing_checkout_sessions_status_idx on public.billing_checkout_sessions(status, created_at desc);
create index if not exists billing_checkout_sessions_email_idx on public.billing_checkout_sessions(lower(contact_email));
alter table public.billing_checkout_sessions enable row level security;
revoke all on public.billing_checkout_sessions from anon, authenticated;

create table if not exists public.core_financial_reconciliation_evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  invoice_id uuid null references public.billing_invoices(id) on delete restrict,
  payment_id uuid null references public.mpago_payments(id) on delete restrict,
  source text not null,
  source_event_key text not null unique,
  gateway_reachable boolean not null,
  gateway_status text null,
  internal_status text null,
  payment_confirmed boolean not null default false,
  reconciled boolean not null default false,
  grace_until timestamptz null,
  exception_blocks_suspension boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists core_fin_recon_company_checked_idx on public.core_financial_reconciliation_evidence(company_id, checked_at desc);
alter table public.core_financial_reconciliation_evidence enable row level security;
revoke all on public.core_financial_reconciliation_evidence from anon, authenticated;

create table if not exists public.core_service_access_state (
  company_id uuid primary key references public.companies(id) on delete restrict,
  state text not null default 'active' check (state in ('active','warning','past_due','grace_period','suspension_eligible','suspended_nonpayment','reactivation_processing','security_containment','maintenance')),
  reason text null,
  source_evidence_id uuid null references public.core_financial_reconciliation_evidence(id) on delete set null,
  suspended_at timestamptz null,
  reactivated_at timestamptz null,
  manual_suspension_block boolean not null default false,
  manual_exception_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.core_service_access_state enable row level security;
revoke all on public.core_service_access_state from anon, authenticated;

create table if not exists public.core_service_access_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  event_key text not null unique,
  from_state text null,
  to_state text not null,
  reason text null,
  source_evidence_id uuid null references public.core_financial_reconciliation_evidence(id) on delete set null,
  actor_type text not null default 'system',
  actor_ref text null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists core_service_access_events_company_idx on public.core_service_access_events(company_id, created_at desc);
alter table public.core_service_access_events enable row level security;
revoke all on public.core_service_access_events from anon, authenticated;

create or replace function public.core_apply_financial_service_transition(
  p_company_id uuid,
  p_target_state text,
  p_evidence_id uuid,
  p_event_key text,
  p_reason text default null
) returns public.core_service_access_state
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_evidence public.core_financial_reconciliation_evidence%rowtype;
  v_result public.core_service_access_state%rowtype;
begin
  if p_target_state not in ('suspended_nonpayment','active') then
    raise exception 'unsupported_target_state';
  end if;

  select * into v_evidence
  from public.core_financial_reconciliation_evidence
  where id = p_evidence_id and company_id = p_company_id;
  if not found then raise exception 'reconciliation_evidence_required'; end if;
  if not v_evidence.reconciled then raise exception 'reconciliation_not_confirmed'; end if;

  if p_target_state = 'suspended_nonpayment' then
    if not v_evidence.gateway_reachable then raise exception 'gateway_unavailable_fail_closed_against_suspension'; end if;
    if v_evidence.payment_confirmed then raise exception 'payment_already_confirmed'; end if;
    if v_evidence.exception_blocks_suspension then raise exception 'commercial_exception_blocks_suspension'; end if;
    if v_evidence.grace_until is not null and v_evidence.grace_until > now() then raise exception 'grace_period_active'; end if;
    if v_evidence.invoice_id is null then raise exception 'invoice_required_for_suspension'; end if;
    if not exists (
      select 1 from public.billing_invoices bi
      where bi.id = v_evidence.invoice_id
        and bi.company_id = p_company_id
        and bi.due_date < current_date
        and bi.paid_at is null
        and lower(coalesce(bi.status,'')) not in ('paid','pago','cancelled','canceled','void','refunded')
    ) then raise exception 'invoice_not_confirmed_overdue'; end if;
  else
    if not v_evidence.payment_confirmed then raise exception 'confirmed_payment_required_for_reactivation'; end if;
  end if;

  insert into public.core_service_access_state(company_id,state,reason,source_evidence_id,suspended_at,reactivated_at,updated_at)
  values (
    p_company_id,
    p_target_state,
    p_reason,
    p_evidence_id,
    case when p_target_state='suspended_nonpayment' then now() else null end,
    case when p_target_state='active' then now() else null end,
    now()
  )
  on conflict (company_id) do update set
    state=excluded.state,
    reason=excluded.reason,
    source_evidence_id=excluded.source_evidence_id,
    suspended_at=case when excluded.state='suspended_nonpayment' then coalesce(public.core_service_access_state.suspended_at,now()) else public.core_service_access_state.suspended_at end,
    reactivated_at=case when excluded.state='active' then now() else public.core_service_access_state.reactivated_at end,
    updated_at=now()
  returning * into v_result;

  insert into public.core_service_access_events(company_id,event_key,from_state,to_state,reason,source_evidence_id,actor_type,details)
  values (p_company_id,p_event_key,null,p_target_state,p_reason,p_evidence_id,'financial_orchestrator',jsonb_build_object('idempotent',true))
  on conflict (event_key) do nothing;

  return v_result;
end;
$$;
revoke all on function public.core_apply_financial_service_transition(uuid,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.core_apply_financial_service_transition(uuid,text,uuid,text,text) to service_role;
