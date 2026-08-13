-- Reconcile legacy generic Agenda tables with the CHRISMED Pega Agenda shape.
--
-- These tables existed before the CHRISMED transactional implementation. A
-- CREATE TABLE IF NOT EXISTS does not add newer columns to an existing table,
-- so a full migration replay from a virgin database could reach the CHRISMED
-- migration with the legacy shape. Keep this migration additive and
-- idempotent: production already has these columns/constraints and therefore
-- evaluates these statements as no-ops.

alter table if exists public.agenda_professional_terms
  add column if not exists revoked_at timestamptz,
  add column if not exists ip_hash text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.agenda_professional_eligibility
  add column if not exists profession_id uuid,
  add column if not exists primary_area text;

-- Pega Agenda treats one eligibility record per professional as the current
-- operational state. The legacy table did not enforce that invariant.
create unique index if not exists agenda_professional_eligibility_professional_unique
  on public.agenda_professional_eligibility(professional_id);

alter table if exists public.agenda_open_slots
  add column if not exists original_professional_id uuid references public.agenda_professionals(id) on delete set null,
  add column if not exists offering_id uuid references public.chrismed_service_offerings(id) on delete set null,
  add column if not exists profession_id uuid,
  add column if not exists primary_area text,
  add column if not exists reason text;

-- The CHRISMED migration creates this partial uniqueness immediately after the
-- table declaration. Creating it here as well makes the handoff from the
-- legacy schema deterministic; IF NOT EXISTS keeps production idempotent.
create unique index if not exists agenda_professional_terms_active_unique
  on public.agenda_professional_terms(professional_id, terms_version)
  where revoked_at is null;
