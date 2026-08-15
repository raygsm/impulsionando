create table if not exists public.wmp_briefing_dates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  briefing_id uuid not null references public.wmp_briefings(id) on delete cascade,
  event_date date not null,
  start_time time,
  end_time time,
  venue_name text,
  venue_cep text,
  venue_address text,
  venue_bairro text,
  venue_city text,
  venue_state text,
  venue_municipio_ibge text,
  status text not null default 'REQUESTED' check (status in ('REQUESTED','QUOTED','CONFIRMED','CANCELLED')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (briefing_id, event_date, start_time, venue_name)
);

create index if not exists wmp_briefing_dates_briefing_idx on public.wmp_briefing_dates(briefing_id, event_date);
create index if not exists wmp_briefing_dates_tenant_date_idx on public.wmp_briefing_dates(tenant_id, event_date, status);

alter table public.wmp_briefing_dates enable row level security;

drop policy if exists wmp_briefing_dates_select on public.wmp_briefing_dates;
create policy wmp_briefing_dates_select on public.wmp_briefing_dates for select using (private.is_tenant_member(tenant_id));

drop policy if exists wmp_briefing_dates_insert on public.wmp_briefing_dates;
create policy wmp_briefing_dates_insert on public.wmp_briefing_dates for insert with check (private.is_tenant_member(tenant_id, array['OWNER','ADMIN','EDITOR','OPERATOR']::text[]));

drop policy if exists wmp_briefing_dates_update on public.wmp_briefing_dates;
create policy wmp_briefing_dates_update on public.wmp_briefing_dates for update using (private.is_tenant_member(tenant_id, array['OWNER','ADMIN','EDITOR','OPERATOR']::text[])) with check (private.is_tenant_member(tenant_id, array['OWNER','ADMIN','EDITOR','OPERATOR']::text[]));

drop policy if exists wmp_briefing_dates_delete on public.wmp_briefing_dates;
create policy wmp_briefing_dates_delete on public.wmp_briefing_dates for delete using (private.is_tenant_member(tenant_id, array['OWNER','ADMIN']::text[]));
