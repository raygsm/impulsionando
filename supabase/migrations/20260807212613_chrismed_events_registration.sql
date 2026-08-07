-- CHRISMED events are deliberately isolated from clinical scheduling.
create table public.chrismed_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 180),
  summary text,
  description text,
  cover_url text,
  venue_name text,
  venue_address text,
  city text default 'Rio de Janeiro',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  capacity integer not null check (capacity > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  status text not null default 'draft' check (status in ('draft','published','cancelled','finished')),
  organizer_name text not null default 'CHRISMED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (registration_closes_at is null or registration_opens_at is null or registration_closes_at > registration_opens_at)
);

create table public.chrismed_event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.chrismed_events(id) on delete restrict,
  registration_code text not null unique,
  attendee_name text not null check (char_length(attendee_name) between 2 and 160),
  attendee_email text not null check (char_length(attendee_email) between 5 and 320),
  attendee_phone text,
  quantity integer not null default 1 check (quantity between 1 and 6),
  status text not null check (status in ('confirmed','waitlisted','cancelled')),
  consent_version text not null default 'events-v1',
  source text not null default 'chrismed-site',
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create unique index chrismed_event_registration_active_email_uidx
  on public.chrismed_event_registrations (event_id, lower(attendee_email))
  where status in ('confirmed','waitlisted');
create index chrismed_events_public_idx on public.chrismed_events (status, starts_at);
create index chrismed_event_registrations_event_status_idx on public.chrismed_event_registrations (event_id, status);

alter table public.chrismed_events enable row level security;
alter table public.chrismed_event_registrations enable row level security;
revoke all on public.chrismed_events from anon, authenticated;
revoke all on public.chrismed_event_registrations from anon, authenticated;
grant all on public.chrismed_events to service_role;
grant all on public.chrismed_event_registrations to service_role;

create or replace function public.chrismed_register_event(
  p_event_id uuid, p_attendee_name text, p_attendee_email text,
  p_attendee_phone text default null, p_quantity integer default 1,
  p_consent_version text default 'events-v1'
) returns table (registration_id uuid, registration_code text, registration_status text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_event public.chrismed_events%rowtype;
  v_reserved integer;
  v_status text;
  v_id uuid;
  v_code text;
begin
  if char_length(trim(coalesce(p_attendee_name,''))) < 2 then raise exception 'Nome inválido'; end if;
  if lower(trim(coalesce(p_attendee_email,''))) !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'E-mail inválido'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 6 then raise exception 'Quantidade inválida'; end if;

  select * into v_event from public.chrismed_events where id = p_event_id for update;
  if not found or v_event.status <> 'published' then raise exception 'Evento indisponível'; end if;
  if v_event.registration_opens_at is not null and now() < v_event.registration_opens_at then raise exception 'Inscrições ainda não abertas'; end if;
  if v_event.registration_closes_at is not null and now() > v_event.registration_closes_at then raise exception 'Inscrições encerradas'; end if;
  if exists (select 1 from public.chrismed_event_registrations where event_id=p_event_id and lower(attendee_email)=lower(trim(p_attendee_email)) and status in ('confirmed','waitlisted')) then raise exception 'Já existe uma inscrição ativa para este e-mail'; end if;

  select coalesce(sum(quantity),0) into v_reserved from public.chrismed_event_registrations where event_id=p_event_id and status='confirmed';
  v_status := case when v_reserved + p_quantity <= v_event.capacity then 'confirmed' else 'waitlisted' end;
  v_code := 'CE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  insert into public.chrismed_event_registrations (event_id,registration_code,attendee_name,attendee_email,attendee_phone,quantity,status,consent_version)
  values (p_event_id,v_code,trim(p_attendee_name),lower(trim(p_attendee_email)),nullif(trim(coalesce(p_attendee_phone,'')),''),p_quantity,v_status,left(coalesce(nullif(trim(p_consent_version),''),'events-v1'),40))
  returning id into v_id;
  return query select v_id,v_code,v_status;
end;
$$;

revoke all on function public.chrismed_register_event(uuid,text,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.chrismed_register_event(uuid,text,text,text,integer,text) to service_role;
comment on table public.chrismed_events is 'Agenda exclusiva de eventos CHRISMED; não contém consultas, pacientes ou dados assistenciais.';
comment on table public.chrismed_event_registrations is 'Inscrições em eventos CHRISMED; domínio isolado da agenda e do prontuário de saúde.';
