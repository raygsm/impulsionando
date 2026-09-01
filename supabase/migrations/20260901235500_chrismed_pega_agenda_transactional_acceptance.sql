alter table public.chrismed_physical_resources enable row level security;
alter table public.chrismed_resource_windows enable row level security;
alter table public.chrismed_resource_assignments enable row level security;

create or replace function public.chrismed_accept_resource_window(p_window_id uuid,p_term_version text,p_term_hash text,p_consent_audit jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path='public' as $$
declare v_uid uuid:=auth.uid(); v_prof uuid; v_company uuid; v_status text; v_assignment uuid;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 select id,company_id into v_prof,v_company from public.agenda_professionals where user_id=v_uid and is_active and profile_status in ('approved','active') limit 1;
 if v_prof is null then raise exception 'eligible_professional_required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_window_id::text,0));
 select status,company_id into v_status,v_company from public.chrismed_resource_windows where id=p_window_id for update;
 if v_status is distinct from 'released' then raise exception 'window_not_available'; end if;
 if exists(select 1 from public.chrismed_resource_assignments where window_id=p_window_id and status='active') then raise exception 'window_already_assigned'; end if;
 if coalesce(length(trim(p_term_version)),0)=0 or coalesce(length(trim(p_term_hash)),0)<16 then raise exception 'term_acceptance_required'; end if;
 insert into public.chrismed_resource_assignments(company_id,window_id,professional_id,term_version,term_hash,consent_audit)
 values(v_company,p_window_id,v_prof,p_term_version,p_term_hash,coalesce(p_consent_audit,'{}'::jsonb)) returning id into v_assignment;
 update public.chrismed_resource_windows set status='assigned',updated_at=now() where id=p_window_id;
 return v_assignment;
end $$;
revoke all on function public.chrismed_accept_resource_window(uuid,text,text,jsonb) from public;
grant execute on function public.chrismed_accept_resource_window(uuid,text,text,jsonb) to authenticated;

create or replace function public.chrismed_release_resource_window(p_resource_id uuid,p_starts_at timestamptz,p_ends_at timestamptz,p_release_scope jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path='public' as $$
declare v_uid uuid:=auth.uid(); v_owner uuid; v_company uuid; v_window uuid;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if p_ends_at<=p_starts_at then raise exception 'invalid_window'; end if;
 select id,company_id into v_owner,v_company from public.agenda_professionals where user_id=v_uid and is_active and profile_status in ('approved','active') limit 1;
 if v_owner is null then raise exception 'eligible_professional_required'; end if;
 if not exists(select 1 from public.chrismed_physical_resources where id=p_resource_id and company_id=v_company and active) then raise exception 'resource_not_available'; end if;
 if exists(select 1 from public.chrismed_resource_windows where resource_id=p_resource_id and status in ('released','assigned') and tstzrange(starts_at,ends_at,'[)') && tstzrange(p_starts_at,p_ends_at,'[)')) then raise exception 'resource_window_conflict'; end if;
 insert into public.chrismed_resource_windows(company_id,resource_id,owner_professional_id,starts_at,ends_at,status,release_scope,created_by)
 values(v_company,p_resource_id,v_owner,p_starts_at,p_ends_at,'released',coalesce(p_release_scope,'{}'::jsonb),v_uid) returning id into v_window;
 return v_window;
end $$;
revoke all on function public.chrismed_release_resource_window(uuid,timestamptz,timestamptz,jsonb) from public;
grant execute on function public.chrismed_release_resource_window(uuid,timestamptz,timestamptz,jsonb) to authenticated;