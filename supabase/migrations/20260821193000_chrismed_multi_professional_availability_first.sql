-- CHRISMED multi-professional discovery and availability-first scheduling.
-- Reuses Core agenda_professionals + health professions/specialties; no parallel professional registry.

create table if not exists public.chrismed_professional_offerings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  professional_id uuid not null references public.agenda_professionals(id) on delete cascade,
  offering_id uuid not null references public.chrismed_service_offerings(id) on delete cascade,
  active boolean not null default true,
  priority integer not null default 100,
  custom_price_cents integer,
  custom_duration_minutes integer,
  location_label text,
  address jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, professional_id, offering_id),
  constraint chrismed_professional_offerings_company check (company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid),
  constraint chrismed_professional_offerings_price check (custom_price_cents is null or custom_price_cents > 0),
  constraint chrismed_professional_offerings_duration check (custom_duration_minutes is null or custom_duration_minutes between 10 and 480)
);

alter table public.chrismed_professional_offerings enable row level security;
revoke all on public.chrismed_professional_offerings from public, anon, authenticated;
grant all on public.chrismed_professional_offerings to service_role;
create policy chrismed_professional_offerings_staff_read on public.chrismed_professional_offerings
for select to authenticated using (
  public.is_impulsionando_staff(auth.uid())
  or exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id=chrismed_professional_offerings.company_id and r.role in ('admin','gestor'))
);

-- Public discovery is intentionally narrow: no private email/phone/user id is exposed.
create or replace function public.list_chrismed_professionals_for_offering(p_offering_id uuid)
returns table(
  professional_id uuid,
  public_slug text,
  professional_name text,
  profession_name text,
  primary_area text,
  specialties text[],
  modalities text[],
  bio text,
  council_label text,
  featured boolean,
  priority integer,
  location_label text,
  address jsonb,
  price_cents integer,
  duration_minutes integer
)
language sql
stable
security definer
set search_path='pg_catalog','public'
as $$
  select
    p.id,
    p.public_slug,
    p.name,
    hp.name,
    p.primary_area,
    coalesce(array(
      select hs.name
      from public.health_professional_specialties hps
      join public.health_specialties hs on hs.id=hps.specialty_id and hs.is_active
      where hps.professional_id=p.id and hps.review_status='approved'
      order by hps.is_primary desc, hs.sort_order, hs.name
    ), '{}'::text[]),
    p.service_modes,
    coalesce(p.bio,''),
    nullif(trim(concat_ws(' ',hp.council_acronym,p.council_number,p.council_region)),''),
    (p.public_slug='dra-christiane-alencar'),
    coalesce(po.priority, case when p.public_slug='dra-christiane-alencar' then 0 else 100 end),
    po.location_label,
    po.address,
    coalesce(po.custom_price_cents,o.price_cents),
    coalesce(po.custom_duration_minutes,o.duration_minutes)
  from public.chrismed_service_offerings o
  join public.chrismed_professional_offerings po on po.offering_id=o.id and po.company_id=o.company_id and po.active
  join public.agenda_professionals p on p.id=po.professional_id and p.company_id=o.company_id and p.is_active and p.profile_status in ('approved','active')
  left join public.health_professions hp on hp.id=p.profession_id and hp.is_active
  where o.id=p_offering_id
    and o.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
    and o.active
  order by featured desc, priority asc, professional_name asc;
$$;
revoke all on function public.list_chrismed_professionals_for_offering(uuid) from public;
grant execute on function public.list_chrismed_professionals_for_offering(uuid) to anon,authenticated,service_role;

