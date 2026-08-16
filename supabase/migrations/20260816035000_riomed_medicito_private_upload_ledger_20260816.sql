create table if not exists public.riomed_medicito_uploads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid null references public.communication_conversations(id) on delete set null,
  session_hash text not null,
  object_path text not null unique,
  media_type text not null check (media_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 8388608),
  status text not null default 'uploaded' check (status in ('uploaded','consumed','expired','deleted','failed')),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_riomed_medicito_uploads_expiry on public.riomed_medicito_uploads(status,expires_at);
create index if not exists idx_riomed_medicito_uploads_session on public.riomed_medicito_uploads(tenant_id,session_hash,created_at desc);
create index if not exists idx_riomed_medicito_uploads_conversation on public.riomed_medicito_uploads(conversation_id) where conversation_id is not null;

alter table public.riomed_medicito_uploads enable row level security;
revoke all on table public.riomed_medicito_uploads from public,anon,authenticated;
grant select,insert,update,delete on table public.riomed_medicito_uploads to service_role;

create or replace function public.riomed_medicito_cleanup_expired_uploads()
returns table(object_path text)
language sql
security definer
set search_path to 'public','pg_temp'
as $function$
  update public.riomed_medicito_uploads
     set status='expired', updated_at=now()
   where status in ('uploaded','consumed') and expires_at <= now()
  returning object_path
$function$;
revoke all on function public.riomed_medicito_cleanup_expired_uploads() from public,anon,authenticated;
grant execute on function public.riomed_medicito_cleanup_expired_uploads() to service_role;
