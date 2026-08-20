-- Preserve the canonical day-5 billing anchor on every payment/reactivation.
create or replace function public.billing_mark_paid(
  _invoice_id uuid,
  _paid_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_inv public.billing_invoices%rowtype;
  v_contract public.billing_contracts%rowtype;
  v_restore uuid[];
  v_paid_local_date date;
  v_next_due date;
begin
  select * into v_inv from public.billing_invoices where id=_invoice_id for update;
  if v_inv.id is null then raise exception 'invoice_not_found'; end if;
  if v_inv.status='paid' then return v_inv.id; end if;

  select * into v_contract from public.billing_contracts where id=v_inv.contract_id for update;
  if v_contract.id is null then raise exception 'contract_not_found'; end if;

  v_paid_local_date := timezone('America/Sao_Paulo',_paid_at)::date;
  v_next_due := greatest(
    case
      when extract(day from v_inv.due_date)::int=5 then (v_inv.due_date+interval '1 month')::date
      else public.billing_next_anchor_day5(v_paid_local_date)
    end,
    public.billing_next_anchor_day5(v_paid_local_date)
  );

  update public.billing_invoices
  set status='paid',paid_at=_paid_at,updated_at=now()
  where id=v_inv.id;

  update public.billing_contracts
  set status='active',last_paid_at=_paid_at,due_day=5,next_due_date=v_next_due,updated_at=now(),
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('last_reactivated_at',now(),'last_reactivated_invoice_id',v_inv.id,'canonical_due_day',5)
  where id=v_contract.id;

  select disabled_module_ids into v_restore
  from public.billing_suspensions
  where contract_id=v_contract.id and reactivated_at is null
  order by suspended_at desc limit 1;

  if coalesce(array_length(v_restore,1),0)>0 then
    update public.company_modules
    set is_enabled=true,enabled_at=coalesce(enabled_at,now()),updated_at=now()
    where company_id=v_contract.company_id and module_id=any(v_restore);
  end if;

  update public.billing_suspensions
  set reactivated_at=now(),reactivated_reason='payment_identified'
  where contract_id=v_contract.id and reactivated_at is null;

  insert into public.audit_logs(company_id,action,entity,entity_id,after,metadata)
  values(
    v_contract.company_id,'billing.invoice.paid','billing_invoices',v_inv.id::text,
    jsonb_build_object('paid_at',_paid_at,'next_due_date',v_next_due,'due_day',5),
    jsonb_build_object('source','billing_mark_paid','timezone','America/Sao_Paulo')
  );

  return v_inv.id;
end;
$$;
