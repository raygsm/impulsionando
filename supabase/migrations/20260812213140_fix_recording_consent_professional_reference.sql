create or replace function public.chrismed_set_recording_consent(
  p_appointment_id uuid,
  p_party_role text,
  p_accept boolean,
  p_consent_version text,
  p_consent_text_hash text,
  p_user_agent_hash text default null,
  p_ip_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_uid uuid := auth.uid();
  v_professional_user_id uuid;
  v_patient_user_id uuid;
  v_decision text := case when p_accept then 'accepted' else 'declined' end;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_party_role not in ('patient','professional') then raise exception 'invalid_party_role'; end if;

  select ap.user_id, a.patient_user_id
    into v_professional_user_id, v_patient_user_id
  from public.chrismed_appointments a
  join public.agenda_professionals ap on ap.id=a.professional_id
  where a.id=p_appointment_id;

  if v_professional_user_id is null and v_patient_user_id is null then raise exception 'appointment_not_found'; end if;
  if p_party_role='patient' and v_patient_user_id is distinct from v_uid then raise exception 'not_authorized'; end if;
  if p_party_role='professional' and v_professional_user_id is distinct from v_uid then raise exception 'not_authorized'; end if;

  insert into public.chrismed_teleconsult_recording_consents(
    appointment_id,user_id,party_role,decision,consent_version,consent_text_hash,decided_at,user_agent_hash,ip_hash
  ) values (p_appointment_id,v_uid,p_party_role,v_decision,p_consent_version,p_consent_text_hash,now(),p_user_agent_hash,p_ip_hash)
  on conflict (appointment_id,party_role) do update set
    user_id=excluded.user_id,
    decision=excluded.decision,
    consent_version=excluded.consent_version,
    consent_text_hash=excluded.consent_text_hash,
    decided_at=excluded.decided_at,
    user_agent_hash=excluded.user_agent_hash,
    ip_hash=excluded.ip_hash;

  insert into public.chrismed_teleconsult_recordings(appointment_id,room_id,status)
  select a.id,r.id,'awaiting_consent'
  from public.chrismed_appointments a
  left join public.chrismed_teleconsult_rooms r on r.appointment_id=a.id
  where a.id=p_appointment_id
  on conflict (appointment_id) do nothing;

  update public.chrismed_teleconsult_recordings rec set
    patient_consent_at=case when p_party_role='patient' and p_accept then now() when p_party_role='patient' then null else rec.patient_consent_at end,
    professional_consent_at=case when p_party_role='professional' and p_accept then now() when p_party_role='professional' then null else rec.professional_consent_at end,
    status=case
      when p_accept and exists(
        select 1 from public.chrismed_teleconsult_recording_consents c
        where c.appointment_id=p_appointment_id and c.party_role<>p_party_role and c.decision='accepted'
      ) then 'ready'
      else 'awaiting_consent'
    end,
    updated_at=now()
  where rec.appointment_id=p_appointment_id;

  return jsonb_build_object(
    'decision',v_decision,
    'recording_ready',exists(select 1 from public.chrismed_teleconsult_recordings r where r.appointment_id=p_appointment_id and r.status='ready')
  );
end;
$$;

create or replace function public.chrismed_get_recording_consent_state(p_appointment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_uid uuid := auth.uid();
  v_professional_user_id uuid;
  v_patient_user_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select ap.user_id,a.patient_user_id
    into v_professional_user_id,v_patient_user_id
  from public.chrismed_appointments a
  join public.agenda_professionals ap on ap.id=a.professional_id
  where a.id=p_appointment_id;

  if v_professional_user_id is null and v_patient_user_id is null then raise exception 'appointment_not_found'; end if;
  if v_uid is distinct from v_professional_user_id
     and v_uid is distinct from v_patient_user_id
     and not public.chrismed_is_recording_master() then
    raise exception 'not_authorized';
  end if;

  return jsonb_build_object(
    'patient',coalesce((select decision from public.chrismed_teleconsult_recording_consents where appointment_id=p_appointment_id and party_role='patient'),'pending'),
    'professional',coalesce((select decision from public.chrismed_teleconsult_recording_consents where appointment_id=p_appointment_id and party_role='professional'),'pending'),
    'recording_status',coalesce((select status from public.chrismed_teleconsult_recordings where appointment_id=p_appointment_id),'awaiting_consent')
  );
end;
$$;