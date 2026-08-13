create or replace function public.communication_ingest_inbound(
  p_agent_key text,
  p_channel text,
  p_provider text,
  p_external_user_id text,
  p_body_text text,
  p_provider_message_id text default null,
  p_endpoint_address text default null,
  p_display_name text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path='public','auth'
as $$
declare
  v_agent_id uuid;
  v_tenant_id uuid;
  v_contact_id uuid;
  v_conversation_id uuid;
  v_endpoint_id uuid;
  v_message_id uuid;
begin
  if nullif(btrim(p_agent_key),'') is null then raise exception 'agent_key_required'; end if;
  if nullif(btrim(p_channel),'') is null then raise exception 'channel_required'; end if;
  if nullif(btrim(p_external_user_id),'') is null then raise exception 'external_user_id_required'; end if;
  if nullif(btrim(p_body_text),'') is null then raise exception 'message_required'; end if;

  select r.agent_id,a.tenant_id into v_agent_id,v_tenant_id
  from public.communication_agent_runtime r
  join public.communication_agents a on a.id=r.agent_id
  where r.agent_key=p_agent_key and r.active=true and a.active=true;
  if v_agent_id is null then raise exception 'agent_not_found'; end if;

  if p_endpoint_address is not null then
    select e.id into v_endpoint_id
    from public.communication_channel_endpoints e
    where e.tenant_id=v_tenant_id and e.agent_id=v_agent_id and e.channel=p_channel and e.address=p_endpoint_address
    order by e.is_primary desc,e.created_at asc limit 1;
  else
    select e.id into v_endpoint_id
    from public.communication_channel_endpoints e
    where e.tenant_id=v_tenant_id and e.agent_id=v_agent_id and e.channel=p_channel
    order by (e.status='ACTIVE') desc,e.is_primary desc,e.created_at asc limit 1;
  end if;

  select i.contact_id into v_contact_id
  from public.communication_contact_identities i
  where i.tenant_id=v_tenant_id
    and i.channel=p_channel
    and i.provider=coalesce(nullif(p_provider,''),'unbound')
    and i.external_user_id=p_external_user_id;

  if v_contact_id is null then
    insert into public.communication_contacts(tenant_id,display_name,attributes)
    values(v_tenant_id,nullif(btrim(p_display_name),''),jsonb_build_object('first_channel',p_channel))
    returning id into v_contact_id;

    insert into public.communication_contact_identities(contact_id,tenant_id,channel,provider,external_user_id,metadata)
    values(v_contact_id,v_tenant_id,p_channel,coalesce(nullif(p_provider,''),'unbound'),p_external_user_id,coalesce(p_metadata,'{}'::jsonb));
  elsif nullif(btrim(p_display_name),'') is not null then
    update public.communication_contacts
    set display_name=coalesce(display_name,btrim(p_display_name)),updated_at=now()
    where id=v_contact_id;
  end if;

  select c.id into v_conversation_id
  from public.communication_conversations c
  where c.tenant_id=v_tenant_id and c.agent_id=v_agent_id and c.contact_id=v_contact_id
    and c.status in ('OPEN','WAITING_HUMAN','HUMAN')
  order by c.last_message_at desc nulls last,c.opened_at desc limit 1;

  if v_conversation_id is null then
    insert into public.communication_conversations(tenant_id,agent_id,contact_id,last_channel,last_message_at,context)
    values(v_tenant_id,v_agent_id,v_contact_id,p_channel,now(),jsonb_build_object('origin_channel',p_channel))
    returning id into v_conversation_id;
  else
    update public.communication_conversations
    set last_channel=p_channel,last_message_at=now(),updated_at=now()
    where id=v_conversation_id;
  end if;

  insert into public.communication_conversation_channels(conversation_id,endpoint_id,channel,provider,external_user_id,last_inbound_at,metadata)
  values(v_conversation_id,v_endpoint_id,p_channel,coalesce(nullif(p_provider,''),'unbound'),p_external_user_id,now(),coalesce(p_metadata,'{}'::jsonb))
  on conflict (conversation_id,channel,provider,external_user_id)
  do update set endpoint_id=coalesce(excluded.endpoint_id,public.communication_conversation_channels.endpoint_id),last_inbound_at=now(),active=true,metadata=public.communication_conversation_channels.metadata||excluded.metadata,updated_at=now();

  if p_provider_message_id is not null and v_endpoint_id is not null then
    select m.id into v_message_id
    from public.communication_conversation_messages m
    where m.endpoint_id=v_endpoint_id and m.provider_message_id=p_provider_message_id;
  end if;

  if v_message_id is null then
    insert into public.communication_conversation_messages(
      conversation_id,tenant_id,agent_id,contact_id,endpoint_id,channel,provider,direction,author_type,provider_message_id,body_text,content,status,occurred_at
    ) values(
      v_conversation_id,v_tenant_id,v_agent_id,v_contact_id,v_endpoint_id,p_channel,coalesce(nullif(p_provider,''),'unbound'),'INBOUND','CONTACT',p_provider_message_id,left(p_body_text,12000),coalesce(p_metadata,'{}'::jsonb),'RECEIVED',now()
    ) returning id into v_message_id;
  end if;

  return jsonb_build_object('agent_id',v_agent_id,'tenant_id',v_tenant_id,'contact_id',v_contact_id,'conversation_id',v_conversation_id,'message_id',v_message_id,'endpoint_id',v_endpoint_id);
end;
$$;

revoke all on function public.communication_ingest_inbound(text,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.communication_ingest_inbound(text,text,text,text,text,text,text,text,jsonb) to service_role;

create or replace function public.communication_record_outbound(
  p_conversation_id uuid,
  p_body_text text,
  p_channel text,
  p_provider text default 'unbound',
  p_provider_message_id text default null,
  p_endpoint_id uuid default null,
  p_status text default 'SENT',
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path='public','auth'
as $$
declare
  v_c public.communication_conversations%rowtype;
  v_id uuid;
begin
  if nullif(btrim(p_body_text),'') is null then raise exception 'message_required'; end if;
  select * into v_c from public.communication_conversations where id=p_conversation_id;
  if v_c.id is null then raise exception 'conversation_not_found'; end if;

  insert into public.communication_conversation_messages(
    conversation_id,tenant_id,agent_id,contact_id,endpoint_id,channel,provider,direction,author_type,provider_message_id,body_text,content,status,occurred_at
  ) values(
    v_c.id,v_c.tenant_id,v_c.agent_id,v_c.contact_id,p_endpoint_id,p_channel,coalesce(nullif(p_provider,''),'unbound'),'OUTBOUND','AGENT',p_provider_message_id,left(p_body_text,12000),coalesce(p_metadata,'{}'::jsonb),coalesce(nullif(p_status,''),'SENT'),now()
  ) returning id into v_id;

  update public.communication_conversations
  set last_channel=p_channel,last_message_at=now(),updated_at=now()
  where id=v_c.id;

  update public.communication_conversation_channels
  set last_outbound_at=now(),updated_at=now()
  where conversation_id=v_c.id and channel=p_channel and active=true;

  return v_id;
end;
$$;

revoke all on function public.communication_record_outbound(uuid,text,text,text,text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.communication_record_outbound(uuid,text,text,text,text,uuid,text,jsonb) to service_role;
