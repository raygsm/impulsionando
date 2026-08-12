create or replace function public.enqueue_chrismed_event_registration_communications()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
  v_event_record public.chrismed_events%rowtype;
  v_payload jsonb;
  v_now timestamptz := now();
  v_became_confirmed boolean := false;
begin
  select id into v_company_id from public.companies where lower(name)='chrismed' and is_active=true order by created_at limit 1;
  if v_company_id is null then raise exception 'CHRISMED company not found'; end if;
  select * into v_event_record from public.chrismed_events where id=new.event_id;
  if not found then return new; end if;

  v_payload := jsonb_build_object(
    'registration_id',new.id,
    'registration_code',new.registration_code,
    'event_id',new.event_id,
    'event_title',v_event_record.title,
    'starts_at',v_event_record.starts_at,
    'ends_at',v_event_record.ends_at,
    'venue_name',v_event_record.venue_name,
    'venue_address',v_event_record.venue_address,
    'attendee_name',new.attendee_name,
    'first_name',coalesce(nullif(split_part(new.attendee_name,' ',1),''),'participante'),
    'quantity',new.quantity,
    'status',new.status
  );

  v_became_confirmed := new.status='confirmed' and (tg_op='INSERT' or old.status is distinct from new.status);

  if v_became_confirmed then
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values
      (v_company_id,'event_confirmed','email',new.attendee_email,v_payload,'event-registration:'||new.id||':confirmed:email','pending',v_now,'sac@chrismed.com.br','sac@chrismed.com.br'),
      (v_company_id,'event_reminder','email',new.attendee_email,v_payload,'event-registration:'||new.id||':reminder:email','pending',greatest(v_now,v_event_record.starts_at-interval '24 hours'),'sac@chrismed.com.br','sac@chrismed.com.br'),
      (v_company_id,'event_survey','email',new.attendee_email,v_payload,'event-registration:'||new.id||':survey:email','pending',greatest(v_now,v_event_record.ends_at+interval '2 hours'),'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do update
      set payload=excluded.payload,
          recipient=excluded.recipient,
          available_at=excluded.available_at,
          status='pending',
          attempts=0,
          last_error=null,
          updated_at=v_now;
  end if;

  if tg_op='UPDATE' and old.status is distinct from new.status and new.status in ('waitlisted','cancelled') then
    update public.chrismed_communication_outbox
       set status='dead_letter',
           last_error=case when new.status='cancelled' then 'registration_cancelled' else 'registration_waitlisted' end,
           updated_at=v_now
     where idempotency_key like 'event-registration:'||new.id||':%:email'
       and status='pending';
  end if;
  return new;
end $$;

revoke all on function public.enqueue_chrismed_event_registration_communications() from public, anon, authenticated;
grant execute on function public.enqueue_chrismed_event_registration_communications() to service_role;
