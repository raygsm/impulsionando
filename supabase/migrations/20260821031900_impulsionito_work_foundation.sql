-- Canonical Impulsionito work queue foundation.
-- Must exist before the risk guard and heartbeat route reference these objects.

create table if not exists public.core_agent_work_items (
  id uuid primary key default gen_random_uuid(),
  work_type text not null default 'GENERAL',
  title text not null,
  objective text not null default '',
  status text not null default 'QUEUED' check (status in ('QUEUED','IN_PROGRESS','READY_FOR_REVIEW','APPROVED','COMPLETED','CANCELLED','FAILED')),
  priority integer not null default 50 check (priority between 0 and 100),
  risk_level text not null default 'LOW' check (risk_level in ('LOW','MEDIUM','HIGH','CRITICAL')),
  target_scope jsonb not null default '{}'::jsonb,
  requires_human_approval boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.core_agent_subtasks (
  id uuid primary key default gen_random_uuid(),
  parent_work_item_id uuid not null references public.core_agent_work_items(id) on delete cascade,
  assigned_agent_id uuid,
  subtask_key text not null,
  objective text not null default '',
  status text not null default 'QUEUED' check (status in ('QUEUED','IN_PROGRESS','READY_FOR_REVIEW','COMPLETED','CANCELLED','FAILED')),
  priority integer not null default 50 check (priority between 0 and 100),
  dependency_keys text[] not null default '{}'::text[],
  evidence jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(parent_work_item_id, subtask_key)
);

create index if not exists idx_core_agent_work_items_queue
  on public.core_agent_work_items(status, priority desc, created_at);
create index if not exists idx_core_agent_subtasks_queue
  on public.core_agent_subtasks(status, priority desc, created_at);
create index if not exists idx_core_agent_subtasks_parent
  on public.core_agent_subtasks(parent_work_item_id);

alter table public.core_agent_work_items enable row level security;
alter table public.core_agent_subtasks enable row level security;

revoke all on public.core_agent_work_items, public.core_agent_subtasks from public, anon, authenticated;
grant all on public.core_agent_work_items, public.core_agent_subtasks to service_role;

create or replace function public.core_impulsionito_route_work(p_work_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_item public.core_agent_work_items%rowtype;
begin
  select * into v_item from public.core_agent_work_items where id=p_work_item_id for update;
  if not found then raise exception 'agent_work_item_not_found'; end if;
  if v_item.status='QUEUED' then
    update public.core_agent_work_items
      set status='IN_PROGRESS', updated_at=now()
      where id=p_work_item_id;
  end if;
  return jsonb_build_object('work_item_id',p_work_item_id,'status','IN_PROGRESS');
end;
$$;

create or replace function public.core_impulsionito_decompose_work(p_work_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_item public.core_agent_work_items%rowtype;
  v_agent record;
  v_count integer := 0;
begin
  select * into v_item from public.core_agent_work_items where id=p_work_item_id;
  if not found then raise exception 'agent_work_item_not_found'; end if;

  for v_agent in
    select agent_id, agent_key
    from public.communication_agent_runtime
    where coalesce(active,true)=true
    order by case when lower(agent_key)='impulsionito' then 1 else 0 end, agent_key
    limit 10
  loop
    insert into public.core_agent_subtasks(
      parent_work_item_id,assigned_agent_id,subtask_key,objective,status,priority,dependency_keys,evidence
    ) values(
      p_work_item_id,
      v_agent.agent_id,
      lower(regexp_replace(v_agent.agent_key,'[^a-zA-Z0-9]+','-','g')),
      v_item.objective,
      'QUEUED',
      v_item.priority,
      '{}'::text[],
      jsonb_build_object('source','core_impulsionito_decompose_work','agent_key',v_agent.agent_key)
    ) on conflict(parent_work_item_id,subtask_key) do nothing;
    if found then v_count := v_count + 1; end if;
  end loop;

  if v_count=0 and not exists(select 1 from public.core_agent_subtasks where parent_work_item_id=p_work_item_id) then
    raise exception 'no_active_agents_available_for_work';
  end if;

  return jsonb_build_object('work_item_id',p_work_item_id,'subtasks_created',v_count);
end;
$$;

revoke all on function public.core_impulsionito_route_work(uuid) from public,anon,authenticated;
revoke all on function public.core_impulsionito_decompose_work(uuid) from public,anon,authenticated;
grant execute on function public.core_impulsionito_route_work(uuid) to service_role;
grant execute on function public.core_impulsionito_decompose_work(uuid) to service_role;
