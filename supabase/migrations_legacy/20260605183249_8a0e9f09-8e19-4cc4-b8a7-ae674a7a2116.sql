
-- 1. Fix function search_path
ALTER FUNCTION public._trial_norm(text) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

-- 2. audit_logs: require audit.read permission or super admin
DROP POLICY IF EXISTS audit_select ON public.audit_logs;
CREATE POLICY audit_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.user_has_permission(auth.uid(), company_id, 'audit.read'))
  );

-- 3. profile_permissions: restrict to staff or users whose own profile maps to it
DROP POLICY IF EXISTS pp_read ON public.profile_permissions;
CREATE POLICY pp_read ON public.profile_permissions
  FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.is_active = true
        AND up.profile_id = profile_permissions.profile_id
    )
  );

-- 4. profiles: restrict to staff or users assigned to the profile
DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.is_active = true
        AND up.profile_id = profiles.id
    )
  );

-- 5. trial_settings: staff-only read
DROP POLICY IF EXISTS trial_settings_read_authenticated ON public.trial_settings;
CREATE POLICY trial_settings_read_staff ON public.trial_settings
  FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

-- 6. trial_subscriptions: drop company-member branch
DROP POLICY IF EXISTS trial_subs_select_self_or_staff ON public.trial_subscriptions;
CREATE POLICY trial_subs_select_self_or_staff ON public.trial_subscriptions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_impulsionando_staff(auth.uid())
  );
