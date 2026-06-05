
-- CRM SELECT policies
DROP POLICY IF EXISTS crm_lead_select ON public.crm_leads;
CREATE POLICY crm_lead_select ON public.crm_leads FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.lead.read'));

DROP POLICY IF EXISTS crm_act_select ON public.crm_activities;
CREATE POLICY crm_act_select ON public.crm_activities FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.activity.read'));

DROP POLICY IF EXISTS crm_opp_select ON public.crm_opportunities;
CREATE POLICY crm_opp_select ON public.crm_opportunities FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.opportunity.read'));

DROP POLICY IF EXISTS crm_pip_select ON public.crm_pipelines;
CREATE POLICY crm_pip_select ON public.crm_pipelines FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.pipeline.read'));

DROP POLICY IF EXISTS crm_stg_select ON public.crm_stages;
CREATE POLICY crm_stg_select ON public.crm_stages FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.pipeline.read'));

-- Agenda SELECT policies
DROP POLICY IF EXISTS aa_select ON public.agenda_appointments;
CREATE POLICY aa_select ON public.agenda_appointments FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.read'));

DROP POLICY IF EXISTS ab_select ON public.agenda_blocks;
CREATE POLICY ab_select ON public.agenda_blocks FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.read'));

DROP POLICY IF EXISTS ap_select ON public.agenda_professionals;
CREATE POLICY ap_select ON public.agenda_professionals FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.professional.read'));

DROP POLICY IF EXISTS aps_select ON public.agenda_professional_services;
CREATE POLICY aps_select ON public.agenda_professional_services FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.professional.read'));

DROP POLICY IF EXISTS asch_select ON public.agenda_schedules;
CREATE POLICY asch_select ON public.agenda_schedules FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.professional.read'));

DROP POLICY IF EXISTS as_select ON public.agenda_services;
CREATE POLICY as_select ON public.agenda_services FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.service.read'));

DROP POLICY IF EXISTS aw_select ON public.agenda_waitlist;
CREATE POLICY aw_select ON public.agenda_waitlist FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'agenda.appointment.read'));

-- message_outbox UPDATE: restrict to authenticated role
DROP POLICY IF EXISTS mo_update ON public.message_outbox;
CREATE POLICY mo_update ON public.message_outbox FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()) OR ((company_id IS NOT NULL) AND user_has_permission(auth.uid(), company_id, 'communication.outbox.write')))
WITH CHECK (is_super_admin(auth.uid()) OR ((company_id IS NOT NULL) AND user_has_permission(auth.uid(), company_id, 'communication.outbox.write')));
