-- HOMOLOGACAO: billing checkout session RLS.
-- Allows a signed-in buyer to see only checkout sessions explicitly accepted by that same user.
-- Staff keeps operational visibility. Mutations remain server-side/staff controlled.

begin;

alter table public.billing_checkout_sessions enable row level security;

drop policy if exists billing_checkout_sessions_read on public.billing_checkout_sessions;
create policy billing_checkout_sessions_read
on public.billing_checkout_sessions
for select
to authenticated
using (
  public.is_impulsionando_staff(auth.uid())
  or accepted_user_id = auth.uid()
);

drop policy if exists billing_checkout_sessions_staff_write on public.billing_checkout_sessions;
create policy billing_checkout_sessions_staff_write
on public.billing_checkout_sessions
for all
to authenticated
using (public.is_impulsionando_staff(auth.uid()))
with check (public.is_impulsionando_staff(auth.uid()));

commit;
