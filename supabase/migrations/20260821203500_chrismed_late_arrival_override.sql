-- CHRISMED late-arrival override: professional may accept a patient after automatic no-show.
-- Clinical decision always wins over the automatic 15-minute operational timeout.

create or replace function public.chrismed_mark_appointment_outcome(
  p_appointment_id uuid,
  p_outcome text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public'
as $$
declare
  v_company constant uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  v_appt public.chrismed_appointments%rowtype;
  v_survey_id uuid;
  v_scheduled_at timestamptz;
  v_token uuid;
  v_was_no_show boolean := false;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_outcome not in ('started','completed','no_show','cancelled_justified') then raise exception 'invalid_outcome'; end if;

  select * into v_appt from public.chrismed_appointments
  where id=p_appointment_id and company_id=v_company for update;
  if not found then raise exception 'appointment_not_found'; end if;

  if not (
    public.is_impulsionando_staff(auth.uid())
    or exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id=v_company and r.role in ('admin','gestor'))
    or exists(select 1 from public.agenda_professionals p where p.id=v_appt.professional_id and p.user_id=auth.uid())
  ) then raise exception 'not_authorized'; end if;

  if p_outcome='started' then
    -- Confirmed is the normal path. no_show is explicitly reversible by the attending professional/authorized management.
    if v_appt.status not in ('confirmed','no_show') then raise exception 'appointment_cannot_start_from_current_status'; end if;
    v_was_no_show := v_appt.status='no_show';

    update public.chrismed_appointments
      set status='in_progress',
          started_at=coalesce(started_at,now()),
          no_show_at=case when v_was_no_show then null else no_show_at end,
          outcome_note=case when v_was_no_show then
            concat_ws(' ',nullif(trim(coalesce(outcome_note,'')),''),'No-show revertido: paciente chegou após a tolerância e o profissional decidiu realizar o atendimento.')
            else outcome_note end,
          metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
            'attendance_started_by',auth.uid(),
            'attendance_started_at',now(),
            'late_arrival_override',v_was_no_show
          ),
          updated_at=now()
    where id=v_appt.id;

    if v_was_no_show then
      -- Cancel any unsent no-show message immediately. Sent messages remain in audit history and are not erased.
      update public.chrismed_communication_outbox
        set status='dead_letter',last_error='late_arrival_override_patient_attended',updated_at=now()
      where idempotency_key='appointment:'||v_appt.id||':no-show-followup:email'
        and status in ('pending','failed','processing');

      insert into public.audit_logs(company_id,user_id,action,entity,entity_id,metadata)
      values(v_company,auth.uid(),'chrismed.appointment.no_show_reversed','chrismed_appointments',v_appt.id::text,
        jsonb_build_object('original_starts_at',v_appt.starts_at,'reversed_at',now(),'reason','late_arrival_accepted_by_professional'));
    end if;

    return jsonb_build_object('ok',true,'status','in_progress','late_arrival_override',v_was_no_show,'open_record',true);
  end if;

  if p_outcome='completed' then
    if v_appt.started_at is null then raise exception 'appointment_must_be_started_before_completion'; end if;
    update public.chrismed_appointments
      set status='completed',completed_at=now(),no_show_at=null,outcome_note=nullif(left(trim(coalesce(p_note,'')),1000),''),updated_at=now()
      where id=v_appt.id;

    update public.chrismed_communication_outbox
      set status='dead_letter',last_error='superseded_by_completed_consultation',updated_at=now()
      where idempotency_key='appointment:'||v_appt.id||':no-show-followup:email' and status in ('pending','failed','processing');

    v_scheduled_at := greatest(now()+interval '60 minutes',v_appt.ends_at+interval '60 minutes');
    v_token := gen_random_uuid();
    insert into public.chrismed_experience_surveys(company_id,subject_type,subject_id,audience_type,recipient_name,recipient_email,token,scheduled_at,journey_stage,answers)
    values(v_company,'appointment',v_appt.id,'patient',v_appt.patient_name,v_appt.patient_email,v_token,v_scheduled_at,'post_consultation','{}'::jsonb)
    on conflict(subject_type,subject_id,audience_type) do update
      set recipient_name=excluded.recipient_name,recipient_email=excluded.recipient_email,scheduled_at=excluded.scheduled_at,updated_at=now()
    returning id,token into v_survey_id,v_token;

    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company,'chrismed.appointment.survey','email',v_appt.patient_email,
      jsonb_build_object('appointment_id',v_appt.id,'professional_id',v_appt.professional_id,'patient_name',v_appt.patient_name,'survey_id',v_survey_id,'survey_url','https://chrismed.impulsionando.com.br/pesquisa?token='||v_token,'starts_at',v_appt.starts_at,'completed_at',now()),
      'appointment:'||v_appt.id||':survey:email','pending',v_scheduled_at,'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do update set payload=excluded.payload,available_at=excluded.available_at,status='pending',last_error=null,updated_at=now();

    return jsonb_build_object('ok',true,'status','completed','survey_scheduled_at',v_scheduled_at);
  end if;

  if p_outcome='no_show' then
    update public.chrismed_appointments set status='no_show',no_show_at=now(),completed_at=null,outcome_note=nullif(left(trim(coalesce(p_note,'')),1000),''),updated_at=now() where id=v_appt.id;
    delete from public.chrismed_experience_surveys where subject_type='appointment' and subject_id=v_appt.id and audience_type='patient' and completed_at is null;
    update public.chrismed_communication_outbox set status='dead_letter',last_error='cancelled_due_to_no_show',updated_at=now()
      where idempotency_key='appointment:'||v_appt.id||':survey:email' and status in ('pending','failed','processing');
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company,'appointment_no_show','email',v_appt.patient_email,jsonb_build_object('appointment_id',v_appt.id,'professional_id',v_appt.professional_id,'patient_name',v_appt.patient_name,'starts_at',v_appt.starts_at),
      'appointment:'||v_appt.id||':no-show-followup:email','pending',now(),'sac@chrismed.com.br','sac@chrismed.com.br') on conflict(idempotency_key) do nothing;
    return jsonb_build_object('ok',true,'status','no_show','reversible_by_professional',true);
  end if;

  update public.chrismed_appointments set status='cancelled',outcome_note=nullif(left(trim(coalesce(p_note,'')),1000),''),updated_at=now() where id=v_appt.id;
  update public.chrismed_communication_outbox set status='dead_letter',last_error='cancelled_or_justified_absence',updated_at=now()
    where idempotency_key in ('appointment:'||v_appt.id||':survey:email','appointment:'||v_appt.id||':no-show-followup:email') and status in ('pending','failed','processing');
  return jsonb_build_object('ok',true,'status','cancelled_justified');
end;
$$;

revoke all on function public.chrismed_mark_appointment_outcome(uuid,text,text) from public,anon;
grant execute on function public.chrismed_mark_appointment_outcome(uuid,text,text) to authenticated,service_role;