-- Availability-first: for a modality/offering, return every real slot together with every eligible professional.
create or replace function public.list_chrismed_availability_by_offering(
  p_offering_id uuid,
  p_from date default current_date,
  p_days integer default 42
)
returns table(
  starts_at timestamptz,
  ends_at timestamptz,
  professional_id uuid,
  professional_slug text,
  professional_name text,
  featured boolean,
  profession_name text,
  primary_area text,
  specialties text[],
  location_label text,
  address jsonb,
  amount_cents integer
)
language sql
stable
security definer
set search_path='pg_catalog','public'
as $$
with eligible as (
  select
    p.id professional_id,
    p.public_slug,
    p.name,
    hp.name profession_name,
    p.primary_area,
    coalesce(array(
      select hs.name from public.health_professional_specialties hps
      join public.health_specialties hs on hs.id=hps.specialty_id and hs.is_active
      where hps.professional_id=p.id and hps.review_status='approved'
      order by hps.is_primary desc,hs.sort_order,hs.name
    ),'{}'::text[]) specialties,
    (p.public_slug='dra-christiane-alencar') featured,
    po.location_label,
    po.address,
    coalesce(po.custom_price_cents,o.price_cents) amount_cents,
    coalesce(po.custom_duration_minutes,o.duration_minutes) duration_minutes
  from public.chrismed_service_offerings o
  join public.chrismed_professional_offerings po on po.offering_id=o.id and po.company_id=o.company_id and po.active
  join public.agenda_professionals p on p.id=po.professional_id and p.company_id=o.company_id and p.is_active and p.profile_status in ('approved','active')
  left join public.health_professions hp on hp.id=p.profession_id and hp.is_active
  where o.id=p_offering_id and o.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and o.active
), windows as (
  select e.*, (((p_from+d.day_offset)+s.start_time) at time zone 'America/Sao_Paulo') window_start,
         (((p_from+d.day_offset)+s.end_time) at time zone 'America/Sao_Paulo') window_end
  from eligible e
  join public.agenda_schedules s on s.professional_id=e.professional_id and s.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and s.is_active
  cross join lateral generate_series(0,least(greatest(p_days,1),60)-1) d(day_offset)
  where s.weekday=extract(dow from (p_from+d.day_offset))::smallint
), slots as (
  select w.*, slot_start,
         slot_start + make_interval(mins=>w.duration_minutes) slot_end
  from windows w
  cross join lateral generate_series(w.window_start,w.window_end-make_interval(mins=>w.duration_minutes),interval '15 minutes') slot_start
)
select s.slot_start,s.slot_end,s.professional_id,s.public_slug,s.name,s.featured,s.profession_name,s.primary_area,s.specialties,s.location_label,s.address,s.amount_cents
from slots s
where s.slot_start > now()+interval '30 minutes'
  and not exists(select 1 from public.agenda_blocks b where b.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and b.professional_id=s.professional_id and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(s.slot_start,s.slot_end,'[)'))
  and not exists(select 1 from public.chrismed_appointments a where a.professional_id=s.professional_id and a.status in ('held','pending_payment','confirmed') and (a.status='confirmed' or a.hold_expires_at>now()) and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(s.slot_start,s.slot_end,'[)'))
order by s.slot_start, s.featured desc, s.name;
$$;
revoke all on function public.list_chrismed_availability_by_offering(uuid,date,integer) from public;
grant execute on function public.list_chrismed_availability_by_offering(uuid,date,integer) to anon,authenticated,service_role;

-- Seed Dra. Christiane against every currently active offering whose modality she already declares in service_modes.
insert into public.chrismed_professional_offerings(company_id,professional_id,offering_id,active,priority,location_label,address)
select o.company_id,p.id,o.id,true,0,
  case o.modality when 'telemedicina' then 'Teleconsulta' when 'domiciliar' then 'Atendimento domiciliar' else 'Consultório CHRISMED' end,
  case when o.modality='telemedicina' then jsonb_build_object('type','online')
       when o.modality='domiciliar' then jsonb_build_object('type','patient_address')
       else jsonb_build_object('type','office','city','Rio de Janeiro','neighborhood','Copacabana') end
from public.chrismed_service_offerings o
join public.agenda_professionals p on p.company_id=o.company_id and p.public_slug='dra-christiane-alencar'
where o.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and o.active
on conflict(company_id,professional_id,offering_id) do update set active=true,priority=0,updated_at=now();

comment on table public.chrismed_professional_offerings is 'Eligibility matrix between CHRISMED professionals and commercial offerings. Controls modality, price/duration overrides and professional location without duplicating the Core professional registry.';
comment on function public.list_chrismed_availability_by_offering(uuid,date,integer) is 'Availability-first public discovery: returns real free slots and eligible health professionals, featuring Dra. Christiane editorially while supporting the full approved CHRISMED network.';
