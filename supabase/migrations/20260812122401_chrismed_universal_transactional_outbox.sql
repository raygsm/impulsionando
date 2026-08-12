create or replace function public.enqueue_chrismed_appointment_communications()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
  v_payload jsonb;
  v_event text;
  v_now timestamptz := now();
  v_rescheduled boolean := false;
begin
  select id into v_company_id from public.companies where lower(name)='chrismed' and is_active=true order by created_at limit 1;
  if v_company_id is null then raise exception 'CHRISMED company not found'; end if;
  if new.company_id <> v_company_id then return new; end if;

  v_payload := jsonb_build_object(
    'appointment_id', new.id,
    'first_name', coalesce(nullif(split_part(new.patient_name,' ',1),''),'cliente'),
    'patient_name', new.patient_name,
    'patient_email', new.patient_email,
    'patient_phone', new.patient_phone,
    'professional_id', new.professional_id,
    'offering_id', new.offering_id,
    'starts_at', new.starts_at,
    'ends_at', new.ends_at,
    'status', new.status,
    'source', new.source
  );

  if tg_op='UPDATE' then
    v_rescheduled := (new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at) and new.status='confirmed';
  end if;

  if tg_op='INSERT' then
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company_id,'appointment_created','email',new.patient_email,v_payload,'appointment:'||new.id||':created:email','pending',v_now,'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do nothing;
  end if;

  if new.status='pending_payment' and (tg_op='INSERT' or old.status is distinct from new.status) then
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company_id,'payment_pending','email',new.patient_email,v_payload,'appointment:'||new.id||':payment-pending:email','pending',v_now,'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do nothing;
  end if;

  if new.status='confirmed' and (tg_op='INSERT' or old.status is distinct from new.status or v_rescheduled) then
    v_event := case when v_rescheduled then 'appointment_rescheduled' else 'appointment_confirmed' end;
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company_id,v_event,'email',new.patient_email,v_payload,'appointment:'||new.id||':'||case when v_rescheduled then 'rescheduled:'||extract(epoch from new.starts_at)::bigint else 'confirmed' end||':email','pending',v_now,'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do nothing;

    if v_rescheduled then
      update public.chrismed_communication_outbox
         set status='dead_letter', last_error='superseded_by_reschedule', updated_at=v_now
       where idempotency_key in ('appointment:'||new.id||':reminder-72h:email','appointment:'||new.id||':reminder-24h:email','appointment:'||new.id||':reminder-2h:email')
         and status='pending';
    end if;

    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values
      (v_company_id,'appointment_reminder_72h','email',new.patient_email,v_payload,'appointment:'||new.id||':reminder-72h:email','pending',greatest(v_now,new.starts_at-interval '72 hours'),'sac@chrismed.com.br','sac@chrismed.com.br'),
      (v_company_id,'appointment_reminder_24h','email',new.patient_email,v_payload,'appointment:'||new.id||':reminder-24h:email','pending',greatest(v_now,new.starts_at-interval '24 hours'),'sac@chrismed.com.br','sac@chrismed.com.br'),
      (v_company_id,'appointment_reminder_2h','email',new.patient_email,v_payload,'appointment:'||new.id||':reminder-2h:email','pending',greatest(v_now,new.starts_at-interval '2 hours'),'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do update set payload=excluded.payload, recipient=excluded.recipient, available_at=excluded.available_at, status='pending', attempts=0, last_error=null, updated_at=v_now;
  end if;

  if tg_op='UPDATE' and old.status is distinct from new.status and new.status in ('cancelled','completed','no_show') then
    v_event := case new.status when 'cancelled' then 'appointment_cancelled' when 'completed' then 'appointment_completed' else 'appointment_no_show' end;
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company_id,v_event,'email',new.patient_email,v_payload,'appointment:'||new.id||':'||new.status||':email','pending',v_now,'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do nothing;
    if new.status='cancelled' then
      update public.chrismed_communication_outbox set status='dead_letter',last_error='appointment_cancelled',updated_at=v_now
      where idempotency_key like 'appointment:'||new.id||':reminder-%:email' and status='pending';
    end if;
  end if;
  return new;
end $$;

revoke all on function public.enqueue_chrismed_appointment_communications() from public, anon, authenticated;
grant execute on function public.enqueue_chrismed_appointment_communications() to service_role;

drop trigger if exists trg_chrismed_appointment_communications on public.chrismed_appointments;
create trigger trg_chrismed_appointment_communications
after insert or update of status,starts_at,ends_at on public.chrismed_appointments
for each row execute function public.enqueue_chrismed_appointment_communications();

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
begin
  select id into v_company_id from public.companies where lower(name)='chrismed' and is_active=true order by created_at limit 1;
  if v_company_id is null then raise exception 'CHRISMED company not found'; end if;
  select * into v_event_record from public.chrismed_events where id=new.event_id;
  if not found then return new; end if;
  v_payload := jsonb_build_object('registration_id',new.id,'registration_code',new.registration_code,'event_id',new.event_id,'event_title',v_event_record.title,'starts_at',v_event_record.starts_at,'ends_at',v_event_record.ends_at,'venue_name',v_event_record.venue_name,'venue_address',v_event_record.venue_address,'attendee_name',new.attendee_name,'first_name',coalesce(nullif(split_part(new.attendee_name,' ',1),''),'participante'),'quantity',new.quantity,'status',new.status);

  if tg_op='INSERT' then
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company_id,'event_confirmed','email',new.attendee_email,v_payload,'event-registration:'||new.id||':confirmed:email','pending',v_now,'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do nothing;
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company_id,'event_reminder','email',new.attendee_email,v_payload,'event-registration:'||new.id||':reminder:email','pending',greatest(v_now,v_event_record.starts_at-interval '24 hours'),'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do nothing;
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company_id,'event_survey','email',new.attendee_email,v_payload,'event-registration:'||new.id||':survey:email','pending',greatest(v_now,v_event_record.ends_at+interval '2 hours'),'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do nothing;
  elsif old.status is distinct from new.status and new.status='cancelled' then
    update public.chrismed_communication_outbox set status='dead_letter',last_error='registration_cancelled',updated_at=v_now
    where idempotency_key like 'event-registration:'||new.id||':%:email' and status='pending';
  end if;
  return new;
end $$;

revoke all on function public.enqueue_chrismed_event_registration_communications() from public, anon, authenticated;
grant execute on function public.enqueue_chrismed_event_registration_communications() to service_role;

drop trigger if exists trg_chrismed_event_registration_communications on public.chrismed_event_registrations;
create trigger trg_chrismed_event_registration_communications
after insert or update of status on public.chrismed_event_registrations
for each row execute function public.enqueue_chrismed_event_registration_communications();
