begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create type public.communication_message_status as enum (
  'PENDING','SCHEDULED','PROCESSING','SENT','DELIVERED','OPENED','CLICKED',
  'BOUNCED','COMPLAINED','FAILED','CANCELLED','SUPPRESSED','EXPIRED',
  'RETRYING','DEAD_LETTER'
);
create type public.communication_template_status as enum ('DRAFT','PUBLISHED','DEPRECATED');
create type public.communication_approval_status as enum ('PENDING','APPROVED','REJECTED');
create type public.communication_category as enum (
  'SECURITY','ACCOUNT','BILLING','SCHEDULING','SERVICE','SUPPORT','SURVEY',
  'NEWS','MARKETING','OPERATIONS'
);

create table public.communication_tenants (
  id uuid primary key default gen_random_uuid(), parent_id uuid references public.communication_tenants(id),
  kind text not null check (kind in ('GLOBAL','NICHE','COMPANY','BRAND','UNIT','PROJECT')), slug text not null unique,
  legal_name text, display_name text not null, locale text not null default 'pt-BR', timezone text not null default 'America/Sao_Paulo',
  settings jsonb not null default '{}'::jsonb, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.communication_tenant_members (
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','EDITOR','OPERATOR','AUDITOR','VIEWER')),
  created_at timestamptz not null default now(), primary key (tenant_id, user_id)
);
create table public.communication_brands (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  name text not null, logo_url text, primary_color text, secondary_color text, domain text, privacy_url text, terms_url text,
  support_url text, footer_html text, legal_text text, hide_impulsionando_brand boolean not null default false,
  settings jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.communication_provider_accounts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  provider text not null, secret_reference text not null, config jsonb not null default '{}'::jsonb,
  active boolean not null default true, created_at timestamptz not null default now(), unique (tenant_id, provider)
);
create table public.communication_senders (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  brand_id uuid references public.communication_brands(id), name text not null, email text not null, reply_to text,
  return_path text, domain text not null, provider_account_id uuid references public.communication_provider_accounts(id),
  dns_status jsonb not null default '{}'::jsonb, verified_at timestamptz, active boolean not null default true,
  created_at timestamptz not null default now(), unique (tenant_id, email)
);
create table public.communication_agents (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  brand_id uuid references public.communication_brands(id), name text not null, avatar_url text, signature text, role text,
  reply_route text, default_cta jsonb, disclaimer text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.communication_recipients (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  external_id text, user_id uuid references auth.users(id), email text not null, display_name text, locale text, timezone text,
  attributes jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz, unique (tenant_id, email)
);
create table public.communication_templates (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  brand_id uuid references public.communication_brands(id), parent_template_id uuid references public.communication_templates(id),
  template_key text not null, event_type text not null, channel text not null default 'EMAIL' check (channel = 'EMAIL'),
  category public.communication_category not null, locale text not null default 'pt-BR',
  status public.communication_template_status not null default 'DRAFT', current_version integer,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz, unique (tenant_id, template_key, locale)
);
create table public.communication_template_versions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  template_id uuid not null references public.communication_templates(id) on delete cascade,
  version integer not null check (version > 0), subject_template text not null, preheader_template text,
  html_template text not null, text_template text not null, variables_schema jsonb not null default '{}'::jsonb,
  required_variables text[] not null default '{}', optional_variables text[] not null default '{}',
  fallback_values jsonb not null default '{}'::jsonb, approval_status public.communication_approval_status not null default 'PENDING',
  created_by uuid references auth.users(id), approved_by uuid references auth.users(id), created_at timestamptz not null default now(),
  published_at timestamptz, deprecated_at timestamptz, unique (template_id, version)
);
create table public.communication_template_blocks (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  brand_id uuid references public.communication_brands(id), block_key text not null, version integer not null default 1,
  html_template text not null, text_template text not null, variables_schema jsonb not null default '{}'::jsonb,
  active boolean not null default true, created_at timestamptz not null default now(), unique (tenant_id, block_key, version)
);
create table public.communication_events (
  id uuid primary key default gen_random_uuid(), event_id uuid not null default gen_random_uuid(), event_type text not null,
  event_version integer not null default 1, tenant_id uuid not null references public.communication_tenants(id), company_id uuid,
  brand_id uuid references public.communication_brands(id), unit_id uuid, project_id uuid, user_id uuid,
  recipient_id uuid references public.communication_recipients(id), actor_id uuid, entity_type text, entity_id text,
  agent_id uuid references public.communication_agents(id), channel text not null default 'EMAIL',
  priority smallint not null default 5 check (priority between 1 and 9), locale text, timezone text,
  occurred_at timestamptz not null, scheduled_for timestamptz, correlation_id text not null, idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb, payload jsonb not null, source text not null,
  environment text not null check (environment in ('development','staging','production')),
  received_at timestamptz not null default now(), processed_at timestamptz, unique (tenant_id, source, idempotency_key)
);
create table public.communication_messages (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  event_id uuid not null references public.communication_events(id), recipient_id uuid not null references public.communication_recipients(id),
  template_version_id uuid references public.communication_template_versions(id), brand_id uuid references public.communication_brands(id),
  sender_id uuid references public.communication_senders(id), agent_id uuid references public.communication_agents(id),
  category public.communication_category not null, status public.communication_message_status not null default 'PENDING',
  priority smallint not null default 5 check (priority between 1 and 9), subject text, preheader text, html_body text, text_body text,
  render_context jsonb not null default '{}'::jsonb, scheduled_for timestamptz, locked_at timestamptz, locked_by text,
  attempt_count integer not null default 0, max_attempts integer not null default 5, provider_message_id text,
  expires_at timestamptz, cancel_reason text, sent_at timestamptz, delivered_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (event_id, recipient_id)
);
create table public.communication_preferences (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  recipient_id uuid not null references public.communication_recipients(id), category public.communication_category not null,
  email_enabled boolean not null default true, updated_at timestamptz not null default now(), unique (tenant_id, recipient_id, category)
);
create table public.communication_consents (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  recipient_id uuid not null references public.communication_recipients(id), category public.communication_category not null,
  purpose text not null, granted boolean not null, source text not null, terms_version text, ip_hash text,
  occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);
create table public.communication_suppressions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  recipient_id uuid references public.communication_recipients(id), email_hash text not null,
  scope text not null check (scope in ('TENANT','GLOBAL')), reason text not null check (reason in ('HARD_BOUNCE','COMPLAINT','UNSUBSCRIBE','MANUAL','LEGAL')),
  category public.communication_category, created_at timestamptz not null default now(), expires_at timestamptz,
  unique (tenant_id, email_hash, reason, category)
);
create table public.communication_deliveries (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  message_id uuid not null references public.communication_messages(id) on delete cascade, provider text not null,
  provider_message_id text, status public.communication_message_status not null, response_code text,
  response_metadata jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now()
);
create table public.communication_interactions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  message_id uuid not null references public.communication_messages(id) on delete cascade,
  kind text not null check (kind in ('OPEN','CLICK','REPLY','UNSUBSCRIBE','CONVERSION')),
  target_url text, metadata jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now()
);
create table public.communication_failures (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  message_id uuid references public.communication_messages(id), event_id uuid references public.communication_events(id),
  stage text not null, error_code text not null, error_message text not null, retryable boolean not null default false,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), resolved_at timestamptz
);
create table public.communication_retries (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  message_id uuid not null references public.communication_messages(id) on delete cascade, attempt integer not null,
  scheduled_for timestamptz not null, started_at timestamptz, completed_at timestamptz, outcome text,
  created_at timestamptz not null default now(), unique (message_id, attempt)
);
create table public.communication_provider_events (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.communication_tenants(id), provider text not null,
  provider_event_id text not null, provider_message_id text, event_type text not null, payload jsonb not null,
  signature_valid boolean not null, received_at timestamptz not null default now(), processed_at timestamptz,
  unique (provider, provider_event_id)
);
create table public.communication_automations (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id), automation_key text not null,
  version integer not null default 1, n8n_workflow_id text, status text not null check (status in ('DRAFT','ACTIVE','PAUSED','DISABLED')),
  config jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, automation_key, version)
);
create table public.communication_workflow_runs (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id),
  automation_id uuid not null references public.communication_automations(id), event_id uuid references public.communication_events(id),
  correlation_id text not null, n8n_execution_id text, status text not null check (status in ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  started_at timestamptz, finished_at timestamptz, error jsonb, created_at timestamptz not null default now()
);
create table public.communication_audit_logs (
  id bigint generated always as identity primary key, tenant_id uuid references public.communication_tenants(id), actor_id uuid,
  actor_type text not null, action text not null, entity_type text not null, entity_id text, correlation_id text,
  before_data jsonb, after_data jsonb, ip_hash text, created_at timestamptz not null default now()
);

