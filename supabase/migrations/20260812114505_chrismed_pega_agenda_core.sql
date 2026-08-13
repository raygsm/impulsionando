-- CHRISMED Pega Agenda transactional core aligned with the current production schema.
create table if not exists public.agenda_professional_availability (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  professional_id uuid not null unique references public.agenda_professionals(id) on delete cascade,
  accepts_substitution boolean not null default false, min_notice_minutes integer not null default 30 check (min_notice_minutes between 0 and 10080),
  max_response_minutes integer not null default 15 check (max_response_minutes between 1 and 1440), metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint agenda_professional_availability_company check (company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid)
);
create table if not exists public.agenda_professional_terms (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  professional_id uuid not null references public.agenda_professionals(id) on delete cascade, terms_version text not null,
  accepted_at timestamptz not null default now(), revoked_at timestamptz, ip_hash text, user_agent text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), constraint agenda_professional_terms_company check (company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid)
);
-- June Agenda created a smaller contract. CREATE TABLE IF NOT EXISTS does not
-- add later columns, so clean replays must converge before indexes/functions.
alter table public.agenda_professional_terms add column if not exists revoked_at timestamptz;
alter table public.agenda_professional_terms add column if not exists ip_hash text;
alter table public.agenda_professional_terms add column if not exists metadata jsonb not null default '{}'::jsonb;
create unique index if not exists agenda_professional_terms_active_unique on public.agenda_professional_terms(professional_id,terms_version) where revoked_at is null;
create table if not exists public.agenda_professional_eligibility (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  professional_id uuid not null references public.agenda_professionals(id) on delete cascade, profession_id uuid, primary_area text,
  priority integer not null default 100, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint agenda_professional_eligibility_company check (company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid), unique(professional_id)
);
alter table public.agenda_professional_eligibility add column if not exists profession_id uuid;
alter table public.agenda_professional_eligibility add column if not exists primary_area text;
create unique index if not exists agenda_professional_eligibility_professional_unique on public.agenda_professional_eligibility(professional_id);
create table if not exists public.agenda_open_slots (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  origin text not null default 'cancellation' check (origin in ('cancellation','manual','substitution','emergency')),
  appointment_id uuid references public.chrismed_appointments(id) on delete set null, original_professional_id uuid references public.agenda_professionals(id) on delete set null,
  offering_id uuid references public.chrismed_service_offerings(id) on delete set null, profession_id uuid, primary_area text,
  starts_at timestamptz not null, ends_at timestamptz not null, status text not null default 'open' check(status in ('open','claimed','expired','cancelled')),
  claimed_by_professional_id uuid references public.agenda_professionals(id) on delete set null, claimed_at timestamptz, expires_at timestamptz not null,
  current_wave integer not null default 1, reason text, metadata jsonb not null default '{}'::jsonb, created_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint agenda_open_slots_company check(company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid), constraint agenda_open_slots_valid_range check(ends_at>starts_at)
);
alter table public.agenda_open_slots add column if not exists original_professional_id uuid references public.agenda_professionals(id) on delete set null;
alter table public.agenda_open_slots add column if not exists offering_id uuid references public.chrismed_service_offerings(id) on delete set null;
alter table public.agenda_open_slots add column if not exists profession_id uuid;
alter table public.agenda_open_slots add column if not exists primary_area text;
alter table public.agenda_open_slots add column if not exists reason text;
alter table public.agenda_open_slots drop constraint if exists agenda_open_slots_appointment_id_fkey;
alter table public.agenda_open_slots
  add constraint agenda_open_slots_appointment_id_fkey
  foreign key (appointment_id) references public.chrismed_appointments(id) on delete set null;
create index if not exists agenda_open_slots_status_time_idx on public.agenda_open_slots(status,starts_at);
create table if not exists public.agenda_slot_offers (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  open_slot_id uuid not null references public.agenda_open_slots(id) on delete cascade, professional_id uuid not null references public.agenda_professionals(id) on delete cascade,
  wave integer not null default 1, status text not null default 'sent' check(status in ('sent','accepted','declined','expired','cancelled')),
  sent_at timestamptz not null default now(), expires_at timestamptz not null, responded_at timestamptz, created_at timestamptz not null default now(),
  constraint agenda_slot_offers_company check(company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid), unique(open_slot_id,professional_id)
);
alter table public.agenda_slot_offers drop constraint if exists agenda_slot_offers_status_check;
alter table public.agenda_slot_offers
  add constraint agenda_slot_offers_status_check
  check (status in ('sent','accepted','declined','expired','cancelled'));
