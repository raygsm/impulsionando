DROP POLICY IF EXISTS aff_affiliates_select ON public.aff_affiliates;
CREATE POLICY aff_affiliates_select ON public.aff_affiliates
  FOR SELECT TO authenticated
  USING (
    ((user_id = auth.uid()) AND user_belongs_to_company(auth.uid(), company_id))
    OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.read'))
  );

DROP POLICY IF EXISTS customers_patient_self_select ON public.customers;
CREATE POLICY customers_patient_self_select ON public.customers
  FOR SELECT TO authenticated
  USING (
    (patient_user_id = auth.uid()) AND user_belongs_to_company(auth.uid(), company_id)
  );