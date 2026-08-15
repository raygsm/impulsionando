create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  severity text not null default 'info' check (severity = any(array['info','success','warning','critical'])),
  title text not null,
  message text not null,
  action_label text,
  action_url text,
  is_read boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at timestamptz
);
alter table public.notifications enable row level security;
grant select,insert,update,delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
drop policy if exists notifications_own_read on public.notifications;
create policy notifications_own_read on public.notifications for select to authenticated using(user_id=auth.uid() or public.is_impulsionando_staff(auth.uid()));
drop policy if exists notifications_own_insert on public.notifications;
create policy notifications_own_insert on public.notifications for insert to authenticated with check(user_id=auth.uid() or public.is_impulsionando_staff(auth.uid()));
drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications for update to authenticated using(user_id=auth.uid() or public.is_impulsionando_staff(auth.uid())) with check(user_id=auth.uid() or public.is_impulsionando_staff(auth.uid()));
drop policy if exists notifications_own_delete on public.notifications;
create policy notifications_own_delete on public.notifications for delete to authenticated using(user_id=auth.uid() or public.is_impulsionando_staff(auth.uid()));
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id,is_read,created_at desc);
comment on table public.notifications is 'Notificações in-app Core com isolamento por usuário; utilizada por alertas operacionais como SLA Marocas.';