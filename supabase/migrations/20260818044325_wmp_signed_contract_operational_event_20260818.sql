create or replace function public.wmp_create_operational_event_after_contract_signed()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_proposal public.wmp_proposals%rowtype;
  v_briefing public.wmp_briefings%rowtype;
  v_date public.wmp_briefing_dates%rowtype;
  v_event_id uuid;
  v_title text;
  v_type text;
  v_event_date date;
  v_start time;
  v_end time;
  v_venue_name text;
  v_venue_address text;
  v_bairro text;
  v_city text;
  v_state text;
  v_cep text;
  v_ibge text;
  v_audience integer;
begin
  if new.status <> 'SIGNED' or old.status is not distinct from new.status then
    return new;
  end if;

  select * into v_proposal from public.wmp_proposals where id = new.proposal_id;
  if v_proposal.id is null then
    return new;
  end if;

  if v_proposal.briefing_id is not null then
    select * into v_briefing from public.wmp_briefings where id = v_proposal.briefing_id;
  end if;

  select * into v_date
  from public.wmp_briefing_dates
  where tenant_id = new.tenant_id
    and briefing_id = v_proposal.briefing_id
    and status = 'CONFIRMED'
  order by event_date asc, start_time asc nulls last
  limit 1;

  if exists (
    select 1 from public.wmp_events e
    where e.tenant_id = new.tenant_id
      and e.proposal_id = v_proposal.id
      and e.status <> 'CANCELLED'
  ) then
    return new;
  end if;

  v_title := coalesce(
    nullif(v_proposal.event_snapshot->>'event_name',''),
    nullif(v_proposal.event_snapshot->>'nome',''),
    nullif(v_proposal.title,''),
    nullif(v_briefing.evento_tipo,''),
    'Evento WMP'
  );
  v_type := coalesce(
    nullif(v_proposal.event_snapshot->>'event_type',''),
    nullif(v_proposal.event_snapshot->>'tipo',''),
    nullif(v_briefing.evento_tipo,''),
    'EVENTO'
  );
  v_event_date := coalesce(
    v_date.event_date,
    case when coalesce(v_proposal.event_snapshot->>'event_date','') ~ '^\d{4}-\d{2}-\d{2}$' then (v_proposal.event_snapshot->>'event_date')::date end,
    v_briefing.evento_data
  );
  v_start := v_date.start_time;
  v_end := v_date.end_time;
  v_venue_name := coalesce(nullif(v_date.venue_name,''), nullif(v_proposal.event_snapshot->>'venue_name',''), nullif(v_proposal.event_snapshot->>'location',''), nullif(v_proposal.event_snapshot->>'local',''));
  v_venue_address := coalesce(nullif(v_date.venue_address,''), nullif(v_proposal.event_snapshot->>'venue_address',''), nullif(v_proposal.event_snapshot->>'address',''));
  v_bairro := v_date.venue_bairro;
  v_city := coalesce(nullif(v_date.venue_city,''), nullif(v_proposal.event_snapshot->>'city',''), nullif(v_proposal.event_snapshot->>'cidade',''), nullif(v_briefing.evento_cidade,''));
  v_state := coalesce(nullif(v_date.venue_state,''), nullif(v_proposal.event_snapshot->>'state',''), nullif(v_proposal.event_snapshot->>'estado',''), nullif(v_briefing.evento_estado,''));
  v_cep := v_date.venue_cep;
  v_ibge := v_date.venue_municipio_ibge;
  v_audience := case
    when coalesce(v_proposal.event_snapshot->>'audience_estimate','') ~ '^\d+$' then (v_proposal.event_snapshot->>'audience_estimate')::integer
    when coalesce(v_proposal.event_snapshot->>'publico','') ~ '^\d+$' then (v_proposal.event_snapshot->>'publico')::integer
    else null
  end;

  insert into public.wmp_events(
    tenant_id, briefing_id, briefing_date_id, proposal_id, opportunity_id,
    source, status, public_status, title, event_type, event_date, start_time, end_time,
    timezone, venue_name, venue_address, venue_bairro, venue_city, venue_state,
    venue_cep, venue_municipio_ibge, audience_estimate, confirmed_at, created_by
  ) values (
    new.tenant_id, v_proposal.briefing_id, v_date.id, v_proposal.id, v_proposal.opportunity_id,
    'SIGNED_CONTRACT', 'CONFIRMED', 'PRIVATE', v_title, v_type, v_event_date, v_start, v_end,
    'America/Sao_Paulo', v_venue_name, v_venue_address, v_bairro, v_city, v_state,
    v_cep, v_ibge, v_audience, now(), new.created_by
  ) returning id into v_event_id;

  insert into public.wmp_audit_logs(tenant_id, actor_user_id, entity_table, entity_id, action, after_data)
  values (
    new.tenant_id, new.created_by, 'wmp_events', v_event_id, 'CREATED_FROM_SIGNED_CONTRACT',
    jsonb_build_object('contract_id', new.id, 'proposal_id', v_proposal.id, 'contract_number', new.contract_number)
  );

  return new;
end
$$;

drop trigger if exists trg_wmp_create_event_after_contract_signed on public.wmp_contracts;
create trigger trg_wmp_create_event_after_contract_signed
after update of status on public.wmp_contracts
for each row
execute function public.wmp_create_operational_event_after_contract_signed();
