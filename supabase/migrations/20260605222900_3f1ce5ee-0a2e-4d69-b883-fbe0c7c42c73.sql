-- Tighten fin_transactions INSERT/UPDATE/DELETE to also verify company membership
DROP POLICY IF EXISTS fin_tx_insert ON public.fin_transactions;
CREATE POLICY fin_tx_insert ON public.fin_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.transaction.write')
    )
  );

DROP POLICY IF EXISTS fin_tx_update ON public.fin_transactions;
CREATE POLICY fin_tx_update ON public.fin_transactions
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.transaction.write')
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.transaction.write')
    )
  );

DROP POLICY IF EXISTS fin_tx_delete ON public.fin_transactions;
CREATE POLICY fin_tx_delete ON public.fin_transactions
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'finance.transaction.delete')
    )
  );

-- Restrict notifications INSERT to super admin only.
-- Application code creates notifications via SECURITY DEFINER function
-- public.notify_user(), which bypasses RLS — so removing the self-insert
-- branch does not break any legitimate flow but prevents users from
-- spamming arbitrary rows into their own inbox with any company_id/category.
DROP POLICY IF EXISTS "Super admin inserts notifications" ON public.notifications;
CREATE POLICY "Super admin inserts notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));