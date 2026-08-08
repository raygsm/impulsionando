-- Trigger functions are invoked by PostgreSQL and must not be callable by API roles.

revoke execute on function private.wmp_set_updated_at()
  from public, anon, authenticated, service_role;

revoke execute on function private.wmp_write_audit_log()
  from public, anon, authenticated, service_role;