create index communication_events_due_idx on public.communication_events (scheduled_for, priority) where processed_at is null;
create index communication_events_correlation_idx on public.communication_events (tenant_id, correlation_id);
create index communication_messages_queue_idx on public.communication_messages (status, scheduled_for, priority, created_at) where status in ('PENDING','SCHEDULED','RETRYING');
create index communication_messages_provider_idx on public.communication_messages (provider_message_id) where provider_message_id is not null;
create index communication_deliveries_message_idx on public.communication_deliveries (message_id, occurred_at desc);
create index communication_interactions_message_idx on public.communication_interactions (message_id, occurred_at desc);
create index communication_failures_open_idx on public.communication_failures (tenant_id, created_at desc) where resolved_at is null;
create index communication_audit_tenant_idx on public.communication_audit_logs (tenant_id, created_at desc);
create index communication_members_user_idx on public.communication_tenant_members (user_id, tenant_id);

create or replace function private.is_tenant_member(target_tenant uuid, allowed_roles text[] default null)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.communication_tenant_members m where m.tenant_id = target_tenant
      and m.user_id = (select auth.uid()) and (allowed_roles is null or m.role = any(allowed_roles))
  );
$$;
revoke all on function private.is_tenant_member(uuid, text[]) from public, anon;
grant execute on function private.is_tenant_member(uuid, text[]) to authenticated, service_role;
create or replace function private.set_updated_at() returns trigger language plpgsql set search_path = pg_catalog as $$
begin new.updated_at = now(); return new; end; $$;
revoke all on function private.set_updated_at() from public, anon, authenticated;
do $$ declare t text; begin foreach t in array array['communication_tenants','communication_brands','communication_agents','communication_recipients','communication_templates','communication_messages','communication_preferences','communication_automations'] loop
  execute format('create trigger %I before update on public.%I for each row execute function private.set_updated_at()', t || '_updated_at', t);
