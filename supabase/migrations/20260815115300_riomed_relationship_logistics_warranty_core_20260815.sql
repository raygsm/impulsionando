create table if not exists public.riomed_hospital_accounts (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 hospital_name text not null, razon_social text, tax_id text, contact_name text not null, contact_email text not null, contact_phone text not null,
 city text, state text, address text, departamento text, municipio text, beds_count int, segment text check(segment is null or segment in('public','private','mixed','clinic','laboratory')),
 sla_hours int not null default 24, payment_terms text, credit_limit numeric(14,2), status text not null default 'pending' check(status in('pending','active','suspended','closed')),
 notes text, metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,contact_email));

create table if not exists public.riomed_suppliers (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 legal_name text not null, trade_name text, tax_id text, country text not null default 'BO', contact_name text not null, contact_email text not null, contact_phone text not null,
 website text, categories text[] not null default '{}', status text not null default 'pending' check(status in('pending','approved','rejected','suspended')),
 notes text, approved_at timestamptz, approved_by uuid references auth.users(id), metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,contact_email));

create table if not exists public.riomed_sellers (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 user_id uuid references auth.users(id) on delete set null, full_name text not null, email text not null, phone text, seller_code text not null,
 commission_rate numeric(6,3) not null default 5 check(commission_rate between 0 and 100), monthly_goal numeric(14,2) not null default 0,
 territory text, status text not null default 'active' check(status in('active','paused','inactive')), notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,seller_code), unique(company_id,email));

