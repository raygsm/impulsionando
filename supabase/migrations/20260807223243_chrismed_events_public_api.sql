drop policy if exists chrismed_events_deny_client_access on public.chrismed_events;

create policy chrismed_events_public_read
on public.chrismed_events for select to anon, authenticated
using (status = 'published');

grant select on public.chrismed_events to anon, authenticated;
grant execute on function public.chrismed_register_event(uuid,text,text,text,integer,text) to anon, authenticated;
