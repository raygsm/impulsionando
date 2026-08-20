-- Queued dunning rows are created before actual delivery. sent_at must therefore
-- remain nullable until the communication worker confirms dispatch.
alter table public.billing_dunning_runs
  alter column sent_at drop not null;

comment on column public.billing_dunning_runs.sent_at is
  'Timestamp of confirmed dispatch; NULL while status is queued/pending.';
