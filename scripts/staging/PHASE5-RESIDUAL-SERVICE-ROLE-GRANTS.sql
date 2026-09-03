-- Phase 5 residual — service_role table GRANTs (staging ONLY: aamorcqznimmleafavai)
-- Paste once in Supabase SQL Editor after PHASE5-PENDING-DASHBOARD.sql.
-- Why: tables had RLS + REVOKE PUBLIC but no GRANT to service_role → API/smokes hit
-- "permission denied" on SELECT/INSERT even though RPCs are SECURITY DEFINER.
-- Never run on prod (arygtqrdpcdkwnuwsgmm).

GRANT SELECT, INSERT, UPDATE ON TABLE public.reengineering_event_outbox TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.reengineering_crm_journey TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.reengineering_crm_invite TO service_role;

-- Defense in depth (service_role still bypasses RLS in Supabase; policies keep intent clear)
DROP POLICY IF EXISTS reengineering_event_outbox_service_role ON public.reengineering_event_outbox;
CREATE POLICY reengineering_event_outbox_service_role
  ON public.reengineering_event_outbox
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS reengineering_crm_journey_service_role ON public.reengineering_crm_journey;
CREATE POLICY reengineering_crm_journey_service_role
  ON public.reengineering_crm_journey
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS reengineering_crm_invite_service_role ON public.reengineering_crm_invite;
CREATE POLICY reengineering_crm_invite_service_role
  ON public.reengineering_crm_invite
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
