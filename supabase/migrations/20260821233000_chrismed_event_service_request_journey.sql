create table if not exists public.chrismed_event_service_requests (
  id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
  company_id uuid not null references public.companies(id) on delete restrict default '642096b5-a9ff-4521-a82a-c004f6d2e2d2',
  organization_name text not null, organization_document text, contact_name text not null, contact_email text not null, contact_phone text not null,
  event_kind text not null, objective text, audience text, estimated_attendees integer, preferred_date_1 text, preferred_date_2 text, preferred_date_3 text,
  preferred_time_window text, location_mode text not null default 'to_define', city text, venue_or_address text, notes text,
  status text not null default 'received' check (status in ('received','in_review','contacted','proposal_sent','approved','scheduled','closed','rejected')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint chrismed_event_service_request_company check (company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'),
  constraint chrismed_event_service_request_attendees check (estimated_attendees is null or estimated_attendees between 1 and 100000)
);
alter table public.chrismed_event_service_requests enable row level security;
revoke all on public.chrismed_event_service_requests from public, anon, authenticated;
grant all on public.chrismed_event_service_requests to service_role;
drop policy if exists chrismed_event_service_requests_staff_read on public.chrismed_event_service_requests;
create policy chrismed_event_service_requests_staff_read on public.chrismed_event_service_requests for select to authenticated using (public.is_impulsionando_staff((select auth.uid())));

create or replace function public.submit_chrismed_event_service_request(p_request jsonb) returns uuid
language plpgsql
security definer
set search_path='pg_catalog','public'
as $$
declare v_id uuid; v_request_id uuid; v_email text; v_kind text; v_attendees integer; v_payload jsonb;
begin
  v_request_id:=nullif(p_request->>'requestId','')::uuid; v_email:=lower(trim(p_request->>'email')); v_kind:=lower(trim(p_request->>'eventKind'));
  v_attendees:=nullif(regexp_replace(coalesce(p_request->>'attendees',''),'[^0-9]','','g'),'')::integer;
  if v_request_id is null then raise exception 'invalid event request'; end if;
  if char_length(trim(p_request->>'organization')) not between 2 and 180 or char_length(trim(p_request->>'contactName')) not between 2 and 180 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(trim(p_request->>'phone')) not between 8 and 40 or char_length(v_kind) not between 2 and 80 then raise exception 'required event contact data is invalid'; end if;
  if v_attendees is not null and (v_attendees<1 or v_attendees>100000) then raise exception 'invalid attendees'; end if;
  insert into public.chrismed_event_service_requests(request_id,organization_name,organization_document,contact_name,contact_email,contact_phone,event_kind,objective,audience,estimated_attendees,preferred_date_1,preferred_date_2,preferred_date_3,preferred_time_window,location_mode,city,venue_or_address,notes)
  values(v_request_id,trim(p_request->>'organization'),nullif(trim(p_request->>'document'),''),trim(p_request->>'contactName'),v_email,trim(p_request->>'phone'),v_kind,nullif(left(trim(p_request->>'objective'),2000),''),nullif(left(trim(p_request->>'audience'),1000),''),v_attendees,nullif(trim(p_request->>'date1'),''),nullif(trim(p_request->>'date2'),''),nullif(trim(p_request->>'date3'),''),nullif(trim(p_request->>'timeWindow'),''),coalesce(nullif(trim(p_request->>'locationMode'),''),'to_define'),nullif(trim(p_request->>'city'),''),nullif(left(trim(p_request->>'venue'),1000),''),nullif(left(trim(p_request->>'notes'),4000),'')) on conflict(request_id) do update set request_id=excluded.request_id returning id into v_id;
  v_payload:=jsonb_build_object('request_id',v_request_id,'event_request_id',v_id,'organization',trim(p_request->>'organization'),'contact_name',trim(p_request->>'contactName'),'contact_email',v_email,'contact_phone',trim(p_request->>'phone'),'event_kind',v_kind,'estimated_attendees',v_attendees,'preferred_date_1',nullif(trim(p_request->>'date1'),''),'preferred_date_2',nullif(trim(p_request->>'date2'),''),'preferred_date_3',nullif(trim(p_request->>'date3'),''),'received_at',now());
  insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key) values('642096b5-a9ff-4521-a82a-c004f6d2e2d2','event_service_request_management','email','sac@chrismed.com.br',v_payload,'event-service:'||v_request_id||':management:email') on conflict(idempotency_key) do nothing;
  insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key) values('642096b5-a9ff-4521-a82a-c004f6d2e2d2','event_service_request_received','email',v_email,v_payload,'event-service:'||v_request_id||':received:email') on conflict(idempotency_key) do nothing;
  return v_id;
end $$;
revoke all on function public.submit_chrismed_event_service_request(jsonb) from public;
grant execute on function public.submit_chrismed_event_service_request(jsonb) to anon,authenticated,service_role;
