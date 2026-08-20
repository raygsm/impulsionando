create or replace function public.impulsionando_financial_dashboard()
returns jsonb
language plpgsql
security definer
set search_path='public','auth'
as $$
declare
  v_company uuid := public.master_company_id();
  v_policy public.core_financial_governance_policy%rowtype;
  v_paying_clients integer := 0;
  v_mrr numeric := 0;
  v_avg_ticket numeric := 0;
  v_expected_staff integer := 0;
  v_current_staff integer := 0;
  v_days integer := 0;
  v_structural_active boolean := false;
  v_next_hire_clients integer := 8;
  v_next_hire_mrr numeric := 0;
  v_reimbursed numeric := 0;
  v_reimbursement_remaining numeric := 0;
  v_reimbursement_months integer := 0;
  v_base_partner_total numeric := 0;
  v_reimbursement_monthly numeric := 0;
  v_accounts jsonb;
  v_partners jsonb;
  v_costs jsonb;
  v_cost_total numeric := 0;
  v_alerts jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or not (public.is_impulsionando_staff(auth.uid()) or public.is_impulsionando_master_observer(auth.uid())) then raise exception 'not_authorized'; end if;
  select * into v_policy from public.core_financial_governance_policy where company_id=v_company and active=true;
  if v_policy.id is null then raise exception 'financial_policy_not_configured'; end if;

  select count(distinct bc.company_id), coalesce(sum(bc.recurring_amount),0)
    into v_paying_clients,v_mrr
  from public.billing_contracts bc
  where bc.status='active' and bc.recurring_amount>0
    and (bc.last_paid_at is not null or exists(select 1 from public.billing_invoices bi where bi.contract_id=bc.id and bi.status='paid'));

  v_avg_ticket := case when v_paying_clients>0 then round(v_mrr/v_paying_clients,2) else 0 end;
  v_expected_staff := floor(v_paying_clients::numeric / v_policy.hiring_client_block)::integer;
  select operational_headcount into v_current_staff from public.core_workforce_capacity where company_id=v_company;
  v_current_staff := coalesce(v_current_staff,0);
  v_days := greatest(current_date-v_policy.commercial_go_live,0);
  v_structural_active := v_days+1 >= v_policy.structural_reserve_starts_day;
  v_next_hire_clients := (floor(v_paying_clients::numeric/v_policy.hiring_client_block)::integer+1)*v_policy.hiring_client_block;
  v_next_hire_mrr := v_next_hire_clients*v_policy.minimum_wage;

  select coalesce(sum(reimbursed_amount),0),coalesce(sum(original_amount-reimbursed_amount),0)
    into v_reimbursed,v_reimbursement_remaining
  from public.core_capital_reimbursements where company_id=v_company and status in ('pending','active');
  v_reimbursement_monthly := v_policy.raygs_reimbursement_sm*v_policy.minimum_wage;
  v_reimbursement_months := case when v_reimbursement_monthly>0 then ceil(v_reimbursement_remaining/v_reimbursement_monthly)::integer else 0 end;
  v_base_partner_total := 2*v_policy.base_partner_prolabore_sm*v_policy.minimum_wage;

  select coalesce(sum(monthly_brl),0),
         coalesce(jsonb_agg(jsonb_build_object('supplier',supplier_name,'service',service_name,'plan',plan_name,'monthly_brl',monthly_brl,'confidence',confidence,'payment_status',payment_status) order by supplier_name,service_name),'[]'::jsonb)
    into v_cost_total,v_costs
  from public.core_recurring_costs where company_id=v_company and active=true;

  select jsonb_agg(jsonb_build_object('code',account_code,'name',display_name,'institution',institution_name,'purpose',purpose,'allocation_pct',allocation_pct,'configured',is_real_configured) order by account_code)
    into v_accounts from public.core_financial_accounts where company_id=v_company and active=true;
  select jsonb_agg(jsonb_build_object('name',partner_name,'role',role_title,'equity_pct',equity_pct,'responsibility',responsibility_summary,'base_prolabore',base_prolabore_sm*v_policy.minimum_wage,'commercial_only',commercial_only) order by partner_name)
    into v_partners from public.core_partner_governance where company_id=v_company and active=true;

  if v_expected_staff>v_current_staff then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('severity','warning','code','HIRE_REQUIRED','message','Capacidade operacional abaixo da regra de 1 profissional a cada 8 clientes pagantes.','expected',v_expected_staff,'current',v_current_staff));
  end if;
  if v_paying_clients < 8 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('severity','info','code','FIRST_HIRE_COUNTDOWN','message','Primeira contratacao sera acionada ao atingir 8 clientes pagantes e pelo menos 8 salarios minimos de MRR.','clients_remaining',greatest(8-v_paying_clients,0),'mrr_remaining',greatest(8*v_policy.minimum_wage-v_mrr,0)));
  end if;
  if exists(select 1 from public.core_financial_accounts where company_id=v_company and active and not is_real_configured) then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('severity','info','code','BANK_DETAILS_PENDING','message','Existem contas gerenciais criadas aguardando agencia/conta/chave real.'));
  end if;
  if exists(select 1 from public.companies where id=v_company and nullif(trim(email),'') is null) then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('severity','warning','code','MASTER_EMAIL_MISSING','message','Cadastro principal da Impulsionando ainda esta sem e-mail corporativo em companies.email.'));
  end if;
  if exists(select 1 from public.core_recurring_costs where company_id=v_company and active and confidence='fallback_paid_plan') then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('severity','info','code','COSTS_WITH_FALLBACK','message','Parte dos custos usa o menor plano pago oficial como piso ate a fatura real ser localizada.'));
  end if;

  return jsonb_build_object(
    'as_of',now(),'company_id',v_company,'minimum_wage',v_policy.minimum_wage,'days_since_commercial_go_live',v_days,
    'phase',case when v_days<90 then '0_90' when v_days<180 then '91_180' else '181_plus' end,
    'paying_clients',v_paying_clients,'mrr',v_mrr,'avg_ticket',v_avg_ticket,
    'next_hire_clients',v_next_hire_clients,'next_hire_mrr',v_next_hire_mrr,'expected_operational_staff',v_expected_staff,'current_operational_staff',v_current_staff,
    'employee_cost_each',v_policy.employee_cost_sm*v_policy.minimum_wage,
    'tax_pct',v_policy.tax_pct,'technology_pct',v_policy.technology_pct,'marketing_commercial_pct',v_policy.marketing_commercial_pct,
    'structural_reserve_pct',v_policy.structural_reserve_pct,'structural_reserve_active',v_structural_active,
    'structural_reserve_starts_at',v_policy.commercial_go_live + (v_policy.structural_reserve_starts_day-1),
    'base_partner_prolabore_total',v_base_partner_total,'raygs_reimbursement_monthly',v_reimbursement_monthly,
    'raygs_reimbursement_original',v_policy.raygs_reimbursement_total,'raygs_reimbursed',v_reimbursed,'raygs_reimbursement_remaining',v_reimbursement_remaining,'raygs_reimbursement_months_remaining',v_reimbursement_months,
    'profit_distribution_pct',v_policy.profit_distribution_pct,'profit_retention_pct',v_policy.profit_retention_pct,'profit_close_months',v_policy.profit_close_months,
    'recurring_costs_monthly_brl',v_cost_total,'recurring_costs',coalesce(v_costs,'[]'::jsonb),
    'projection',jsonb_build_object('new_clients_per_week',v_policy.default_new_clients_per_week,'initial_showcase_clients',v_policy.projected_initial_showcase_clients,'initial_conversion_clients',v_policy.projected_initial_conversion_clients,'plan_average_ticket',(810.50+1621+3242)/3),
    'accounts',coalesce(v_accounts,'[]'::jsonb),'partners',coalesce(v_partners,'[]'::jsonb),'alerts',v_alerts
  );
end $$;
revoke all on function public.impulsionando_financial_dashboard() from public,anon;
grant execute on function public.impulsionando_financial_dashboard() to authenticated;
