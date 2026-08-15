-- Universal conversation protocol/export foundation for all Impulsionando agents.
create sequence if not exists public.communication_conversation_ticket_seq;

create or replace function public.communication_next_conversation_protocol()
returns text language sql volatile set search_path=public as $$
  select 'IMP-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(nextval('public.communication_conversation_ticket_seq')::text,6,'0')
$$;
revoke all on function public.communication_next_conversation_protocol() from public,anon,authenticated;
grant execute on function public.communication_next_conversation_protocol() to service_role;

create table if not exists public.communication_conversation_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  agent_id uuid not null references public.communication_agents(id) on delete cascade,
  conversation_id uuid not null references public.communication_conversations(id) on delete cascade,
  contact_id uuid not null references public.communication_contacts(id) on delete cascade,
  protocol text not null unique default public.communication_next_conversation_protocol(),
  access_token uuid not null unique default gen_random_uuid(),
  access_expires_at timestamptz not null default (now()+interval '7 days'),
  export_status text not null default 'NOT_REQUESTED' check(export_status in('NOT_REQUESTED','OFFERED','REQUESTED','QUEUED','SENT','DECLINED','FAILED')),
  lead_capture_status text not null default 'ANONYMOUS' check(lead_capture_status in('ANONYMOUS','PENDING','CAPTURED')),
  privacy_consent_version text,
  privacy_consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,conversation_id)
);
create index if not exists communication_conversation_tickets_contact_idx on public.communication_conversation_tickets(tenant_id,contact_id,created_at desc);
alter table public.communication_conversation_tickets enable row level security;
revoke all on public.communication_conversation_tickets from public,anon,authenticated;
grant all on public.communication_conversation_tickets to service_role;

create table if not exists public.communication_conversation_export_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.communication_conversation_tickets(id) on delete cascade,
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  contact_id uuid not null references public.communication_contacts(id) on delete cascade,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  optional_data jsonb not null default '{}'::jsonb,
  consent_version text not null,
  consented_at timestamptz not null default now(),
  requested_at timestamptz not null default now(),
  sent_at timestamptz,
  status text not null default 'REQUESTED' check(status in('REQUESTED','QUEUED','SENT','FAILED','CANCELLED')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.communication_conversation_export_requests enable row level security;
revoke all on public.communication_conversation_export_requests from public,anon,authenticated;
grant all on public.communication_conversation_export_requests to service_role;

create or replace function public.communication_ensure_conversation_ticket(p_conversation_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_conv public.communication_conversations%rowtype; v_ticket public.communication_conversation_tickets%rowtype;
begin
  select * into v_conv from public.communication_conversations where id=p_conversation_id;
  if v_conv.id is null then raise exception 'conversation_not_found'; end if;
  insert into public.communication_conversation_tickets(tenant_id,agent_id,conversation_id,contact_id)
  values(v_conv.tenant_id,v_conv.agent_id,v_conv.id,v_conv.contact_id)
  on conflict (tenant_id,conversation_id) do update set updated_at=now()
  returning * into v_ticket;
  return jsonb_build_object('ticket_id',v_ticket.id,'protocol',v_ticket.protocol,'access_token',v_ticket.access_token,'access_expires_at',v_ticket.access_expires_at,'export_status',v_ticket.export_status,'lead_capture_status',v_ticket.lead_capture_status);
end $$;
revoke all on function public.communication_ensure_conversation_ticket(uuid) from public,anon,authenticated;
grant execute on function public.communication_ensure_conversation_ticket(uuid) to service_role;

create or replace function public.communication_register_conversation_export(
  p_protocol text,p_access_token uuid,p_full_name text,p_email text,p_whatsapp text,p_optional jsonb default '{}'::jsonb,p_consent_version text default 'privacy-v1'
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_ticket public.communication_conversation_tickets%rowtype; v_req public.communication_conversation_export_requests%rowtype; v_email text:=lower(trim(p_email)); v_phone text:=regexp_replace(coalesce(p_whatsapp,''),'[^0-9+]','','g');
begin
  select * into v_ticket from public.communication_conversation_tickets where protocol=p_protocol and access_token=p_access_token and access_expires_at>now() for update;
  if v_ticket.id is null then raise exception 'invalid_or_expired_conversation_access'; end if;
  if char_length(trim(coalesce(p_full_name,'')))<3 then raise exception 'invalid_full_name'; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_email'; end if;
  if char_length(v_phone)<10 then raise exception 'invalid_whatsapp'; end if;
  update public.communication_contacts set display_name=trim(p_full_name),attributes=coalesce(attributes,'{}'::jsonb)||jsonb_build_object('lead_capture_status','CAPTURED','captured_at',now(),'email',v_email,'whatsapp',v_phone,'optional',coalesce(p_optional,'{}'::jsonb)),updated_at=now() where id=v_ticket.contact_id;
  insert into public.communication_contact_identities(contact_id,tenant_id,channel,provider,external_user_id,normalized_address,verified,metadata)
    values(v_ticket.contact_id,v_ticket.tenant_id,'email','lead_capture',v_email,v_email,false,jsonb_build_object('source','conversation_export')) on conflict do nothing;
  insert into public.communication_contact_identities(contact_id,tenant_id,channel,provider,external_user_id,normalized_address,verified,metadata)
    values(v_ticket.contact_id,v_ticket.tenant_id,'whatsapp','lead_capture',v_phone,v_phone,false,jsonb_build_object('source','conversation_export')) on conflict do nothing;
  insert into public.communication_conversation_export_requests(ticket_id,tenant_id,contact_id,full_name,email,whatsapp,optional_data,consent_version)
  values(v_ticket.id,v_ticket.tenant_id,v_ticket.contact_id,trim(p_full_name),v_email,v_phone,coalesce(p_optional,'{}'::jsonb),p_consent_version)
  on conflict(ticket_id) do update set full_name=excluded.full_name,email=excluded.email,whatsapp=excluded.whatsapp,optional_data=excluded.optional_data,consent_version=excluded.consent_version,consented_at=now(),requested_at=now(),status='REQUESTED',updated_at=now()
  returning * into v_req;
  update public.communication_conversation_tickets set export_status='REQUESTED',lead_capture_status='CAPTURED',privacy_consent_version=p_consent_version,privacy_consented_at=now(),updated_at=now() where id=v_ticket.id;
  update public.communication_conversations set journey_key='lead_captured',context=coalesce(context,'{}'::jsonb)||jsonb_build_object('lead_captured',true,'lead_capture_source','conversation_export','lead_captured_at',now()),updated_at=now() where id=v_ticket.conversation_id;
  return jsonb_build_object('ok',true,'request_id',v_req.id,'protocol',v_ticket.protocol,'status',v_req.status);
end $$;
revoke all on function public.communication_register_conversation_export(text,uuid,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.communication_register_conversation_export(text,uuid,text,text,text,jsonb,text) to service_role;