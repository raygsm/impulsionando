DROP POLICY IF EXISTS "off_fin_select" ON public.contab_office_finance;
CREATE POLICY "off_fin_select" ON public.contab_office_finance
FOR SELECT
USING (
  is_impulsionando_staff(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.finance.read'::text)
      OR user_has_permission(auth.uid(), company_id, 'contab.finance.write'::text)
    )
  )
);

DROP POLICY IF EXISTS "off_fin_write" ON public.contab_office_finance;
CREATE POLICY "off_fin_write" ON public.contab_office_finance
FOR ALL
USING (
  is_impulsionando_staff(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.finance.write'::text)
    )
  )
)
WITH CHECK (
  is_impulsionando_staff(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.finance.write'::text)
    )
  )
);