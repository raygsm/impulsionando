create or replace function public.chrismed_prepare_authenticated_conversation_export(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_req public.communication_conversation_export_requests%rowtype;
  v_ticket public.communication_conversation_tickets%rowtype;
  v_tenant uuid;
  v_transcript jsonb;
  v_text text;
  v_count integer;
begin
  if auth.role()<>'service_role' and not public.is_impulsionando_staff(auth.uid()) then
    raise exception 'not_authorized';
  end if;
  select id into v_tenant from public.communication_tenants where slug='chrismed' and active is true limit 1;
  if v_tenant is null then raise exception 'chrismed_tenant_not_found'; end if;
  select * into v_req from public.communication_conversation_export_requests
   where id=p_request_id and tenant_id=v_tenant and status='QUEUED' for update;
  if v_req.id is null then raise exception 'export_request_not_found_or_not_queued'; end if;
  if coalesce((v_req.metadata->>'authenticated_request')::boolean,false) is not true then raise exception 'authenticated_export_required'; end if;
  select * into v_ticket from public.communication_conversation_tickets
   where id=v_req.ticket_id and tenant_id=v_tenant and conversation_id=v_req.conversation_id;
  if v_ticket.id is null then raise exception 'ticket_not_found'; end if;

  select count(*),
    coalesce(jsonb_agg(jsonb_build_object(
      'occurred_at',m.occurred_at,'author_type',m.author_type,'direction',m.direction,
      'channel',m.channel,'body',coalesce(m.body_text,''),'message_type',m.message_type
    ) order by m.occurred_at,m.created_at),'[]'::jsonb),
    coalesce(string_agg(
      '['||to_char(m.occurred_at at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI')||'] '||
      case when m.author_type='agent' then 'Oliver/CHRISMED' when m.author_type='user' then 'Cliente' else coalesce(m.author_type,'Sistema') end||': '||coalesce(m.body_text,''),
      E'\n' order by m.occurred_at,m.created_at
    ),'')
  into v_count,v_transcript,v_text
  from public.communication_conversation_messages m
  where m.tenant_id=v_tenant and m.conversation_id=v_req.conversation_id;

  insert into public.chrismed_communication_outbox(
    company_id,event_code,channel,recipient,payload,idempotency_key,status,attempts,available_at,from_email,reply_to_email
  ) values(
    '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid,'CONVERSATION_EXPORT_AUTHENTICATED','email',lower(v_req.email),
    jsonb_build_object('export_request_id',v_req.id,'conversation_id',v_req.conversation_id,'ticket_id',v_ticket.id,
      'protocol',v_ticket.protocol,'full_name',v_req.full_name,'message_count',v_count,'transcript_text',v_text,
      'transcript',v_transcript,'requested_at',v_req.requested_at,
      'privacy_note','Exportação solicitada por usuário autenticado na área exclusiva CHRISMED.'),
    'chrismed-conversation-export:'||v_req.id::text,'pending',0,now(),'sac@chrismed.com.br','sac@chrismed.com.br'
  ) on conflict(idempotency_key) do nothing;

  update public.communication_conversation_export_requests
     set status='PROCESSING',metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('prepared_at',now(),'message_count',v_count)
   where id=v_req.id;
  update public.communication_conversation_tickets set export_status='PROCESSING',updated_at=now() where id=v_ticket.id;
  return jsonb_build_object('request_id',v_req.id,'protocol',v_ticket.protocol,'status','PROCESSING','message_count',v_count,'recipient',lower(v_req.email));
end;
$$;
revoke all on function public.chrismed_prepare_authenticated_conversation_export(uuid) from public,anon,authenticated;
grant execute on function public.chrismed_prepare_authenticated_conversation_export(uuid) to service_role;

create or replace function public.chrismed_mark_conversation_export_sent(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path=public,auth
as $$
declare v_ticket uuid;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  update public.communication_conversation_export_requests set status='SENT',sent_at=now(),last_error=null where id=p_request_id returning ticket_id into v_ticket;
  if v_ticket is not null then
    update public.communication_conversation_tickets set export_status='SENT',export_sent_at=now(),updated_at=now() where id=v_ticket;
  end if;
end;
$$;
revoke all on function public.chrismed_mark_conversation_export_sent(uuid) from public,anon,authenticated;
grant execute on function public.chrismed_mark_conversation_export_sent(uuid) to service_role;
