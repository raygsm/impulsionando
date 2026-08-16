alter table public.cp_invitations add column if not exists invited_alias_hint text;

revoke insert,update,delete on public.cp_invitations from authenticated;
grant select on public.cp_invitations to authenticated;

drop policy if exists cp_invitations_inviter_create on public.cp_invitations;
drop policy if exists cp_invitations_parties_update on public.cp_invitations;

create or replace function public.cp_create_invitation(p_phone text,p_alias_hint text default null)
returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public','auth'
as $$
declare
  v_uid uuid:=auth.uid();
  v_phone text;
  v_token text;
  v_hash text;
  v_phone_hash text;
  v_id uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_phone:=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
  if length(v_phone)<10 or length(v_phone)>15 then raise exception 'invalid_phone'; end if;
  v_token:=encode(gen_random_bytes(32),'hex');
  v_hash:=encode(digest(v_token,'sha256'),'hex');
  v_phone_hash:=encode(digest(v_phone,'sha256'),'hex');
  insert into public.cp_invitations(inviter_user_id,invited_phone_hash,invited_alias_hint,invitation_token_hash,state,expires_at)
  values(v_uid,v_phone_hash,nullif(trim(p_alias_hint),''),v_hash,'invited',now()+interval '72 hours')
  returning id into v_id;
  return jsonb_build_object('invitation_id',v_id,'invitation_token',v_token,'expires_at',now()+interval '72 hours');
end $$;

create or replace function public.cp_accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public','auth'
as $$
declare
  v_uid uuid:=auth.uid();
  v_aal text:=coalesce(auth.jwt()->>'aal','');
  v_hash text;
  v_inv public.cp_invitations%rowtype;
  v_phone text;
  v_phone_hash text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if v_aal<>'aal2' then raise exception 'aal2_required'; end if;
  if nullif(trim(p_token),'') is null then raise exception 'token_required'; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');
  select * into v_inv from public.cp_invitations where invitation_token_hash=v_hash for update;
  if v_inv.id is null then raise exception 'invitation_not_found'; end if;
  if v_inv.state<>'invited' then raise exception 'invalid_invitation_state'; end if;
  if v_inv.expires_at<=now() then
    update public.cp_invitations set state='expired',updated_at=now() where id=v_inv.id;
    raise exception 'invitation_expired';
  end if;
  select regexp_replace(coalesce(phone,''),'[^0-9]','','g') into v_phone from auth.users where id=v_uid;
  if nullif(v_phone,'') is null then raise exception 'verified_phone_required'; end if;
  v_phone_hash:=encode(digest(v_phone,'sha256'),'hex');
  if v_phone_hash<>v_inv.invited_phone_hash then raise exception 'invitation_identity_mismatch'; end if;
  update public.cp_invitations
    set invitee_user_id=v_uid,
        state='invitee_accepted',
        second_factor_type='supabase_aal2',
        second_factor_verified_at=now(),
        invitee_accepted_at=now(),
        updated_at=now()
  where id=v_inv.id;
  return jsonb_build_object('accepted',true,'invitation_id',v_inv.id,'state','invitee_accepted','requires_inviter_confirmation',true);
end $$;

create or replace function public.cp_confirm_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public','auth'
as $$
declare
  v_uid uuid:=auth.uid();
  v_inv public.cp_invitations%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_inv from public.cp_invitations where id=p_invitation_id for update;
  if v_inv.id is null then raise exception 'invitation_not_found'; end if;
  if v_inv.inviter_user_id<>v_uid then raise exception 'forbidden'; end if;
  if v_inv.state<>'invitee_accepted' or v_inv.invitee_user_id is null or v_inv.second_factor_verified_at is null then raise exception 'invitee_acceptance_required'; end if;
  update public.cp_invitations set state='active',inviter_confirmed_at=now(),activated_at=now(),updated_at=now() where id=v_inv.id;
  return jsonb_build_object('active',true,'invitation_id',v_inv.id,'state','active');
end $$;

create or replace function public.cp_revoke_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public','auth'
as $$
declare
  v_uid uuid:=auth.uid();
  v_inv public.cp_invitations%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_inv from public.cp_invitations where id=p_invitation_id for update;
  if v_inv.id is null then raise exception 'invitation_not_found'; end if;
  if v_inv.inviter_user_id<>v_uid then raise exception 'forbidden'; end if;
  if v_inv.state in ('active','expired','revoked') then raise exception 'invitation_not_revocable'; end if;
  update public.cp_invitations set state='revoked',revoked_at=now(),updated_at=now() where id=v_inv.id;
  return jsonb_build_object('revoked',true,'invitation_id',v_inv.id);
end $$;

revoke all on function public.cp_create_invitation(text,text) from public,anon;
revoke all on function public.cp_accept_invitation(text) from public,anon;
revoke all on function public.cp_confirm_invitation(uuid) from public,anon;
revoke all on function public.cp_revoke_invitation(uuid) from public,anon;
grant execute on function public.cp_create_invitation(text,text) to authenticated;
grant execute on function public.cp_accept_invitation(text) to authenticated;
grant execute on function public.cp_confirm_invitation(uuid) to authenticated;
grant execute on function public.cp_revoke_invitation(uuid) to authenticated;

update public.modules
set readiness_checklist=jsonb_set(coalesce(readiness_checklist,'{}'::jsonb),'{double_acceptance_invites}','true'::jsonb,true),updated_at=now()
where slug='cp';
