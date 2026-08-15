create table if not exists public.riomed_quotes (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 code text not null, lead_id uuid, opportunity_id uuid references public.crm_opportunities(id) on delete set null, customer_id uuid, owner_user_id uuid references auth.users(id) on delete set null,
 channel text not null default 'internal', status text not null default 'draft' check(status=any(array['draft','sent','negotiating','approved','rejected','won','lost','expired','cancelled','converted'])),
 currency text not null default 'PYG', subtotal numeric(14,2) not null default 0, discount_total numeric(14,2) not null default 0, total numeric(14,2) not null default 0,
 expires_at timestamptz,sent_at timestamptz,approved_at timestamptz,approved_by_name text,rejected_at timestamptz,rejection_reason text,won_at timestamptz,lost_reason text,notes text,
 public_token text unique,public_token_expires_at timestamptz,order_id uuid,metadata jsonb not null default '{}',created_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,code));
create table if not exists public.riomed_quote_items (
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,quote_id uuid not null references public.riomed_quotes(id) on delete cascade,product_id uuid references public.riomed_products(id) on delete set null,variant_id uuid,description text not null,qty numeric(14,3) not null check(qty>0),unit_price numeric(14,2) not null check(unit_price>=0),discount numeric(14,2) not null default 0 check(discount>=0),total numeric(14,2) not null default 0,sort_order int not null default 0,created_at timestamptz not null default now());
create table if not exists public.sales_orders (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,quote_id uuid references public.riomed_quotes(id) on delete set null,order_number text not null,customer_id uuid,customer_name text,status text not null default 'confirmed' check(status=any(array['draft','confirmed','processing','fulfilled','cancelled','refunded'])),currency text not null default 'PYG',subtotal numeric(14,2) not null default 0,discount_total numeric(14,2) not null default 0,total numeric(14,2) not null default 0,owner_user_id uuid references auth.users(id) on delete set null,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,order_number));
create table if not exists public.sales_order_items (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.sales_orders(id) on delete cascade,company_id uuid not null references public.companies(id) on delete cascade,product_id uuid references public.riomed_products(id) on delete set null,description text not null,quantity numeric(14,3) not null check(quantity>0),unit_price numeric(14,2) not null check(unit_price>=0),discount numeric(14,2) not null default 0,total numeric(14,2) not null default 0,created_at timestamptz not null default now());
create table if not exists public.riomed_commission_rules (
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,scope text not null check(scope=any(array['product','category','seller'])),product_id uuid references public.riomed_products(id) on delete cascade,category text,user_id uuid references auth.users(id) on delete cascade,rate_pct numeric(6,3) not null check(rate_pct between 0 and 100),active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.riomed_commissions (
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,order_id uuid references public.sales_orders(id) on delete set null,quote_id uuid references public.riomed_quotes(id) on delete set null,seller_user_id uuid references auth.users(id) on delete set null,rule_id uuid references public.riomed_commission_rules(id) on delete set null,period text,base_amount numeric(14,2) not null default 0,rate_pct numeric(6,3) not null default 0,amount numeric(14,2) not null default 0,status text not null default 'pending' check(status=any(array['pending','approved','paid','cancelled'])),paid_at timestamptz,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());

create or replace function public.riomed_quote_recalc(p_quote_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare v_sub numeric; v_disc numeric; begin
 select coalesce(sum(qty*unit_price),0),coalesce(sum(discount),0) into v_sub,v_disc from public.riomed_quote_items where quote_id=p_quote_id;
 update public.riomed_quotes set subtotal=v_sub,discount_total=v_disc,total=greatest(v_sub-v_disc,0),updated_at=now() where id=p_quote_id;
end $$;
create or replace function public.riomed_quote_item_before() returns trigger language plpgsql set search_path=public as $$ begin new.total:=greatest(new.qty*new.unit_price-coalesce(new.discount,0),0); return new; end $$;
create or replace function public.riomed_quote_item_after() returns trigger language plpgsql security definer set search_path=public as $$ begin perform public.riomed_quote_recalc(coalesce(new.quote_id,old.quote_id)); return null; end $$;
drop trigger if exists trg_riomed_quote_item_total on public.riomed_quote_items;
create trigger trg_riomed_quote_item_total before insert or update on public.riomed_quote_items for each row execute function public.riomed_quote_item_before();
drop trigger if exists trg_riomed_quote_item_aggregate on public.riomed_quote_items;
create trigger trg_riomed_quote_item_aggregate after insert or update or delete on public.riomed_quote_items for each row execute function public.riomed_quote_item_after();

create or replace function public.riomed_convert_quote_to_order(_quote_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare q public.riomed_quotes%rowtype; v_order uuid; v_number text; v_rule public.riomed_commission_rules%rowtype;
begin
 select * into q from public.riomed_quotes where id=_quote_id for update;
 if not found then raise exception 'Cotización no encontrada'; end if;
 if q.order_id is not null then return q.order_id; end if;
 if q.status in('rejected','lost','expired','cancelled') then raise exception 'Cotización no convertible en estado %',q.status; end if;
 v_number:='RM-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
 insert into public.sales_orders(company_id,quote_id,order_number,customer_id,status,currency,subtotal,discount_total,total,owner_user_id,metadata)
 values(q.company_id,q.id,v_number,q.customer_id,'confirmed',q.currency,q.subtotal,q.discount_total,q.total,q.owner_user_id,jsonb_build_object('source','riomed_quote')) returning id into v_order;
 insert into public.sales_order_items(order_id,company_id,product_id,description,quantity,unit_price,discount,total)
 select v_order,company_id,product_id,description,qty,unit_price,discount,total from public.riomed_quote_items where quote_id=q.id;
 update public.riomed_quotes set order_id=v_order,status='converted',won_at=now(),updated_at=now() where id=q.id;
 if q.owner_user_id is not null then
   select * into v_rule from public.riomed_commission_rules where company_id=q.company_id and active and scope='seller' and user_id=q.owner_user_id order by updated_at desc limit 1;
   if found then insert into public.riomed_commissions(company_id,order_id,quote_id,seller_user_id,rule_id,period,base_amount,rate_pct,amount,status)
     values(q.company_id,v_order,q.id,q.owner_user_id,v_rule.id,to_char(current_date,'YYYY-MM'),q.total,v_rule.rate_pct,round(q.total*v_rule.rate_pct/100,2),'pending'); end if;
 end if;
 return v_order;
end $$;
create or replace function public.riomed_commercial_touch() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['riomed_quotes','sales_orders','riomed_commission_rules','riomed_commissions'] loop execute format('drop trigger if exists trg_%I_touch on public.%I',t,t); execute format('create trigger trg_%I_touch before update on public.%I for each row execute function public.riomed_commercial_touch()',t,t); end loop; end $$;
do $$ declare t text; begin foreach t in array array['riomed_quotes','riomed_quote_items','sales_orders','sales_order_items','riomed_commission_rules','riomed_commissions'] loop execute format('alter table public.%I enable row level security',t); execute format('grant select,insert,update,delete on public.%I to authenticated',t); execute format('grant all on public.%I to service_role',t); execute format('drop policy if exists riomed_commercial_company_access on public.%I',t); execute format('create policy riomed_commercial_company_access on public.%I for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()))',t); end loop; end $$;
revoke all on function public.riomed_convert_quote_to_order(uuid) from public,anon; grant execute on function public.riomed_convert_quote_to_order(uuid) to authenticated,service_role;
revoke all on function public.riomed_quote_recalc(uuid) from public,anon,authenticated; grant execute on function public.riomed_quote_recalc(uuid) to service_role;
create index if not exists riomed_quotes_company_status_idx on public.riomed_quotes(company_id,status,created_at desc);
create index if not exists riomed_quote_items_quote_idx on public.riomed_quote_items(quote_id);
create index if not exists sales_orders_company_created_idx on public.sales_orders(company_id,created_at desc);
create index if not exists riomed_commissions_company_period_idx on public.riomed_commissions(company_id,period,status);
comment on function public.riomed_convert_quote_to_order(uuid) is 'Converte cotação RioMed aprovada em pedido de forma idempotente, sem dependências do CRM legado.';