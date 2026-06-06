
DROP POLICY IF EXISTS sales_items_select ON public.sales_order_items;
DROP POLICY IF EXISTS sales_items_write ON public.sales_order_items;
DROP POLICY IF EXISTS sales_pay_select ON public.sales_payments;
DROP POLICY IF EXISTS sales_pay_write ON public.sales_payments;

CREATE POLICY sales_items_select ON public.sales_order_items FOR SELECT TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'sales.order.read'));
CREATE POLICY sales_items_write ON public.sales_order_items FOR ALL TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'sales.order.write'))
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'sales.order.write'));

CREATE POLICY sales_pay_select ON public.sales_payments FOR SELECT TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'sales.order.read'));
CREATE POLICY sales_pay_write ON public.sales_payments FOR ALL TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'sales.order.write'))
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'sales.order.write'));

CREATE POLICY trial_subs_anon_no_insert ON public.trial_subscriptions FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY trial_subs_anon_no_select ON public.trial_subscriptions FOR SELECT TO anon USING (false);
CREATE POLICY trial_subs_anon_no_update ON public.trial_subscriptions FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY trial_subs_anon_no_delete ON public.trial_subscriptions FOR DELETE TO anon USING (false);
