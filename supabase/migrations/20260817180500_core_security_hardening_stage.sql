-- HOMOLOGACAO ONLY: P0 permission hardening staged for review/testing.
-- Do not promote to production until authenticated/public flows are smoke-tested.

begin;

-- Billing plan-change operations are authenticated workflows.
revoke execute on function public.billing_plan_change_quote(uuid, uuid, date) from public, anon;
revoke execute on function public.billing_request_plan_change(uuid, uuid, date) from public, anon;
revoke execute on function public.billing_accept_plan_change(uuid, text, text, text) from public, anon;
grant execute on function public.billing_plan_change_quote(uuid, uuid, date) to authenticated;
grant execute on function public.billing_request_plan_change(uuid, uuid, date) to authenticated;
grant execute on function public.billing_accept_plan_change(uuid, text, text, text) to authenticated;

-- Legacy generic inventory search bypasses the new paid-club entitlement gate.
-- Keep it server-side only; consumer inventory search must use core_search_paid_inventory().
revoke execute on function public.core_inventory_search(text, integer) from public, anon, authenticated;
grant execute on function public.core_inventory_search(text, integer) to service_role;

-- CP helper RPCs inherited PUBLIC execute. They expose membership/eligibility metadata
-- or mutate invitation state and therefore must require an authenticated session.
revoke execute on function public.cp_can_invite(uuid) from public, anon;
revoke execute on function public.cp_is_user_financially_eligible(uuid) from public, anon;
revoke execute on function public.cp_owner_confirm_invitation(uuid) from public, anon;
grant execute on function public.cp_can_invite(uuid) to authenticated;
grant execute on function public.cp_is_user_financially_eligible(uuid) to authenticated;
grant execute on function public.cp_owner_confirm_invitation(uuid) to authenticated;

commit;
