
ALTER VIEW public.v_tenant_identity_status SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.provision_tenant_identity(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_tenant_subdomain(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trg_companies_provision_identity() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.normalize_subdomain(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.provision_tenant_identity(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_tenant_subdomain(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.normalize_subdomain(text) TO authenticated, service_role;
