-- Hospitality / beer POS core — additive, reusable across bars and restaurants
-- No tenant-specific hardcoding. Every row is scoped by company_id.

create table if not exists public.hospitality_beers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sku text,
  name text not null,
  brewery text,
  style text,
  origin text,
  abv numeric(5,2),
  ibu numeric(7,2),
  serving_notes text,
  image_url text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, sku)
);

create table if not exists public.hospitality_kegs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  beer_id uuid not null references public.hospitality_beers(id),
  keg_code text not null,
  nominal_volume_ml integer not null check (nominal_volume_ml > 0),
  remaining_volume_ml integer not null check (remaining_volume_ml >= 0),
  status text not null default 'sealed' check(status in ('sealed','tapped','empty','retired')),
  tapped_at timestamptz,
  emptied_at timestamptz,
  purchase_cost numeric(12,2),
  expires_at date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, keg_code),
  check (remaining_volume_ml <= nominal_volume_ml)
);

create table if not exists public.hospitality_taps (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tap_number integer not null,
  name text,
  active_keg_id uuid references public.hospitality_kegs(id),
  is_public boolean not null default true,
  status text not null default 'inactive' check(status in ('inactive','active','cleaning','maintenance')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, tap_number)
);

create table if not exists public.hospitality_serving_sizes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  volume_ml integer not null check(volume_ml > 0),
  price numeric(12,2) not null check(price >= 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, name, volume_ml)
);

create table if not exists public.hospitality_tabs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tab_number text not null,
  service_mode text not null default 'table' check(service_mode in ('table','counter','takeaway','event')),
  table_label text,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  opened_by uuid references auth.users(id),
  status text not null default 'open' check(status in ('open','closing','paid','cancelled')),
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, tab_number)
);

create table if not exists public.hospitality_tab_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tab_id uuid not null references public.hospitality_tabs(id) on delete cascade,
  item_type text not null check(item_type in ('draft_beer','packaged_beer','food','other')),
  beer_id uuid references public.hospitality_beers(id),
  tap_id uuid references public.hospitality_taps(id),
  keg_id uuid references public.hospitality_kegs(id),
  serving_size_id uuid references public.hospitality_serving_sizes(id),
  description text not null,
  quantity numeric(10,3) not null default 1 check(quantity > 0),
  unit_price numeric(12,2) not null default 0 check(unit_price >= 0),
  volume_ml integer check(volume_ml is null or volume_ml > 0),
  line_total numeric(12,2) not null default 0,
  status text not null default 'posted' check(status in ('posted','voided','refunded')),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.hospitality_keg_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  keg_id uuid not null references public.hospitality_kegs(id) on delete cascade,
  tap_id uuid references public.hospitality_taps(id),
  tab_item_id uuid references public.hospitality_tab_items(id),
  movement_type text not null check(movement_type in ('sale','loss','foam','line_cleaning','tasting','adjustment_in','adjustment_out','initial')),
  volume_ml integer not null check(volume_ml > 0),
  direction text not null check(direction in ('in','out')),
  balance_after_ml integer not null check(balance_after_ml >= 0),
  reason text,
  actor_id uuid references auth.users(id),
  idempotency_key text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(company_id, idempotency_key)
);

