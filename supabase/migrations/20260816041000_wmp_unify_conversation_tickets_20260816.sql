drop policy if exists wmp_export_requests_select_own on public.wmp_conversation_export_requests;
create policy wmp_export_requests_select_own on public.wmp_conversation_export_requests
for select to authenticated
using (
  exists (
    select 1
    from public.communication_contacts c
    join public.communication_conversation_tickets t
      on t.contact_id=c.id
     and t.conversation_id=wmp_conversation_export_requests.conversation_id
     and t.tenant_id=wmp_conversation_export_requests.tenant_id
    where c.id=wmp_conversation_export_requests.contact_id
      and c.user_id=auth.uid()
  )
);
drop table public.wmp_conversation_tickets;