create table if not exists public.riomed_distribution_config (
 id uuid primary key default gen_random_uuid(), company_id uuid not null unique default public.riomed_company_id() references public.companies(id) on delete cascade,
 mode text not null default 'round_robin' check(mode in('round_robin','random','manual','territory')), active boolean not null default true,
 business_hours_start time, business_hours_end time, weekend_enabled boolean not null default false,
 fallback_seller_id uuid references public.riomed_sellers(id) on delete set null, rr_cursor bigint not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists public.riomed_seller_assignments (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 seller_id uuid not null references public.riomed_sellers(id) on delete cascade,
 contact_id uuid references public.communication_contacts(id) on delete set null,
 opportunity_id uuid references public.crm_opportunities(id) on delete set null,
 assigned_via text not null default 'manual' check(assigned_via in('manual','round_robin','random','territory','system')),
 status text not null default 'new' check(status in('new','contacted','won','lost')),
 first_contact_at timestamptz, won_at timestamptz, lost_at timestamptz, lost_reason text, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists public.riomed_seller_notifications (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 seller_id uuid not null references public.riomed_sellers(id) on delete cascade,
 assignment_id uuid references public.riomed_seller_assignments(id) on delete cascade,
 title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now());

create table if not exists public.riomed_whatsapp_clicks (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 contact_id uuid references public.communication_contacts(id) on delete set null, source text, campaign text, target_phone text, metadata jsonb not null default '{}', created_at timestamptz not null default now());

create table if not exists public.riomed_shipments (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 shipment_code text not null, source_type text not null default 'sales_order', source_id uuid,
 hospital_id uuid references public.riomed_hospital_accounts(id) on delete set null,
 tracking_code text, carrier_name text, status text not null default 'pending' check(status in('pending','preparing','dispatched','in_transit','delivered','cancelled','returned')),
 expected_at timestamptz, dispatched_at timestamptz, delivered_at timestamptz, recipient_name text, recipient_doc text,
 shipping_address jsonb not null default '{}', freight_cost numeric(14,2) not null default 0, notes text, metadata jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,shipment_code));

create table if not exists public.riomed_shipment_items (
 id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.riomed_shipments(id) on delete cascade,
 product_id uuid references public.riomed_products(id) on delete set null, quantity numeric(12,3) not null default 1 check(quantity>0), unit_label text,
 serial_number text, warranty_days integer not null default 0 check(warranty_days between 0 and 3650), warranty_starts_at date, warranty_ends_at date,
 notes text, created_at timestamptz not null default now());

create table if not exists public.riomed_warranties (
 id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 source_type text not null default 'shipment_item', source_id uuid, product_id uuid references public.riomed_products(id) on delete set null,
 serial_number text, hospital_id uuid references public.riomed_hospital_accounts(id) on delete set null,
 starts_at date not null, ends_at date not null, terms text, status text not null default 'active' check(status in('active','expired','voided','claimed')),
 metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index if not exists riomed_warranties_source_unique on public.riomed_warranties(source_type,source_id) where source_id is not null;

create table if not exists public.riomed_tracking_events (
 id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.riomed_shipments(id) on delete cascade,
 event_type text not null, location text, occurred_at timestamptz not null default now(), payload jsonb not null default '{}', created_at timestamptz not null default now());

create or replace function public.riomed_generate_warranties_on_delivery()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_delivered date; v_item record;
begin
 if new.status is distinct from 'delivered' then return new; end if;
 if tg_op='UPDATE' and old.status='delivered' then return new; end if;
 v_delivered:=coalesce(new.delivered_at,now())::date;
 for v_item in select id,product_id,serial_number,warranty_days from public.riomed_shipment_items where shipment_id=new.id and warranty_days>0 loop
   update public.riomed_shipment_items set warranty_starts_at=v_delivered,warranty_ends_at=(v_delivered+v_item.warranty_days) where id=v_item.id;
   insert into public.riomed_warranties(company_id,source_type,source_id,product_id,serial_number,hospital_id,starts_at,ends_at,status,metadata)
   values(new.company_id,'shipment_item',v_item.id,v_item.product_id,v_item.serial_number,new.hospital_id,v_delivered,(v_delivered+v_item.warranty_days),'active',jsonb_build_object('shipment_id',new.id,'warranty_days',v_item.warranty_days))
   on conflict do nothing;
 end loop;
 return new;
end $$;
drop trigger if exists trg_riomed_warranty_on_delivery on public.riomed_shipments;
create trigger trg_riomed_warranty_on_delivery after insert or update of status,delivered_at on public.riomed_shipments for each row execute function public.riomed_generate_warranties_on_delivery();

create or replace view public.riomed_my_warranties with (security_invoker=true) as
select w.id,w.company_id,w.hospital_id,w.product_id,p.name as product_name,p.sku as product_sku,w.serial_number,w.starts_at,w.ends_at,
       s.id as shipment_id,s.shipment_code,s.delivered_at,greatest(0,(w.ends_at-current_date))::int as days_remaining,(w.ends_at<current_date) as is_finished,w.status,w.created_at
from public.riomed_warranties w
left join public.riomed_products p on p.id=w.product_id
left join public.riomed_shipment_items si on si.id=w.source_id and w.source_type='shipment_item'
left join public.riomed_shipments s on s.id=si.shipment_id;
grant select on public.riomed_my_warranties to authenticated,service_role;

create or replace function public.riomed_touch_generic() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['riomed_hospital_accounts','riomed_suppliers','riomed_sellers','riomed_distribution_config','riomed_seller_assignments','riomed_shipments','riomed_warranties'] loop execute format('drop trigger if exists trg_%I_touch on public.%I',t,t); execute format('create trigger trg_%I_touch before update on public.%I for each row execute function public.riomed_touch_generic()',t,t); end loop; end $$;

do $$ declare t text; begin foreach t in array array['riomed_hospital_accounts','riomed_suppliers','riomed_sellers','riomed_distribution_config','riomed_seller_assignments','riomed_seller_notifications','riomed_whatsapp_clicks','riomed_shipments','riomed_warranties'] loop execute format('alter table public.%I enable row level security',t); execute format('grant select,insert,update,delete on public.%I to authenticated',t); execute format('grant all on public.%I to service_role',t); execute format('drop policy if exists riomed_relationship_company_access on public.%I',t); execute format('create policy riomed_relationship_company_access on public.%I for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()))',t); end loop; end $$;

alter table public.riomed_shipment_items enable row level security; grant select,insert,update,delete on public.riomed_shipment_items to authenticated; grant all on public.riomed_shipment_items to service_role;
drop policy if exists riomed_shipment_items_company_access on public.riomed_shipment_items;
create policy riomed_shipment_items_company_access on public.riomed_shipment_items for all to authenticated using(exists(select 1 from public.riomed_shipments s where s.id=shipment_id and (public.user_belongs_to_company(auth.uid(),s.company_id) or public.is_impulsionando_staff(auth.uid())))) with check(exists(select 1 from public.riomed_shipments s where s.id=shipment_id and (public.user_belongs_to_company(auth.uid(),s.company_id) or public.is_impulsionando_staff(auth.uid()))));
alter table public.riomed_tracking_events enable row level security; grant select,insert,update,delete on public.riomed_tracking_events to authenticated; grant all on public.riomed_tracking_events to service_role;
drop policy if exists riomed_tracking_company_access on public.riomed_tracking_events;
create policy riomed_tracking_company_access on public.riomed_tracking_events for all to authenticated using(exists(select 1 from public.riomed_shipments s where s.id=shipment_id and (public.user_belongs_to_company(auth.uid(),s.company_id) or public.is_impulsionando_staff(auth.uid())))) with check(exists(select 1 from public.riomed_shipments s where s.id=shipment_id and (public.user_belongs_to_company(auth.uid(),s.company_id) or public.is_impulsionando_staff(auth.uid()))));

create index if not exists riomed_hospital_company_status_idx on public.riomed_hospital_accounts(company_id,status);
create index if not exists riomed_supplier_company_status_idx on public.riomed_suppliers(company_id,status);
create index if not exists riomed_sellers_company_status_idx on public.riomed_sellers(company_id,status);
create index if not exists riomed_assignments_company_status_idx on public.riomed_seller_assignments(company_id,status,created_at desc);
create index if not exists riomed_shipments_company_status_idx on public.riomed_shipments(company_id,status,created_at desc);
create index if not exists riomed_warranties_company_end_idx on public.riomed_warranties(company_id,ends_at desc);

revoke all on function public.riomed_generate_warranties_on_delivery() from public,anon,authenticated;
grant execute on function public.riomed_generate_warranties_on_delivery() to service_role;
comment on table public.riomed_seller_assignments is 'Distribuição comercial RioMed ligada ao Core: contact_id e opportunity_id substituem o antigo crm_leads paralelo.';