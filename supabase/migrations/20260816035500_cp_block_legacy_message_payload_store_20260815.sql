alter table public.cp_messages add column if not exists payload_ref text;
alter table public.cp_messages alter column ciphertext drop not null;
alter table public.cp_messages alter column nonce drop not null;

create or replace function public.cp_enforce_payload_store()
returns trigger
language plpgsql
security definer
set search_path='pg_catalog','public'
as $$
begin
  if new.payload_store is null or new.payload_store='legacy_primary_db' then raise exception 'cp_payload_store_not_homologated'; end if;
  if new.payload_store<>'dedicated_ephemeral_store' then raise exception 'cp_payload_store_invalid'; end if;
  if nullif(trim(new.payload_ref),'') is null then raise exception 'cp_payload_ref_required'; end if;
  if new.ciphertext is not null or new.nonce is not null then raise exception 'cp_primary_db_must_not_store_message_payload'; end if;
  return new;
end $$;

drop trigger if exists trg_cp_enforce_payload_store on public.cp_messages;
create trigger trg_cp_enforce_payload_store before insert or update of payload_store,payload_ref,ciphertext,nonce on public.cp_messages for each row execute function public.cp_enforce_payload_store();
revoke all on function public.cp_enforce_payload_store() from public,anon,authenticated;
grant execute on function public.cp_enforce_payload_store() to service_role;

create or replace function public.cp_readiness_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path='pg_catalog','public'
as $$
declare
  v_module public.modules%rowtype;
  v_profile public.cp_security_profile%rowtype;
  v_dedicated_count bigint;
  v_legacy_count bigint;
begin
  if auth.uid() is null or not public.is_impulsionando_staff(auth.uid()) then raise exception 'forbidden'; end if;
  select * into v_module from public.modules where slug='cp';
  select * into v_profile from public.cp_security_profile order by created_at desc limit 1;
  select count(*) into v_dedicated_count from public.cp_messages where payload_store='dedicated_ephemeral_store';
  select count(*) into v_legacy_count from public.cp_messages where payload_store='legacy_primary_db';
  return jsonb_build_object('module_status_tecnico',v_module.status_tecnico,'module_status_comercial',v_module.status_comercial,'readiness_status',v_module.readiness_status,'checklist',v_module.readiness_checklist,'security_profile_version',v_profile.version,'security_profile_status',v_profile.status,'provider_has_decryption_keys',v_profile.provider_has_decryption_keys,'content_backups_allowed',v_profile.content_backups_allowed,'legacy_payload_rows',v_legacy_count,'dedicated_payload_rows',v_dedicated_count,'message_writes_fail_closed',true,'captured_at',now());
end $$;
revoke all on function public.cp_readiness_snapshot() from public,anon;
grant execute on function public.cp_readiness_snapshot() to authenticated,service_role;

update public.modules set readiness_checklist=jsonb_set(coalesce(readiness_checklist,'{}'::jsonb),'{dedicated_payload_store_no_backup}','false'::jsonb,true),updated_at=now() where slug='cp';
