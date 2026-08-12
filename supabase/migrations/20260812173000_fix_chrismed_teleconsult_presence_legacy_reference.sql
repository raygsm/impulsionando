-- CHRISMED teleconsultation compatibility hardening.
-- The current professional source is agenda_professionals. This overload is
-- kept for frontend compatibility, but must never reference the removed
-- health_professionals table.
create or replace function public.chrismed_mark_teleconsult_presence(
  p_appointment_id uuid,
  p_role text,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_uid uuid := auth.uid();
  v_actual_role text;
  v_event text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select case
    when ap.user_id = v_uid then 'professional'
    when a.patient_user_id = v_uid then 'patient'
    when public.is_impulsionando_staff(v_uid) then 'admin'
    else null
  end
  into v_actual_role
  from public.chrismed_appointments a
  join public.agenda_professionals ap on ap.id = a.professional_id
  where a.id = p_appointment_id;

  if v_actual_role is null then
    raise exception 'not_authorized';
  end if;

  if p_role is distinct from v_actual_role and v_actual_role <> 'admin' then
    raise exception 'role_mismatch';
  end if;

  v_event := case
    when v_actual_role = 'professional' then 'ready_confirmed'
    when v_actual_role = 'patient' then 'joined_call'
    else 'opened_room'
  end;

  return public.chrismed_mark_teleconsult_presence(p_appointment_id, v_event);
end;
$$;

revoke all on function public.chrismed_mark_teleconsult_presence(uuid,text,text)
  from public, anon;
grant execute on function public.chrismed_mark_teleconsult_presence(uuid,text,text)
  to authenticated, service_role;
