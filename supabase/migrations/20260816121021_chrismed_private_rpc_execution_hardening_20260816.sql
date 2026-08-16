-- CHRISMED: harden client-exposed SECURITY DEFINER RPCs that require authentication or privileged roles.
-- Public token/registration/checkout RPCs are intentionally left untouched.

REVOKE EXECUTE ON FUNCTION public.chrismed_add_clinical_entry(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_add_clinical_entry(uuid,text,text,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_approve_patient(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_approve_patient(uuid,boolean,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_bind_my_oliver_session(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_bind_my_oliver_session(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_complete_patient_fiscal_profile(text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_complete_patient_fiscal_profile(text,text,text,text,text,text,text,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_get_my_professional_finance_dashboard(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_get_my_professional_finance_dashboard(date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_get_my_support_tickets() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_get_my_support_tickets() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_get_or_open_clinical_record(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_get_or_open_clinical_record(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_is_clinical_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_is_clinical_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_is_linked_professional(uuid,uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_is_linked_professional(uuid,uuid,uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_occ_approve_company_request(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_occ_approve_company_request(uuid,boolean,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_occ_can_manage_company(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_occ_can_manage_company(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_occ_dispatch_referral(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_occ_dispatch_referral(uuid,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_occ_invite_company_user(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_occ_invite_company_user(uuid,text,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_patient_can_reschedule(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_patient_can_reschedule(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_professional_payout_eligibility(uuid,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_professional_payout_eligibility(uuid,date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_request_my_conversation_export(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_request_my_conversation_export(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_reserve_coupon_for_appointment(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_reserve_coupon_for_appointment(uuid,text,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_review_professional(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_review_professional(uuid,boolean,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_set_clinical_record_status(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_set_clinical_record_status(uuid,text,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_sign_clinical_entry(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_sign_clinical_entry(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_submit_professional_invoice(date,text,timestamptz,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_submit_professional_invoice(date,text,timestamptz,text,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.chrismed_support_management_overview(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chrismed_support_management_overview(integer) TO authenticated;

ALTER FUNCTION public.chrismed_normalize_coupon_code(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.chrismed_first_business_day(date) SET search_path = public, pg_temp;
