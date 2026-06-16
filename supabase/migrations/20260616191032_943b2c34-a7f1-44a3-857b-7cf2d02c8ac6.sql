
DROP POLICY IF EXISTS "realestate_matches_service_write" ON public.realestate_property_matches;

CREATE POLICY "suppressed_emails_staff_read"
  ON public.suppressed_emails FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));
