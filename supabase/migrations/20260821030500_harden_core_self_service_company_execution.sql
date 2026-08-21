-- Restrict SECURITY DEFINER execution to the roles that actually own each Core flow.

revoke all on function public.core_self_service_create_company(text,text,text,text,text) from public, anon;
grant execute on function public.core_self_service_create_company(text,text,text,text,text) to authenticated;

revoke all on function public.billing_create_initial_checkout_session(uuid,uuid,text,text,text,text,text,text,text,inet) from public, anon;
grant execute on function public.billing_create_initial_checkout_session(uuid,uuid,text,text,text,text,text,text,text,inet) to authenticated, service_role;
