
-- Harden function search_path
CREATE OR REPLACE FUNCTION public.clube_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Helper macros via inline policies. We use user_has_permission(user, company, perm) + has_role(user,'admin').

-- contab_contracts
DROP POLICY IF EXISTS ctr_all ON public.contab_contracts;
CREATE POLICY ctr_select ON public.contab_contracts FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY ctr_write ON public.contab_contracts FOR ALL TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.contract.write'))
)
WITH CHECK (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.contract.write'))
);

-- contab_irpf_journeys
DROP POLICY IF EXISTS irpf_j_all ON public.contab_irpf_journeys;
CREATE POLICY irpf_j_select ON public.contab_irpf_journeys FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY irpf_j_write ON public.contab_irpf_journeys FOR ALL TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.irpf.write'))
)
WITH CHECK (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.irpf.write'))
);

-- contab_irpf_steps (write needs perm on parent journey's company)
DROP POLICY IF EXISTS irpf_s_all ON public.contab_irpf_steps;
CREATE POLICY irpf_s_select ON public.contab_irpf_steps FOR SELECT TO authenticated
USING (journey_id IN (
  SELECT id FROM public.contab_irpf_journeys
  WHERE company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
));
CREATE POLICY irpf_s_write ON public.contab_irpf_steps FOR ALL TO authenticated
USING (journey_id IN (
  SELECT j.id FROM public.contab_irpf_journeys j
  WHERE j.company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), j.company_id, 'contab.irpf.write'))
))
WITH CHECK (journey_id IN (
  SELECT j.id FROM public.contab_irpf_journeys j
  WHERE j.company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), j.company_id, 'contab.irpf.write'))
));

-- contab_office_finance (sensitive: restrict SELECT too)
DROP POLICY IF EXISTS off_fin_all ON public.contab_office_finance;
CREATE POLICY off_fin_select ON public.contab_office_finance FOR SELECT TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.finance.read') OR public.user_has_permission(auth.uid(), company_id, 'contab.finance.write'))
);
CREATE POLICY off_fin_write ON public.contab_office_finance FOR ALL TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.finance.write'))
)
WITH CHECK (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.finance.write'))
);

-- contab_onboarding
DROP POLICY IF EXISTS onb_all ON public.contab_onboarding;
CREATE POLICY onb_select ON public.contab_onboarding FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY onb_write ON public.contab_onboarding FOR ALL TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.onboarding.write'))
)
WITH CHECK (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'contab.onboarding.write'))
);

-- core_refund_rules
DROP POLICY IF EXISTS refund_company ON public.core_refund_rules;
CREATE POLICY refund_select ON public.core_refund_rules FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY refund_write ON public.core_refund_rules FOR ALL TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write'))
)
WITH CHECK (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write'))
);

-- core_reschedule_rules
DROP POLICY IF EXISTS resched_company ON public.core_reschedule_rules;
CREATE POLICY resched_select ON public.core_reschedule_rules FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY resched_write ON public.core_reschedule_rules FOR ALL TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write'))
)
WITH CHECK (
  company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.user_has_permission(auth.uid(), company_id, 'company.settings.write'))
);
