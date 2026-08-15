create table if not exists public.chrismed_fiscal_issuer_config (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  legal_name text not null,
  cnpj text not null,
  municipal_registration text,
  service_code text,
  service_description text not null default 'Serviços médicos e de saúde',
  tax_regime text not null default 'simples_nacional',
  provider text not null default 'focus_nfe',
  environment text not null default 'homologation',
  provider_secret_ref text,
  enabled boolean not null default false,
  readiness jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chrismed_fiscal_cnpj_digits check (cnpj ~ '^[0-9]{14}$'),
  constraint chrismed_fiscal_environment_check check (environment in ('homologation','production')),
  constraint chrismed_fiscal_provider_check check (provider in ('focus_nfe','manual'))
);

insert into public.chrismed_fiscal_issuer_config(company_id,legal_name,cnpj,enabled,readiness)
select c.id,coalesce(c.legal_name,c.name),regexp_replace(coalesce(c.document,''),'[^0-9]','','g'),false,
       jsonb_build_object('municipal_registration',false,'service_code',false,'provider_secret',false,'validated_at',null)
from public.companies c
where c.id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  and regexp_replace(coalesce(c.document,''),'[^0-9]','','g') ~ '^[0-9]{14}$'
on conflict(company_id) do update set
  legal_name=excluded.legal_name,
  cnpj=excluded.cnpj,
  updated_at=now();

create table if not exists public.chrismed_fiscal_invoice_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  appointment_id uuid references public.chrismed_appointments(id) on delete set null,
  patient_user_id uuid,
  patient_invoice_id uuid references public.chrismed_patient_invoices(id) on delete set null,
  reference text not null unique,
  status text not null default 'blocked',
  amount_cents integer not null check (amount_cents >= 0),
  taker_name text not null,
  taker_document text,
  taker_email text,
  service_code text,
  service_description text,
  provider text not null default 'focus_nfe',
  environment text not null default 'homologation',
  provider_status text,
  provider_response jsonb not null default '{}'::jsonb,
  nf_number text,
  verification_code text,
  pdf_url text,
  xml_url text,
  issued_at timestamptz,
  last_error text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chrismed_fiscal_job_status check (status in ('blocked','queued','sent','issued','rejected','failed','cancelled')),
  constraint chrismed_fiscal_job_environment check (environment in ('homologation','production'))
);

create index if not exists chrismed_fiscal_invoice_jobs_company_status_idx on public.chrismed_fiscal_invoice_jobs(company_id,status,created_at desc);
create index if not exists chrismed_fiscal_invoice_jobs_patient_idx on public.chrismed_fiscal_invoice_jobs(patient_user_id,created_at desc);

alter table public.chrismed_fiscal_issuer_config enable row level security;
alter table public.chrismed_fiscal_invoice_jobs enable row level security;

revoke all on public.chrismed_fiscal_issuer_config from anon;
revoke all on public.chrismed_fiscal_invoice_jobs from anon;
grant select on public.chrismed_fiscal_issuer_config to authenticated;
grant select on public.chrismed_fiscal_invoice_jobs to authenticated;
grant all on public.chrismed_fiscal_issuer_config to service_role;
grant all on public.chrismed_fiscal_invoice_jobs to service_role;

drop policy if exists chrismed_fiscal_issuer_select_admin on public.chrismed_fiscal_issuer_config;
create policy chrismed_fiscal_issuer_select_admin on public.chrismed_fiscal_issuer_config for select to authenticated using (
  public.chrismed_is_clinical_admin(company_id)
);

drop policy if exists chrismed_fiscal_jobs_select_owner_or_admin on public.chrismed_fiscal_invoice_jobs;
create policy chrismed_fiscal_jobs_select_owner_or_admin on public.chrismed_fiscal_invoice_jobs for select to authenticated using (
  patient_user_id=auth.uid() or public.chrismed_is_clinical_admin(company_id)
);

create or replace function public.chrismed_fiscal_readiness()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v public.chrismed_fiscal_issuer_config%rowtype;
begin
  select * into v from public.chrismed_fiscal_issuer_config where company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  if not found then return jsonb_build_object('ready',false,'reason','issuer_missing'); end if;
  return jsonb_build_object(
    'ready', v.enabled and nullif(trim(v.municipal_registration),'') is not null and nullif(trim(v.service_code),'') is not null and nullif(trim(v.provider_secret_ref),'') is not null,
    'enabled',v.enabled,
    'municipal_registration',nullif(trim(v.municipal_registration),'' ) is not null,
    'service_code',nullif(trim(v.service_code),'') is not null,
    'provider_secret',nullif(trim(v.provider_secret_ref),'') is not null,
    'environment',v.environment
  );
end;$$;
revoke execute on function public.chrismed_fiscal_readiness() from public,anon;
grant execute on function public.chrismed_fiscal_readiness() to authenticated,service_role;

create or replace function public.chrismed_prepare_fiscal_invoice(p_appointment_id uuid)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_company constant uuid:='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  v_app public.chrismed_appointments%rowtype;
  v_pay public.mpago_payments%rowtype;
  v_profile public.chrismed_patient_profiles%rowtype;
  v_cfg public.chrismed_fiscal_issuer_config%rowtype;
  v_id uuid;
  v_ref text;
begin
  select * into v_app from public.chrismed_appointments where id=p_appointment_id and company_id=v_company and status='confirmed';
  if not found then raise exception 'confirmed_appointment_required'; end if;
  if v_app.payment_id is null then raise exception 'approved_payment_required'; end if;
  select * into v_pay from public.mpago_payments where id=v_app.payment_id and status='approved';
  if not found then raise exception 'approved_payment_required'; end if;
  if v_app.patient_user_id is null then raise exception 'authenticated_patient_required'; end if;
  select * into v_profile from public.chrismed_patient_profiles where user_id=v_app.patient_user_id and status='approved';
  if not found or not coalesce(v_profile.fiscal_profile_complete,false) then raise exception 'complete_fiscal_profile_required'; end if;
  select * into v_cfg from public.chrismed_fiscal_issuer_config where company_id=v_company;
  if not found then raise exception 'fiscal_issuer_not_configured'; end if;
  v_ref:='chrismed-'||v_app.id::text;
  insert into public.chrismed_fiscal_invoice_jobs(company_id,appointment_id,patient_user_id,reference,status,amount_cents,taker_name,taker_document,taker_email,service_code,service_description,provider,environment,last_error)
  values(v_company,v_app.id,v_app.patient_user_id,v_ref,
         case when v_cfg.enabled and nullif(trim(v_cfg.municipal_registration),'') is not null and nullif(trim(v_cfg.service_code),'') is not null and nullif(trim(v_cfg.provider_secret_ref),'') is not null then 'queued' else 'blocked' end,
         v_pay.amount_cents,v_profile.full_name,regexp_replace(coalesce(v_profile.cpf,''),'[^0-9]','','g'),v_profile.email,
         v_cfg.service_code,v_cfg.service_description,v_cfg.provider,v_cfg.environment,
         case when v_cfg.enabled and nullif(trim(v_cfg.municipal_registration),'') is not null and nullif(trim(v_cfg.service_code),'') is not null and nullif(trim(v_cfg.provider_secret_ref),'') is not null then null else 'fiscal_provider_not_ready' end)
  on conflict(reference) do update set updated_at=now()
  returning id into v_id;
  return v_id;
end;$$;
revoke execute on function public.chrismed_prepare_fiscal_invoice(uuid) from public,anon,authenticated;
grant execute on function public.chrismed_prepare_fiscal_invoice(uuid) to service_role;