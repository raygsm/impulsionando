
-- Tighten affiliate/outbox RLS to enforce company membership on self-access branches

DROP POLICY IF EXISTS aff_affiliates_self_update ON public.aff_affiliates;
CREATE POLICY aff_affiliates_self_update ON public.aff_affiliates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (user_id = auth.uid() AND user_belongs_to_company(auth.uid(), company_id));

DROP POLICY IF EXISTS aff_coproducers_select ON public.aff_coproducers;
CREATE POLICY aff_coproducers_select ON public.aff_coproducers
  FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid() AND user_belongs_to_company(auth.uid(), company_id))
    OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.coproducer.read'))
  );

DROP POLICY IF EXISTS aff_sales_select ON public.aff_sales;
CREATE POLICY aff_sales_select ON public.aff_sales
  FOR SELECT TO authenticated
  USING (
    is_impulsionando_staff(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND EXISTS (
        SELECT 1 FROM public.aff_affiliates a
        WHERE a.id = aff_sales.affiliate_id AND a.user_id = auth.uid()
      )
    )
    OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.sale.read'))
  );

-- Public affiliate links: stop exposing metrics + UTM to anon. Keep is_active filter.
-- Anon redirect resolution should go through a server function; revoke anon SELECT here.
DROP POLICY IF EXISTS aff_links_public_read ON public.aff_links;

-- Message outbox: require company scoping on recipient self-access branch.
DROP POLICY IF EXISTS mo_select ON public.message_outbox;
CREATE POLICY mo_select ON public.message_outbox
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND user_has_permission(auth.uid(), company_id, 'communication.outbox.read'))
    OR (recipient_user_id = auth.uid() AND company_id IS NOT NULL AND user_belongs_to_company(auth.uid(), company_id))
  );
