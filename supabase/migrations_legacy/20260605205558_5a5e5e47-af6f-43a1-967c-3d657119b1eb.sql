
-- Tighten SELECT policies to require *.read permissions
DROP POLICY IF EXISTS units_select ON public.company_units;
CREATE POLICY units_select ON public.company_units FOR SELECT
USING (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'units.read')));

DROP POLICY IF EXISTS sectors_select ON public.sectors;
CREATE POLICY sectors_select ON public.sectors FOR SELECT
USING (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'sectors.read')));

DROP POLICY IF EXISTS cm_select ON public.company_modules;
CREATE POLICY cm_select ON public.company_modules FOR SELECT
USING (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'modules.read')));

-- audit_logs: prevent tampering by authenticated users (inserts happen via SECURITY DEFINER trigger tg_audit, which bypasses RLS)
DROP POLICY IF EXISTS audit_no_insert ON public.audit_logs;
CREATE POLICY audit_no_insert ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS audit_no_update ON public.audit_logs;
CREATE POLICY audit_no_update ON public.audit_logs FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS audit_no_delete ON public.audit_logs;
CREATE POLICY audit_no_delete ON public.audit_logs FOR DELETE TO authenticated USING (false);

-- fin_payments: make deletion-prohibition explicit
DROP POLICY IF EXISTS fin_payments_no_delete ON public.fin_payments;
CREATE POLICY fin_payments_no_delete ON public.fin_payments FOR DELETE TO authenticated USING (false);
