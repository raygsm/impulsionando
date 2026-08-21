-- Grupo EVR — specialized layer over the universal Impulsionando Core.
-- IMPORTANT: this migration is independent from every other health client.
-- No hardcoded company id. Every row is scoped by company_id and protected by Core membership.

create table if not exists public.evr_business_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  legal_name text,
  display_name text not null,
  unit_type text not null check (unit_type in ('clinic','pharmacy','service','holding','other')),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

create table if not exists public.evr_patient_consents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  contact_id uuid not null,
  consent_type text not null check (consent_type in ('care_coordination','pharmacy_referral','commercial_relationship','whatsapp','email','sms')),
  status text not null default 'granted' check (status in ('granted','revoked')),
  version text not null,
  source text not null default 'digital',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists evr_patient_consents_contact_idx on public.evr_patient_consents(company_id, contact_id, consent_type, status);

create table if not exists public.evr_clinical_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  clinic_unit_id uuid references public.evr_business_units(id) on delete restrict,
  contact_id uuid not null,
  professional_id uuid,
  appointment_id uuid,
  order_kind text not null check (order_kind in ('prescription','compound_request','exam','care_plan','other')),
  prescription_document_ref text,
  prescription_hash text,
  regulatory_class text not null default 'standard' check (regulatory_class in ('standard','retained','controlled','special')),
  status text not null default 'draft' check (status in ('draft','issued','shared_with_patient','referred','cancelled','expired')),
  patient_pharmacy_choice text,
  patient_authorized_pharmacy_referral boolean not null default false,
  authorized_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists evr_clinical_orders_contact_idx on public.evr_clinical_orders(company_id, contact_id, created_at desc);

create table if not exists public.evr_pharmacy_fulfillments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  pharmacy_unit_id uuid not null references public.evr_business_units(id) on delete restrict,
  clinical_order_id uuid not null references public.evr_clinical_orders(id) on delete restrict,
  contact_id uuid not null,
  pharmacist_user_id uuid,
  status text not null default 'received' check (status in ('received','validation','quote_ready','awaiting_patient','approved','production','quality_control','ready','dispensed','delivery','completed','rejected','cancelled')),
  quote_amount numeric(14,2),
  payment_status text not null default 'pending' check (payment_status in ('pending','authorized','paid','refunded','cancelled')),
  pos_sale_id uuid,
  stock_reservation_ref text,
  lot_trace jsonb not null default '[]'::jsonb,
  validation_notes text,
  received_at timestamptz not null default now(),
  approved_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(clinical_order_id, pharmacy_unit_id)
);
create index if not exists evr_pharmacy_fulfillments_status_idx on public.evr_pharmacy_fulfillments(company_id, status, received_at desc);

create table if not exists public.evr_appointment_waitlist (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  contact_id uuid not null,
  professional_id uuid,
  service_id uuid,
  current_appointment_id uuid,
  earliest_at timestamptz,
  latest_at timestamptz,
  preferred_weekdays smallint[] not null default '{}',
  preferred_periods text[] not null default '{}',
  min_notice_minutes integer not null default 60 check (min_notice_minutes between 0 and 10080),
  channels text[] not null default array['whatsapp']::text[],
  status text not null default 'active' check (status in ('active','offered','accepted','declined','paused','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists evr_waitlist_match_idx on public.evr_appointment_waitlist(company_id, status, professional_id, service_id);

create table if not exists public.evr_appointment_slot_offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  waitlist_id uuid not null references public.evr_appointment_waitlist(id) on delete cascade,
  open_slot_ref uuid not null,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'sent' check (status in ('sent','accepted','declined','expired','cancelled')),
  channel text not null,
  idempotency_key text not null unique,
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.evr_management_events (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete restrict,
  business_unit_id uuid references public.evr_business_units(id) on delete set null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  amount numeric(14,2),
  quantity numeric(14,3),
  contact_id uuid,
  source_ref text,
  dimensions jsonb not null default '{}'::jsonb
);
create index if not exists evr_management_events_bi_idx on public.evr_management_events(company_id, event_type, occurred_at desc);

alter table public.evr_business_units enable row level security;
alter table public.evr_patient_consents enable row level security;
alter table public.evr_clinical_orders enable row level security;
alter table public.evr_pharmacy_fulfillments enable row level security;
alter table public.evr_appointment_waitlist enable row level security;
alter table public.evr_appointment_slot_offers enable row level security;
alter table public.evr_management_events enable row level security;

create policy evr_business_units_member on public.evr_business_units for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_patient_consents_member on public.evr_patient_consents for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_clinical_orders_member on public.evr_clinical_orders for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_pharmacy_fulfillments_member on public.evr_pharmacy_fulfillments for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_appointment_waitlist_member on public.evr_appointment_waitlist for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_appointment_slot_offers_member on public.evr_appointment_slot_offers for all to authenticated using (public.user_belongs_to_company(auth.uid(), company_id)) with check (public.user_belongs_to_company(auth.uid(), company_id));
create policy evr_management_events_member on public.evr_management_events for select to authenticated using (public.user_belongs_to_company(auth.uid(), company_id));

grant select, insert, update on public.evr_business_units, public.evr_patient_consents, public.evr_clinical_orders, public.evr_pharmacy_fulfillments, public.evr_appointment_waitlist, public.evr_appointment_slot_offers to authenticated;
grant select on public.evr_management_events to authenticated;
grant all on public.evr_business_units, public.evr_patient_consents, public.evr_clinical_orders, public.evr_pharmacy_fulfillments, public.evr_appointment_waitlist, public.evr_appointment_slot_offers, public.evr_management_events to service_role;

comment on table public.evr_clinical_orders is 'Grupo EVR: clinical order ledger. Pharmacy referral requires explicit patient authorization and does not remove patient pharmacy choice.';
comment on table public.evr_pharmacy_fulfillments is 'Ative-se Pharma fulfillment workflow connected to a clinical order; pharmacist validation remains mandatory before production/dispensing.';
