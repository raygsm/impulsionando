alter table public.wmp_dj_bookings add column if not exists response_token_hash text;
alter table public.wmp_dj_bookings add column if not exists response_token_expires_at timestamptz;
alter table public.wmp_dj_bookings add column if not exists response_responded_at timestamptz;
create unique index if not exists idx_wmp_dj_bookings_response_token_hash on public.wmp_dj_bookings(response_token_hash) where response_token_hash is not null;

create or replace function public.create_wmp_dj_invitation(p_booking_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','private','extensions'
as $function$
declare v public.wmp_dj_bookings%rowtype; p public.wmp_parceiros%rowtype; tok text; expiry timestamptz;
begin
  select * into v from public.wmp_dj_bookings where id=p_booking_id for update;
  if v.id is null then raise exception 'booking_not_found'; end if;
  if not private.is_tenant_member(v.tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']) then raise exception 'not_authorized'; end if;
  if v.status not in ('HOLD','OFFERED') then raise exception 'booking_not_invitable'; end if;
  select * into p from public.wmp_parceiros where id=v.parceiro_id and tenant_id=v.tenant_id;
  if p.id is null or coalesce(trim(p.email),'')='' then raise exception 'partner_email_missing'; end if;
  tok:=encode(extensions.gen_random_bytes(32),'hex'); expiry:=coalesce(v.response_deadline,now()+interval '24 hours');
  update public.wmp_dj_bookings set status='OFFERED',response_deadline=expiry,response_token_hash=encode(extensions.digest(tok,'sha256'),'hex'),response_token_expires_at=expiry,response_responded_at=null,updated_at=now() where id=v.id;
  insert into public.wmp_dj_booking_events(tenant_id,booking_id,event_type,payload) values(v.tenant_id,v.id,'OFFERED',jsonb_build_object('partner_id',v.parceiro_id,'response_deadline',expiry));
  return jsonb_build_object('booking_id',v.id,'token',tok,'expires_at',expiry,'partner_name',coalesce(nullif(p.nome_artistico,''),p.nome),'partner_email',p.email,'event_name',v.event_name,'event_date',v.event_date,'venue_name',v.venue_name,'city',v.city,'state',v.state,'fee_cents',v.fee_cents,'meal_allowance_cents',case when v.meal_provided_by_contractor then 0 else v.meal_allowance_cents end,'parking_allowance_cents',case when v.parking_provided_by_contractor then 0 else v.parking_allowance_cents end);
end $function$;

create or replace function public.get_wmp_dj_invitation_by_token(p_token text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v public.wmp_dj_bookings%rowtype; p public.wmp_parceiros%rowtype;
begin
  if length(coalesce(p_token,''))<40 then return null; end if;
  select * into v from public.wmp_dj_bookings where response_token_hash=encode(extensions.digest(p_token,'sha256'),'hex') limit 1;
  if v.id is null or v.response_token_expires_at is null or v.response_token_expires_at<now() then return null; end if;
  select * into p from public.wmp_parceiros where id=v.parceiro_id and tenant_id=v.tenant_id;
  return jsonb_build_object('booking_id',v.id,'status',v.status,'partner_name',coalesce(nullif(p.nome_artistico,''),p.nome),'event_name',v.event_name,'event_date',v.event_date,'venue_name',v.venue_name,'city',v.city,'state',v.state,'arrival_at',v.arrival_at,'soundcheck_at',v.soundcheck_at,'performance_start_at',v.performance_start_at,'performance_end_at',v.performance_end_at,'fee_cents',v.fee_cents,'meal_allowance_cents',case when v.meal_provided_by_contractor then 0 else v.meal_allowance_cents end,'parking_allowance_cents',case when v.parking_provided_by_contractor then 0 else v.parking_allowance_cents end,'meal_provided_by_contractor',v.meal_provided_by_contractor,'parking_provided_by_contractor',v.parking_provided_by_contractor,'response_deadline',v.response_deadline,'responded_at',v.response_responded_at);
end $function$;

create or replace function public.respond_wmp_dj_invitation(p_token text,p_decision text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v public.wmp_dj_bookings%rowtype; decision text:=upper(trim(coalesce(p_decision,''))); now_at timestamptz:=now();
begin
  if decision not in ('ACCEPT','DECLINE') then raise exception 'invalid_decision'; end if;
  if length(coalesce(p_token,''))<40 then raise exception 'invalid_token'; end if;
  select * into v from public.wmp_dj_bookings where response_token_hash=encode(extensions.digest(p_token,'sha256'),'hex') limit 1 for update;
  if v.id is null then raise exception 'invalid_token'; end if; if v.response_token_expires_at is null or v.response_token_expires_at<now_at then raise exception 'expired_token'; end if;
  if v.status='ACCEPTED' and decision='ACCEPT' then return jsonb_build_object('ok',true,'booking_id',v.id,'status','ACCEPTED','already_responded',true); end if;
  if v.status='DECLINED' and decision='DECLINE' then return jsonb_build_object('ok',true,'booking_id',v.id,'status','DECLINED','already_responded',true); end if;
  if v.status<>'OFFERED' then raise exception 'booking_not_awaiting_response'; end if;
  if decision='ACCEPT' then
    update public.wmp_dj_bookings set status='ACCEPTED',accepted_at=now_at,declined_at=null,decline_reason=null,response_responded_at=now_at,updated_at=now_at where id=v.id;
    insert into public.wmp_dj_booking_events(tenant_id,booking_id,event_type,payload) values(v.tenant_id,v.id,'ACCEPTED',jsonb_build_object('responded_at',now_at,'source','secure_link'));
    return jsonb_build_object('ok',true,'booking_id',v.id,'status','ACCEPTED','event_name',v.event_name,'event_date',v.event_date,'already_responded',false);
  end if;
  update public.wmp_dj_bookings set status='DECLINED',declined_at=now_at,decline_reason=nullif(trim(coalesce(p_reason,'')),''),accepted_at=null,response_responded_at=now_at,updated_at=now_at where id=v.id;
  insert into public.wmp_dj_booking_events(tenant_id,booking_id,event_type,payload) values(v.tenant_id,v.id,'DECLINED',jsonb_build_object('responded_at',now_at,'source','secure_link','reason',nullif(trim(coalesce(p_reason,'')),'')));
  return jsonb_build_object('ok',true,'booking_id',v.id,'status','DECLINED','event_name',v.event_name,'event_date',v.event_date,'already_responded',false);
end $function$;
revoke all on function public.create_wmp_dj_invitation(uuid) from public,anon;
grant execute on function public.create_wmp_dj_invitation(uuid) to authenticated;
revoke all on function public.get_wmp_dj_invitation_by_token(text) from public;
grant execute on function public.get_wmp_dj_invitation_by_token(text) to anon,authenticated;
revoke all on function public.respond_wmp_dj_invitation(text,text,text) from public;
grant execute on function public.respond_wmp_dj_invitation(text,text,text) to anon,authenticated;
