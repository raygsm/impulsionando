
-- Tighten fin_categories: require company membership in addition to permission
DROP POLICY IF EXISTS fin_categories_select ON public.fin_categories;
DROP POLICY IF EXISTS fin_categories_insert ON public.fin_categories;
DROP POLICY IF EXISTS fin_categories_update ON public.fin_categories;
DROP POLICY IF EXISTS fin_categories_delete ON public.fin_categories;

CREATE POLICY fin_categories_select ON public.fin_categories
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'finance.category.read')
    )
  );

CREATE POLICY fin_categories_insert ON public.fin_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'finance.category.write')
    )
  );

CREATE POLICY fin_categories_update ON public.fin_categories
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'finance.category.write')
    )
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'finance.category.write')
    )
  );

CREATE POLICY fin_categories_delete ON public.fin_categories
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'finance.category.write')
    )
  );

-- Allow service_role to insert notifications (background workers / server fns)
DROP POLICY IF EXISTS notifications_insert_service ON public.notifications;
CREATE POLICY notifications_insert_service ON public.notifications
  FOR INSERT TO service_role
  WITH CHECK (true);
