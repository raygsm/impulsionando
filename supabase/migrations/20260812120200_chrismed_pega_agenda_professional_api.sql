create or replace function public.chrismed_get_my_pega_agenda_state()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_prof public.agenda_professionals%rowtype;
  v_terms record;
  v_avail record;
  v_offers jsonb;
begin
  select * into v_prof
  from public.agenda_professionals
  where user_id = auth.uid()
    and company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
    and is_active = true
  order by created_at
  limit 1;

  if v_prof.id is null then
    return jsonb_build_object('professional_found',false,'enabled',false,'offers','[]'::jsonb);
  end if;

  select terms_version, accepted_at, revoked_at into v_terms
  from public.agenda_professional_terms
  where professional_id=v_prof.id
  order by accepted_at desc
  limit 1;

  select accepts_substitution,min_notice_minutes,max_response_minutes into v_avail
  from public.agenda_professional_availability
  where professional_id=v_prof.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'offer_id',o.id,'offer_status',o.status,'wave',o.wave,'sent_at',o.sent_at,
    'offer_expires_at',o.expires_at,'slot_id',s.id,'origin',s.origin,
    'starts_at',s.starts_at,'ends_at',s.ends_at,'primary_area',s.primary_area,
    'slot_status',s.status,'slot_expires_at',s.expires_at,'reason',s.reason
  ) order by s.starts_at),'[]'::jsonb)
  into v_offers
  from public.agenda_slot_offers o
  join public.agenda_open_slots s on s.id=o.open_slot_id
  where o.professional_id=v_prof.id
    and o.status='sent' and o.expires_at > now()
    and s.status='open' and s.expires_at > now();

  return jsonb_build_object(
    'professional_found',true,'professional_id',v_prof.id,'professional_name',v_prof.name,
    'enabled',coalesce(v_avail.accepts_substitution,false) and v_terms.accepted_at is not null and v_terms.revoked_at is null,
    'terms_version',v_terms.terms_version,'accepted_at',v_terms.accepted_at,'revoked_at',v_terms.revoked_at,
    'min_notice_minutes',coalesce(v_avail.min_notice_minutes,30),
    'max_response_minutes',coalesce(v_avail.max_response_minutes,15),'offers',v_offers
  );
end
$$;

create or replace function public.chrismed_decline_pega_agenda_offer(p_offer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_prof uuid;
begin
  select id into v_prof from public.agenda_professionals
  where user_id=auth.uid() and company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid and is_active=true
  order by created_at limit 1;
  if v_prof is null then raise exception 'professional_not_found'; end if;
  update public.agenda_slot_offers set status='declined', responded_at=now()
  where id=p_offer_id and professional_id=v_prof and status='sent' and expires_at>now();
  return found;
end
$$;

create or replace function public.chrismed_claim_pega_agenda_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_prof uuid; v_slot uuid; v_result jsonb;
begin
  select p.id,o.open_slot_id into v_prof,v_slot
  from public.agenda_professionals p
  join public.agenda_slot_offers o on o.professional_id=p.id
  where p.user_id=auth.uid() and p.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
    and p.is_active=true and o.id=p_offer_id and o.status='sent' and o.expires_at>now();
  if v_prof is null or v_slot is null then raise exception 'offer_not_available'; end if;
  select public.agenda_claim_open_slot(v_slot,v_prof,null,null) into v_result;
  return v_result;
end
$$;

revoke all on function public.chrismed_get_my_pega_agenda_state() from public, anon;
revoke all on function public.chrismed_decline_pega_agenda_offer(uuid) from public, anon;
revoke all on function public.chrismed_claim_pega_agenda_offer(uuid) from public, anon;
grant execute on function public.chrismed_get_my_pega_agenda_state() to authenticated;
grant execute on function public.chrismed_decline_pega_agenda_offer(uuid) to authenticated;
grant execute on function public.chrismed_claim_pega_agenda_offer(uuid) to authenticated;
