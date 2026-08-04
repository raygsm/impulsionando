-- Service-role-only bridge for the optional Cloudflare cache self-healing token.
-- The secret value remains in Supabase Vault and is never persisted in app tables.
create or replace function public.get_deployment_vault_secret(_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_value text;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if _name <> 'CLOUDFLARE_API_TOKEN' then
    raise exception 'secret name is not allow-listed';
  end if;

  select decrypted_secret
    into secret_value
    from vault.decrypted_secrets
   where name = _name
   limit 1;

  if secret_value is null then
    raise exception 'deployment secret is not configured';
  end if;
  return secret_value;
end;
$$;

revoke all on function public.get_deployment_vault_secret(text) from public, anon, authenticated;
grant execute on function public.get_deployment_vault_secret(text) to service_role;
