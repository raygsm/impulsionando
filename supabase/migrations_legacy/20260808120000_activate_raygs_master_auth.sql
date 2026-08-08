-- Canonical master identity for the Impulsionando multi-tenant Core.
-- Passwords are intentionally never stored here; recovery is handled by Supabase Auth.

UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'platform_role', 'super_admin',
  'is_super_admin', true,
  'is_impulsionando_staff', true,
  'master_email', 'raygs@hotmail.com',
  'access_scope', 'all_clients'
)
WHERE id = '3f2e2101-190d-44f2-8102-57dddfd34c91'::uuid
  AND lower(email) = 'raygs@hotmail.com';

CREATE OR REPLACE FUNCTION public.is_super_admin(_user uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  profile_match boolean := false;
BEGIN
  IF _user IS DISTINCT FROM auth.uid() THEN RETURN false; END IF;
  IF to_regclass('public.user_profiles') IS NOT NULL AND to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.user_profiles up JOIN public.profiles p ON p.id=up.profile_id WHERE up.user_id=$1 AND up.is_active=true AND p.slug=''super-admin-impulsionando'')'
      INTO profile_match USING _user;
  END IF;
  RETURN profile_match OR EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id=_user
      AND (u.raw_app_meta_data->>'is_super_admin')::boolean IS TRUE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_impulsionando_staff(_user uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  profile_match boolean := false;
BEGIN
  IF _user IS DISTINCT FROM auth.uid() THEN RETURN false; END IF;
  IF to_regclass('public.user_profiles') IS NOT NULL AND to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.user_profiles up JOIN public.profiles p ON p.id=up.profile_id WHERE up.user_id=$1 AND up.is_active=true AND p.is_master_profile=true)'
      INTO profile_match USING _user;
  END IF;
  RETURN profile_match OR EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id=_user
      AND ((u.raw_app_meta_data->>'is_impulsionando_staff')::boolean IS TRUE
        OR (u.raw_app_meta_data->>'is_super_admin')::boolean IS TRUE)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_impulsionando_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_impulsionando_staff(uuid) TO authenticated, service_role;

-- Minimal-project compatibility. Full installations already expose the app_role overload.
DO $$
BEGIN
  IF to_regtype('public.app_role') IS NULL THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $body$
        SELECT _user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM auth.users u WHERE u.id=_user_id
            AND ((u.raw_app_meta_data->>'is_super_admin')::boolean IS TRUE
              OR u.raw_app_meta_data->>'platform_role' = _role)
        )
      $body$
    $fn$;
    REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
  END IF;
END;
$$;
