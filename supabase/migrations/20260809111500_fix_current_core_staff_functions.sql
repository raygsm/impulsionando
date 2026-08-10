-- Remove retired-profile dependencies from the current Core authorization helpers.
-- The caller may only ask about its own JWT identity; authoritative flags remain
-- server-managed in auth.users.raw_app_meta_data.

CREATE OR REPLACE FUNCTION public.is_super_admin(_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT CASE
    WHEN _user IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1
      FROM auth.users AS u
      WHERE u.id = _user
        AND u.raw_app_meta_data @> '{"is_super_admin": true}'::jsonb
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.is_impulsionando_staff(_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT CASE
    WHEN _user IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1
      FROM auth.users AS u
      WHERE u.id = _user
        AND (
          u.raw_app_meta_data @> '{"is_impulsionando_staff": true}'::jsonb
          OR u.raw_app_meta_data @> '{"is_super_admin": true}'::jsonb
        )
    )
  END
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_impulsionando_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_impulsionando_staff(uuid) TO authenticated, service_role;

