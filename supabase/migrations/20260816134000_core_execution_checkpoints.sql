create table if not exists public.core_execution_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  scope text not null,
  company_id uuid null references public.companies(id) on delete set null,
  operation_type text not null,
  status text not null default 'pending' check (status in ('pending','running','paused','completed','failed','cancelled')),
  total_batches integer not null default 0 check (total_batches >= 0),
  completed_batches integer not null default 0 check (completed_batches >= 0),
  current_batch integer not null default 0 check (current_batch >= 0),
  last_checkpoint text null,
  idempotency_key text not null,
  started_at timestamptz null,
  completed_at timestamptz null,
  last_error text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scope, idempotency_key)
);

create table if not exists public.core_execution_batches (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.core_execution_runs(id) on delete cascade,
  batch_no integer not null check (batch_no > 0),
  batch_key text not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed','skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  payload_hash text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  error_text text null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id, batch_no),
  unique(run_id, batch_key)
);

create index if not exists core_execution_runs_status_idx on public.core_execution_runs(status, updated_at desc);
create index if not exists core_execution_runs_company_idx on public.core_execution_runs(company_id, updated_at desc);
create index if not exists core_execution_batches_status_idx on public.core_execution_batches(run_id, status, batch_no);

alter table public.core_execution_runs enable row level security;
alter table public.core_execution_batches enable row level security;
revoke all on public.core_execution_runs from anon, authenticated;
revoke all on public.core_execution_batches from anon, authenticated;
grant select,insert,update,delete on public.core_execution_runs to service_role;
grant select,insert,update,delete on public.core_execution_batches to service_role;

create or replace function public.core_execution_checkpoint(
  p_run_key text,
  p_scope text,
  p_operation_type text,
  p_idempotency_key text,
  p_batch_no integer,
  p_batch_key text,
  p_batch_status text,
  p_total_batches integer default 0,
  p_company_id uuid default null,
  p_error_text text default null,
  p_evidence jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_completed integer;
begin
  if p_batch_no < 1 then raise exception 'invalid_batch_no'; end if;
  if p_batch_status not in ('pending','running','completed','failed','skipped') then raise exception 'invalid_batch_status'; end if;

  insert into public.core_execution_runs(run_key,scope,company_id,operation_type,status,total_batches,current_batch,idempotency_key,started_at,updated_at)
  values(p_run_key,p_scope,p_company_id,p_operation_type,'running',greatest(p_total_batches,0),p_batch_no,p_idempotency_key,now(),now())
  on conflict (run_key) do update set
    current_batch=greatest(public.core_execution_runs.current_batch,excluded.current_batch),
    total_batches=greatest(public.core_execution_runs.total_batches,excluded.total_batches),
    status=case when public.core_execution_runs.status='completed' then 'completed' else 'running' end,
    updated_at=now()
  returning id into v_run_id;

  insert into public.core_execution_batches(run_id,batch_no,batch_key,status,attempt_count,started_at,completed_at,error_text,evidence,updated_at)
  values(v_run_id,p_batch_no,p_batch_key,p_batch_status,1,case when p_batch_status='running' then now() else null end,case when p_batch_status in ('completed','skipped') then now() else null end,p_error_text,coalesce(p_evidence,'{}'::jsonb),now())
  on conflict (run_id,batch_no) do update set
    batch_key=excluded.batch_key,
    status=excluded.status,
    attempt_count=public.core_execution_batches.attempt_count+1,
    started_at=coalesce(public.core_execution_batches.started_at,case when excluded.status='running' then now() else null end),
    completed_at=case when excluded.status in ('completed','skipped') then now() else public.core_execution_batches.completed_at end,
    error_text=excluded.error_text,
    evidence=public.core_execution_batches.evidence || excluded.evidence,
    updated_at=now();

  select count(*) into v_completed from public.core_execution_batches where run_id=v_run_id and status in ('completed','skipped');

  update public.core_execution_runs set
    completed_batches=v_completed,
    last_checkpoint=p_batch_key,
    last_error=case when p_batch_status='failed' then p_error_text else null end,
    status=case
      when p_batch_status='failed' then 'failed'
      when total_batches > 0 and v_completed >= total_batches then 'completed'
      else 'running'
    end,
    completed_at=case when total_batches > 0 and v_completed >= total_batches then now() else completed_at end,
    updated_at=now()
  where id=v_run_id;

  return v_run_id;
end;
$$;

revoke all on function public.core_execution_checkpoint(text,text,text,text,integer,text,text,integer,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.core_execution_checkpoint(text,text,text,text,integer,text,text,integer,uuid,text,jsonb) to service_role;

comment on table public.core_execution_runs is 'Universal resumable execution ledger for large Core operations.';
comment on table public.core_execution_batches is 'Idempotent batch checkpoints for resumable Core operations.';
