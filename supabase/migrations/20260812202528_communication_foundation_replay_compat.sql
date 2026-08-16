-- Replay compatibility: the original omnichannel-agents migration was authored
-- against a database where the communication foundation already existed outside
-- the repository history. A clean replay therefore needs the canonical base
-- tables immediately before that migration. This is additive/idempotent and a
-- no-op on live databases where these objects already exist.

create table if not exists public.communication_tenants (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid null references public.communication_tenants(id) on delete restrict,
  kind text not null,
  slug text not null,
  legal_name text null,
  display_name text not null,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  settings jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create unique index if not exists uq_communication_tenants_slug
  on public.communication_tenants(slug)
  where deleted_at is null;
create index if not exists idx_communication_tenants_parent
  on public.communication_tenants(parent_id);

create table if not exists public.communication_brands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  name text not null,
  logo_url text null,
  primary_color text null,
  secondary_color text null,
  domain text null,
  privacy_url text null,
  terms_url text null,
  support_url text null,
  footer_html text null,
  legal_text text null,
  hide_impulsionando_brand boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_communication_brands_tenant
  on public.communication_brands(tenant_id);

create table if not exists public.communication_agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  brand_id uuid null references public.communication_brands(id) on delete set null,
  name text not null,
  avatar_url text null,
  signature text null,
  role text null,
  reply_route text null,
  default_cta jsonb null,
  disclaimer text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_communication_agents_tenant
  on public.communication_agents(tenant_id, active);

comment on table public.communication_tenants is
  'Canonical communication tenant foundation. Replay compatibility migration is no-op when the live foundation already exists.';
