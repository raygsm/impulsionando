
DROP POLICY IF EXISTS crm_lead_select ON public.crm_leads;
DROP POLICY IF EXISTS crm_lead_insert ON public.crm_leads;
DROP POLICY IF EXISTS crm_lead_update ON public.crm_leads;
DROP POLICY IF EXISTS crm_lead_delete ON public.crm_leads;

CREATE POLICY crm_lead_select ON public.crm_leads FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'crm.lead.read'))
);

CREATE POLICY crm_lead_insert ON public.crm_leads FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'crm.lead.write'))
);

CREATE POLICY crm_lead_update ON public.crm_leads FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'crm.lead.write'))
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'crm.lead.write'))
);

CREATE POLICY crm_lead_delete ON public.crm_leads FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'crm.lead.delete'))
);
