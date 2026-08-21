-- CHRISMED consultation lifecycle: surveys only after confirmed completion.
-- No-show never receives satisfaction survey; it receives a separate caring follow-up.

alter table public.chrismed_appointments
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists no_show_at timestamptz,
  add column if not exists outcome_note text;

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
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_outcome not in ('started','completed','no_show','cancelled_justified') then
    raise exception 'invalid_outcome';
  end if;

  select * into v_appt
  from public.chrismed_appointments
  where id=p_appointment_id and company_id=v_company
  for update;
  if not found then raise exception 'appointment_not_found'; end if;

  if not (
    public.is_impulsionando_staff(auth.uid())
    or exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id=v_company and r.role in ('admin','gestor'))
    or exists(select 1 from public.agenda_professionals p where p.id=v_appt.professional_id and p.user_id=auth.uid())
  ) then raise exception 'not_authorized'; end if;

  if p_outcome='started' then
    if v_appt.status <> 'confirmed' then raise exception 'only_confirmed_appointments_can_start'; end if;
    update public.chrismed_appointments
      set started_at=coalesce(started_at,now()),updated_at=now()
      where id=v_appt.id;
    return jsonb_build_object('ok',true,'status','started');
  end if;

  if p_outcome='completed' then
    if v_appt.started_at is null then raise exception 'appointment_must_be_started_before_completion'; end if;
    update public.chrismed_appointments
      set status='completed',completed_at=now(),no_show_at=null,outcome_note=nullif(left(trim(coalesce(p_note,'')),1000),''),updated_at=now()
      where id=v_appt.id;

    -- A previously queued no-show communication must never be sent after completion.
    update public.chrismed_communication_outbox
      set status='dead_letter',last_error='superseded_by_completed_consultation',updated_at=now()
      where idempotency_key='appointment:'||v_appt.id||':no-show-followup:email'
        and status in ('pending','failed');

    v_scheduled_at := greatest(v_appt.starts_at + interval '60 minutes', now());
    v_token := gen_random_uuid();
    insert into public.chrismed_experience_surveys(
      company_id,subject_type,subject_id,audience_type,recipient_name,recipient_email,token,scheduled_at,journey_stage,answers
    ) values (
      v_company,'appointment',v_appt.id,'patient',v_appt.patient_name,v_appt.patient_email,v_token,v_scheduled_at,'post_consultation','{}'::jsonb
    )
    on conflict(subject_type,subject_id,audience_type) do update
      set recipient_name=excluded.recipient_name,recipient_email=excluded.recipient_email,scheduled_at=excluded.scheduled_at,updated_at=now()
    returning id,token into v_survey_id,v_token;

    insert into public.chrismed_communication_outbox(
      company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email
    ) values (
      v_company,'chrismed.appointment.survey','email',v_appt.patient_email,
      jsonb_build_object(
        'appointment_id',v_appt.id,
        'professional_id',v_appt.professional_id,
        'patient_name',v_appt.patient_name,
        'survey_id',v_survey_id,
        'survey_url','https://chrismed.impulsionando.com.br/pesquisa?token='||v_token,
        'starts_at',v_appt.starts_at,
        'completed_at',now()
      ),
      'appointment:'||v_appt.id||':survey:email','pending',v_scheduled_at,'sac@chrismed.com.br','sac@chrismed.com.br'
    ) on conflict(idempotency_key) do update set
      payload=excluded.payload,available_at=excluded.available_at,status='pending',last_error=null,updated_at=now();

    return jsonb_build_object('ok',true,'status','completed','survey_scheduled_at',v_scheduled_at);
  end if;

  if p_outcome='no_show' then
    update public.chrismed_appointments
      set status='no_show',no_show_at=now(),completed_at=null,outcome_note=nullif(left(trim(coalesce(p_note,'')),1000),''),updated_at=now()
      where id=v_appt.id;

    -- Hard stop: no satisfaction survey may remain queued for a no-show.
    delete from public.chrismed_experience_surveys
      where subject_type='appointment' and subject_id=v_appt.id and audience_type='patient' and completed_at is null;
    update public.chrismed_communication_outbox
      set status='dead_letter',last_error='cancelled_due_to_no_show',updated_at=now()
      where idempotency_key='appointment:'||v_appt.id||':survey:email'
        and status in ('pending','failed');

    insert into public.chrismed_communication_outbox(
      company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email
    ) values (
      v_company,'appointment_no_show','email',v_appt.patient_email,
      jsonb_build_object(
        'appointment_id',v_appt.id,
        'professional_id',v_appt.professional_id,
        'patient_name',v_appt.patient_name,
        'starts_at',v_appt.starts_at,
        'message','Sentimos sua falta hoje. Esperamos que esteja tudo bem. Sabemos que imprevistos sérios podem acontecer. Quando perceber que não conseguirá comparecer, avise a CHRISMED com o máximo de antecedência possível. Esse cuidado ajuda a equipe a reorganizar a agenda e permite que outro paciente possa ser atendido. Se aconteceu algo ou você precisa de ajuda para remarcar, responda esta mensagem.'
      ),
      'appointment:'||v_appt.id||':no-show-followup:email','pending',now(),'sac@chrismed.com.br','sac@chrismed.com.br'
    ) on conflict(idempotency_key) do nothing;

    return jsonb_build_object('ok',true,'status','no_show');
  end if;

  -- justified/previously communicated absence: no survey and no corrective no-show message.
  update public.chrismed_appointments
    set status='cancelled',outcome_note=nullif(left(trim(coalesce(p_note,'')),1000),''),updated_at=now()
    where id=v_appt.id;
  update public.chrismed_communication_outbox
    set status='dead_letter',last_error='cancelled_or_justified_absence',updated_at=now()
    where idempotency_key in (
      'appointment:'||v_appt.id||':survey:email',
      'appointment:'||v_appt.id||':no-show-followup:email'
    ) and status in ('pending','failed');

  return jsonb_build_object('ok',true,'status','cancelled_justified');
