REVOKE ALL ON FUNCTION public.resolve_tenant_by_host(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_tenant_by_host(text) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_tenant_by_host(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_tenant_by_host(text) TO service_role;