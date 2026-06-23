
DROP POLICY IF EXISTS "ol_read" ON public.order_logistics;
DROP POLICY IF EXISTS "ol_write" ON public.order_logistics;
CREATE POLICY "ol_tenant_read" ON public.order_logistics FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));
CREATE POLICY "ol_tenant_write" ON public.order_logistics FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "oe_read" ON public.order_events;
DROP POLICY IF EXISTS "oe_insert" ON public.order_events;
CREATE POLICY "oe_tenant_read" ON public.order_events FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));
CREATE POLICY "oe_tenant_insert" ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "ctq_read" ON public.crm_touch_queue;
CREATE POLICY "ctq_tenant_read" ON public.crm_touch_queue FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "ctr_read" ON public.crm_touch_rules;
CREATE POLICY "ctr_tenant_read" ON public.crm_touch_rules FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "mcl_read" ON public.module_change_log;
CREATE POLICY "mcl_tenant_read" ON public.module_change_log FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "riomed_ai_runs_insert" ON public.riomed_ai_runs;
CREATE POLICY "riomed_ai_runs_tenant_insert" ON public.riomed_ai_runs FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "riomed_aut_runs_insert" ON public.riomed_automation_runs;
CREATE POLICY "riomed_aut_runs_tenant_insert" ON public.riomed_automation_runs FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "riomed_n8n_exec_insert" ON public.riomed_n8n_executions;
CREATE POLICY "riomed_n8n_exec_tenant_insert" ON public.riomed_n8n_executions FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "Public read quote by token" ON public.riomed_quotes;
