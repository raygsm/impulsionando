create or replace function public.chrismed_queue_event_reminders(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_inserted integer := 0;
begin
  select company_id into v_company_id
  from public.communication_tenants
  where slug = 'chrismed' and active = true and deleted_at is null
  limit 1;

  if v_company_id is null then
    raise exception 'chrismed_company_not_found';
  end if;

  with recipient_source as (
    select r.event_id, lower(trim(r.attendee_email)) as email, r.attendee_name as recipient_name
    from public.chrismed_event_registrations r
    where r.status = 'confirmed'
    union
    select i.event_id, lower(trim(i.invitee_email)) as email, i.invitee_name as recipient_name
    from public.chrismed_event_invitations i
    where i.status = 'accepted'
  ), recipients as (
    select distinct on (event_id, email) event_id, email, recipient_name
    from recipient_source
    where email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    order by event_id, email, recipient_name
  ), due as (
    select
      e.id as event_id,
      e.title as event_name,
      e.starts_at,
      e.venue_name,
      e.venue_address,
      e.city,
      r.email,
      r.recipient_name,
      x.reminder_key,
      x.threshold
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
    insert into public.chrismed_communication_outbox (
      company_id, event_code, channel, recipient, payload, idempotency_key,
      status, available_at, from_email, reply_to_email
    )
    select
      v_company_id,
      'event_reminder',
      'email',
      d.email,
      jsonb_build_object(
        'event_id', d.event_id,
        'recipient_name', d.recipient_name,
        'event_name', d.event_name,
        'starts_at', d.starts_at,
        'venue_name', d.venue_name,
        'venue_address', d.venue_address,
        'city', d.city,
        'event_url', 'https://chrismed.impulsionando.com.br/eventos',
        'reminder_key', d.reminder_key
      ),
      'chrismed:event-reminder:' || d.event_id::text || ':' || encode(digest(d.email, 'sha256'), 'hex') || ':' || d.reminder_key,
      'pending',
      p_now,
      'sac@chrismed.com.br',
      'sac@chrismed.com.br'
    from due d
    on conflict (idempotency_key) do nothing
    returning id
  )
  select count(*) into v_inserted from ins;

  return jsonb_build_object('ok', true, 'queued', v_inserted, 'checked_at', p_now);
end;
$$;

revoke all on function public.chrismed_queue_event_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.chrismed_queue_event_reminders(timestamptz) to service_role;

comment on function public.chrismed_queue_event_reminders(timestamptz) is
'Enfileira lembretes idempotentes de eventos CHRISMED em 72h, 24h e 2h para inscrições confirmadas e convites aceitos. A execução recorrente deve ser feita pelo orquestrador/worker autenticado.';