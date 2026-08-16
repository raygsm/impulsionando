create table if not exists public.wmp_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  briefing_id uuid references public.wmp_briefings(id) on delete set null,
  briefing_date_id uuid references public.wmp_briefing_dates(id) on delete set null,
  proposal_id uuid references public.wmp_proposals(id) on delete set null,
  opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  source text not null default 'CUSTOMER' check (source in ('CUSTOMER','OWNED','PARTNER','INTERNAL')),
  status text not null default 'PLANNED' check (status in ('PLANNED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')),
  public_status text not null default 'DRAFT' check (public_status in ('DRAFT','PUBLISHED','ARCHIVED')),
  title text not null,
  event_type text,
  event_date date,
  start_time time without time zone,
  end_time time without time zone,
  timezone text not null default 'America/Sao_Paulo',
  venue_name text,
  venue_address text,
  venue_bairro text,
  venue_city text,
  venue_state text,
  venue_cep text,
  venue_municipio_ibge text,
  audience_estimate integer check (audience_estimate is null or audience_estimate >= 0),
  notes text,
  public_summary text,
  published_at timestamptz,
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wmp_events_proposal_unique on public.wmp_events(tenant_id, proposal_id) where proposal_id is not null;
create index if not exists wmp_events_date_idx on public.wmp_events(tenant_id,event_date,status);
create index if not exists wmp_events_public_idx on public.wmp_events(tenant_id,public_status,event_date) where public_status='PUBLISHED';
create index if not exists wmp_events_briefing_date_idx on public.wmp_events(briefing_date_id) where briefing_date_id is not null;

alter table public.wmp_events enable row level security;

drop policy if exists wmp_events_select on public.wmp_events;
create policy wmp_events_select on public.wmp_events for select using (private.is_tenant_member(tenant_id));
drop policy if exists wmp_events_insert on public.wmp_events;
create policy wmp_events_insert on public.wmp_events for insert with check (private.is_tenant_member(tenant_id, array['OWNER','ADMIN','EDITOR','OPERATOR']));
drop policy if exists wmp_events_update on public.wmp_events;
create policy wmp_events_update on public.wmp_events for update using (private.is_tenant_member(tenant_id, array['OWNER','ADMIN','EDITOR','OPERATOR'])) with check (private.is_tenant_member(tenant_id, array['OWNER','ADMIN','EDITOR','OPERATOR']));
drop policy if exists wmp_events_delete on public.wmp_events;
create policy wmp_events_delete on public.wmp_events for delete using (private.is_tenant_member(tenant_id, array['OWNER','ADMIN']));

comment on table public.wmp_events is 'Canonical WMP operational event entity. Customer, owned and partner events live here; public exposure is controlled independently by public_status.';
