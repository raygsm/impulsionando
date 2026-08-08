
-- Restrict billing_contracts SELECT to staff or members with finance.transaction.read
DROP POLICY IF EXISTS "Company can read own contract" ON public.billing_contracts;
CREATE POLICY "Company can read own contract"
ON public.billing_contracts FOR SELECT TO authenticated
USING (
  is_impulsionando_staff(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.transaction.read'))
);

-- Restrict billing_invoices SELECT similarly
DROP POLICY IF EXISTS "Company reads own invoices" ON public.billing_invoices;
CREATE POLICY "Company reads own invoices"
ON public.billing_invoices FOR SELECT TO authenticated
USING (
  is_impulsionando_staff(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.transaction.read'))
);

-- Restrict billing_suspensions SELECT similarly
DROP POLICY IF EXISTS "Read suspensions" ON public.billing_suspensions;
CREATE POLICY "Read suspensions"
ON public.billing_suspensions FOR SELECT TO authenticated
USING (
  is_impulsionando_staff(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.transaction.read'))
);
