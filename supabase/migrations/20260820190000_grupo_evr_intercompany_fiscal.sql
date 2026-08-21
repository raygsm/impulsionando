-- Grupo EVR — intercompany attribution + fiscal orchestration.
-- Branch-only migration. Do not apply to production without schema review and rollback plan.

create table if not exists public.evr_revenue_attribution (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  contact_id uuid,
  source_business_unit_id uuid references public.evr_business_units(id) on delete set null,
  destination_business_unit_id uuid references public.evr_business_units(id) on delete set null,
  billing_business_unit_id uuid references public.evr_business_units(id) on delete set null,
  source_type text not null default 'direct' check (source_type in ('direct','referral','campaign','professional','intercompany','organic','other')),
  source_ref text,
  journey_code text,
  revenue_context_type text not null check (revenue_context_type in ('appointment','service','pharmacy_order','pos_sale','membership','other')),
  revenue_context_id uuid,
  gross_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2),
  currency text not null default 'BRL',
  recognized_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists evr_revenue_attribution_idx on public.evr_revenue_attribution(company_id, billing_business_unit_id, recognized_at desc);
create index if not exists evr_revenue_attribution_source_idx on public.evr_revenue_attribution(company_id, source_business_unit_id, destination_business_unit_id, created_at desc);

create table if not exists public.evr_fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  issuer_business_unit_id uuid not null references public.evr_business_units(id) on delete restrict,
  contact_id uuid,
  revenue_attribution_id uuid references public.evr_revenue_attribution(id) on delete set null,
  context_type text not null check (context_type in ('appointment','service','pharmacy_order','pos_sale','membership','other')),
  context_id uuid,
  document_type text not null check (document_type in ('nfse','nfe','nfce','receipt','other')),
  provider text,
  provider_reference text,
  status text not null default 'pending' check (status in ('pending','queued','processing','authorized','rejected','cancelled','error')),
  amount numeric(14,2) not null,
  currency text not null default 'BRL',
  access_key text,
  number text,
  series text,
  xml_url text,
  pdf_url text,
  error_code text,
  error_message text,
  attempts integer not null default 0,
  next_retry_at timestamptz,
  issued_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(issuer_business_unit_id, context_type, context_id, document_type)
);
create index if not exists evr_fiscal_documents_status_idx on public.evr_fiscal_documents(company_id, status, next_retry_at, created_at desc);

create table if not exists public.evr_fiscal_events (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete restrict,
  fiscal_document_id uuid not null references public.evr_fiscal_documents(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.evr_intercompany_referrals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  contact_id uuid not null,
  source_business_unit_id uuid not null references public.evr_business_units(id) on delete restrict,
  destination_business_unit_id uuid not null references public.evr_business_units(id) on delete restrict,
  reason_code text not null,
  source_context_type text,
  source_context_id uuid,
  destination_context_type text,
  destination_context_id uuid,
  patient_authorized boolean not null default false,
  authorized_at timestamptz,
  status text not null default 'created' check (status in ('created','offered','authorized','received','converted','declined','cancelled','expired')),
  converted_amount numeric(14,2),
  converted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists evr_intercompany_referrals_idx on public.evr_intercompany_referrals(company_id, source_business_unit_id, destination_business_unit_id, status, created_at desc);

alter table public.evr_revenue_attribution enable row level security;
alter table public.evr_fiscal_documents enable row level security;
alter table public.evr_fiscal_events enable row level security;
alter table public.evr_intercompany_referrals enable row level security;

create policy evr_revenue_attribution_member on public.evr_revenue_attribution for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_fiscal_documents_member on public.evr_fiscal_documents for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_fiscal_events_member on public.evr_fiscal_events for select to authenticated using (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_intercompany_referrals_member on public.evr_intercompany_referrals for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));

grant select, insert, update on public.evr_revenue_attribution, public.evr_fiscal_documents, public.evr_intercompany_referrals to authenticated;
grant select on public.evr_fiscal_events to authenticated;
grant all on public.evr_revenue_attribution, public.evr_fiscal_documents, public.evr_fiscal_events, public.evr_intercompany_referrals to service_role;

comment on table public.evr_revenue_attribution is 'Tracks source, destination and billing unit for Grupo EVR revenue without merging company accounting.';
comment on table public.evr_fiscal_documents is 'Fiscal orchestration ledger. Actual issuance requires a homologated provider and issuer-specific fiscal configuration.';
comment on table public.evr_intercompany_referrals is 'Tracks authorized intercompany referrals and conversion between Grupo EVR companies.';
