-- Canonical manual Pix fallback for launch continuity.
-- This does not bypass Mercado Pago homologation: it is an authenticated,
-- auditable contingency path using the same Core contract rules.

create table if not exists public.billing_pix_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  contract_id uuid references public.billing_contracts(id) on delete set null,
  plan_code text,
  base_amount_cents integer not null check (base_amount_cents > 0),
  unique_amount_cents integer not null check (unique_amount_cents > 0),
  pix_payload text not null,
  pix_key text not null,
  txid text not null,
  status text not null default 'pending' check (status in ('pending','paid','expired','cancelled')),
  payer_name text,
  payer_doc text,
  payer_email text,
  payer_whatsapp text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  paid_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete set null,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_pix_charges
  add column if not exists checkout_session_id uuid references public.billing_checkout_sessions(id) on delete set null,
  add column if not exists reconciliation_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists billing_pix_charges_pending_amount_uniq
  on public.billing_pix_charges(unique_amount_cents) where status='pending';
create index if not exists billing_pix_charges_company_idx on public.billing_pix_charges(company_id);
create index if not exists billing_pix_charges_status_idx on public.billing_pix_charges(status,created_at desc);
create index if not exists billing_pix_charges_checkout_idx on public.billing_pix_charges(checkout_session_id);

grant select,update on public.billing_pix_charges to authenticated;
grant all on public.billing_pix_charges to service_role;
alter table public.billing_pix_charges enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='billing_pix_charges' and policyname='owners read own pix charges') then
    create policy "owners read own pix charges" on public.billing_pix_charges for select to authenticated
    using(company_id is not null and public.user_belongs_to_company(auth.uid(),company_id));
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='billing_pix_charges' and policyname='admins read all pix charges') then
    create policy "admins read all pix charges" on public.billing_pix_charges for select to authenticated
    using(public.has_role(auth.uid(),'admin') or public.is_impulsionando_staff(auth.uid()));
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='billing_pix_charges' and policyname='admins update pix charges') then
    create policy "admins update pix charges" on public.billing_pix_charges for update to authenticated
    using(public.has_role(auth.uid(),'admin') or public.is_impulsionando_staff(auth.uid()))
    with check(public.has_role(auth.uid(),'admin') or public.is_impulsionando_staff(auth.uid()));
  end if;
end $$;

