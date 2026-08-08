-- fin_accounts
DROP POLICY IF EXISTS "fin_accounts_select" ON public.fin_accounts;
CREATE POLICY "fin_accounts_select" ON public.fin_accounts
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.user_has_permission(auth.uid(), company_id, 'finance.account.read')
  );

-- fin_categories
DROP POLICY IF EXISTS "fin_categories_select" ON public.fin_categories;
CREATE POLICY "fin_categories_select" ON public.fin_categories
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.user_has_permission(auth.uid(), company_id, 'finance.category.read')
  );

-- fin_payment_methods
DROP POLICY IF EXISTS "fin_pm_select" ON public.fin_payment_methods;
CREATE POLICY "fin_pm_select" ON public.fin_payment_methods
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.user_has_permission(auth.uid(), company_id, 'finance.method.read')
  );

-- company_settings
DROP POLICY IF EXISTS "cs_select" ON public.company_settings;
CREATE POLICY "cs_select" ON public.company_settings
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.user_has_permission(auth.uid(), company_id, 'company.settings.read')
  );

-- message_templates (company_id pode ser NULL para templates globais)
DROP POLICY IF EXISTS "mt_select" ON public.message_templates;
CREATE POLICY "mt_select" ON public.message_templates
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      company_id IS NOT NULL
      AND public.user_has_permission(auth.uid(), company_id, 'communication.template.read')
    )
  );

-- user_permission_overrides
DROP POLICY IF EXISTS "upo_select" ON public.user_permission_overrides;
CREATE POLICY "upo_select" ON public.user_permission_overrides
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.user_has_permission(auth.uid(), company_id, 'users.read')
  );