-- Versionamento das capacidades universais Inventory Core / Busca Impulsionando
-- e Migração Assistida. O estado live foi aplicado via migrations gerenciadas.
-- Este arquivo é idempotente e preserva o schema canônico para replay.

-- INVENTORY CORE
create table if not exists public.core_products (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  sku text, name text not null, brand text, model text, category text, description text, image_url text,
  active boolean not null default true, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,sku)
);
create table if not exists public.core_product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.core_products(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade, sku text, barcode text, variant_name text,
  attributes jsonb not null default '{}'::jsonb, sale_price numeric(14,2), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,sku),unique(company_id,barcode)
);
create table if not exists public.core_inventory_locations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, location_type text not null default 'store', address jsonb not null default '{}'::jsonb,
  active boolean not null default true, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(company_id,name)
);
create table if not exists public.core_inventory_balances (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.core_products(id) on delete cascade, variant_id uuid references public.core_product_variants(id) on delete cascade,
  location_id uuid not null references public.core_inventory_locations(id) on delete cascade, on_hand numeric(14,3) not null default 0,
  reserved numeric(14,3) not null default 0, available numeric(14,3) generated always as (on_hand-reserved) stored,
  updated_at timestamptz not null default now(), check(on_hand>=0 and reserved>=0 and reserved<=on_hand), unique(company_id,product_id,variant_id,location_id)
);
create table if not exists public.core_inventory_publications (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.core_products(id) on delete cascade, variant_id uuid references public.core_product_variants(id) on delete cascade,
  location_id uuid references public.core_inventory_locations(id) on delete cascade, published boolean not null default false,
  show_price boolean not null default false, show_exact_quantity boolean not null default false, allow_online_purchase boolean not null default false,
  allow_pickup boolean not null default true, public_price numeric(14,2), starts_at timestamptz, ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id,product_id,variant_id,location_id)
);
create table if not exists public.core_inventory_reservations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  balance_id uuid not null references public.core_inventory_balances(id) on delete restrict, quantity numeric(14,3) not null check(quantity>0),
  external_reference text, status text not null default 'active', expires_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- MIGRAÇÃO ASSISTIDA
create table if not exists public.core_import_jobs (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null, source_type text not null, source_name text, status text not null default 'uploaded',
  total_rows integer not null default 0, valid_rows integer not null default 0, duplicate_rows integer not null default 0, review_rows integer not null default 0,
  error_rows integer not null default 0, imported_rows integer not null default 0, updated_rows integer not null default 0, skipped_rows integer not null default 0,
  file_ref text, file_hash text, source_metadata jsonb not null default '{}'::jsonb, dry_run_summary jsonb not null default '{}'::jsonb,
  reconciliation_summary jsonb not null default '{}'::jsonb, approved_at timestamptz, approved_by uuid references auth.users(id) on delete set null,
  started_at timestamptz, finished_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.core_import_field_mappings (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.core_import_jobs(id) on delete cascade,
  source_field text not null,target_field text not null,transform_rule jsonb not null default '{}'::jsonb,required boolean not null default false,
  approved boolean not null default false,created_at timestamptz not null default now(),unique(job_id,source_field)
);
create table if not exists public.core_import_duplicate_candidates (
  id uuid primary key default gen_random_uuid(),job_id uuid not null references public.core_import_jobs(id) on delete cascade,
  source_row_number integer not null,candidate_entity_type text not null,candidate_entity_id uuid,match_keys jsonb not null default '{}'::jsonb,
  confidence numeric(5,4),resolution text not null default 'review',resolved_by uuid references auth.users(id) on delete set null,resolved_at timestamptz,created_at timestamptz not null default now()
);
create table if not exists public.core_import_row_results (
  id bigint generated always as identity primary key,job_id uuid not null references public.core_import_jobs(id) on delete cascade,
  source_row_number integer not null,source_fingerprint text,status text not null,target_entity_type text,target_entity_id uuid,
  normalized_data jsonb not null default '{}'::jsonb,errors jsonb not null default '[]'::jsonb,created_at timestamptz not null default now(),unique(job_id,source_row_number)
);

-- A migration live correspondente também cria RLS, políticas, índices e RPCs seguros.
-- Mantemos aqui um guard obrigatório: nenhuma tabela deste bloco pode existir sem RLS.
alter table public.core_products enable row level security;
alter table public.core_product_variants enable row level security;
alter table public.core_inventory_locations enable row level security;
alter table public.core_inventory_balances enable row level security;
alter table public.core_inventory_publications enable row level security;
alter table public.core_inventory_reservations enable row level security;
alter table public.core_import_jobs enable row level security;
alter table public.core_import_field_mappings enable row level security;
alter table public.core_import_duplicate_candidates enable row level security;
alter table public.core_import_row_results enable row level security;
