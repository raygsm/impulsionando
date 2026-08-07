create policy chrismed_events_deny_client_access
on public.chrismed_events as restrictive for all to anon, authenticated
using (false) with check (false);

create policy chrismed_event_registrations_deny_client_access
on public.chrismed_event_registrations as restrictive for all to anon, authenticated
using (false) with check (false);
