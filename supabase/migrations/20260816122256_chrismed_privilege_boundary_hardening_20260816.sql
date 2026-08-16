-- CHRISMED privilege-boundary hardening.
-- 1) Trigger-only functions must not be directly callable through PostgREST RPC.
REVOKE EXECUTE ON FUNCTION public.chrismed_event_queue_checkin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.chrismed_event_queue_invitation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.chrismed_event_queue_registration_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.chrismed_event_queue_registration_status() FROM PUBLIC, anon, authenticated;

-- 2) Fiscal readiness is administration-only, not a generic authenticated-user RPC.
CREATE OR REPLACE FUNCTION public.chrismed_fiscal_readiness()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
declare
  v public.chrismed_fiscal_issuer_config%rowtype;
  v_company constant uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  v_allowed boolean := false;
begin
  v_allowed := public.is_impulsionando_staff(auth.uid()) or exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid()
      and r.company_id = v_company
      and r.role in ('admin','gestor')
  );
  if not v_allowed then raise exception 'not_authorized'; end if;
  select cfg.* into v from public.chrismed_fiscal_issuer_config cfg where cfg.company_id = v_company limit 1;
  if not found then return jsonb_build_object('ready',false,'reason','issuer_missing'); end if;
  return jsonb_build_object(
    'ready',v.enabled and nullif(trim(v.municipal_registration),'') is not null and nullif(trim(v.service_code),'') is not null and nullif(trim(v.provider_secret_ref),'') is not null and nullif(trim(v.webhook_secret_ref),'') is not null and coalesce((v.readiness->>'provider_token_validated')::boolean,false) and coalesce((v.readiness->>'focus_company_registered')::boolean,false),
    'enabled',v.enabled,
    'municipal_registration',nullif(trim(v.municipal_registration),'') is not null,
    'service_code',nullif(trim(v.service_code),'') is not null,
    'provider_secret',nullif(trim(v.provider_secret_ref),'') is not null,
    'webhook_secret',nullif(trim(v.webhook_secret_ref),'') is not null,
    'provider_token_validated',coalesce((v.readiness->>'provider_token_validated')::boolean,false),
    'focus_company_registered',coalesce((v.readiness->>'focus_company_registered')::boolean,false),
    'environment',v.environment
  );
end;
$function$;
REVOKE EXECUTE ON FUNCTION public.chrismed_fiscal_readiness() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_fiscal_readiness() TO authenticated;