end;
$$;

revoke all on function public.chrismed_mark_appointment_outcome(uuid,text,text) from public,anon;
grant execute on function public.chrismed_mark_appointment_outcome(uuid,text,text) to authenticated,service_role;

-- Refresh the no-show template with a careful but firm tone.
do $m$
declare v_tenant uuid; v_brand uuid; v_actor uuid; v_template uuid;
begin
  select id into strict v_tenant from public.communication_tenants where slug='chrismed' and active=true;
  select id into strict v_brand from public.communication_brands where tenant_id=v_tenant and deleted_at is null order by created_at limit 1;
  select id into v_actor from auth.users where lower(email)='raygs@hotmail.com' limit 1;

  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version,created_by)
  values(v_tenant,v_brand,'appointment.no_show','appointment.no_show','EMAIL','SCHEDULING','pt-BR','PUBLISHED',1,v_actor)
  on conflict(tenant_id,template_key,locale) do update set status='PUBLISHED',current_version=1,updated_at=now(),deleted_at=null returning id into v_template;

  insert into public.communication_template_versions(
    tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,
    variables_schema,required_variables,optional_variables,fallback_values,approval_status,created_by,approved_by,published_at
  ) values (
    v_tenant,v_template,1,
    'Sentimos sua falta hoje — está tudo bem?',
    'Se aconteceu algum imprevisto, conte com a CHRISMED para ajudar a reorganizar seu atendimento.',
    '<p>Olá, {{patient_name}}.</p><p>Percebemos que você não conseguiu comparecer ao atendimento marcado para <strong>{{appointment_date}} às {{appointment_time}}</strong> e esperamos, antes de tudo, que esteja tudo bem.</p><p>Sabemos que imprevistos sérios podem acontecer — inclusive situações de saúde, acidentes ou emergências. Se foi o seu caso, fique à vontade para nos contar apenas o que considerar necessário.</p><p>Ao mesmo tempo, quando perceber que não poderá comparecer, pedimos que avise a CHRISMED com o máximo de antecedência possível. Uma ausência sem aviso prejudica a organização do atendimento e pode impedir que outro paciente utilize aquele horário.</p><p>Se precisar remarcar ou se pudermos ajudar de alguma forma, responda este e-mail. Estamos à disposição.</p><p>Com cuidado,<br><strong>Equipe CHRISMED</strong></p>',
    'Olá, {{patient_name}}.\n\nPercebemos que você não conseguiu comparecer ao atendimento marcado para {{appointment_date}} às {{appointment_time}} e esperamos, antes de tudo, que esteja tudo bem.\n\nSabemos que imprevistos sérios podem acontecer, inclusive situações de saúde, acidentes ou emergências.\n\nQuando perceber que não poderá comparecer, pedimos que avise a CHRISMED com o máximo de antecedência possível. Uma ausência sem aviso prejudica a organização do atendimento e pode impedir que outro paciente utilize aquele horário.\n\nSe precisar remarcar ou se pudermos ajudar de alguma forma, responda este e-mail. Estamos à disposição.\n\nEquipe CHRISMED',
    '{}'::jsonb,array['patient_name','appointment_date','appointment_time'],'{}'::text[],'{}'::jsonb,'APPROVED',v_actor,v_actor,now()
  ) on conflict(template_id,version) do update set
    subject_template=excluded.subject_template,preheader_template=excluded.preheader_template,
    html_template=excluded.html_template,text_template=excluded.text_template,
    required_variables=excluded.required_variables,approval_status='APPROVED',approved_by=v_actor,published_at=now();
end $m$;
