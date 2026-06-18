
INSERT INTO public.permissions (code, module, description) VALUES
  ('contab.onboarding.read', 'contab', 'Ler onboarding contábil'),
  ('contab.irpf.read', 'contab', 'Ler jornadas de IRPF (PII)'),
  ('contab.contract.read', 'contab', 'Ler contratos contábeis'),
  ('company.settings.read', 'company', 'Ler regras de cancelamento/reagendamento')
ON CONFLICT (code) DO NOTHING;

-- billing_plans: hide internal_notes column from non-staff via column-level revocation
REVOKE SELECT (internal_notes) ON public.billing_plans FROM anon, authenticated;
-- staff still reads it via service_role / specific role grants

-- contab_onboarding
DROP POLICY IF EXISTS onb_select ON public.contab_onboarding;
CREATE POLICY onb_select ON public.contab_onboarding
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'contab.onboarding.read'))
);

-- contab_irpf_journeys
DROP POLICY IF EXISTS irpf_j_select ON public.contab_irpf_journeys;
CREATE POLICY irpf_j_select ON public.contab_irpf_journeys
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'contab.irpf.read'))
);

-- contab_contracts
DROP POLICY IF EXISTS ctr_select ON public.contab_contracts;
CREATE POLICY ctr_select ON public.contab_contracts
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'contab.contract.read'))
);

-- core_reschedule_rules
DROP POLICY IF EXISTS resched_select ON public.core_reschedule_rules;
CREATE POLICY resched_select ON public.core_reschedule_rules
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'company.settings.read'))
);

-- core_refund_rules
DROP POLICY IF EXISTS refund_select ON public.core_refund_rules;
CREATE POLICY refund_select ON public.core_refund_rules
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'company.settings.read'))
);
