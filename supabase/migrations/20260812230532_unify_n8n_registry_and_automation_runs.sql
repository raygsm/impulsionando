-- Reconciliacao de producao: um unico ledger para automacoes modernas e
-- workflows reais do registry n8n.
alter table public.communication_workflow_runs
  add column if not exists registry_id uuid references public.n8n_workflow_registry(id);

alter table public.communication_workflow_runs
  alter column automation_id drop not null;

create index if not exists idx_communication_workflow_runs_registry_id
  on public.communication_workflow_runs(registry_id);

alter table public.communication_workflow_runs
  drop constraint if exists communication_workflow_runs_owner_check;

alter table public.communication_workflow_runs
  add constraint communication_workflow_runs_owner_check
  check (automation_id is not null or registry_id is not null);

create or replace function public.record_n8n_registry_run(
  p_tenant_slug text,
  p_workflow_slug text,
  p_correlation_id text,
  p_n8n_execution_id text,
  p_status text,
  p_started_at timestamptz default now(),
  p_finished_at timestamptz default null,
  p_error jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tenant_id uuid;
  v_registry_id uuid;
  v_automation_id uuid;
  v_run_id uuid;
  v_status text;
begin
  v_status := case lower(coalesce(p_status,''))
    when 'queued' then 'PENDING'
    when 'pending' then 'PENDING'
    when 'running' then 'RUNNING'
    when 'success' then 'SUCCEEDED'
    when 'succeeded' then 'SUCCEEDED'
    when 'completed' then 'SUCCEEDED'
    when 'failed' then 'FAILED'
    when 'error' then 'FAILED'
    when 'cancelled' then 'CANCELLED'
    else null
  end;
  if v_status is null then raise exception 'invalid_run_status'; end if;

  select id into v_tenant_id
  from public.communication_tenants
  where slug=p_tenant_slug and active=true
  order by created_at asc limit 1;
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;

  select r.id into v_registry_id
  from public.n8n_workflow_registry r
  where r.workflow_slug=p_workflow_slug
  order by r.version desc limit 1;
  if v_registry_id is null then raise exception 'workflow_registry_not_found'; end if;

  select tws.automation_id into v_automation_id
  from public.tenant_workflow_state tws
  where tws.tenant_id=v_tenant_id and tws.registry_id=v_registry_id
  limit 1;

  insert into public.communication_workflow_runs(
    tenant_id,automation_id,registry_id,correlation_id,n8n_execution_id,status,started_at,finished_at,error
  ) values (
    v_tenant_id,v_automation_id,v_registry_id,coalesce(nullif(p_correlation_id,''),gen_random_uuid()::text),p_n8n_execution_id,v_status,p_started_at,p_finished_at,p_error
  ) returning id into v_run_id;

  update public.tenant_workflow_state
  set last_execution_at=coalesce(p_finished_at,p_started_at,now()),
      last_error=case when v_status='FAILED' then p_error else null end,
      status=case when v_status='FAILED' then 'ERROR' when v_status='SUCCEEDED' then 'ACTIVE' else status end,
      updated_at=now()
  where tenant_id=v_tenant_id and registry_id=v_registry_id;

  return v_run_id;
end;
$function$;

revoke all on function public.record_n8n_registry_run(
  text,text,text,text,text,timestamptz,timestamptz,jsonb
) from public, anon, authenticated;
grant execute on function public.record_n8n_registry_run(
  text,text,text,text,text,timestamptz,timestamptz,jsonb
) to service_role;
