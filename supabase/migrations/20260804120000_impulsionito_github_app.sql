-- Impulsionito GitHub App integration.
-- Secrets remain in Supabase Vault; application tables only keep secret names.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create table if not exists public.github_app_approval_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete restrict,
  repository text not null check (repository ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
  action text not null check (
    action in (
      'issue.create',
      'branch.create',
      'pull_request.create_draft'
    )
  ),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  rationale text not null check (char_length(rationale) between 3 and 2000),
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'executing', 'executed', 'failed')
  ),
  idempotency_key text not null unique check (char_length(idempotency_key) between 16 and 160),
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  decision_note text check (decision_note is null or char_length(decision_note) <= 2000),
  executed_at timestamptz,
  result_summary jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_app_approval_decision_fields check (
    (status = 'pending' and approved_by is null and approved_at is null)
    or status <> 'pending'
  )
);

create table if not exists public.github_app_webhook_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null unique,
  event_name text not null check (char_length(event_name) between 1 and 100),
  action text,
  repository text,
  installation_id bigint,
  sender_login text,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.github_app_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  approval_request_id uuid references public.github_app_approval_requests(id) on delete set null,
  operation text not null check (char_length(operation) between 1 and 120),
  repository text,
  outcome text not null check (outcome in ('requested', 'approved', 'rejected', 'success', 'error', 'received', 'ignored')),
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists github_app_approvals_status_created_idx
  on public.github_app_approval_requests (status, created_at desc);
create index if not exists github_app_approvals_requester_created_idx
  on public.github_app_approval_requests (requested_by, created_at desc);
create index if not exists github_app_webhooks_event_received_idx
  on public.github_app_webhook_events (event_name, received_at desc);
create index if not exists github_app_audit_operation_created_idx
  on public.github_app_audit_log (operation, created_at desc);
create index if not exists github_app_audit_approval_idx
  on public.github_app_audit_log (approval_request_id)
  where approval_request_id is not null;

create or replace function private.is_github_master()
returns boolean
language sql
stable
set search_path = ''
as $$
  select lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'raygs@hotmail.com';
$$;

create or replace function private.github_app_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.github_app_guard_approval_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text := coalesce(auth.role(), '');
begin
  if new.requested_by is distinct from old.requested_by
     or new.repository is distinct from old.repository
     or new.action is distinct from old.action
     or new.payload is distinct from old.payload
     or new.rationale is distinct from old.rationale
     or new.idempotency_key is distinct from old.idempotency_key then
    raise exception 'GitHub approval request is immutable';
  end if;

  if old.status = new.status then
    return new;
  end if;

  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    if not private.is_github_master() then
      raise exception 'Only the GitHub master may decide requests';
    end if;
    new.approved_by := auth.uid();
    new.approved_at := now();
    return new;
  end if;

  if caller_role = 'service_role'
     and old.status = 'approved'
     and new.status in ('executing', 'failed') then
    return new;
  end if;

  if caller_role = 'service_role'
     and old.status = 'executing'
     and new.status in ('executed', 'failed') then
    return new;
  end if;

  raise exception 'Invalid GitHub approval status transition: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists github_app_approval_guard on public.github_app_approval_requests;
create trigger github_app_approval_guard
before update on public.github_app_approval_requests
for each row execute function private.github_app_guard_approval_transition();

drop trigger if exists github_app_approval_updated_at on public.github_app_approval_requests;
create trigger github_app_approval_updated_at
before update on public.github_app_approval_requests
for each row execute function private.github_app_set_updated_at();

alter table public.github_app_approval_requests enable row level security;
alter table public.github_app_webhook_events enable row level security;
alter table public.github_app_audit_log enable row level security;

revoke all on public.github_app_approval_requests from public, anon, authenticated;
revoke all on public.github_app_webhook_events from public, anon, authenticated;
revoke all on public.github_app_audit_log from public, anon, authenticated;

grant select, insert, update on public.github_app_approval_requests to authenticated;
grant all on public.github_app_approval_requests to service_role;
grant all on public.github_app_webhook_events to service_role;
grant all on public.github_app_audit_log to service_role;
grant usage, select on sequence public.github_app_audit_log_id_seq to service_role;
grant select on public.github_app_audit_log to authenticated;

drop policy if exists github_app_approvals_select on public.github_app_approval_requests;
create policy github_app_approvals_select
on public.github_app_approval_requests for select to authenticated
using (requested_by = (select auth.uid()) or (select private.is_github_master()));

drop policy if exists github_app_approvals_insert on public.github_app_approval_requests;
create policy github_app_approvals_insert
on public.github_app_approval_requests for insert to authenticated
with check (
  requested_by = (select auth.uid())
  and (select public.is_impulsionando_staff((select auth.uid())))
);

drop policy if exists github_app_approvals_update on public.github_app_approval_requests;
create policy github_app_approvals_update
on public.github_app_approval_requests for update to authenticated
using ((select private.is_github_master()))
with check ((select private.is_github_master()));

drop policy if exists github_app_audit_master_select on public.github_app_audit_log;
create policy github_app_audit_master_select
on public.github_app_audit_log for select to authenticated
using ((select private.is_github_master()));

-- The service-role-only RPC lets server runtimes retrieve two allow-listed
-- secrets from Vault without exposing the vault schema through PostgREST.
create or replace function public.get_github_app_vault_secret(_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_value text;
begin
  if _name not in ('GITHUB_APP_PRIVATE_KEY', 'GITHUB_APP_WEBHOOK_SECRET') then
    raise exception 'Secret name is not allow-listed';
  end if;

  select decrypted_secret
    into secret_value
    from vault.decrypted_secrets
   where name = _name
   limit 1;

  if secret_value is null then
    raise exception 'GitHub App secret is not configured';
  end if;
  return secret_value;
end;
$$;

revoke execute on function public.get_github_app_vault_secret(text)
  from public, anon, authenticated;
grant execute on function public.get_github_app_vault_secret(text) to service_role;

revoke execute on function private.is_github_master() from public, anon;
grant execute on function private.is_github_master() to authenticated, service_role;
revoke execute on function private.github_app_set_updated_at() from public, anon, authenticated, service_role;
revoke execute on function private.github_app_guard_approval_transition() from public, anon, authenticated, service_role;

insert into public.core_integrations (
  slug,
  name,
  environment,
  status,
  config,
  secret_refs,
  is_active
)
values (
  'github-app',
  'GitHub App — Impulsionito',
  'production',
  'not_configured',
  jsonb_build_object(
    'repository_allowlist', jsonb_build_array('raygsm/impulsionando'),
    'official_mcp_image', 'ghcr.io/github/github-mcp-server:v1.0.5',
    'mcp_read_only', true,
    'mcp_toolsets', jsonb_build_array('context', 'repos', 'issues', 'pull_requests', 'actions')
  ),
  jsonb_build_object(
    'private_key', 'GITHUB_APP_PRIVATE_KEY',
    'webhook_secret', 'GITHUB_APP_WEBHOOK_SECRET'
  ),
  true
)
on conflict (slug) do update set
  name = excluded.name,
  config = public.core_integrations.config || excluded.config,
  secret_refs = excluded.secret_refs,
  updated_at = now();
