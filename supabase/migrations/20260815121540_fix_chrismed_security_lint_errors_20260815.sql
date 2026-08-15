create or replace function public.chrismed_checkin_event_qr(p_event_id uuid, p_qr_token uuid)
returns table(checkin_id uuid, registration_id uuid, attendee_name text, checked_in_at timestamptz)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_reg public.chrismed_event_registrations%rowtype;
  v_checkin uuid;
  v_at timestamptz;
begin
  if v_uid is null then raise exception 'Autenticação obrigatória'; end if;
  if not exists(
    select 1 from public.chrismed_event_contractor_users cu
    where cu.event_id = p_event_id and cu.user_id = v_uid
  ) and not exists(
    select 1 from public.user_roles ur
    where ur.user_id = v_uid
      and ur.company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
      and ur.role in ('admin','gestor')
  ) then
    raise exception 'Acesso ao check-in não autorizado';
  end if;

  select r.* into v_reg
  from public.chrismed_event_registrations r
  where r.event_id = p_event_id
    and r.qr_token = p_qr_token
    and r.status = 'confirmed'
  for update;

  if not found then raise exception 'QR Code inválido ou participação não confirmada'; end if;

  if exists(
    select 1
    from public.chrismed_event_checkins c
    where c.event_id = p_event_id
      and c.registration_id = v_reg.id
  ) then
    raise exception 'Check-in já realizado';
  end if;

  insert into public.chrismed_event_checkins(event_id, registration_id, checked_in_by)
  values(p_event_id, v_reg.id, v_uid)
  returning id, chrismed_event_checkins.checked_in_at into v_checkin, v_at;

  return query select v_checkin, v_reg.id, v_reg.attendee_name, v_at;
end;
$function$;

create or replace function public.chrismed_queue_event_reminders(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_company_id uuid;
  v_inserted integer := 0;
begin
  select ct.company_id into v_company_id
  from public.communication_tenants ct
  where ct.slug = 'chrismed' and ct.active = true and ct.deleted_at is null
  limit 1;

  if v_company_id is null then raise exception 'chrismed_company_not_found'; end if;

  with recipient_source as (
    select r.event_id, lower(trim(r.attendee_email)) as email, r.attendee_name as recipient_name
    from public.chrismed_event_registrations r
    where r.status = 'confirmed'
    union
    select i.event_id, lower(trim(i.invitee_email)) as email, i.invitee_name as recipient_name
    from public.chrismed_event_invitations i
    where i.status = 'accepted'
  ), recipients as (
    select distinct on (rs.event_id, rs.email) rs.event_id, rs.email, rs.recipient_name
    from recipient_source rs
    where rs.email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    order by rs.event_id, rs.email, rs.recipient_name
  ), due as (
    select e.id as event_id, e.title as event_name, e.starts_at, e.venue_name,
           e.venue_address, e.city, r.email, r.recipient_name,
           x.reminder_key, x.threshold
    from public.chrismed_events e
    join recipients r on r.event_id = e.id
    cross join (values
      ('72h'::text, interval '72 hours'),
      ('24h'::text, interval '24 hours'),
      ('2h'::text, interval '2 hours')
    ) as x(reminder_key, threshold)
    where e.status = 'published'
      and e.starts_at > p_now
      and (e.starts_at - x.threshold) <= p_now
      and (e.starts_at - x.threshold) > (p_now - interval '6 hours')
  ), ins as (
    insert into public.chrismed_communication_outbox(
      company_id,event_code,channel,recipient,payload,idempotency_key,status,
      available_at,from_email,reply_to_email
    )
    select v_company_id,'event_reminder','email',d.email,
      jsonb_build_object(
        'event_id',d.event_id,'recipient_name',d.recipient_name,'event_name',d.event_name,
        'starts_at',d.starts_at,'venue_name',d.venue_name,'venue_address',d.venue_address,
        'city',d.city,'event_url','https://chrismed.impulsionando.com.br/eventos',
        'reminder_key',d.reminder_key
      ),
      'chrismed:event-reminder:' || d.event_id::text || ':' ||
        encode(extensions.digest(d.email, 'sha256'), 'hex') || ':' || d.reminder_key,
      'pending',p_now,'sac@chrismed.com.br','sac@chrismed.com.br'
    from due d
    on conflict (idempotency_key) do nothing
    returning id
  )
  select count(*) into v_inserted from ins;

  return jsonb_build_object('ok', true, 'queued', v_inserted, 'checked_at', p_now);
end;
$function$;

revoke all on function public.chrismed_queue_event_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.chrismed_queue_event_reminders(timestamptz) to service_role;