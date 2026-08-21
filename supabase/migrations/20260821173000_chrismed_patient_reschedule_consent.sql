-- CHRISMED management reschedule proposal with explicit patient consent.
-- Drag/drop in management creates a proposal only; appointment time changes only after acceptance.

create table if not exists public.chrismed_reschedule_proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  appointment_id uuid not null references public.chrismed_appointments(id) on delete cascade,
  proposed_by uuid not null references auth.users(id) on delete restrict,
  original_starts_at timestamptz not null,
  original_ends_at timestamptz not null,
  proposed_starts_at timestamptz not null,
  proposed_ends_at timestamptz not null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','expired','superseded','cancelled')),
  expires_at timestamptz not null default (now() + interval '72 hours'),
  accepted_at timestamptz,
  accepted_ip_hash text,
  accepted_user_agent text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chrismed_reschedule_company check (company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid),
  constraint chrismed_reschedule_range check (proposed_ends_at > proposed_starts_at)
);
create unique index if not exists uq_chrismed_reschedule_pending_appointment
  on public.chrismed_reschedule_proposals(appointment_id)
  where status='pending';
create index if not exists idx_chrismed_reschedule_pending_slot
  on public.chrismed_reschedule_proposals(appointment_id, proposed_starts_at)
  where status='pending';

alter table public.chrismed_reschedule_proposals enable row level security;
revoke all on public.chrismed_reschedule_proposals from public, anon, authenticated;
grant all on public.chrismed_reschedule_proposals to service_role;
create policy chrismed_reschedule_management_read
  on public.chrismed_reschedule_proposals for select to authenticated
  using (
    public.is_impulsionando_staff(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id=auth.uid()
        and ur.company_id=chrismed_reschedule_proposals.company_id
        and ur.role in ('admin','gestor')
    )
  );