create or replace function public.billing_finalize_manual_pix_charge(p_charge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_charge public.billing_pix_charges%rowtype;
  v_session public.billing_checkout_sessions%rowtype;
  v_plan public.billing_plans%rowtype;
  v_quote jsonb;
  v_expected_cents integer;
  v_variance_cents integer;
  v_contract public.billing_contracts%rowtype;
  v_invoice_id uuid;
  v_policy_id uuid;
  v_anchor date;
  v_effective date;
begin
  select * into v_charge from public.billing_pix_charges where id=p_charge_id for update;
  if not found then raise exception 'pix_charge_not_found'; end if;
  if v_charge.status<>'paid' then raise exception 'pix_payment_confirmation_required'; end if;
  if v_charge.company_id is null or v_charge.checkout_session_id is null then raise exception 'canonical_checkout_session_required'; end if;

  select * into v_session from public.billing_checkout_sessions where id=v_charge.checkout_session_id for update;
  if not found then raise exception 'checkout_session_not_found'; end if;
  if v_session.customer_company_id is distinct from v_charge.company_id then raise exception 'checkout_company_mismatch'; end if;
  if v_session.accepted_at is null or nullif(trim(v_session.terms_version),'') is null or nullif(trim(v_session.terms_hash),'') is null then raise exception 'terms_acceptance_required'; end if;

  if v_session.status='completed' and v_session.billing_contract_id is not null then
    update public.billing_pix_charges set contract_id=v_session.billing_contract_id,updated_at=now() where id=v_charge.id;
    return jsonb_build_object('completed',true,'contract_id',v_session.billing_contract_id,'idempotent',true);
  end if;

  select * into v_plan from public.billing_plans where id=v_session.plan_id and is_active=true;
  if not found then raise exception 'plan_not_found_or_inactive'; end if;

  v_effective:=timezone('America/Sao_Paulo',v_session.accepted_at)::date;
  v_quote:=public.billing_initial_contract_quote(v_session.plan_id,v_effective);
  v_expected_cents:=round(((v_quote->>'initial_total')::numeric)*100)::int;
  if v_charge.base_amount_cents<>v_expected_cents then raise exception 'canonical_base_amount_mismatch'; end if;
  v_variance_cents:=v_charge.unique_amount_cents-v_expected_cents;
  if v_variance_cents<0 or v_variance_cents>99 then raise exception 'invalid_reconciliation_variance'; end if;

  select id into v_policy_id from public.billing_dunning_policy where is_default=true order by created_at limit 1;
  if v_policy_id is null then raise exception 'default_dunning_policy_required'; end if;
  v_anchor:=(v_quote->>'next_anchor_date')::date;

  select * into v_contract from public.billing_contracts
  where company_id=v_charge.company_id and status not in ('cancelled','archived')
  order by created_at desc limit 1 for update;
  if v_contract.id is null then
    insert into public.billing_contracts(company_id,plan_id,policy_id,start_date,due_day,next_due_date,recurring_amount,status,setup_paid_at,setup_amount,last_paid_at,metadata)
    values(v_charge.company_id,v_session.plan_id,v_policy_id,v_effective,5,v_anchor,v_plan.recurring_amount,'active',coalesce(v_charge.paid_at,now()),v_plan.setup_fee,coalesce(v_charge.paid_at,now()),jsonb_build_object('source','manual_pix_canonical_checkout','checkout_session_id',v_session.id,'pix_charge_id',v_charge.id,'terms_version',v_session.terms_version,'terms_hash',v_session.terms_hash,'accepted_at',v_session.accepted_at,'initial_prorata_amount',(v_quote->>'prorata_amount')::numeric,'initial_total',(v_quote->>'initial_total')::numeric,'reconciliation_variance_cents',v_variance_cents,'due_day',5))
    returning * into v_contract;
  end if;

  insert into public.billing_invoices(contract_id,company_id,period_start,period_end,due_date,amount,status,paid_at,metadata)
  values(v_contract.id,v_contract.company_id,v_effective,greatest(v_effective,v_anchor-1),v_effective,(v_quote->>'initial_total')::numeric,'paid',coalesce(v_charge.paid_at,now()),jsonb_build_object('kind','initial_setup_and_prorata','setup_amount',v_plan.setup_fee,'prorata_amount',(v_quote->>'prorata_amount')::numeric,'pix_charge_id',v_charge.id,'actual_received_cents',v_charge.unique_amount_cents,'reconciliation_variance_cents',v_variance_cents,'next_full_recurring_due_date',v_anchor))
  on conflict(contract_id,due_date) do update set status='paid',paid_at=excluded.paid_at,metadata=coalesce(public.billing_invoices.metadata,'{}'::jsonb)||excluded.metadata
  returning id into v_invoice_id;

  update public.billing_checkout_sessions set status='completed',billing_contract_id=v_contract.id,updated_at=now(),metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('completed_at',now(),'initial_invoice_id',v_invoice_id,'payment_channel','manual_pix') where id=v_session.id;
  update public.billing_pix_charges set contract_id=v_contract.id,updated_at=now(),reconciliation_metadata=coalesce(reconciliation_metadata,'{}'::jsonb)||jsonb_build_object('canonical_total_cents',v_expected_cents,'actual_received_cents',v_charge.unique_amount_cents,'variance_cents',v_variance_cents,'finalized_at',now()) where id=v_charge.id;
  perform public.core_enroll_company(v_contract.company_id,null);

  return jsonb_build_object('completed',true,'contract_id',v_contract.id,'initial_invoice_id',v_invoice_id,'next_due_date',v_anchor,'due_day',5,'monthly_amount',v_plan.recurring_amount,'canonical_initial_total',(v_quote->>'initial_total')::numeric,'actual_received_cents',v_charge.unique_amount_cents,'reconciliation_variance_cents',v_variance_cents,'idempotent',false);
end;
$$;
