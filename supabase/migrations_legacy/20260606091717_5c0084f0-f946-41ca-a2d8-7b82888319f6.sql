-- Affiliate self-access: assert affiliate.company_id == sale.company_id
DROP POLICY IF EXISTS aff_sales_select ON public.aff_sales;
CREATE POLICY aff_sales_select ON public.aff_sales
FOR SELECT
USING (
  is_impulsionando_staff(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND EXISTS (
      SELECT 1 FROM public.aff_affiliates a
      WHERE a.id = aff_sales.affiliate_id
        AND a.user_id = auth.uid()
        AND a.company_id = aff_sales.company_id
    )
  )
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'aff.sale.read')
  )
);

-- EHR patient self-access: require active company membership too
DROP POLICY IF EXISTS ehr_records_patient_select ON public.ehr_records;
CREATE POLICY ehr_records_patient_select ON public.ehr_records
FOR SELECT
USING (
  user_belongs_to_company(auth.uid(), company_id)
  AND EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = ehr_records.customer_id
      AND c.patient_user_id = auth.uid()
  )
);

-- fin_payments INSERT/UPDATE: explicit tenant scope check
DROP POLICY IF EXISTS fin_payments_insert ON public.fin_payments;
CREATE POLICY fin_payments_insert ON public.fin_payments
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'finance.payment.write')
  )
);

DROP POLICY IF EXISTS fin_payments_update ON public.fin_payments;
CREATE POLICY fin_payments_update ON public.fin_payments
FOR UPDATE
USING (
  is_super_admin(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'finance.payment.write')
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'finance.payment.write')
  )
);