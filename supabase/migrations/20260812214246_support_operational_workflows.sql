create sequence if not exists public.support_ticket_seq;

create or replace function public.support_next_ticket_code()
returns text
language sql
volatile
set search_path=public
as $$
  select 'IMP-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(nextval('public.support_ticket_seq')::text,6,'0')
$$;

alter table public.support_tickets add column if not exists ticket_code text;
update public.support_tickets set ticket_code=public.support_next_ticket_code() where ticket_code is null;
alter table public.support_tickets alter column ticket_code set default public.support_next_ticket_code();
alter table public.support_tickets alter column ticket_code set not null;
create unique index if not exists uq_support_ticket_code on public.support_tickets(ticket_code);

create or replace function public.support_create_ticket(
  p_company_id uuid,
  p_category text,
  p_priority text,
  p_subject text,
  p_description text,
  p_source_channel text default 'web'
)
returns jsonb
language plpgsql
security definer
set search_path='public','auth'
as $$
declare
  v_uid uuid:=auth.uid();
  v_ticket public.support_tickets%rowtype;
  v_sla public.support_sla_policies%rowtype;
  v_email text;
  v_first_due timestamptz;
  v_resolution_due timestamptz;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not public.user_belongs_to_company(v_uid,p_company_id) and not public.is_impulsionando_staff(v_uid) then raise exception 'not_authorized'; end if;
  if p_priority not in('low','normal','high','critical') then raise exception 'invalid_priority'; end if;
  if nullif(trim(p_subject),'') is null or char_length(trim(p_subject))>180 then raise exception 'invalid_subject'; end if;
  if nullif(trim(p_description),'') is null or char_length(trim(p_description))>10000 then raise exception 'invalid_description'; end if;

  select * into v_sla
  from public.support_sla_policies
  where active=true
    and priority=p_priority
    and (company_id=p_company_id or company_id=public.master_company_id())
  order by (company_id=p_company_id) desc
  limit 1;

  v_first_due:=now()+make_interval(mins=>coalesce(v_sla.first_response_minutes,240));
  v_resolution_due:=now()+make_interval(mins=>coalesce(v_sla.resolution_minutes,2880));

  insert into public.support_tickets(
    company_id,requester_user_id,category,priority,status,subject,description,source_channel,
    first_response_due_at,resolution_due_at,metadata
  ) values(
    p_company_id,v_uid,left(coalesce(nullif(trim(p_category),''),'other'),80),p_priority,'open',left(trim(p_subject),180),trim(p_description),left(coalesce(nullif(trim(p_source_channel),''),'web'),40),
    v_first_due,v_resolution_due,jsonb_build_object('sla_policy_id',v_sla.id)
  ) returning * into v_ticket;

  insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body,is_internal)
  values(v_ticket.id,v_uid,'customer',trim(p_description),false);

  select email into v_email from auth.users where id=v_uid;
  if v_email is not null then
    insert into public.message_outbox(
      company_id,event_code,channel,recipient_user_id,recipient_email,subject,body,payload,status,
      reference_type,reference_id,idempotency_key,correlation_id
    ) values(
      p_company_id,'support.ticket.created','email',v_uid,v_email,
      'Chamado '||v_ticket.ticket_code||' recebido',
      'Recebemos seu chamado '||v_ticket.ticket_code||': '||v_ticket.subject||'. Você poderá acompanhar as atualizações pela Central de Suporte.',
      jsonb_build_object('ticket_id',v_ticket.id,'ticket_code',v_ticket.ticket_code,'ticket_subject',v_ticket.subject),
      'queued','support_tickets',v_ticket.id::text,'support-created:'||v_ticket.id::text,'support:'||v_ticket.id::text
    ) on conflict do nothing;
  end if;

  insert into public.audit_logs(company_id,user_id,user_email,action,entity,entity_id,after,metadata,correlation_id)
  values(p_company_id,v_uid,v_email,'support.ticket.created','support_tickets',v_ticket.id::text,
    jsonb_build_object('ticket_code',v_ticket.ticket_code,'priority',v_ticket.priority,'category',v_ticket.category),
    jsonb_build_object('source_channel',v_ticket.source_channel),'support:'||v_ticket.id::text);

  return jsonb_build_object(
    'ticket_id',v_ticket.id,'ticket_code',v_ticket.ticket_code,'status',v_ticket.status,
    'first_response_due_at',v_ticket.first_response_due_at,'resolution_due_at',v_ticket.resolution_due_at
  );
