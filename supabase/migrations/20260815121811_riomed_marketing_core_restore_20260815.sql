create table if not exists public.riomed_campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  goal text not null default 'custom',
  channel text not null default 'multi',
  audience text not null default 'all',
  status text not null default 'draft' check (status in ('draft','generating','ready','scheduled','running','completed','cancelled')),
  target_filter jsonb not null default '{}'::jsonb,
  copy_headline text,
  copy_body text,
  copy_cta text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,code)
);

create table if not exists public.riomed_campaign_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
  campaign_id uuid not null references public.riomed_campaigns(id) on delete cascade,
  product_id uuid references public.riomed_products(id) on delete set null,
  variant_id uuid references public.riomed_product_variants(id) on delete set null,
  original_price numeric(14,2) not null default 0,
  discount_pct numeric(6,2) not null default 0 check(discount_pct between 0 and 100),
  promo_price numeric(14,2) not null default 0,
  stock_qty numeric(14,3) not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.riomed_whatsapp_broadcasts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
  campaign_id uuid references public.riomed_campaigns(id) on delete cascade,
  recipient_phone text not null,
  recipient_name text,
  customer_id uuid,
  message text not null,
  status text not null default 'queued' check(status in ('queued','processing','sent','delivered','read','failed','cancelled')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.riomed_stale_stock_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
  name text not null,
  days_threshold integer not null default 90 check(days_threshold between 1 and 720),
  min_qty numeric(14,3) not null default 1 check(min_qty >= 0),
  discount_pct numeric(6,2) not null default 15 check(discount_pct between 0 and 90),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.riomed_detect_stale_stock(_company_id uuid, _days_threshold integer default 90, _min_qty numeric default 1, _limit integer default 50)
returns table(product_id uuid, variant_id uuid, product_name text, sku text, qty numeric, unit_price numeric, reference_at timestamptz)
language sql
security definer
set search_path='public','pg_temp'
as $$
  select p.id,
         v.id,
         p.name,
         coalesce(v.sku,p.sku),
         coalesce(v.stock,p.stock,0)::numeric,
         coalesce(v.price_sale,p.price_sale,0)::numeric,
         coalesce(
           nullif(v.metadata->>'last_stock_movement_at','')::timestamptz,
           nullif(p.metadata->>'last_stock_movement_at','')::timestamptz,
           v.updated_at,
           p.updated_at
         ) as reference_at
  from public.riomed_products p
  left join public.riomed_product_variants v on v.product_id=p.id and v.company_id=p.company_id and v.active=true
  where p.company_id=_company_id
    and p.is_active=true
    and coalesce(v.stock,p.stock,0) >= _min_qty
    and coalesce(
      nullif(v.metadata->>'last_stock_movement_at','')::timestamptz,
      nullif(p.metadata->>'last_stock_movement_at','')::timestamptz,
      v.updated_at,
      p.updated_at
    ) <= now() - make_interval(days => greatest(1,least(_days_threshold,720)))
  order by reference_at asc
  limit greatest(1,least(_limit,200));
$$;

alter table public.riomed_campaigns enable row level security;
alter table public.riomed_campaign_items enable row level security;
alter table public.riomed_whatsapp_broadcasts enable row level security;
alter table public.riomed_stale_stock_rules enable row level security;

do $$ declare t text; begin
  foreach t in array array['riomed_campaigns','riomed_campaign_items','riomed_whatsapp_broadcasts','riomed_stale_stock_rules'] loop
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('drop policy if exists riomed_marketing_company_access on public.%I',t);
    execute format('create policy riomed_marketing_company_access on public.%I for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()))',t);
  end loop;
end $$;

revoke all on function public.riomed_detect_stale_stock(uuid,integer,numeric,integer) from public,anon;
grant execute on function public.riomed_detect_stale_stock(uuid,integer,numeric,integer) to authenticated,service_role;

create index if not exists riomed_campaigns_company_status_created_idx on public.riomed_campaigns(company_id,status,created_at desc);
create index if not exists riomed_campaign_items_campaign_idx on public.riomed_campaign_items(campaign_id,position);
create index if not exists riomed_broadcasts_company_status_idx on public.riomed_whatsapp_broadcasts(company_id,status,created_at);
create index if not exists riomed_stale_rules_company_active_idx on public.riomed_stale_stock_rules(company_id,active,days_threshold);

comment on function public.riomed_detect_stale_stock(uuid,integer,numeric,integer) is 'Detecta itens com estoque e sem movimentacao registrada recente; usa metadata.last_stock_movement_at quando disponivel e updated_at apenas como fallback operacional.';