create index if not exists agenda_slot_offers_prof_status_idx on public.agenda_slot_offers(professional_id,status,expires_at);
alter table public.agenda_professional_availability enable row level security;
alter table public.agenda_professional_terms enable row level security;
alter table public.agenda_professional_eligibility enable row level security;
alter table public.agenda_open_slots enable row level security;
alter table public.agenda_slot_offers enable row level security;
create policy agenda_professional_availability_self_or_staff on public.agenda_professional_availability for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or exists(select 1 from public.agenda_professionals p where p.id=professional_id and p.user_id=auth.uid()));
create policy agenda_professional_terms_self_or_staff on public.agenda_professional_terms for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or exists(select 1 from public.agenda_professionals p where p.id=professional_id and p.user_id=auth.uid()));
create policy agenda_professional_eligibility_self_or_staff on public.agenda_professional_eligibility for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or exists(select 1 from public.agenda_professionals p where p.id=professional_id and p.user_id=auth.uid()));
create policy agenda_open_slots_staff_read on public.agenda_open_slots for select to authenticated using(public.is_impulsionando_staff(auth.uid()));
create policy agenda_slot_offers_self_or_staff on public.agenda_slot_offers for select to authenticated using(public.is_impulsionando_staff(auth.uid()) or exists(select 1 from public.agenda_professionals p where p.id=professional_id and p.user_id=auth.uid()));
grant select on public.agenda_professional_availability,public.agenda_professional_terms,public.agenda_professional_eligibility,public.agenda_open_slots,public.agenda_slot_offers to authenticated;
grant all on public.agenda_professional_availability,public.agenda_professional_terms,public.agenda_professional_eligibility,public.agenda_open_slots,public.agenda_slot_offers to service_role;

create or replace function public.chrismed_set_pega_agenda_preference(p_enabled boolean,p_terms_version text default 'pega-agenda-v1',p_user_agent text default null) returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_prof public.agenda_professionals%rowtype;
begin
 select * into v_prof from public.agenda_professionals where user_id=auth.uid() and company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and is_active=true order by created_at limit 1;
 if v_prof.id is null then raise exception 'professional_profile_not_found'; end if;
 insert into public.agenda_professional_availability(company_id,professional_id,accepts_substitution,metadata) values(v_prof.company_id,v_prof.id,p_enabled,jsonb_build_object('source','professional_settings')) on conflict(professional_id) do update set accepts_substitution=excluded.accepts_substitution,updated_at=now();
 if p_enabled then
   insert into public.agenda_professional_terms(company_id,professional_id,terms_version,user_agent,metadata) values(v_prof.company_id,v_prof.id,p_terms_version,p_user_agent,jsonb_build_object('feature','pega_agenda')) on conflict do nothing;
   insert into public.agenda_professional_eligibility(company_id,professional_id,profession_id,primary_area,is_active) values(v_prof.company_id,v_prof.id,v_prof.profession_id,v_prof.primary_area,true) on conflict(professional_id) do update set profession_id=excluded.profession_id,primary_area=excluded.primary_area,is_active=true,updated_at=now();
 else
   update public.agenda_professional_terms set revoked_at=coalesce(revoked_at,now()) where professional_id=v_prof.id and revoked_at is null;
   update public.agenda_professional_eligibility set is_active=false,updated_at=now() where professional_id=v_prof.id;
 end if;
 return jsonb_build_object('professional_id',v_prof.id,'enabled',p_enabled,'terms_version',case when p_enabled then p_terms_version else null end);
end;$$;
revoke all on function public.chrismed_set_pega_agenda_preference(boolean,text,text) from public,anon;
grant execute on function public.chrismed_set_pega_agenda_preference(boolean,text,text) to authenticated;

