create or replace function public.save_mpago_credentials(
  p_company_id uuid,
  p_environment text,
  p_access_token text,
  p_public_key text,
  p_webhook_secret text default null,
  p_user_id_mp text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, vault, pg_temp
as $$
declare
  v_allowed boolean := false;
  v_env text := lower(trim(p_environment));
  v_access_name text;
  v_webhook_name text;
  v_secret_id uuid;
  v_credential_id uuid;
begin
  v_allowed := public.is_impulsionando_staff(auth.uid()) or exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid()
      and r.company_id = p_company_id
      and r.role in ('admin','gestor')
  );
  if not v_allowed then raise exception 'not_authorized'; end if;
  if v_env not in ('sandbox','production') then raise exception 'invalid_environment'; end if;
  if length(trim(coalesce(p_access_token,''))) < 20 then raise exception 'invalid_access_token'; end if;
  if length(trim(coalesce(p_public_key,''))) < 10 then raise exception 'invalid_public_key'; end if;

  v_access_name := 'mpago:' || p_company_id::text || ':' || v_env || ':access_token';
  v_webhook_name := case when nullif(trim(coalesce(p_webhook_secret,'')),'') is null then null
                         else 'mpago:' || p_company_id::text || ':' || v_env || ':webhook_secret' end;

  select id into v_secret_id from vault.secrets where name = v_access_name order by created_at desc limit 1;
  if v_secret_id is null then
    perform vault.create_secret(trim(p_access_token), v_access_name, 'Mercado Pago access token ' || v_env, null);
  else
    perform vault.update_secret(v_secret_id, trim(p_access_token), v_access_name, 'Mercado Pago access token ' || v_env, null);
  end if;

  if v_webhook_name is not null then
    v_secret_id := null;
    select id into v_secret_id from vault.secrets where name = v_webhook_name order by created_at desc limit 1;
    if v_secret_id is null then
      perform vault.create_secret(trim(p_webhook_secret), v_webhook_name, 'Mercado Pago webhook secret ' || v_env, null);
    else
      perform vault.update_secret(v_secret_id, trim(p_webhook_secret), v_webhook_name, 'Mercado Pago webhook secret ' || v_env, null);
    end if;
  end if;

  insert into public.mpago_credentials(
    company_id, environment, access_token_secret_name, public_key,
    webhook_secret_name, user_id_mp, active, created_at, updated_at
  ) values (
    p_company_id, v_env, v_access_name, trim(p_public_key),
    v_webhook_name, nullif(trim(coalesce(p_user_id_mp,'')),''), true, now(), now()
  )
  on conflict (company_id, environment) do update set
    access_token_secret_name = excluded.access_token_secret_name,
    public_key = excluded.public_key,
    webhook_secret_name = excluded.webhook_secret_name,
    user_id_mp = excluded.user_id_mp,
    active = true,
    updated_at = now()
  returning id into v_credential_id;

  return v_credential_id;
end;
$$;

revoke all on function public.save_mpago_credentials(uuid,text,text,text,text,text) from public, anon;
grant execute on function public.save_mpago_credentials(uuid,text,text,text,text,text) to authenticated, service_role;

create or replace function public.get_mpago_credentials_masked(p_company_id uuid)
returns table(
  environment text,
  public_key_masked text,
  access_token_configured boolean,
  webhook_configured boolean,
  user_id_mp text,
  active boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, vault, pg_temp
as $$
begin
  if not (
    public.is_impulsionando_staff(auth.uid()) or exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid()
        and r.company_id = p_company_id
        and r.role in ('admin','gestor')
    )
  ) then
    raise exception 'not_authorized';
  end if;

  return query
  select
    c.environment,
    case when length(c.public_key) <= 12 then repeat('*', greatest(length(c.public_key)-4,0)) || right(c.public_key,4)
         else left(c.public_key,6) || repeat('*', greatest(length(c.public_key)-10,0)) || right(c.public_key,4) end,
    exists(select 1 from vault.secrets s where s.name = c.access_token_secret_name),
    c.webhook_secret_name is not null and exists(select 1 from vault.secrets s where s.name = c.webhook_secret_name),
    c.user_id_mp,
    c.active,
    c.updated_at
  from public.mpago_credentials c
  where c.company_id = p_company_id
  order by c.environment;
end;
$$;

revoke all on function public.get_mpago_credentials_masked(uuid) from public, anon;
grant execute on function public.get_mpago_credentials_masked(uuid) to authenticated, service_role;
