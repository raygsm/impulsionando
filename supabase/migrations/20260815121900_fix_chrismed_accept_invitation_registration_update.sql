create or replace function public.chrismed_accept_event_invitation(p_token uuid)
returns table(registration_id uuid, registration_code text, registration_status text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_inv public.chrismed_event_invitations%rowtype;
  v_event public.chrismed_events%rowtype;
  v_existing public.chrismed_event_registrations%rowtype;
  v_reserved integer;
  v_id uuid;
  v_code text;
begin
  select * into v_inv from public.chrismed_event_invitations where token=p_token for update;
  if not found then raise exception 'Convite indisponível'; end if;

  select * into v_event from public.chrismed_events where id=v_inv.event_id for update;
  if not found or v_event.status<>'published' or v_event.ends_at<=now() then raise exception 'Evento indisponível'; end if;

  select * into v_existing
  from public.chrismed_event_registrations
  where event_id=v_inv.event_id and lower(attendee_email)=lower(v_inv.invitee_email)
    and status in ('confirmed','pending_approval')
  order by case when status='confirmed' then 0 else 1 end, created_at desc
  limit 1
  for update;

  if found then
    if v_existing.status='pending_approval' then
      update public.chrismed_event_registrations
      set status='confirmed', approved_at=coalesce(approved_at,now()), approval_expires_at=null
      where id=v_existing.id
      returning * into v_existing;
    end if;
    update public.chrismed_event_invitations
      set status='accepted',accepted_at=coalesce(accepted_at,now()),updated_at=now()
      where id=v_inv.id;
    return query select v_existing.id,v_existing.registration_code,'confirmed'::text;
    return;
  end if;

  if v_inv.status='accepted' then raise exception 'Convite já utilizado'; end if;
  if v_inv.status<>'pending' then raise exception 'Convite indisponível'; end if;
  if v_inv.expires_at is not null and v_inv.expires_at<=now() then
    update public.chrismed_event_invitations set status='expired',updated_at=now() where id=v_inv.id;
    raise exception 'Convite expirado';
  end if;

  update public.chrismed_event_registrations set status='expired'
  where event_id=v_inv.event_id and status='pending_approval' and approval_expires_at<=now();

  select coalesce(sum(quantity),0) into v_reserved
  from public.chrismed_event_registrations
  where event_id=v_inv.event_id and (status='confirmed' or (status='pending_approval' and approval_expires_at>now()));
  if v_reserved+1>v_event.capacity then raise exception 'Evento lotado'; end if;

  v_code:='CE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  insert into public.chrismed_event_registrations(event_id,registration_code,attendee_name,attendee_email,attendee_phone,quantity,status,consent_version,source,approved_at)
  values(v_inv.event_id,v_code,v_inv.invitee_name,lower(v_inv.invitee_email),v_inv.invitee_phone,1,'confirmed','events-invite-v2','chrismed-invite',now())
  returning id into v_id;

  update public.chrismed_event_invitations set status='accepted',accepted_at=now(),updated_at=now() where id=v_inv.id;
  return query select v_id,v_code,'confirmed'::text;
end;
$function$;
