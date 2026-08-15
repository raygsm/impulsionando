create table if not exists public.core_tenant_identity (
 id uuid primary key default gen_random_uuid(), company_id uuid not null unique references public.companies(id) on delete cascade,
 subdomain text not null unique, root_domain text not null default 'impulsionando.com.br', custom_domain text unique,
 dns_status text not null default 'pending' check(dns_status=any(array['pending','provisioning','active','failed','disabled'])), dns_last_checked_at timestamptz,dns_error text,
 ssl_status text not null default 'pending' check(ssl_status=any(array['pending','issued','failed','renewing'])),ssl_issued_at timestamptz,ssl_expires_at timestamptz,provisioned_at timestamptz,
 metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),constraint core_tenant_identity_subdomain_format check(subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'));
alter table public.core_tenant_identity enable row level security;
grant select on public.core_tenant_identity to authenticated;
grant all on public.core_tenant_identity to service_role;
drop policy if exists core_tenant_identity_member_read on public.core_tenant_identity;
create policy core_tenant_identity_member_read on public.core_tenant_identity for select to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()));
insert into public.core_tenant_identity(company_id,subdomain,dns_status,ssl_status,provisioned_at,metadata)
select ct.company_id,ct.slug,'active','issued',now(),jsonb_build_object('source','communication_tenants','tenant_id',ct.id)
from public.communication_tenants ct where ct.company_id is not null and ct.active=true and ct.deleted_at is null
on conflict(company_id) do update set subdomain=excluded.subdomain,metadata=public.core_tenant_identity.metadata || excluded.metadata,updated_at=now();

create or replace function public.riomed_company_id() returns uuid language sql stable security definer set search_path=public as $$
 select company_id from public.communication_tenants where slug='rio-med' and active=true and deleted_at is null and company_id is not null limit 1
$$;
revoke all on function public.riomed_company_id() from public,anon,authenticated;
grant execute on function public.riomed_company_id() to service_role;

create table if not exists public.riomed_products(
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,sku text,name text not null,description text,category text,audiences text[] not null default array['paciente']::text[],modality text not null default 'venta' check(modality in('venta','alquiler','ambos')),price_sale numeric(12,2),price_rental_daily numeric(12,2),price_rental_monthly numeric(12,2),currency text not null default 'BOB',image_url text,stock int not null default 0,is_active boolean not null default true,display_order int not null default 0,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,sku));
create table if not exists public.rental_assets(
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,asset_code text not null,name text not null,category text,brand text,model text,serial_number text,status text not null default 'available',daily_rate numeric(12,2),monthly_rate numeric(12,2),acquisition_cost numeric(12,2),warehouse_id uuid,notes text,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,asset_code));
create table if not exists public.rental_contracts(
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,contract_number text not null,customer_id uuid,customer_name text not null,customer_document text,start_date date not null,end_date date,billing_cycle text not null default 'monthly',total_amount numeric(12,2) not null default 0,status text not null default 'active',delivery_address text,notes text,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,contract_number));
create table if not exists public.rental_contract_items(
 id uuid primary key default gen_random_uuid(),contract_id uuid not null references public.rental_contracts(id) on delete cascade,asset_id uuid references public.rental_assets(id),description text not null,quantity int not null default 1,unit_rate numeric(12,2) not null default 0,total numeric(12,2) not null default 0,created_at timestamptz not null default now());
create table if not exists public.service_orders(
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,order_number text not null,customer_id uuid,customer_name text not null,equipment_description text not null,equipment_serial text,service_type text not null default 'corrective',priority text not null default 'normal',status text not null default 'open',assigned_to uuid references auth.users(id),sla_due_at timestamptz,opened_at timestamptz not null default now(),closed_at timestamptz,diagnosis text,resolution text,labor_cost numeric(12,2) default 0,parts_cost numeric(12,2) default 0,total_cost numeric(12,2) default 0,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,order_number));
create table if not exists public.service_order_events(
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.service_orders(id) on delete cascade,event_type text not null,description text,actor_id uuid references auth.users(id),metadata jsonb not null default '{}',created_at timestamptz not null default now());
create table if not exists public.crm_lead_routing_rules(
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,name text not null,priority int not null default 100,conditions jsonb not null default '{}',assign_to uuid references auth.users(id),assign_strategy text not null default 'specific',pipeline_id uuid references public.crm_pipelines(id),is_active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.commerce_abandoned_carts(
 id uuid primary key default gen_random_uuid(),company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,customer_email text,customer_phone text,customer_name text,cart_value numeric(12,2) not null default 0,items jsonb not null default '[]',abandoned_at timestamptz not null default now(),recovery_status text not null default 'pending',recovery_attempts int not null default 0,recovered_at timestamptz,recovery_order_id uuid,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());

create or replace function public.riomed_touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['core_tenant_identity','riomed_products','rental_assets','rental_contracts','service_orders','crm_lead_routing_rules','commerce_abandoned_carts'] loop execute format('drop trigger if exists trg_%I_touch on public.%I',t,t); execute format('create trigger trg_%I_touch before update on public.%I for each row execute function public.riomed_touch_updated_at()',t,t); end loop; end $$;
do $$ declare t text; begin foreach t in array array['riomed_products','rental_assets','rental_contracts','service_orders','crm_lead_routing_rules','commerce_abandoned_carts'] loop execute format('alter table public.%I enable row level security',t); execute format('grant select,insert,update,delete on public.%I to authenticated',t); execute format('grant all on public.%I to service_role',t); execute format('drop policy if exists riomed_company_access on public.%I',t); execute format('create policy riomed_company_access on public.%I for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()))',t); end loop; end $$;
alter table public.rental_contract_items enable row level security;
grant select,insert,update,delete on public.rental_contract_items to authenticated;
grant all on public.rental_contract_items to service_role;
drop policy if exists riomed_rental_items_access on public.rental_contract_items;
create policy riomed_rental_items_access on public.rental_contract_items for all to authenticated using(exists(select 1 from public.rental_contracts c where c.id=contract_id and (public.user_belongs_to_company(auth.uid(),c.company_id) or public.is_impulsionando_staff(auth.uid())))) with check(exists(select 1 from public.rental_contracts c where c.id=contract_id and (public.user_belongs_to_company(auth.uid(),c.company_id) or public.is_impulsionando_staff(auth.uid()))));
alter table public.service_order_events enable row level security;
grant select,insert,update,delete on public.service_order_events to authenticated;
grant all on public.service_order_events to service_role;
drop policy if exists riomed_service_events_access on public.service_order_events;
create policy riomed_service_events_access on public.service_order_events for all to authenticated using(exists(select 1 from public.service_orders o where o.id=order_id and (public.user_belongs_to_company(auth.uid(),o.company_id) or public.is_impulsionando_staff(auth.uid())))) with check(exists(select 1 from public.service_orders o where o.id=order_id and (public.user_belongs_to_company(auth.uid(),o.company_id) or public.is_impulsionando_staff(auth.uid()))));
create index if not exists riomed_products_company_active_idx on public.riomed_products(company_id,is_active);
create index if not exists rental_assets_company_idx on public.rental_assets(company_id);
create index if not exists rental_contracts_company_idx on public.rental_contracts(company_id);
create index if not exists service_orders_company_status_idx on public.service_orders(company_id,status);
create index if not exists lead_routing_company_idx on public.crm_lead_routing_rules(company_id);
create index if not exists abandoned_carts_company_status_idx on public.commerce_abandoned_carts(company_id,recovery_status);
comment on function public.riomed_company_id() is 'Resolve Rio Med pelo Core communication_tenants slug rio-med; não usa companies.subdomain.';