-- 3) Management routing data is restricted to CHRISMED administrators/staff.
CREATE OR REPLACE FUNCTION public.get_chrismed_management_emails()
RETURNS TABLE(primary_email text, copy_emails jsonb, clinical_sensitive_mode text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
declare
  v_company constant uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
begin
  if not (public.is_impulsionando_staff(auth.uid()) or exists (
    select 1 from public.user_roles r where r.user_id = auth.uid() and r.company_id = v_company and r.role in ('admin','gestor')
  )) then raise exception 'not_authorized'; end if;
  return query
  select
    coalesce((select value #>> '{}' from public.company_settings where company_id=v_company and key='comms.management_primary_email'),'sac@chrismed.com.br'),
    coalesce((select value from public.company_settings where company_id=v_company and key='comms.management_copy_emails'),'[]'::jsonb),
    coalesce((select value->>'clinical_sensitive_mode' from public.company_settings where company_id=v_company and key='comms.management_copy_policy'),'metadata_only');
end;
$function$;
REVOKE EXECUTE ON FUNCTION public.get_chrismed_management_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chrismed_management_emails() TO authenticated;

-- 4) Professional payout eligibility is self-service for that professional, or admin/staff.
CREATE OR REPLACE FUNCTION public.chrismed_professional_payout_eligibility(p_professional_id uuid, p_reference_month date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
declare
  v_company constant uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  v_allowed boolean := false;
  v_result jsonb;
begin
  v_allowed := public.is_impulsionando_staff(auth.uid())
    or exists (select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id=v_company and r.role in ('admin','gestor'))
    or exists (select 1 from public.agenda_professionals ap where ap.id=p_professional_id and ap.company_id=v_company and ap.user_id=auth.uid());
  if not v_allowed then raise exception 'not_authorized'; end if;
  with prof as (
    select * from public.agenda_professionals where id=p_professional_id and company_id=v_company
  ), inv as (
    select * from public.chrismed_professional_fiscal_invoices where professional_id=p_professional_id and reference_month=date_trunc('month',p_reference_month)::date limit 1
  ), pay as (
    select p.id,p.amount_cents,p.payment_method,p.approved_at,a.id as appointment_id,
      case when lower(coalesce(p.payment_method,''))='pix' then p.approved_at+interval '7 days' else p.approved_at+interval '37 days' end as eligible_at
    from public.mpago_payments p join public.chrismed_appointments a on a.payment_id=p.id
    where a.professional_id=p_professional_id and p.status='approved'
      and p.approved_at>=date_trunc('month',p_reference_month)
      and p.approved_at<date_trunc('month',p_reference_month)+interval '1 month'
  )
  select jsonb_build_object(
    'professional_id',p_professional_id,
    'reference_month',date_trunc('month',p_reference_month)::date,
    'invoice',coalesce((select jsonb_build_object('status',status,'issued_at',issued_at,'invoice_number',invoice_number,'due_business_date',due_business_date,'drive_file_id',drive_file_id) from inv),'{}'::jsonb),
    'invoice_ok',coalesce((select status in ('submitted','validated','late') and issued_at is not null from inv),false),
    'receivables',coalesce((select jsonb_agg(jsonb_build_object('payment_id',id,'appointment_id',appointment_id,'amount_cents',amount_cents,'payment_method',payment_method,'approved_at',approved_at,'eligible_at',eligible_at,'matured',eligible_at<=now()) order by approved_at) from pay),'[]'::jsonb),
    'matured_amount_cents',coalesce((select sum(amount_cents) from pay where eligible_at<=now()),0),
    'unmatured_amount_cents',coalesce((select sum(amount_cents) from pay where eligible_at>now()),0),
    'can_prepare_payout',coalesce((select status in ('submitted','validated','late') and issued_at is not null from inv),false) and coalesce((select count(*)>0 from pay where eligible_at<=now()),false)
  ) into v_result from prof;
  return coalesce(v_result, jsonb_build_object('professional_id',p_professional_id,'not_found',true));
end;
$function$;
REVOKE EXECUTE ON FUNCTION public.chrismed_professional_payout_eligibility(uuid,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_professional_payout_eligibility(uuid,date) TO authenticated;

-- 5) Coupon reservation can only mutate an appointment owned by the signed-in patient, or by admin/staff.
CREATE OR REPLACE FUNCTION public.chrismed_reserve_coupon_for_appointment(p_appointment_id uuid, p_coupon_code text, p_cpf text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
declare
  v_appointment public.chrismed_appointments%rowtype;
  v_offering public.chrismed_service_offerings%rowtype;
  v_calc jsonb;
  v_coupon_id uuid;
  v_cpf_clean text:=regexp_replace(coalesce(p_cpf,''),'[^0-9]','','g');
  v_redemption_id uuid;
  v_allowed boolean := false;
begin
  select * into v_appointment from public.chrismed_appointments where id=p_appointment_id for update;
  if v_appointment.id is null then raise exception 'appointment_not_found'; end if;
  if v_appointment.company_id<>'642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid then raise exception 'wrong_company'; end if;
  v_allowed := public.is_impulsionando_staff(auth.uid())
    or exists (select 1 from public.user_roles r where r.user_id=auth.uid() and r.company_id=v_appointment.company_id and r.role in ('admin','gestor'))
    or v_appointment.patient_user_id = auth.uid();
  if not v_allowed then raise exception 'not_authorized'; end if;
  if char_length(v_cpf_clean)<>11 then return jsonb_build_object('valid',false,'reason','valid_cpf_required'); end if;
  if v_appointment.patient_document_last4 is not null and right(v_cpf_clean,4)<>v_appointment.patient_document_last4 then return jsonb_build_object('valid',false,'reason','cpf_does_not_match_booking'); end if;
  select * into v_offering from public.chrismed_service_offerings where id=v_appointment.offering_id and active;
  if v_offering.id is null then raise exception 'offering_not_found'; end if;
  v_calc:=public.chrismed_calculate_coupon(p_coupon_code,v_cpf_clean,v_offering.id,v_offering.price_cents);
  if coalesce((v_calc->>'valid')::boolean,false)=false then return v_calc; end if;
  v_coupon_id:=(v_calc->>'coupon_id')::uuid;
  insert into public.chrismed_coupon_redemptions(company_id,coupon_id,appointment_id,cpf_hash,cpf_last4,gross_amount_cents,discount_amount_cents,net_amount_cents,status,reserved_until,metadata)
  values(v_appointment.company_id,v_coupon_id,v_appointment.id,public.chrismed_coupon_cpf_hash(v_cpf_clean),right(v_cpf_clean,4),(v_calc->>'gross_amount_cents')::integer,(v_calc->>'discount_amount_cents')::integer,(v_calc->>'net_amount_cents')::integer,'reserved',v_appointment.hold_expires_at,jsonb_build_object('coupon_code',v_calc->>'code'))
  on conflict(coupon_id,appointment_id) do update set cpf_hash=excluded.cpf_hash,cpf_last4=excluded.cpf_last4,gross_amount_cents=excluded.gross_amount_cents,discount_amount_cents=excluded.discount_amount_cents,net_amount_cents=excluded.net_amount_cents,status='reserved',reserved_until=excluded.reserved_until,released_at=null,updated_at=now()
  returning id into v_redemption_id;
  update public.chrismed_appointments set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('coupon',jsonb_build_object('redemption_id',v_redemption_id,'coupon_id',v_coupon_id,'code',v_calc->>'code','gross_amount_cents',(v_calc->>'gross_amount_cents')::integer,'discount_amount_cents',(v_calc->>'discount_amount_cents')::integer,'net_amount_cents',(v_calc->>'net_amount_cents')::integer),'checkout_amount_cents',(v_calc->>'net_amount_cents')::integer),updated_at=now() where id=v_appointment.id;
  return v_calc||jsonb_build_object('redemption_id',v_redemption_id);
end;
$function$;
REVOKE EXECUTE ON FUNCTION public.chrismed_reserve_coupon_for_appointment(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_reserve_coupon_for_appointment(uuid,text,text) TO authenticated;