create or replace function public.chrismed_release_appointment_to_pega_agenda(p_appointment_id uuid,p_reason text default null,p_expires_minutes integer default 30) returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_appt public.chrismed_appointments%rowtype; v_original public.agenda_professionals%rowtype; v_slot public.agenda_open_slots%rowtype; v_count integer:=0;
begin
 if p_expires_minutes<5 or p_expires_minutes>1440 then raise exception 'invalid_expiration_window'; end if;
 select * into v_appt from public.chrismed_appointments where id=p_appointment_id for update; if v_appt.id is null then raise exception 'appointment_not_found'; end if;
 select * into v_original from public.agenda_professionals where id=v_appt.professional_id;
 if not public.is_impulsionando_staff(auth.uid()) and v_original.user_id is distinct from auth.uid() then raise exception 'not_authorized'; end if;
 if v_appt.status not in('held','pending_payment','confirmed') then raise exception 'appointment_not_eligible'; end if;
 insert into public.agenda_open_slots(company_id,origin,appointment_id,original_professional_id,offering_id,profession_id,primary_area,starts_at,ends_at,expires_at,reason,created_by,metadata)
 values(v_appt.company_id,'cancellation',v_appt.id,v_original.id,v_appt.offering_id,v_original.profession_id,v_original.primary_area,v_appt.starts_at,v_appt.ends_at,now()+make_interval(mins=>p_expires_minutes),p_reason,auth.uid(),jsonb_build_object('patient_preserved',true,'source','chrismed_appointment')) returning * into v_slot;
 insert into public.agenda_slot_offers(company_id,open_slot_id,professional_id,wave,status,expires_at)
 select v_appt.company_id,v_slot.id,e.professional_id,1,'sent',v_slot.expires_at from public.agenda_professional_eligibility e join public.agenda_professional_availability av on av.professional_id=e.professional_id and av.accepts_substitution=true join public.agenda_professional_terms t on t.professional_id=e.professional_id and t.revoked_at is null and t.terms_version='pega-agenda-v1' join public.agenda_professionals p on p.id=e.professional_id and p.is_active=true
 where e.company_id=v_appt.company_id and e.is_active=true and e.professional_id<>v_original.id and (v_original.profession_id is null or e.profession_id=v_original.profession_id) and (v_original.primary_area is null or e.primary_area=v_original.primary_area) on conflict(open_slot_id,professional_id) do nothing;
 get diagnostics v_count=row_count;
 insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,attempts,available_at,from_email,reply_to_email)
 select v_appt.company_id,'PEGA_AGENDA_OFFER','email',p.email,jsonb_build_object('slot_id',v_slot.id,'appointment_id',v_appt.id,'starts_at',v_appt.starts_at,'ends_at',v_appt.ends_at,'professional_name',p.name),'pega-agenda:'||v_slot.id::text||':email:'||p.id::text,'pending',0,now(),'sac@chrismed.com.br','sac@chrismed.com.br' from public.agenda_slot_offers o join public.agenda_professionals p on p.id=o.professional_id where o.open_slot_id=v_slot.id and p.email is not null on conflict(idempotency_key) do nothing;
 return jsonb_build_object('slot_id',v_slot.id,'offered_to',v_count,'expires_at',v_slot.expires_at);
end;$$;
revoke all on function public.chrismed_release_appointment_to_pega_agenda(uuid,text,integer) from public,anon;
grant execute on function public.chrismed_release_appointment_to_pega_agenda(uuid,text,integer) to authenticated;

create or replace function public.agenda_claim_open_slot(_slot_id uuid,_professional_id uuid,_ip text default null,_user_agent text default null) returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_slot public.agenda_open_slots%rowtype; v_prof public.agenda_professionals%rowtype; v_rows integer;
begin
 select * into v_prof from public.agenda_professionals where id=_professional_id and is_active=true; if v_prof.id is null then raise exception 'professional_not_found'; end if;
 if not public.is_impulsionando_staff(auth.uid()) and v_prof.user_id is distinct from auth.uid() then raise exception 'not_authorized'; end if;
 if not exists(select 1 from public.agenda_professional_availability where professional_id=_professional_id and accepts_substitution=true) then raise exception 'pega_agenda_not_enabled'; end if;
 if not exists(select 1 from public.agenda_professional_terms where professional_id=_professional_id and terms_version='pega-agenda-v1' and revoked_at is null) then raise exception 'terms_not_accepted'; end if;
 if not exists(select 1 from public.agenda_slot_offers where open_slot_id=_slot_id and professional_id=_professional_id and status='sent' and expires_at>now()) then raise exception 'offer_not_available'; end if;
 update public.agenda_open_slots set status='claimed',claimed_by_professional_id=_professional_id,claimed_at=now(),updated_at=now(),metadata=metadata||jsonb_build_object('claim_user_agent',_user_agent) where id=_slot_id and status='open' and expires_at>now() returning * into v_slot; get diagnostics v_rows=row_count; if v_rows<>1 then raise exception 'already_taken_or_expired'; end if;
 update public.agenda_slot_offers set status=case when professional_id=_professional_id then 'accepted' else 'cancelled' end,responded_at=now() where open_slot_id=_slot_id and status='sent';
 if v_slot.appointment_id is not null then update public.chrismed_appointments set professional_id=_professional_id,metadata=metadata||jsonb_build_object('pega_agenda',jsonb_build_object('slot_id',v_slot.id,'claimed_at',now(),'original_professional_id',v_slot.original_professional_id,'new_professional_id',_professional_id)),updated_at=now() where id=v_slot.appointment_id; end if;
 insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,attempts,available_at,from_email,reply_to_email)
 select v_slot.company_id,'PEGA_AGENDA_CLAIMED','email',a.patient_email,jsonb_build_object('appointment_id',a.id,'slot_id',v_slot.id,'starts_at',a.starts_at,'professional_name',v_prof.name),'pega-agenda-claimed:'||v_slot.id::text||':patient','pending',0,now(),'sac@chrismed.com.br','sac@chrismed.com.br' from public.chrismed_appointments a where a.id=v_slot.appointment_id on conflict(idempotency_key) do nothing;
 return jsonb_build_object('slot_id',v_slot.id,'status','claimed','professional_id',_professional_id,'appointment_id',v_slot.appointment_id);
end;$$;
revoke all on function public.agenda_claim_open_slot(uuid,uuid,text,text) from public,anon;
grant execute on function public.agenda_claim_open_slot(uuid,uuid,text,text) to authenticated;
