CREATE OR REPLACE FUNCTION public.pulsonitor_register_check(
  p_target_id uuid,
  p_probe_region text,
  p_success boolean,
  p_status_code integer DEFAULT NULL::integer,
  p_latency_ms integer DEFAULT NULL::integer,
  p_error_code text DEFAULT NULL::text,
  p_error_message text DEFAULT NULL::text,
  p_response_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_target public.imp_monitoring_targets%rowtype;
  v_state public.imp_monitoring_state%rowtype;
  v_incident_id uuid;
  v_failures integer;
begin
  if not public.is_impulsionando_staff(auth.uid()) and auth.role() <> 'service_role' then
    raise exception 'not_authorized';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_target_id::text, 0));

  select * into v_target
  from public.imp_monitoring_targets
  where id = p_target_id and is_active = true;

  if not found then
    raise exception 'target_not_found_or_inactive';
  end if;

  insert into public.imp_monitoring_checks(
    target_id, probe_region, success, status_code, latency_ms,
    error_code, error_message, response_meta
  ) values (
    p_target_id, p_probe_region, p_success, p_status_code, p_latency_ms,
    p_error_code, left(p_error_message,1000), coalesce(p_response_meta,'{}'::jsonb)
  );

  insert into public.imp_monitoring_state(
    target_id,current_status,consecutive_failures,last_success_at,last_failure_at,last_latency_ms
  ) values (
    p_target_id,
    case when p_success then 'operational' else 'unstable' end,
    case when p_success then 0 else 1 end,
    case when p_success then now() end,
    case when not p_success then now() end,
    p_latency_ms
  )
  on conflict(target_id) do update set
    consecutive_failures = case when p_success then 0 else public.imp_monitoring_state.consecutive_failures + 1 end,
    last_success_at = case when p_success then now() else public.imp_monitoring_state.last_success_at end,
    last_failure_at = case when not p_success then now() else public.imp_monitoring_state.last_failure_at end,
    last_latency_ms = p_latency_ms,
    current_status = case when p_success then 'operational' else public.imp_monitoring_state.current_status end,
    updated_at = now()
  returning * into v_state;

  v_failures := v_state.consecutive_failures;

  if not p_success and v_failures >= v_target.consecutive_failures_to_incident then
    if v_state.open_incident_id is null then
      insert into public.imp_operational_incidents(
        company_id,scope,source,fingerprint,title,summary,severity,status,local_agent_name,supervised_by,
        first_seen_at,last_seen_at,detected_at,occurrence_count,affected_entity_type,affected_entity_id,evidence,
        customer_impact,institutional_risk,requires_human
      ) values (
        v_target.company_id,
        case when v_target.company_id is null then 'core' else 'client' end,
        'pulsonitor',
        'pulsonitor:' || v_target.id::text,
        'Indisponibilidade detectada: ' || v_target.label,
        coalesce(p_error_message,'Falha consecutiva de health check'),
        case when v_failures >= v_target.consecutive_failures_to_incident + 2 then 'high' else 'warning' end,
        'open','Pulsonitor','Impulsionito',now(),now(),now(),1,
        'monitoring_target',v_target.id::text,
        jsonb_build_object(
          'target',v_target.target,'probe',p_probe_region,'status_code',p_status_code,
          'latency_ms',p_latency_ms,'failures',v_failures
        ),
        'possible_service_degradation',false,false
      )
      on conflict (company_id, fingerprint) do update set
        status = 'open',
        resolved_at = null,
        last_seen_at = now(),
        detected_at = now(),
        occurrence_count = public.imp_operational_incidents.occurrence_count + 1,
        summary = excluded.summary,
        severity = excluded.severity,
        evidence = coalesce(public.imp_operational_incidents.evidence,'{}'::jsonb) || excluded.evidence || jsonb_build_object('reopened_at', now()),
        updated_at = now()
      returning id into v_incident_id;

      update public.imp_monitoring_state
      set open_incident_id = v_incident_id,
          current_status = 'unavailable',
          updated_at = now()
      where target_id = p_target_id;
    else
      v_incident_id := v_state.open_incident_id;
      update public.imp_operational_incidents
      set last_seen_at = now(),
          occurrence_count = occurrence_count + 1,
          evidence = evidence || jsonb_build_object(
            'last_probe',p_probe_region,'last_status_code',p_status_code,
            'last_latency_ms',p_latency_ms,'failures',v_failures
          ),
          updated_at = now()
      where id = v_incident_id;
    end if;
  elsif p_success and v_state.open_incident_id is not null then
    v_incident_id := v_state.open_incident_id;
    update public.imp_operational_incidents
    set status = 'resolved',
        resolved_at = now(),
        last_seen_at = now(),
        updated_at = now(),
        remediation = coalesce(remediation,'{}'::jsonb) || jsonb_build_object(
          'auto_resolution','healthcheck_recovered','resolved_by','Pulsonitor'
        )
    where id = v_incident_id and status <> 'resolved';

    update public.imp_monitoring_state
    set open_incident_id = null,
        current_status = 'operational',
        updated_at = now()
    where target_id = p_target_id;
  end if;

  return v_incident_id;
end
$function$;
