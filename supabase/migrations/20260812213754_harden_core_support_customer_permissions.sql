revoke update on public.support_tickets from authenticated;

drop policy if exists support_tickets_update on public.support_tickets;

drop policy if exists support_messages_insert on public.support_ticket_messages;
create policy support_messages_insert
on public.support_ticket_messages
for insert to authenticated
with check(
  author_user_id=(select auth.uid())
  and (
    (public.is_impulsionando_staff((select auth.uid())))
    or (
      author_type='customer'
      and is_internal=false
      and exists(
        select 1 from public.support_tickets t
        where t.id=ticket_id and t.requester_user_id=(select auth.uid())
      )
    )
  )
);

create or replace function public.support_customer_reopen_ticket(p_ticket_id uuid,p_message text default null)
returns jsonb
language plpgsql
security definer
set search_path='public','auth'
as $$
declare
  v_uid uuid:=auth.uid();
  v_ticket public.support_tickets%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_ticket from public.support_tickets where id=p_ticket_id for update;
  if v_ticket.id is null then raise exception 'ticket_not_found'; end if;
  if v_ticket.requester_user_id is distinct from v_uid and not public.is_impulsionando_staff(v_uid) then raise exception 'not_authorized'; end if;
  if v_ticket.status not in('resolved','closed') then raise exception 'ticket_not_closed'; end if;

  update public.support_tickets
  set status='reopened',resolved_at=null,closed_at=null,updated_at=now()
  where id=v_ticket.id;

  if nullif(trim(coalesce(p_message,'')),'') is not null then
    insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body,is_internal)
    values(v_ticket.id,v_uid,case when public.is_impulsionando_staff(v_uid) then 'agent' else 'customer' end,left(trim(p_message),10000),false);
  end if;

  insert into public.audit_logs(company_id,user_id,action,entity,entity_id,metadata)
  values(v_ticket.company_id,v_uid,'support.ticket.reopened','support_tickets',v_ticket.id::text,jsonb_build_object('source','customer_rpc'));

  return jsonb_build_object('ticket_id',v_ticket.id,'status','reopened');
end;
$$;
revoke all on function public.support_customer_reopen_ticket(uuid,text) from public,anon;
grant execute on function public.support_customer_reopen_ticket(uuid,text) to authenticated,service_role;