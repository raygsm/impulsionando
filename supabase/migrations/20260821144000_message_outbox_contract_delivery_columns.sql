-- Version the durable outbox fields required by canonical contract delivery.
alter table public.message_outbox
  add column if not exists available_at timestamptz,
  add column if not exists idempotency_key text;

update public.message_outbox
set available_at = coalesce(available_at, scheduled_at, created_at, now())
where available_at is null;

alter table public.message_outbox
  alter column available_at set default now();

create unique index if not exists uq_message_outbox_idempotency
  on public.message_outbox(idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_message_outbox_available
  on public.message_outbox(status, available_at)
  where status in ('queued','retry');
