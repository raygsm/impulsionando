-- CHRISMED presence timeout + event organizer governance + daily organizer BI.

-- 1) Consultation presence timeout: 15 minutes maximum.
create or replace function public.chrismed_auto_mark_no_show_due(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public'
as $$
declare
  v_company constant uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  v_count integer := 0;
  r record;
begin
  for r in
    select a.*
    from public.chrismed_appointments a
    where a.company_id=v_company
      and a.status='confirmed'
      and a.started_at is null
      and a.starts_at + interval '15 minutes' <= p_now
    for update skip locked
  loop
    update public.chrismed_appointments
      set status='no_show', no_show_at=p_now, completed_at=null,
          outcome_note=coalesce(outcome_note,'Ausência registrada automaticamente após tolerância de 15 minutos.'),
          updated_at=p_now
    where id=r.id and status='confirmed' and started_at is null;

    if found then
      delete from public.chrismed_experience_surveys
       where subject_type='appointment' and subject_id=r.id and audience_type='patient' and completed_at is null;

      update public.chrismed_communication_outbox
         set status='dead_letter',last_error='cancelled_due_to_no_show',updated_at=p_now
       where idempotency_key='appointment:'||r.id||':survey:email'
         and status in ('pending','failed');

      insert into public.chrismed_communication_outbox(
        company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email
      ) values (
        v_company,'appointment_no_show','email',r.patient_email,
        jsonb_build_object(
          'appointment_id',r.id,'professional_id',r.professional_id,'patient_name',r.patient_name,
          'starts_at',r.starts_at,'auto_no_show',true,'tolerance_minutes',15
        ),
        'appointment:'||r.id||':no-show-followup:email','pending',p_now,'sac@chrismed.com.br','sac@chrismed.com.br'
      ) on conflict(idempotency_key) do nothing;
      v_count := v_count + 1;
    end if;
  end loop;
  return jsonb_build_object('ok',true,'marked_no_show',v_count,'checked_at',p_now);
end;
$$;
revoke all on function public.chrismed_auto_mark_no_show_due(timestamptz) from public,anon,authenticated;
grant execute on function public.chrismed_auto_mark_no_show_due(timestamptz) to service_role;

-- Server-side minute tick; no browser dependency.
do $m$
declare v_job bigint;
begin
  select jobid into v_job from cron.job where jobname='chrismed-presence-timeout-1min';
  if v_job is not null then perform cron.unschedule(v_job); end if;
  perform cron.schedule('chrismed-presence-timeout-1min','* * * * *',$job$select public.chrismed_auto_mark_no_show_due(now());$job$);
end $m$;

-- 2) Events must belong to an existing company before publication.
alter table public.chrismed_events
  add column if not exists organizer_company_id uuid references public.companies(id) on delete restrict;
create index if not exists idx_chrismed_events_organizer_company on public.chrismed_events(organizer_company_id,starts_at desc);

create or replace function public.chrismed_event_require_registered_organizer()
returns trigger
language plpgsql
set search_path='pg_catalog','public'
as $$
begin
  if new.status in ('published','finished') and new.organizer_company_id is null then
    raise exception 'registered_organizer_company_required';
  end if;
  if new.organizer_company_id is not null and not exists(
    select 1 from public.companies c where c.id=new.organizer_company_id and c.is_active=true
  ) then
    raise exception 'organizer_company_not_active';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_chrismed_event_require_registered_organizer on public.chrismed_events;
create trigger trg_chrismed_event_require_registered_organizer
before insert or update of organizer_company_id,status on public.chrismed_events
for each row execute function public.chrismed_event_require_registered_organizer();

-- Existing CHRISMED-owned events can select CHRISMED itself.
update public.chrismed_events e
set organizer_company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid,
    organizer_name='CHRISMED'
where organizer_company_id is null and upper(trim(coalesce(organizer_name,'CHRISMED')))='CHRISMED';

-- 3) Organizer contacts receive operational summaries.
create table if not exists public.chrismed_event_company_contacts(
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text not null,
  role_label text,
  receives_daily_report boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,email)
);
alter table public.chrismed_event_company_contacts enable row level security;
revoke all on public.chrismed_event_company_contacts from public,anon,authenticated;
grant all on public.chrismed_event_company_contacts to service_role;
create policy chrismed_event_company_contacts_read on public.chrismed_event_company_contacts
for select to authenticated using (
  public.is_impulsionando_staff(auth.uid())
  or public.user_belongs_to_company(auth.uid(),company_id)
  or exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and r.role in ('admin','gestor'))
);

