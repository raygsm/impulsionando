-- Canonical first-contract flow for the Impulsionando Core.
-- The commercial terms are accepted before payment; activation only occurs
-- after an approved payment is linked to the checkout session.

create or replace function public.billing_initial_contract_quote(
  p_plan_id uuid,
  p_effective_date date default current_date
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_plan public.billing_plans%rowtype;
  v_anchor date;
  v_cycle_start date;
  v_cycle_days integer;
  v_remaining integer;
  v_prorata numeric;
begin
  select * into v_plan
  from public.billing_plans
  where id=p_plan_id and is_active=true;
  if not found then raise exception 'plan_not_found_or_inactive'; end if;
  if v_plan.code='WHITE_LABEL' then raise exception 'white_label_requires_separate_flow'; end if;

  v_anchor := public.billing_next_anchor_day5(p_effective_date);
  v_cycle_start := (v_anchor - interval '1 month')::date;
  v_cycle_days := greatest(v_anchor-v_cycle_start,1);
  v_remaining := greatest(v_anchor-p_effective_date,0);
  v_prorata := round(v_plan.recurring_amount * v_remaining::numeric / v_cycle_days::numeric,2);

  return jsonb_build_object(
    'plan_id',v_plan.id,
    'plan_code',v_plan.code,
    'plan_name',v_plan.name,
    'effective_date',p_effective_date,
    'due_day',5,
    'next_anchor_date',v_anchor,
    'cycle_days',v_cycle_days,
    'remaining_days',v_remaining,
    'monthly_amount',v_plan.recurring_amount,
    'prorata_amount',v_prorata,
    'setup_amount',v_plan.setup_fee,
    'initial_total',round(v_plan.setup_fee+v_prorata,2),
    'setup_rule','integral_no_prorata',
    'recurrence_rule','full_monthly_amount_due_every_day_5',
    'timezone','America/Sao_Paulo'
  );
end;
$$;

create or replace function public.billing_create_initial_checkout_session(
  p_company_id uuid,
  p_plan_id uuid,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_contact_doc text,
  p_terms_version text,
  p_terms_hash text,
  p_idempotency_key text,
  p_accepted_ip inet default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_company public.companies%rowtype;
  v_plan public.billing_plans%rowtype;
  v_quote jsonb;
  v_session public.billing_checkout_sessions%rowtype;
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if not (public.user_belongs_to_company(v_user,p_company_id) or public.is_impulsionando_staff(v_user)) then raise exception 'forbidden'; end if;

  select * into v_company from public.companies where id=p_company_id;
  if not found or not coalesce(v_company.is_active,false) or coalesce(v_company.is_master,false) or coalesce(v_company.is_demo,false) then
    raise exception 'company_not_eligible';
  end if;
  if exists(select 1 from public.billing_contracts where company_id=p_company_id and status not in ('cancelled','archived')) then
    raise exception 'active_or_historical_current_contract_exists_use_plan_change';
  end if;
  if nullif(trim(p_contact_name),'') is null then raise exception 'contact_name_required'; end if;
  if nullif(trim(p_contact_email),'') is null then raise exception 'contact_email_required'; end if;
  if nullif(trim(p_terms_version),'') is null or nullif(trim(p_terms_hash),'') is null then raise exception 'terms_acceptance_required'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception 'idempotency_key_required'; end if;

  select * into v_plan from public.billing_plans where id=p_plan_id and is_active=true;
  if not found then raise exception 'plan_not_found_or_inactive'; end if;
  if v_plan.code='WHITE_LABEL' then raise exception 'white_label_requires_separate_flow'; end if;

  v_quote := public.billing_initial_contract_quote(p_plan_id,current_date);

  select * into v_session from public.billing_checkout_sessions where idempotency_key=p_idempotency_key;
  if found then
    if v_session.customer_company_id is distinct from p_company_id or v_session.plan_id is distinct from p_plan_id then
      raise exception 'idempotency_key_conflict';
    end if;
    return jsonb_build_object('session_id',v_session.id,'status',v_session.status,'quote',v_session.metadata->'quote','idempotent',true);
  end if;

  insert into public.billing_checkout_sessions(
    plan_id,customer_company_id,contact_name,contact_company,contact_email,contact_phone,contact_doc,
    setup_amount,recurring_amount,due_day,cycle,terms_version,terms_hash,accepted_at,accepted_ip,
    accepted_user_id,status,idempotency_key,metadata
  ) values (
    p_plan_id,p_company_id,trim(p_contact_name),v_company.name,lower(trim(p_contact_email)),nullif(trim(p_contact_phone),''),nullif(trim(p_contact_doc),''),
    (v_quote->>'setup_amount')::numeric,v_plan.recurring_amount,5,v_plan.cycle,trim(p_terms_version),trim(p_terms_hash),now(),p_accepted_ip,
    v_user,'created',trim(p_idempotency_key),jsonb_build_object(
      'quote',v_quote,
      'initial_prorata_amount',(v_quote->>'prorata_amount')::numeric,
      'initial_total',(v_quote->>'initial_total')::numeric,
      'commercial_acceptance_recorded',true,
      'activation_requires_approved_payment',true
    )
  ) returning * into v_session;

  return jsonb_build_object('session_id',v_session.id,'status',v_session.status,'quote',v_quote,'idempotent',false);
end;
$$;

create or replace function public.billing_finalize_initial_checkout(p_checkout_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_session public.billing_checkout_sessions%rowtype;
  v_payment public.mpago_payments%rowtype;
  v_plan public.billing_plans%rowtype;
  v_quote jsonb;
  v_expected numeric;
  v_paid numeric;
  v_contract public.billing_contracts%rowtype;
  v_invoice_id uuid;
  v_policy_id uuid;
  v_anchor date;
  v_effective date;
begin
  select * into v_session from public.billing_checkout_sessions where id=p_checkout_session_id for update;
  if not found then raise exception 'checkout_session_not_found'; end if;

  if v_session.status='completed' and v_session.billing_contract_id is not null then
    return jsonb_build_object('completed',true,'contract_id',v_session.billing_contract_id,'idempotent',true);
  end if;
  if v_session.customer_company_id is null then raise exception 'checkout_company_required'; end if;
  if v_session.accepted_at is null or nullif(trim(v_session.terms_version),'') is null or nullif(trim(v_session.terms_hash),'') is null then
    raise exception 'terms_acceptance_required';
  end if;
  if v_session.mpago_payment_id is null then raise exception 'approved_payment_required'; end if;

  select * into v_payment from public.mpago_payments where id=v_session.mpago_payment_id for update;
  if not found or v_payment.status<>'approved' then raise exception 'approved_payment_required'; end if;
  if v_payment.company_id is distinct from v_session.customer_company_id then raise exception 'payment_company_mismatch'; end if;

  select * into v_plan from public.billing_plans where id=v_session.plan_id and is_active=true;
  if not found then raise exception 'plan_not_found_or_inactive'; end if;

  v_effective := timezone('America/Sao_Paulo',v_session.accepted_at)::date;
  v_quote := public.billing_initial_contract_quote(v_session.plan_id,v_effective);
  v_expected := (v_quote->>'initial_total')::numeric;
  v_paid := round(v_payment.amount_cents::numeric/100,2);
  if v_paid <> v_expected then raise exception 'payment_amount_mismatch expected=% paid=%',v_expected,v_paid; end if;

  select id into v_policy_id from public.billing_dunning_policy where is_default=true order by created_at limit 1;
  if v_policy_id is null then raise exception 'default_dunning_policy_required'; end if;
  v_anchor := (v_quote->>'next_anchor_date')::date;

  select * into v_contract from public.billing_contracts
  where company_id=v_session.customer_company_id and status not in ('cancelled','archived')
  order by created_at desc limit 1 for update;

  if v_contract.id is null then
    insert into public.billing_contracts(
      company_id,plan_id,policy_id,start_date,due_day,next_due_date,recurring_amount,status,
      setup_paid_at,setup_amount,last_paid_at,metadata
    ) values (
      v_session.customer_company_id,v_session.plan_id,v_policy_id,v_effective,5,v_anchor,v_plan.recurring_amount,'active',
      coalesce(v_payment.approved_at,now()),v_plan.setup_fee,coalesce(v_payment.approved_at,now()),
      jsonb_build_object(
        'source','billing_initial_checkout',
        'checkout_session_id',v_session.id,
        'terms_version',v_session.terms_version,
        'terms_hash',v_session.terms_hash,
        'accepted_at',v_session.accepted_at,
        'accepted_user_id',v_session.accepted_user_id,
        'initial_prorata_amount',(v_quote->>'prorata_amount')::numeric,
        'initial_total',v_expected,
        'mpago_payment_id',v_payment.id,
        'due_day',5
      )
    ) returning * into v_contract;
  end if;

  insert into public.billing_invoices(
    contract_id,company_id,period_start,period_end,due_date,amount,status,paid_at,mp_payment_id,metadata
  ) values (
    v_contract.id,v_contract.company_id,v_effective,greatest(v_effective,v_anchor-1),v_effective,v_expected,'paid',coalesce(v_payment.approved_at,now()),
    v_payment.mp_payment_id,
    jsonb_build_object(
      'kind','initial_setup_and_prorata',
      'setup_amount',v_plan.setup_fee,
      'prorata_amount',(v_quote->>'prorata_amount')::numeric,
      'next_full_recurring_due_date',v_anchor,
      'checkout_session_id',v_session.id
    )
  ) on conflict(contract_id,due_date) do update set
    status='paid',paid_at=excluded.paid_at,mp_payment_id=excluded.mp_payment_id,metadata=coalesce(public.billing_invoices.metadata,'{}'::jsonb)||excluded.metadata
  returning id into v_invoice_id;

  update public.billing_checkout_sessions
  set status='completed',billing_contract_id=v_contract.id,updated_at=now(),
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('completed_at',now(),'initial_invoice_id',v_invoice_id)
  where id=v_session.id;

  perform public.core_enroll_company(v_contract.company_id,null);

  return jsonb_build_object(
    'completed',true,
    'contract_id',v_contract.id,
    'initial_invoice_id',v_invoice_id,
    'next_due_date',v_contract.next_due_date,
    'due_day',5,
    'monthly_amount',v_contract.recurring_amount,
    'initial_total',v_expected,
    'idempotent',false
  );
end;
$$;
