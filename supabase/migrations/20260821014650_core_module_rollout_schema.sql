-- Version Core module rollout objects required by later notification functions.

create table if not exists public.core_module_versions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  version text not null,
  summary text not null default '',
  change_type text not null default 'MINOR',
  status text not null default 'DRAFT',
  metadata jsonb not null default '{}'::jsonb,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id, version)
);

create table if not exists public.core_module_rollouts (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references public.core_module_versions(id) on delete cascade,
  status text not null default 'PENDING',
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.core_module_rollout_targets (
  id uuid primary key default gen_random_uuid(),
  rollout_id uuid not null references public.core_module_rollouts(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status text not null default 'PENDING',
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(rollout_id, company_id)
);

create table if not exists public.core_module_update_notifications (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references public.core_module_versions(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  tenant_id uuid references public.communication_tenants(id) on delete set null,
  module_id uuid not null references public.modules(id) on delete cascade,
  rollout_target_id uuid references public.core_module_rollout_targets(id) on delete set null,
  recipient_email text,
  recipient_name text,
  subject text not null,
  body_text text not null,
  learn_more_url text,
  status text not null default 'PENDING',
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_version_id, company_id)
);

create index if not exists idx_core_module_rollouts_version on public.core_module_rollouts(module_version_id);
create index if not exists idx_core_module_rollout_targets_company on public.core_module_rollout_targets(company_id);
create index if not exists idx_core_module_notifications_status on public.core_module_update_notifications(status, created_at);

alter table public.core_module_versions enable row level security;
alter table public.core_module_rollouts enable row level security;
alter table public.core_module_rollout_targets enable row level security;
alter table public.core_module_update_notifications enable row level security;

grant select on public.core_module_versions, public.core_module_rollouts, public.core_module_rollout_targets, public.core_module_update_notifications to authenticated;
grant all on public.core_module_versions, public.core_module_rollouts, public.core_module_rollout_targets, public.core_module_update_notifications to service_role;
