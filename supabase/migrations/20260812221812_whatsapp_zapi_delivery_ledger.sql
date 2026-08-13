alter table public.message_outbox add column if not exists external_message_id text;
create index if not exists idx_message_outbox_external_message_id on public.message_outbox(external_message_id) where external_message_id is not null;

create table if not exists public.whatsapp_message_events (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid references public.message_outbox(id) on delete set null,
  external_id text not null,
  phone text,
  status text not null,
  error_code text,
  error_message text,
  instance_id text,
  momment timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_whatsapp_message_events_external on public.whatsapp_message_events(external_id,created_at desc);
create index if not exists idx_whatsapp_message_events_instance on public.whatsapp_message_events(instance_id,created_at desc);
create index if not exists idx_whatsapp_message_events_outbox on public.whatsapp_message_events(outbox_id);
alter table public.whatsapp_message_events enable row level security;
revoke all on public.whatsapp_message_events from anon,authenticated;
grant all on public.whatsapp_message_events to service_role;