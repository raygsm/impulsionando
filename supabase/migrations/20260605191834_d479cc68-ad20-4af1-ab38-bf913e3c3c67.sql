-- Fix 1: Remove direct INSERT into message_outbox from clients.
-- Enqueueing must go through SECURITY DEFINER public.enqueue_message (which bypasses RLS)
-- or service_role code. Removing this policy blocks tenant users from injecting
-- arbitrary messages with recipient emails/phones/bodies into the outbox.
DROP POLICY IF EXISTS mo_insert ON public.message_outbox;

-- Fix 2: Restrict reading peer profiles to users with the 'users.read' permission.
-- Users can still always read their own user_profiles row.
DROP POLICY IF EXISTS up_select ON public.user_profiles;
CREATE POLICY up_select ON public.user_profiles
  FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'users.read')
    )
  );