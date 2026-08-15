create table if not exists public.riomed_product_variants (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 product_id uuid not null references public.riomed_products(id) on delete cascade,
 sku text,
 name text not null,
 price_sale numeric(14,2),
 price_rental_daily numeric(14,2),
 price_rental_monthly numeric(14,2),
 stock integer not null default 0 check(stock>=0),
 active boolean not null default true,
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(company_id,sku)
);
create table if not exists public.riomed_showcase (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 slug text not null,
 title text not null,
 subtitle text,
 banner_url text,
 layout text not null default 'grid',
 is_published boolean not null default false,
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(company_id,slug)
);
create table if not exists public.riomed_showcase_items (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 showcase_id uuid not null references public.riomed_showcase(id) on delete cascade,
 product_id uuid not null references public.riomed_products(id) on delete cascade,
 variant_id uuid references public.riomed_product_variants(id) on delete set null,
 position integer not null default 0,
 is_featured boolean not null default false,
 override_price numeric(14,2),
 badge text,
 created_at timestamptz not null default now()
);
create table if not exists public.riomed_public_carts (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 session_token text not null unique,
 status text not null default 'active' check(status=any(array['active','submitted','abandoned','expired'])),
 currency text not null default 'BOB',
 subtotal numeric(14,2) not null default 0,
 total numeric(14,2) not null default 0,
 items_count integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '30 days')
);
create table if not exists public.riomed_cart_items (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 cart_id uuid not null references public.riomed_public_carts(id) on delete cascade,
 product_id uuid not null references public.riomed_products(id) on delete restrict,
 variant_id uuid references public.riomed_product_variants(id) on delete set null,
 modality text not null default 'sale' check(modality=any(array['sale','rental_daily','rental_monthly'])),
 product_name text not null,
 sku text,
 unit_price numeric(14,2) not null check(unit_price>=0),
 qty numeric(12,3) not null check(qty>0),
 rental_days integer check(rental_days is null or rental_days>0),
 total numeric(14,2) not null check(total>=0),
 created_at timestamptz not null default now()
);
create table if not exists public.riomed_checkout_sessions (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 cart_id uuid not null references public.riomed_public_carts(id) on delete restrict,
 contact_name text not null,
 contact_email text,
 contact_phone text not null,
 contact_doc text,
 company_name text,
 audience text not null default 'public' check(audience=any(array['public','b2b','hospital','rental'])),
 address jsonb not null default '{}',
 notes text,
 contact_id uuid references public.communication_contacts(id) on delete set null,
 opportunity_id uuid references public.crm_opportunities(id) on delete set null,
 quote_id uuid references public.riomed_quotes(id) on delete set null,
 status text not null default 'submitted' check(status=any(array['submitted','contacted','converted','cancelled'])),
 submitted_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create or replace function public.riomed_cart_recalc(p_cart_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_sub numeric; v_count int;
begin
 select coalesce(sum(total),0),count(*) into v_sub,v_count from public.riomed_cart_items where cart_id=p_cart_id;
 update public.riomed_public_carts set subtotal=v_sub,total=v_sub,items_count=v_count,updated_at=now() where id=p_cart_id;
end $$;
create or replace function public.riomed_cart_item_after()
returns trigger language plpgsql security definer set search_path=public as $$ begin perform public.riomed_cart_recalc(coalesce(new.cart_id,old.cart_id)); return null; end $$;
drop trigger if exists trg_riomed_cart_item_aggregate on public.riomed_cart_items;
create trigger trg_riomed_cart_item_aggregate after insert or update or delete on public.riomed_cart_items for each row execute function public.riomed_cart_item_after();

do $$ declare t text; begin foreach t in array array['riomed_product_variants','riomed_showcase','riomed_showcase_items','riomed_public_carts','riomed_cart_items','riomed_checkout_sessions'] loop execute format('alter table public.%I enable row level security',t); execute format('grant all on public.%I to service_role',t); end loop; end $$;

grant select,insert,update,delete on public.riomed_product_variants,public.riomed_showcase,public.riomed_showcase_items,public.riomed_checkout_sessions to authenticated;
grant select on public.riomed_public_carts,public.riomed_cart_items to authenticated;

do $$ declare t text; begin foreach t in array array['riomed_product_variants','riomed_showcase','riomed_showcase_items','riomed_checkout_sessions'] loop execute format('drop policy if exists riomed_portal_company_access on public.%I',t); execute format('create policy riomed_portal_company_access on public.%I for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()))',t); end loop; end $$;
drop policy if exists riomed_cart_company_read on public.riomed_public_carts;
create policy riomed_cart_company_read on public.riomed_public_carts for select to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()));
drop policy if exists riomed_cart_items_company_read on public.riomed_cart_items;
create policy riomed_cart_items_company_read on public.riomed_cart_items for select to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()));

create index if not exists riomed_showcase_company_slug_idx on public.riomed_showcase(company_id,slug) where is_published;
create index if not exists riomed_showcase_items_showcase_idx on public.riomed_showcase_items(showcase_id,position);
create index if not exists riomed_cart_items_cart_idx on public.riomed_cart_items(cart_id);
create index if not exists riomed_checkout_company_created_idx on public.riomed_checkout_sessions(company_id,created_at desc);

comment on table public.riomed_public_carts is 'Carrinhos públicos Rio Med manipulados exclusivamente por funções server-side; não há acesso anônimo direto às linhas.';
comment on table public.riomed_checkout_sessions is 'Captura de intenção comercial do portal Rio Med; checkout atual gera cotação, não cobrança.';