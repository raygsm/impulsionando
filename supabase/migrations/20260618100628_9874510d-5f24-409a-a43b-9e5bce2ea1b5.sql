
DROP POLICY IF EXISTS quotes_staff_read ON public.quotes;
CREATE POLICY quotes_staff_read
ON public.quotes FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.companies c ON c.id = up.company_id
    WHERE up.user_id = auth.uid()
      AND up.is_active = true
      AND c.is_master = true
      AND user_has_permission(auth.uid(), up.company_id, 'quotes.read')
  )
);
