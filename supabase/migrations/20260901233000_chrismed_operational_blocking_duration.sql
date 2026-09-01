-- CHRISMED: separate the duration shown to the patient from the interval reserved operationally.
alter table public.chrismed_service_offerings
  add column if not exists blocking_duration_minutes integer;

update public.chrismed_service_offerings
set blocking_duration_minutes = case
  when slug = 'consulta-presencial' then 120
  else duration_minutes
end
where company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  and blocking_duration_minutes is null;

alter table public.chrismed_service_offerings
  add constraint chrismed_service_offerings_blocking_duration_check
  check (blocking_duration_minutes is null or (blocking_duration_minutes >= duration_minutes and blocking_duration_minutes % 15 = 0));

create or replace function public.list_chrismed_available_slots(
  p_professional_slug text,
  p_offering_id uuid,
  p_from date default current_date,
  p_days integer default 42
)
returns table(starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with selected as (
    select p.id as professional_id,
           o.duration_minutes,
           coalesce(o.blocking_duration_minutes, o.duration_minutes) as blocking_duration_minutes
    from public.agenda_professionals p
    join public.chrismed_service_offerings o on o.company_id=p.company_id
    where p.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
      and p.public_slug=p_professional_slug
      and p.is_active is true
      and p.profile_status in ('approved','active')
      and o.id=p_offering_id and o.active
  ), candidates as (
    select s.professional_id,
      (((p_from + d.day_offset) + s.start_time) at time zone 'America/Sao_Paulo') as window_start,
      (((p_from + d.day_offset) + s.end_time) at time zone 'America/Sao_Paulo') as window_end,
      selected.duration_minutes,
      selected.blocking_duration_minutes
    from selected
    join public.agenda_schedules s on s.professional_id=selected.professional_id
      and s.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and s.is_active
    cross join lateral generate_series(0, least(greatest(p_days,1),60) - 1) d(day_offset)
    where s.weekday=extract(dow from (p_from + d.day_offset))::smallint
  ), slots as (
    select c.professional_id, slot_start,
      slot_start + make_interval(mins=>c.duration_minutes) as slot_end,
      slot_start + make_interval(mins=>c.blocking_duration_minutes) as blocking_end
    from candidates c
    cross join lateral generate_series(
      c.window_start,
      c.window_end - make_interval(mins=>c.blocking_duration_minutes),
      interval '15 minutes'
    ) slot_start
  )
  select slot_start,slot_end from slots x
  where slot_start >= now() + interval '30 minutes'
    and not exists (
      select 1 from public.agenda_blocks b
      where b.professional_id=x.professional_id
        and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(x.slot_start,x.blocking_end,'[)')
    )
    and not exists (
      select 1 from public.chrismed_appointments a
      join public.chrismed_service_offerings ao on ao.id=a.offering_id
      where a.professional_id=x.professional_id
        and a.status in ('held','pending_payment','confirmed')
        and (a.status='confirmed' or a.hold_expires_at>now())
        and tstzrange(a.starts_at, a.starts_at + make_interval(mins=>coalesce(ao.blocking_duration_minutes, ao.duration_minutes)), '[)')
            && tstzrange(x.slot_start,x.blocking_end,'[)')
    )
  order by slot_start;
$function$;