-- 4) Invite new organizer companies into CHRISMED.
create table if not exists public.chrismed_event_company_invitations(
  id uuid primary key default gen_random_uuid(),
  invited_email text not null,
  invited_company_name text,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check(status in ('pending','accepted','expired','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now()+interval '7 days'),
  accepted_company_id uuid references public.companies(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.chrismed_event_company_invitations enable row level security;
revoke all on public.chrismed_event_company_invitations from public,anon,authenticated;
grant all on public.chrismed_event_company_invitations to service_role;
create policy chrismed_event_company_invitations_management_read on public.chrismed_event_company_invitations
for select to authenticated using (
  public.is_impulsionando_staff(auth.uid())
  or exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and r.role in ('admin','gestor'))
);

create or replace function public.chrismed_create_event_company_invitation(p_email text,p_company_name text default null)
returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public'
as $$
declare v_id uuid; v_token uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if not (public.is_impulsionando_staff(auth.uid()) or exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and r.role in ('admin','gestor'))) then raise exception 'not_authorized'; end if;
  if lower(trim(coalesce(p_email,''))) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_email'; end if;
  insert into public.chrismed_event_company_invitations(invited_email,invited_company_name,created_by)
  values(lower(trim(p_email)),nullif(trim(coalesce(p_company_name,'')),''),auth.uid()) returning id,token into v_id,v_token;
  return jsonb_build_object('id',v_id,'invite_url','https://chrismed.impulsionando.com.br/empresas/cadastro?convite='||v_token,'expires_in_days',7);
end;
$$;
revoke all on function public.chrismed_create_event_company_invitation(text,text) from public,anon;
grant execute on function public.chrismed_create_event_company_invitation(text,text) to authenticated,service_role;

-- 5) Comparative event BI.
create or replace function public.chrismed_get_event_comparison(p_company_id uuid default null)
returns table(
  event_id uuid,event_name text,organizer_company_id uuid,starts_at timestamptz,
  invited integer,accepted integer,registered integer,present integer,no_show integer,
  acceptance_rate numeric,attendance_rate numeric
)
language sql
stable
security definer
set search_path='pg_catalog','public'
as $$
  select e.id,e.title,e.organizer_company_id,e.starts_at,
    (select count(*)::int from public.chrismed_event_invitations i where i.event_id=e.id) invited,
    (select count(*)::int from public.chrismed_event_invitations i where i.event_id=e.id and i.status='accepted') accepted,
    (select count(*)::int from public.chrismed_event_registrations r where r.event_id=e.id and r.status='confirmed') registered,
    (select count(*)::int from public.chrismed_event_checkins c where c.event_id=e.id) present,
    greatest((select count(*)::int from public.chrismed_event_registrations r where r.event_id=e.id and r.status='confirmed')-(select count(*)::int from public.chrismed_event_checkins c where c.event_id=e.id),0) no_show,
    case when (select count(*) from public.chrismed_event_invitations i where i.event_id=e.id)>0 then round(100.0*(select count(*) from public.chrismed_event_invitations i where i.event_id=e.id and i.status='accepted')/(select count(*) from public.chrismed_event_invitations i where i.event_id=e.id),1) else 0 end,
    case when (select count(*) from public.chrismed_event_registrations r where r.event_id=e.id and r.status='confirmed')>0 then round(100.0*(select count(*) from public.chrismed_event_checkins c where c.event_id=e.id)/(select count(*) from public.chrismed_event_registrations r where r.event_id=e.id and r.status='confirmed'),1) else 0 end
  from public.chrismed_events e
  where (p_company_id is null or e.organizer_company_id=p_company_id)
  order by e.starts_at desc;
$$;
revoke all on function public.chrismed_get_event_comparison(uuid) from public,anon;
grant execute on function public.chrismed_get_event_comparison(uuid) to authenticated,service_role;

-- 6) Queue daily organizer digest. Delivery uses the existing CHRISMED outbox worker.
create or replace function public.chrismed_queue_event_organizer_daily_reports(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public'
as $$
declare v_company constant uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid; v_count integer:=0; r record;
begin
  for r in
    select e.id event_id,e.title,e.organizer_company_id,e.starts_at,e.ends_at,c.name recipient_name,c.email recipient_email,
      (select count(*) from public.chrismed_event_invitations i where i.event_id=e.id) invited,
      (select count(*) from public.chrismed_event_invitations i where i.event_id=e.id and i.status='accepted') accepted,
      (select count(*) from public.chrismed_event_registrations x where x.event_id=e.id and x.status='confirmed') confirmed,
      (select count(*) from public.chrismed_event_checkins x where x.event_id=e.id) present
    from public.chrismed_events e
    join public.chrismed_event_company_contacts c on c.company_id=e.organizer_company_id and c.active and c.receives_daily_report
    where e.status in ('published','finished')
  loop
    insert into public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key,status,available_at,from_email,reply_to_email)
    values(v_company,'event_organizer_daily_digest','email',r.recipient_email,
      jsonb_build_object('event_id',r.event_id,'event_name',r.title,'recipient_name',r.recipient_name,'starts_at',r.starts_at,'ends_at',r.ends_at,'invited',r.invited,'accepted',r.accepted,'confirmed',r.confirmed,'present',r.present,'no_show',greatest(r.confirmed-r.present,0),'management_url','https://chrismed.impulsionando.com.br/eventos'),
      'event:'||r.event_id||':organizer-digest:'||r.recipient_email||':'||to_char(p_now at time zone 'America/Sao_Paulo','YYYY-MM-DD'),
      'pending',p_now,'sac@chrismed.com.br','sac@chrismed.com.br')
    on conflict(idempotency_key) do nothing;
    if found then v_count:=v_count+1; end if;
  end loop;
  return jsonb_build_object('ok',true,'queued',v_count,'date',to_char(p_now at time zone 'America/Sao_Paulo','YYYY-MM-DD'));
end;
$$;
revoke all on function public.chrismed_queue_event_organizer_daily_reports(timestamptz) from public,anon,authenticated;
grant execute on function public.chrismed_queue_event_organizer_daily_reports(timestamptz) to service_role;

do $m$
declare v_job bigint;
begin
  select jobid into v_job from cron.job where jobname='chrismed-event-organizer-digest-daily';
  if v_job is not null then perform cron.unschedule(v_job); end if;
  perform cron.schedule('chrismed-event-organizer-digest-daily','0 21 * * *',$job$select public.chrismed_queue_event_organizer_daily_reports(now());$job$);
end $m$;
