create or replace function public.chrismed_get_fiscal_admin_status()
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_company uuid;
  v_cfg public.chrismed_fiscal_issuer_config%rowtype;
  v_allowed boolean:=false;
  v_jobs jsonb;
begin
  select id into v_company from public.companies where regexp_replace(coalesce(document,''),'[^0-9]','','g')='42625058000170' limit 1;
  if v_company is null then raise exception 'chrismed_company_not_found'; end if;
  v_allowed:=public.is_impulsionando_staff(auth.uid()) or exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id=v_company and r.role in ('admin','gestor'));
  if not v_allowed then raise exception 'not_authorized'; end if;
  select * into v_cfg from public.chrismed_fiscal_issuer_config where company_id=v_company;
  if not found then raise exception 'fiscal_issuer_not_configured'; end if;
  select jsonb_build_object(
    'blocked',count(*) filter(where status='blocked'),
    'queued',count(*) filter(where status='queued'),
    'sent',count(*) filter(where status='sent'),
    'issued',count(*) filter(where status='issued'),
    'failed',count(*) filter(where status in ('failed','rejected'))
  ) into v_jobs from public.chrismed_fiscal_invoice_jobs where company_id=v_company;
  return jsonb_build_object(
    'legal_name',v_cfg.legal_name,
    'cnpj',v_cfg.cnpj,
    'municipal_registration',v_cfg.municipal_registration,
    'service_code',v_cfg.service_code,
    'service_description',v_cfg.service_description,
    'tax_regime',v_cfg.tax_regime,
    'provider',v_cfg.provider,
    'environment',v_cfg.environment,
    'enabled',v_cfg.enabled,
    'provider_secret',nullif(trim(v_cfg.provider_secret_ref),'') is not null,
    'webhook_secret',nullif(trim(v_cfg.webhook_secret_ref),'') is not null,
    'provider_token_validated',coalesce((v_cfg.readiness->>'provider_token_validated')::boolean,false),
    'ready',v_cfg.enabled and nullif(trim(v_cfg.municipal_registration),'') is not null and nullif(trim(v_cfg.service_code),'') is not null and nullif(trim(v_cfg.provider_secret_ref),'') is not null and nullif(trim(v_cfg.webhook_secret_ref),'') is not null and coalesce((v_cfg.readiness->>'provider_token_validated')::boolean,false),
    'jobs',coalesce(v_jobs,'{}'::jsonb)
  );
end;$$;
revoke execute on function public.chrismed_get_fiscal_admin_status() from public,anon;
grant execute on function public.chrismed_get_fiscal_admin_status() to authenticated;
