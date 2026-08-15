create table if not exists public.riomed_ap_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
  supplier_id uuid references public.riomed_suppliers(id) on delete set null,
  description text not null,
  amount numeric(14,2) not null check(amount>=0),
  paid_amount numeric(14,2) not null default 0 check(paid_amount>=0),
  currency text not null default 'BOB',
  issue_date date not null default current_date,
  due_date date not null,
  paid_at timestamptz,
  payment_method text,
  category text,
  status text not null default 'open' check(status in ('open','partial','paid','overdue','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.riomed_refresh_overdue(p_company_id uuid)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_ar int:=0; v_ap int:=0;
begin
  if not (public.user_belongs_to_company(auth.uid(),p_company_id) or public.is_impulsionando_staff(auth.uid()) or auth.role()='service_role') then raise exception 'Acesso negado'; end if;
  update public.riomed_ar_invoices set status='overdue',updated_at=now() where company_id=p_company_id and status in ('open','partial') and due_date is not null and due_date<current_date;
  get diagnostics v_ar=row_count;
  update public.riomed_ap_invoices set status='overdue',updated_at=now() where company_id=p_company_id and status in ('open','partial') and due_date<current_date;
  get diagnostics v_ap=row_count;
  return jsonb_build_object('ok',true,'ar',v_ar,'ap',v_ap);
end $$;

create unique index if not exists riomed_commissions_order_seller_uq on public.riomed_commissions(order_id,seller_user_id) where order_id is not null;

create or replace function public.riomed_accrue_commission(p_order_id uuid,p_user_id uuid)
returns uuid language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_order public.sales_orders%rowtype; v_rule public.riomed_commission_rules%rowtype; v_id uuid; v_rate numeric(8,4):=0; v_amount numeric(14,2):=0;
begin
  select * into v_order from public.sales_orders where id=p_order_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if not (public.user_belongs_to_company(auth.uid(),v_order.company_id) or public.is_impulsionando_staff(auth.uid()) or auth.role()='service_role') then raise exception 'Acesso negado'; end if;
  select id into v_id from public.riomed_commissions where order_id=p_order_id and seller_user_id=p_user_id limit 1;
  if v_id is not null then return v_id; end if;
  select * into v_rule from public.riomed_commission_rules where company_id=v_order.company_id and active=true and ((scope='user' and user_id=p_user_id) or scope='default') order by case when scope='user' then 0 else 1 end, created_at desc limit 1;
  v_rate:=coalesce(v_rule.rate_pct,0); v_amount:=round(coalesce(v_order.total,0)*v_rate/100,2);
  insert into public.riomed_commissions(company_id,order_id,quote_id,seller_user_id,rule_id,period,base_amount,rate_pct,amount,status,metadata)
  values(v_order.company_id,v_order.id,v_order.quote_id,p_user_id,v_rule.id,to_char(v_order.created_at,'YYYY-MM'),coalesce(v_order.total,0),v_rate,v_amount,'accrued',jsonb_build_object('source','sales_order')) returning id into v_id;
  return v_id;
end $$;

alter table public.riomed_ap_invoices enable row level security;
grant select,insert,update,delete on public.riomed_ap_invoices to authenticated;
grant all on public.riomed_ap_invoices to service_role;
drop policy if exists riomed_ap_company_access on public.riomed_ap_invoices;
create policy riomed_ap_company_access on public.riomed_ap_invoices for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()));
revoke all on function public.riomed_refresh_overdue(uuid) from public,anon;
grant execute on function public.riomed_refresh_overdue(uuid) to authenticated,service_role;
revoke all on function public.riomed_accrue_commission(uuid,uuid) from public,anon;
grant execute on function public.riomed_accrue_commission(uuid,uuid) to authenticated,service_role;
create index if not exists riomed_ap_company_status_due_idx on public.riomed_ap_invoices(company_id,status,due_date);
drop trigger if exists trg_riomed_ap_touch on public.riomed_ap_invoices;
create trigger trg_riomed_ap_touch before update on public.riomed_ap_invoices for each row execute function public.riomed_commercial_touch();