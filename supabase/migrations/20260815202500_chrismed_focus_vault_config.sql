alter table public.chrismed_fiscal_issuer_config add column if not exists webhook_secret_ref text;

create or replace function public.chrismed_configure_focus_nfse(p_environment text,p_api_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','auth','vault','extensions'
as $$
declare
  v_company uuid;
  v_allowed boolean:=false;
  v_env text:=lower(trim(coalesce(p_environment,'')));
  v_token_name text;
  v_webhook_name text;
  v_secret_id uuid;
  v_webhook_secret text;
begin
  select id into v_company from public.companies where regexp_replace(coalesce(document,''),'[^0-9]','','g')='42625058000170' limit 1;
  if v_company is null then raise exception 'chrismed_company_not_found'; end if;
  v_allowed:=public.is_impulsionando_staff(auth.uid()) or exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id=v_company and r.role in ('admin','gestor'));
  if not v_allowed then raise exception 'not_authorized'; end if;
  if v_env not in ('homologation','production') then raise exception 'invalid_environment'; end if;
  if length(trim(coalesce(p_api_token,'')))<16 then raise exception 'invalid_focus_token'; end if;

  v_token_name:='chrismed_focus_nfse_'||v_env||'_api_token';
  v_webhook_name:='chrismed_focus_nfse_'||v_env||'_webhook_authorization';

  select id into v_secret_id from vault.secrets where name=v_token_name order by created_at desc limit 1;
  if v_secret_id is null then
    perform vault.create_secret(trim(p_api_token),v_token_name,'Focus NFe CHRISMED API token - '||v_env,null);
  else
    perform vault.update_secret(v_secret_id,trim(p_api_token),v_token_name,'Focus NFe CHRISMED API token - '||v_env,null);
  end if;

  select id into v_secret_id from vault.secrets where name=v_webhook_name order by created_at desc limit 1;
  if v_secret_id is null then
    v_webhook_secret:=encode(extensions.gen_random_bytes(32),'hex');
    perform vault.create_secret(v_webhook_secret,v_webhook_name,'Focus NFe CHRISMED webhook authorization - '||v_env,null);
  end if;

  update public.chrismed_fiscal_issuer_config
  set provider='focus_nfe',environment=v_env,provider_secret_ref=v_token_name,webhook_secret_ref=v_webhook_name,enabled=false,
      readiness=coalesce(readiness,'{}'::jsonb)||jsonb_build_object('provider_secret',true,'webhook_secret',true,'provider_token_validated',false,'configured_at',now()),updated_at=now()
  where company_id=v_company;

  insert into public.communication_audit_logs(tenant_id,actor_id,actor_type,action,entity_type,entity_id,after_data)
  select t.id,auth.uid(),'USER','CHRISMED_FOCUS_NFSE_CONFIGURED','chrismed_fiscal_issuer_config',v_company::text,
         jsonb_build_object('environment',v_env,'api_token_saved',true,'webhook_authorization_saved',true,'emission_enabled',false)
  from public.communication_tenants t where t.slug='chrismed' limit 1;

  return jsonb_build_object('configured',true,'environment',v_env,'secrets_saved',true,'emission_enabled',false,'requires_external_validation',true);
end;$$;

revoke execute on function public.chrismed_configure_focus_nfse(text,text) from public,anon;
grant execute on function public.chrismed_configure_focus_nfse(text,text) to authenticated;

create or replace function public.chrismed_fiscal_readiness()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v public.chrismed_fiscal_issuer_config%rowtype;
begin
  select cfg.* into v from public.chrismed_fiscal_issuer_config cfg join public.companies c on c.id=cfg.company_id where regexp_replace(coalesce(c.document,''),'[^0-9]','','g')='42625058000170' limit 1;
  if not found then return jsonb_build_object('ready',false,'reason','issuer_missing'); end if;
  return jsonb_build_object(
    'ready',v.enabled and nullif(trim(v.municipal_registration),'') is not null and nullif(trim(v.service_code),'') is not null and nullif(trim(v.provider_secret_ref),'') is not null and nullif(trim(v.webhook_secret_ref),'') is not null and coalesce((v.readiness->>'provider_token_validated')::boolean,false),
    'enabled',v.enabled,
    'municipal_registration',nullif(trim(v.municipal_registration),'') is not null,
    'service_code',nullif(trim(v.service_code),'') is not null,
    'provider_secret',nullif(trim(v.provider_secret_ref),'') is not null,
    'webhook_secret',nullif(trim(v.webhook_secret_ref),'') is not null,
    'provider_token_validated',coalesce((v.readiness->>'provider_token_validated')::boolean,false),
    'environment',v.environment
  );
end;$$;
