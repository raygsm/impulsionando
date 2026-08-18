-- HOMOLOGACAO ONLY — Impulsionando Tecnologia direct checkout provisioning.
-- Atomic path after a Mercado Pago payment is independently confirmed server-side.
-- Creates/links the customer company, Core tenant membership, billing contract and paid first invoice.

begin;

create or replace function public.core_finalize_impulsionando_checkout(
  p_checkout_session_id uuid,
  p_payment_id uuid,
  p_mp_payment_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_session public.billing_checkout_sessions%rowtype;
  v_plan public.billing_plans%rowtype;
  v_payment public.mpago_payments%rowtype;
  v_company_id uuid;
  v_tenant_id uuid;
  v_contract_id uuid;
  v_invoice_id uuid;
  v_slug text;
  v_doc text;
  v_doc_type text;
  v_period_start date := current_date;
  v_period_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
  v_next_due date := (date_trunc('month', current_date) + interval '1 month + 4 days')::date;
  v_first_amount numeric(14,2);
begin
  select * into v_session
  from public.billing_checkout_sessions
  where id = p_checkout_session_id
  for update;
  if v_session.id is null then raise exception 'checkout_session_not_found'; end if;

  if v_session.billing_contract_id is not null and v_session.status = 'completed' then
    return jsonb_build_object(
      'status','IDEMPOTENT_ALREADY_COMPLETED',
      'checkout_session_id',v_session.id,
      'company_id',v_session.customer_company_id,
      'contract_id',v_session.billing_contract_id
    );
  end if;

  if v_session.accepted_at is null or v_session.accepted_user_id is null then
    raise exception 'checkout_terms_not_accepted';
  end if;

  select * into v_plan from public.billing_plans where id = v_session.plan_id and is_active = true;
  if v_plan.id is null then raise exception 'billing_plan_not_available'; end if;
  if not coalesce(v_plan.allow_direct_checkout,false) or not coalesce(v_plan.show_in_checkout,false) then
    raise exception 'direct_checkout_not_enabled';
  end if;

  select * into v_payment
  from public.mpago_payments
  where id = p_payment_id
    and context_type = 'billing_checkout_session'
    and context_id = v_session.id
    and mp_payment_id = p_mp_payment_id
  for update;
  if v_payment.id is null then raise exception 'checkout_payment_not_found'; end if;
  if lower(coalesce(v_payment.status,'')) <> 'approved' then raise exception 'payment_not_approved'; end if;

  v_company_id := v_session.customer_company_id;
  if v_company_id is null then
    v_doc := regexp_replace(coalesce(v_session.contact_doc,''), '\D', '', 'g');
    if length(v_doc) = 14 and public.core_is_valid_cnpj(v_doc) then
      v_doc_type := 'CNPJ';
    else
      v_doc := null;
      v_doc_type := null;
    end if;

    -- Reuse a company only when the document is an exact verified match.
    if v_doc is not null then
      select c.id into v_company_id
      from public.companies c
      where regexp_replace(coalesce(c.document,''), '\D', '', 'g') = v_doc
      limit 1;
    end if;

    if v_company_id is null then
      insert into public.companies(name,legal_name,email,phone,document,document_type,is_active,status,is_demo)
      values(
        trim(v_session.contact_company),
        trim(v_session.contact_company),
        lower(trim(v_session.contact_email)),
        nullif(trim(v_session.contact_phone),''),
        v_doc,
        v_doc_type,
        true,
        'active',
        false
      )
      returning id into v_company_id;
    end if;

    update public.billing_checkout_sessions
    set customer_company_id = v_company_id, status = 'provisioning', updated_at = now()
    where id = v_session.id;
  end if;

  select t.id into v_tenant_id
  from public.communication_tenants t
  where t.company_id = v_company_id and t.active = true
  order by t.created_at
  limit 1;

  if v_tenant_id is null then
    v_slug := lower(regexp_replace(trim(v_session.contact_company), '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    if v_slug = '' then v_slug := 'empresa'; end if;
    v_slug := left(v_slug, 48) || '-' || substr(replace(v_session.id::text,'-',''),1,8);

    insert into public.communication_tenants(kind,slug,legal_name,display_name,locale,timezone,settings,active,company_id)
    values('COMPANY',v_slug,trim(v_session.contact_company),trim(v_session.contact_company),'pt-BR','America/Sao_Paulo','{}'::jsonb,true,v_company_id)
    returning id into v_tenant_id;
  end if;

  insert into public.communication_tenant_members(tenant_id,user_id,role)
  values(v_tenant_id,v_session.accepted_user_id,'OWNER')
  on conflict (tenant_id,user_id) do update set role = 'OWNER';

  select bc.id into v_contract_id
  from public.billing_contracts bc
  where bc.company_id = v_company_id
    and bc.plan_id = v_session.plan_id
    and bc.status <> 'archived'
  order by bc.created_at desc
  limit 1;

  if v_contract_id is null then
    insert into public.billing_contracts(
      company_id,plan_id,start_date,due_day,next_due_date,recurring_amount,status,
      setup_paid_at,setup_amount,last_paid_at,metadata
    ) values(
      v_company_id,v_session.plan_id,current_date,5,v_next_due,v_session.recurring_amount,'active',
      now(),v_session.setup_amount,now(),
      jsonb_build_object(
        'source','impulsionando_direct_checkout',
        'checkout_session_id',v_session.id,
        'accepted_user_id',v_session.accepted_user_id,
        'terms_version',v_session.terms_version,
        'terms_hash',v_session.terms_hash
      )
    ) returning id into v_contract_id;
  else
    update public.billing_contracts
    set status='active',last_paid_at=now(),setup_paid_at=coalesce(setup_paid_at,now()),updated_at=now()
    where id=v_contract_id;
  end if;

  v_first_amount := coalesce(v_session.setup_amount,0) + coalesce(v_session.recurring_amount,0);

  insert into public.billing_invoices(
    contract_id,company_id,period_start,period_end,due_date,amount,status,paid_at,mp_payment_id,metadata
  ) values(
    v_contract_id,v_company_id,v_period_start,v_period_end,current_date,v_first_amount,'paid',now(),p_mp_payment_id,
    jsonb_build_object('source','impulsionando_direct_checkout','checkout_session_id',v_session.id,'payment_id',v_payment.id,'includes_setup',true)
  )
  on conflict (contract_id,due_date) do update set
    status='paid',paid_at=coalesce(public.billing_invoices.paid_at,now()),mp_payment_id=p_mp_payment_id,updated_at=now()
  returning id into v_invoice_id;

  insert into public.core_service_access_state(company_id,state,reason,updated_at)
  values(v_company_id,'active','initial_payment_confirmed',now())
  on conflict (company_id) do update set
    state='active',reason='initial_payment_confirmed',reactivated_at=now(),updated_at=now();

  update public.billing_checkout_sessions
  set customer_company_id=v_company_id,
      billing_contract_id=v_contract_id,
      status='completed',
      updated_at=now()
  where id=v_session.id;

  insert into public.audit_logs(company_id,action,entity,entity_id,after,metadata)
  values(
    v_company_id,
    'billing.checkout.completed',
    'billing_checkout_sessions',
    v_session.id::text,
    jsonb_build_object('contract_id',v_contract_id,'invoice_id',v_invoice_id,'plan_id',v_session.plan_id),
    jsonb_build_object('source','impulsionando_direct_checkout','mp_payment_id',p_mp_payment_id)
  );

  return jsonb_build_object(
    'status','COMPLETED',
    'checkout_session_id',v_session.id,
    'company_id',v_company_id,
    'tenant_id',v_tenant_id,
    'contract_id',v_contract_id,
    'invoice_id',v_invoice_id
  );
end;
$$;

revoke all on function public.core_finalize_impulsionando_checkout(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.core_finalize_impulsionando_checkout(uuid,uuid,text) to service_role;

commit;