end;
$$;
revoke all on function public.support_create_ticket(uuid,text,text,text,text,text) from public,anon;
grant execute on function public.support_create_ticket(uuid,text,text,text,text,text) to authenticated,service_role;

create or replace function public.support_staff_update_ticket(
  p_ticket_id uuid,
  p_status text default null,
  p_priority text default null,
  p_assigned_user_id uuid default null,
  p_public_message text default null,
  p_internal_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path='public','auth'
as $$
declare
  v_uid uuid:=auth.uid();
  v_ticket public.support_tickets%rowtype;
  v_requester_email text;
  v_new_status text;
begin
  if v_uid is null or not public.is_impulsionando_staff(v_uid) then raise exception 'not_authorized'; end if;
  select * into v_ticket from public.support_tickets where id=p_ticket_id for update;
  if v_ticket.id is null then raise exception 'ticket_not_found'; end if;

  if p_status is not null and p_status not in('open','waiting_customer','waiting_internal','resolved','closed','reopened') then raise exception 'invalid_status'; end if;
  if p_priority is not null and p_priority not in('low','normal','high','critical') then raise exception 'invalid_priority'; end if;
  v_new_status:=coalesce(p_status,v_ticket.status);

  update public.support_tickets set
    status=v_new_status,
    priority=coalesce(p_priority,priority),
    assigned_user_id=coalesce(p_assigned_user_id,assigned_user_id),
    first_response_at=case when first_response_at is null and nullif(trim(coalesce(p_public_message,'')),'') is not null then now() else first_response_at end,
    resolved_at=case when v_new_status='resolved' then coalesce(resolved_at,now()) when v_new_status in('open','reopened','waiting_customer','waiting_internal') then null else resolved_at end,
    closed_at=case when v_new_status='closed' then coalesce(closed_at,now()) when v_new_status<>'closed' then null else closed_at end,
    updated_at=now()
  where id=p_ticket_id
  returning * into v_ticket;

  if nullif(trim(coalesce(p_public_message,'')),'') is not null then
    insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body,is_internal)
    values(v_ticket.id,v_uid,'agent',left(trim(p_public_message),10000),false);
  end if;
  if nullif(trim(coalesce(p_internal_note,'')),'') is not null then
    insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body,is_internal)
    values(v_ticket.id,v_uid,'agent',left(trim(p_internal_note),10000),true);
  end if;

  select email into v_requester_email from auth.users where id=v_ticket.requester_user_id;
  if v_requester_email is not null and (nullif(trim(coalesce(p_public_message,'')),'') is not null or p_status is not null) then
    insert into public.message_outbox(
      company_id,event_code,channel,recipient_user_id,recipient_email,subject,body,payload,status,
      reference_type,reference_id,idempotency_key,correlation_id
    ) values(
      v_ticket.company_id,
      case when v_new_status in('resolved','closed') then 'support.ticket.resolved' else 'support.ticket.updated' end,
      'email',v_ticket.requester_user_id,v_requester_email,
      'Atualização no chamado '||v_ticket.ticket_code,
      coalesce(nullif(trim(p_public_message),''),'O status do chamado '||v_ticket.ticket_code||' foi atualizado para '||v_new_status||'.'),
      jsonb_build_object('ticket_id',v_ticket.id,'ticket_code',v_ticket.ticket_code,'status',v_new_status),
      'queued','support_tickets',v_ticket.id::text,
      'support-update:'||v_ticket.id::text||':'||extract(epoch from now())::bigint,
      'support:'||v_ticket.id::text
    );
  end if;

  insert into public.audit_logs(company_id,user_id,action,entity,entity_id,after,metadata,correlation_id)
  values(v_ticket.company_id,v_uid,'support.ticket.updated','support_tickets',v_ticket.id::text,
    jsonb_build_object('status',v_ticket.status,'priority',v_ticket.priority,'assigned_user_id',v_ticket.assigned_user_id),
    jsonb_build_object('public_message',nullif(trim(coalesce(p_public_message,'')),''),'has_internal_note',nullif(trim(coalesce(p_internal_note,'')),'') is not null),
    'support:'||v_ticket.id::text);

  return jsonb_build_object('ticket_id',v_ticket.id,'ticket_code',v_ticket.ticket_code,'status',v_ticket.status,'priority',v_ticket.priority);
end;
$$;
revoke all on function public.support_staff_update_ticket(uuid,text,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.support_staff_update_ticket(uuid,text,text,uuid,text,text) to service_role;