end loop; end $$;
create or replace function public.communication_claim_messages(worker_name text, batch_size integer default 25)
returns setof public.communication_messages language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if current_user not in ('service_role','postgres') then raise exception 'not authorized'; end if;
  return query with picked as (
    select m.id from public.communication_messages m where m.status in ('PENDING','SCHEDULED','RETRYING')
      and coalesce(m.scheduled_for, m.created_at) <= now() and (m.expires_at is null or m.expires_at > now())
    order by m.priority asc, coalesce(m.scheduled_for, m.created_at), m.created_at for update skip locked
    limit greatest(1, least(batch_size, 100))
  ) update public.communication_messages m set status='PROCESSING', locked_at=now(), locked_by=worker_name,
      attempt_count=attempt_count+1, updated_at=now() from picked where m.id=picked.id returning m.*;
end; $$;
revoke all on function public.communication_claim_messages(text, integer) from public, anon, authenticated;
grant execute on function public.communication_claim_messages(text, integer) to service_role;
create or replace function public.communication_metrics(target_tenant uuid, from_at timestamptz, to_at timestamptz)
returns table(status public.communication_message_status, total bigint) language sql stable security invoker set search_path=pg_catalog,public as $$
  select m.status, count(*) from public.communication_messages m where m.tenant_id=target_tenant and m.created_at>=from_at and m.created_at<to_at group by m.status;
$$;
do $$ declare t text; begin foreach t in array array['communication_tenants','communication_tenant_members','communication_brands','communication_senders','communication_agents','communication_recipients','communication_templates','communication_template_versions','communication_template_blocks','communication_events','communication_messages','communication_preferences','communication_consents','communication_suppressions','communication_deliveries','communication_interactions','communication_failures','communication_retries','communication_provider_accounts','communication_provider_events','communication_automations','communication_workflow_runs','communication_audit_logs'] loop
  execute format('alter table public.%I enable row level security', t); execute format('revoke all on public.%I from anon', t);
  execute format('grant select, insert, update, delete on public.%I to authenticated', t); execute format('grant all on public.%I to service_role', t);
end loop; end $$;
create policy tenants_select on public.communication_tenants for select to authenticated using (private.is_tenant_member(id));
create policy tenants_update on public.communication_tenants for update to authenticated using (private.is_tenant_member(id,array['OWNER','ADMIN'])) with check (private.is_tenant_member(id,array['OWNER','ADMIN']));
create policy members_select on public.communication_tenant_members for select to authenticated using (private.is_tenant_member(tenant_id));
create policy members_write on public.communication_tenant_members for all to authenticated using (private.is_tenant_member(tenant_id,array['OWNER','ADMIN'])) with check (private.is_tenant_member(tenant_id,array['OWNER','ADMIN']));
do $$ declare t text; begin foreach t in array array['communication_brands','communication_senders','communication_agents','communication_recipients','communication_templates','communication_template_versions','communication_template_blocks','communication_events','communication_messages','communication_preferences','communication_consents','communication_suppressions','communication_deliveries','communication_interactions','communication_failures','communication_retries','communication_provider_accounts','communication_provider_events','communication_automations','communication_workflow_runs','communication_audit_logs'] loop
  execute format('create policy %I on public.%I for select to authenticated using (private.is_tenant_member(tenant_id))',t||'_select',t);
  execute format('create policy %I on public.%I for insert to authenticated with check (private.is_tenant_member(tenant_id,array[''OWNER'',''ADMIN'',''EDITOR'',''OPERATOR'']))',t||'_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using (private.is_tenant_member(tenant_id,array[''OWNER'',''ADMIN'',''EDITOR'',''OPERATOR''])) with check (private.is_tenant_member(tenant_id,array[''OWNER'',''ADMIN'',''EDITOR'',''OPERATOR'']))',t||'_update',t);
end loop; end $$;
revoke delete on all tables in schema public from authenticated;
grant usage on schema public to authenticated, service_role;
grant usage on schema private to authenticated, service_role;
grant usage, select on all sequences in schema public to service_role;
grant usage, select on sequence public.communication_audit_logs_id_seq to authenticated;
commit;
