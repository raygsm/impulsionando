create table if not exists public.wmp_briefing_upload_tokens (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.wmp_briefings(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_count integer not null default 0 check (used_count >= 0 and used_count <= 8),
  max_files integer not null default 8 check (max_files between 1 and 8),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists wmp_briefing_upload_tokens_briefing_idx
  on public.wmp_briefing_upload_tokens(briefing_id, expires_at desc);

alter table public.wmp_briefing_upload_tokens enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wmp-briefing-evidence',
  'wmp-briefing-evidence',
  false,
  52428800,
  array['image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/webm','video/quicktime']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.wmp_briefing_upload_tokens is
  'Service-role-only ephemeral upload grants for private WMP briefing evidence.';
