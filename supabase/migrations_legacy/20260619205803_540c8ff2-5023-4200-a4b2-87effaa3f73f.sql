DROP POLICY IF EXISTS refund_write ON public.core_refund_rules;
CREATE POLICY refund_write ON public.core_refund_rules
  FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND (public.has_role(auth.uid(), 'admin'::app_role)
             OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write')))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND (public.has_role(auth.uid(), 'admin'::app_role)
             OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write')))
  );

DROP POLICY IF EXISTS resched_write ON public.core_reschedule_rules;
CREATE POLICY resched_write ON public.core_reschedule_rules
  FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND (public.has_role(auth.uid(), 'admin'::app_role)
             OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write')))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND (public.has_role(auth.uid(), 'admin'::app_role)
             OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write')))
  );