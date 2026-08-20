revoke execute on function public.billing_finalize_initial_checkout(uuid) from public;
revoke execute on function public.billing_finalize_initial_checkout(uuid) from anon;
revoke execute on function public.billing_finalize_initial_checkout(uuid) from authenticated;
grant execute on function public.billing_finalize_initial_checkout(uuid) to service_role;