create table if not exists public.hospitality_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tab_id uuid not null references public.hospitality_tabs(id) on delete cascade,
  method text not null,
  amount numeric(12,2) not null check(amount > 0),
  status text not null default 'paid' check(status in ('pending','paid','failed','refunded')),
  external_reference text,
  received_by uuid references auth.users(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.hospitality_touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['hospitality_beers','hospitality_kegs','hospitality_taps','hospitality_serving_sizes','hospitality_tabs'] loop
    execute format('drop trigger if exists trg_%I_touch on public.%I',t,t);
    execute format('create trigger trg_%I_touch before update on public.%I for each row execute function public.hospitality_touch_updated_at()',t,t);
  end loop;
end $$;

-- Atomic draft sale: lock keg, validate balance, insert item + movement, decrement keg.
create or replace function public.hospitality_post_draft_sale(
  p_company_id uuid,
  p_tab_id uuid,
  p_tap_id uuid,
  p_serving_size_id uuid,
  p_quantity integer default 1,
  p_actor_id uuid default null,
  p_idempotency_key text default null
) returns uuid
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_keg public.hospitality_kegs%rowtype;
  v_tap public.hospitality_taps%rowtype;
  v_size public.hospitality_serving_sizes%rowtype;
  v_beer public.hospitality_beers%rowtype;
  v_item_id uuid;
  v_total_ml integer;
  v_line_total numeric(12,2);
begin
  if p_quantity <= 0 then raise exception 'quantity must be positive'; end if;

  if p_idempotency_key is not null then
    select tab_item_id into v_item_id
      from public.hospitality_keg_movements
     where company_id=p_company_id and idempotency_key=p_idempotency_key
     limit 1;
    if v_item_id is not null then return v_item_id; end if;
  end if;

  select * into v_tap from public.hospitality_taps
   where id=p_tap_id and company_id=p_company_id for update;
  if not found or v_tap.status <> 'active' or v_tap.active_keg_id is null then
    raise exception 'tap unavailable';
  end if;

  select * into v_keg from public.hospitality_kegs
   where id=v_tap.active_keg_id and company_id=p_company_id for update;
  if not found or v_keg.status <> 'tapped' then raise exception 'active keg unavailable'; end if;

  select * into v_size from public.hospitality_serving_sizes
   where id=p_serving_size_id and company_id=p_company_id and is_active=true;
  if not found then raise exception 'serving size unavailable'; end if;

  select * into v_beer from public.hospitality_beers where id=v_keg.beer_id and company_id=p_company_id;
  if not found then raise exception 'beer unavailable'; end if;

  perform 1 from public.hospitality_tabs where id=p_tab_id and company_id=p_company_id and status='open';
  if not found then raise exception 'tab is not open'; end if;

  v_total_ml := v_size.volume_ml * p_quantity;
  if v_keg.remaining_volume_ml < v_total_ml then raise exception 'insufficient keg volume'; end if;
  v_line_total := v_size.price * p_quantity;

  insert into public.hospitality_tab_items(company_id,tab_id,item_type,beer_id,tap_id,keg_id,serving_size_id,description,quantity,unit_price,volume_ml,line_total,created_by)
  values(p_company_id,p_tab_id,'draft_beer',v_beer.id,v_tap.id,v_keg.id,v_size.id,v_beer.name,p_quantity,v_size.price,v_total_ml,v_line_total,p_actor_id)
  returning id into v_item_id;

  update public.hospitality_kegs
     set remaining_volume_ml=remaining_volume_ml-v_total_ml,
         status=case when remaining_volume_ml-v_total_ml=0 then 'empty' else status end,
         emptied_at=case when remaining_volume_ml-v_total_ml=0 then now() else emptied_at end
   where id=v_keg.id;

  insert into public.hospitality_keg_movements(company_id,keg_id,tap_id,tab_item_id,movement_type,volume_ml,direction,balance_after_ml,actor_id,idempotency_key)
  values(p_company_id,v_keg.id,v_tap.id,v_item_id,'sale',v_total_ml,'out',v_keg.remaining_volume_ml-v_total_ml,p_actor_id,p_idempotency_key);

  update public.hospitality_tabs
     set subtotal=subtotal+v_line_total,
         total=greatest(0,(subtotal+v_line_total)-discount_total)
   where id=p_tab_id;

  return v_item_id;
end $$;

create or replace view public.hospitality_public_tapboard as
select
  t.company_id,
  t.id as tap_id,
  t.tap_number,
  coalesce(t.name, 'Torneira ' || t.tap_number::text) as tap_name,
  b.id as beer_id,
  b.name as beer_name,
  b.brewery,
  b.style,
  b.origin,
  b.abv,
  b.ibu,
  b.image_url,
  k.id as keg_id,
  k.remaining_volume_ml,
  k.nominal_volume_ml,
  case
    when k.id is null or t.status <> 'active' then 'unavailable'
    when k.remaining_volume_ml <= greatest(1000, (k.nominal_volume_ml * 0.05)::int) then 'ending'
    else 'available'
  end as availability
from public.hospitality_taps t
left join public.hospitality_kegs k on k.id=t.active_keg_id
left join public.hospitality_beers b on b.id=k.beer_id
where t.is_public=true;

-- Tenant isolation

do $$ declare t text; begin
  foreach t in array array['hospitality_beers','hospitality_kegs','hospitality_taps','hospitality_serving_sizes','hospitality_tabs','hospitality_tab_items','hospitality_keg_movements','hospitality_payments'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('drop policy if exists hospitality_company_access on public.%I',t);
    execute format('create policy hospitality_company_access on public.%I for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()))',t);
  end loop;
end $$;

grant select on public.hospitality_public_tapboard to authenticated, service_role;
grant execute on function public.hospitality_post_draft_sale(uuid,uuid,uuid,uuid,integer,uuid,text) to authenticated, service_role;

create index if not exists hospitality_beers_company_active_idx on public.hospitality_beers(company_id,is_active);
create index if not exists hospitality_kegs_company_status_idx on public.hospitality_kegs(company_id,status);
create index if not exists hospitality_taps_company_status_idx on public.hospitality_taps(company_id,status);
create index if not exists hospitality_tabs_company_status_idx on public.hospitality_tabs(company_id,status);
create index if not exists hospitality_tab_items_tab_idx on public.hospitality_tab_items(tab_id,created_at);
create index if not exists hospitality_movements_keg_idx on public.hospitality_keg_movements(keg_id,created_at);
create index if not exists hospitality_payments_tab_idx on public.hospitality_payments(tab_id,created_at);

comment on function public.hospitality_post_draft_sale(uuid,uuid,uuid,uuid,integer,uuid,text) is 'Atomic POS draft-beer sale: deducts exact mL from active keg, records movement and updates tab with idempotency support.';