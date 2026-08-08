
-- aff_affiliates: require aff.affiliate.read permission for SELECT (keep self-access)
DROP POLICY IF EXISTS aff_affiliates_select ON public.aff_affiliates;
CREATE POLICY aff_affiliates_select ON public.aff_affiliates
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (
    public.user_belongs_to_company(auth.uid(), company_id)
    AND public.user_has_permission(auth.uid(), company_id, 'aff.affiliate.read')
  )
);

-- aff_coproducers: require aff.coproducer.read permission for SELECT (keep self-access)
DROP POLICY IF EXISTS aff_coproducers_select ON public.aff_coproducers;
CREATE POLICY aff_coproducers_select ON public.aff_coproducers
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (
    public.user_belongs_to_company(auth.uid(), company_id)
    AND public.user_has_permission(auth.uid(), company_id, 'aff.coproducer.read')
  )
);

-- aff_managers: require permission for cross-user reads; self-access still allowed but scoped to company membership
DROP POLICY IF EXISTS aff_managers_select ON public.aff_managers;
CREATE POLICY aff_managers_select ON public.aff_managers
FOR SELECT TO authenticated
USING (
  (user_id = auth.uid() AND public.user_belongs_to_company(auth.uid(), company_id))
  OR (
    public.user_belongs_to_company(auth.uid(), company_id)
    AND public.user_has_permission(auth.uid(), company_id, 'aff.manager.read')
  )
);

-- aff_commissions: scope self-access by company membership
DROP POLICY IF EXISTS aff_commissions_select ON public.aff_commissions;
CREATE POLICY aff_commissions_select ON public.aff_commissions
FOR SELECT TO authenticated
USING (
  (recipient_user_id = auth.uid() AND public.user_belongs_to_company(auth.uid(), company_id))
  OR (
    public.user_belongs_to_company(auth.uid(), company_id)
    AND public.user_has_permission(auth.uid(), company_id, 'aff.commission.read')
  )
);

-- aff_payouts: scope self SELECT by company membership
DROP POLICY IF EXISTS aff_payouts_select ON public.aff_payouts;
CREATE POLICY aff_payouts_select ON public.aff_payouts
FOR SELECT TO authenticated
USING (
  (recipient_user_id = auth.uid() AND public.user_belongs_to_company(auth.uid(), company_id))
  OR (
    public.user_belongs_to_company(auth.uid(), company_id)
    AND public.user_has_permission(auth.uid(), company_id, 'aff.payout.read')
  )
);

-- aff_payouts: scope self INSERT by company membership
DROP POLICY IF EXISTS aff_payouts_insert_self ON public.aff_payouts;
CREATE POLICY aff_payouts_insert_self ON public.aff_payouts
FOR INSERT TO authenticated
WITH CHECK (
  recipient_user_id = auth.uid()
  AND public.user_belongs_to_company(auth.uid(), company_id)
);