drop function if exists public.chrismed_propose_appointment_reschedule(uuid,timestamptz,text);
create or replace function public.chrismed_propose_appointment_reschedule(
  p_appointment_id uuid,
  p_proposed_starts_at timestamptz,
  p_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public','extensions'
as $$
declare
  v_company constant uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  v_appt public.chrismed_appointments%rowtype;
  v_duration interval;
  v_end timestamptz;
  v_token text;
  v_hash text;
  v_proposal uuid;
  v_accept_url text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if not public.is_impulsionando_staff(auth.uid()) and not exists(
    select 1 from public.user_roles ur
    where ur.user_id=auth.uid() and ur.company_id=v_company and ur.role in ('admin','gestor')
  ) then raise exception 'not_authorized'; end if;

  select * into v_appt from public.chrismed_appointments
   where id=p_appointment_id and company_id=v_company for update;
  if not found then raise exception 'appointment_not_found'; end if;
  if v_appt.status <> 'confirmed' then raise exception 'only_confirmed_appointments_can_be_rescheduled'; end if;
  if p_proposed_starts_at <= now() + interval '30 minutes' then raise exception 'proposed_time_too_soon'; end if;

  v_duration := v_appt.ends_at-v_appt.starts_at;
  v_end := p_proposed_starts_at+v_duration;

  if exists(
    select 1 from public.chrismed_appointments a
    where a.id<>v_appt.id and a.professional_id=v_appt.professional_id
      and a.status in ('held','pending_payment','confirmed')
      and (a.status='confirmed' or a.hold_expires_at>now())
      and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(p_proposed_starts_at,v_end,'[)')
  ) then raise exception 'target_slot_unavailable'; end if;

  update public.chrismed_reschedule_proposals
     set status='superseded',updated_at=now()
   where appointment_id=v_appt.id and status='pending';

  v_token := encode(gen_random_bytes(32),'hex');
  v_hash := encode(extensions.digest(v_token,'sha256'),'hex');
  v_accept_url := 'https://chrismed.impulsionando.com.br/reagendamento/aceitar?token='||v_token;

  insert into public.chrismed_reschedule_proposals(
    company_id,appointment_id,proposed_by,original_starts_at,original_ends_at,
    proposed_starts_at,proposed_ends_at,token_hash,reason,metadata
  ) values (
    v_company,v_appt.id,auth.uid(),v_appt.starts_at,v_appt.ends_at,
    p_proposed_starts_at,v_end,v_hash,nullif(left(trim(coalesce(p_reason,'')),1000),''),
    jsonb_build_object('source','management_drag_drop','consent_required',true)
  ) returning id into v_proposal;

  insert into public.chrismed_communication_outbox(
    company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email
  ) values (
    v_company,'appointment_reschedule_proposed','email',v_appt.patient_email,
    jsonb_build_object(
      'proposal_id',v_proposal,'appointment_id',v_appt.id,'patient_name',v_appt.patient_name,
      'old_starts_at',v_appt.starts_at,'old_ends_at',v_appt.ends_at,
      'proposed_starts_at',p_proposed_starts_at,'proposed_ends_at',v_end,
      'accept_url',v_accept_url,'expires_at',now()+interval '72 hours',
      'message','Seu horário atual permanece confirmado. A mudança só acontecerá se você clicar em Aceitar novo horário.'
    ),
    'appointment:'||v_appt.id||':reschedule-proposal:'||v_proposal||':email','pending',now(),'sac@chrismed.com.br','sac@chrismed.com.br'
  ) on conflict(idempotency_key) do nothing;

  return jsonb_build_object('proposal_id',v_proposal,'status','pending','patient_email',v_appt.patient_email,'proposed_starts_at',p_proposed_starts_at,'proposed_ends_at',v_end,'expires_at',now()+interval '72 hours');
end;
$$;
revoke all on function public.chrismed_propose_appointment_reschedule(uuid,timestamptz,text) from public,anon;
grant execute on function public.chrismed_propose_appointment_reschedule(uuid,timestamptz,text) to authenticated,service_role;

drop function if exists public.chrismed_accept_appointment_reschedule(text,text,text);
create or replace function public.chrismed_accept_appointment_reschedule(
  p_token text,
  p_ip text default null,
  p_user_agent text default null
) returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public','extensions'
as $$
declare
  v_hash text;
  v_prop public.chrismed_reschedule_proposals%rowtype;
  v_appt public.chrismed_appointments%rowtype;
  v_ip_hash text;
begin
  if char_length(coalesce(p_token,'')) < 32 then raise exception 'invalid_token'; end if;
  v_hash := encode(extensions.digest(p_token,'sha256'),'hex');
  select * into v_prop from public.chrismed_reschedule_proposals
   where token_hash=v_hash for update;
  if not found then raise exception 'invalid_or_expired_link'; end if;
  if v_prop.status='accepted' then
    return jsonb_build_object('status','accepted','appointment_id',v_prop.appointment_id,'starts_at',v_prop.proposed_starts_at,'already_accepted',true);
  end if;
  if v_prop.status<>'pending' or v_prop.expires_at<=now() then
    if v_prop.status='pending' then update public.chrismed_reschedule_proposals set status='expired',updated_at=now() where id=v_prop.id; end if;
    raise exception 'invalid_or_expired_link';
  end if;

  select * into v_appt from public.chrismed_appointments where id=v_prop.appointment_id for update;
  if not found or v_appt.status<>'confirmed' then raise exception 'appointment_not_available'; end if;
  if v_appt.starts_at is distinct from v_prop.original_starts_at or v_appt.ends_at is distinct from v_prop.original_ends_at then
    update public.chrismed_reschedule_proposals set status='superseded',updated_at=now() where id=v_prop.id;
    raise exception 'appointment_changed_since_proposal';
  end if;
  if exists(
    select 1 from public.chrismed_appointments a
    where a.id<>v_appt.id and a.professional_id=v_appt.professional_id
      and a.status in ('held','pending_payment','confirmed')
      and (a.status='confirmed' or a.hold_expires_at>now())
      and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(v_prop.proposed_starts_at,v_prop.proposed_ends_at,'[)')
  ) then raise exception 'target_slot_no_longer_available'; end if;

  update public.chrismed_appointments
     set starts_at=v_prop.proposed_starts_at,
         ends_at=v_prop.proposed_ends_at,
         metadata=metadata||jsonb_build_object('patient_reschedule_consent',jsonb_build_object('proposal_id',v_prop.id,'accepted_at',now())),
         updated_at=now()
   where id=v_appt.id;

  v_ip_hash := case when nullif(trim(coalesce(p_ip,'')),'') is null then null else encode(extensions.digest(p_ip,'sha256'),'hex') end;
  update public.chrismed_reschedule_proposals
     set status='accepted',accepted_at=now(),accepted_ip_hash=v_ip_hash,
         accepted_user_agent=left(p_user_agent,1000),updated_at=now()
   where id=v_prop.id;

  insert into public.chrismed_communication_outbox(
    company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email
  ) values (
    v_appt.company_id,'appointment_reschedule_accepted','email',v_appt.patient_email,
    jsonb_build_object('proposal_id',v_prop.id,'appointment_id',v_appt.id,'patient_name',v_appt.patient_name,'starts_at',v_prop.proposed_starts_at,'ends_at',v_prop.proposed_ends_at,'appointment_url','https://chrismed.impulsionando.com.br/minha-conta'),
    'appointment:'||v_appt.id||':reschedule-accepted:'||v_prop.id||':email','pending',now(),'sac@chrismed.com.br','sac@chrismed.com.br'
  ) on conflict(idempotency_key) do nothing;

  return jsonb_build_object('status','accepted','appointment_id',v_appt.id,'starts_at',v_prop.proposed_starts_at,'ends_at',v_prop.proposed_ends_at);
end;
$$;
revoke all on function public.chrismed_accept_appointment_reschedule(text,text,text) from public;
grant execute on function public.chrismed_accept_appointment_reschedule(text,text,text) to anon,authenticated,service_role;
