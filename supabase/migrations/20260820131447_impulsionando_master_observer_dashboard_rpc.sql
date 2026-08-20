create or replace function public.impulsionando_master_observer_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path='public','auth'
as $$
declare
  v_active_companies integer := 0;
  v_billing_contracts integer := 0;
  v_mrr numeric := 0;
  v_open_tickets integer := 0;
  v_open_conversations integer := 0;
  v_crm_opportunities integer := 0;
  v_n8n_active integer := 0;
  v_n8n_total integer := 0;
  v_costs numeric := 0;
  v_paying_clients integer := 0;
begin
  if auth.uid() is null or not (public.is_impulsionando_master_observer(auth.uid()) or public.is_impulsionando_staff(auth.uid())) then
    raise exception 'not_authorized';
  end if;

  select count(*) into v_active_companies from public.companies where coalesce(is_active,true)=true;
  select count(*),coalesce(sum(recurring_amount),0),count(distinct company_id)
    into v_billing_contracts,v_mrr,v_paying_clients
  from public.billing_contracts
  where status='active' and recurring_amount>0
    and (last_paid_at is not null or exists(select 1 from public.billing_invoices bi where bi.contract_id=billing_contracts.id and bi.status='paid'));
  select count(*) into v_open_tickets from public.support_tickets where status in ('open','waiting_customer','waiting_internal','reopened');
  select count(*) into v_open_conversations from public.communication_conversations where status in ('open','active','pending');
  select count(*) into v_crm_opportunities from public.crm_opportunities;
  select count(*) filter(where status='ACTIVE' and n8n_workflow_id is not null),count(*) into v_n8n_active,v_n8n_total from public.n8n_workflow_registry;
  select coalesce(sum(monthly_brl),0) into v_costs from public.core_recurring_costs where company_id=public.master_company_id() and active=true;

  return jsonb_build_object(
    'as_of',now(),'access_mode','read_only','active_companies',v_active_companies,
    'paying_clients',v_paying_clients,'active_billing_contracts',v_billing_contracts,
    'mrr',v_mrr,'monthly_recurring_costs',v_costs,'open_support_tickets',v_open_tickets,
    'open_conversations',v_open_conversations,'crm_opportunities',v_crm_opportunities,
    'n8n_active',v_n8n_active,'n8n_total',v_n8n_total,
    'scope',jsonb_build_object('erp',true,'crm',true,'commercial',true,'operations',true,'analytics',true,'customer_portfolio',true,'secrets',false,'credential_vault',false,'clinical_records',false)
  );
end $$;
revoke all on function public.impulsionando_master_observer_dashboard() from public,anon;
grant execute on function public.impulsionando_master_observer_dashboard() to authenticated;
