
-- Add missing RBAC permissions
INSERT INTO public.permissions (code, module, description) VALUES
  ('comm.community.write', 'comm', 'Criar e modificar comunidades'),
  ('contab.calendar.read', 'contab', 'Ler calendário fiscal'),
  ('contab.obligation.read', 'contab', 'Ler obrigações contábeis'),
  ('core.master_data.write', 'core', 'Modificar master data da empresa'),
  ('evt.transfer.read', 'evt', 'Ler transferências de ingressos (PII)'),
  ('evt.ticket_type.write', 'evt', 'Modificar tipos de ingresso'),
  ('evt.ticket.read', 'evt', 'Ler ingressos (PII)'),
  ('restaurant.menu.write', 'restaurant', 'Modificar cardápio do restaurante')
ON CONFLICT (code) DO NOTHING;

-- Grant to default gestor profile
INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT 'fcaf3905-2f47-4afa-b16e-0844b92706e5'::uuid, id FROM public.permissions
WHERE code IN ('comm.community.write','contab.calendar.read','contab.obligation.read','core.master_data.write','evt.transfer.read','evt.ticket_type.write','evt.ticket.read','restaurant.menu.write')
ON CONFLICT DO NOTHING;

-- 1) comm_communities: require comm.community.write for mutations; keep read for company members
DROP POLICY IF EXISTS "comm_c company" ON public.comm_communities;
CREATE POLICY comm_communities_select ON public.comm_communities FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY comm_communities_write ON public.comm_communities FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'comm.community.write')))
  WITH CHECK (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'comm.community.write')));

-- 2) companies vitrine: restrict anon column access to non-sensitive columns
REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (id, niche_id, name, trade_name, logo_url, segment, primary_color, secondary_color,
  website, instagram, facebook, address_city, address_state, public_slug, vitrine_enabled,
  company_type, company_kind, is_active, status) ON public.companies TO anon;

-- 3) contab_fiscal_calendar: require read permission
DROP POLICY IF EXISTS contab_cal_select ON public.contab_fiscal_calendar;
CREATE POLICY contab_cal_select ON public.contab_fiscal_calendar FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.calendar.read') OR user_has_permission(auth.uid(), company_id, 'contab.calendar.write'));

-- 4) contab_obligations: require read permission
DROP POLICY IF EXISTS contab_obligations_select ON public.contab_obligations;
CREATE POLICY contab_obligations_select ON public.contab_obligations FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.obligation.read') OR user_has_permission(auth.uid(), company_id, 'contab.obligation.write'));

-- 5) core_master_data: require write permission for company-scoped mutations
DROP POLICY IF EXISTS master_admin_all ON public.core_master_data;
CREATE POLICY master_admin_all ON public.core_master_data FOR ALL TO authenticated
  USING (
    (company_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
    OR (company_id IS NOT NULL AND (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'core.master_data.write')))
  )
  WITH CHECK (
    (company_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
    OR (company_id IS NOT NULL AND (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'core.master_data.write')))
  );

-- 6) demo_visit_sessions: drop unowned UPDATE for anon/authenticated; updates flow via server fn (service role)
DROP POLICY IF EXISTS demo_sess_update_recent ON public.demo_visit_sessions;

-- 7) evt_ticket_transfers: require read permission (PII)
DROP POLICY IF EXISTS "evt_tr company read" ON public.evt_ticket_transfers;
CREATE POLICY evt_tr_company_read ON public.evt_ticket_transfers FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'evt.transfer.read')));

-- 8) evt_ticket_types: require write permission for mutations
DROP POLICY IF EXISTS "evt_tt company write" ON public.evt_ticket_types;
CREATE POLICY evt_tt_company_write ON public.evt_ticket_types FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'evt.ticket_type.write')))
  WITH CHECK (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'evt.ticket_type.write')));

-- 9) evt_tickets: require read permission for company members (PII); holder still can read own
DROP POLICY IF EXISTS "evt_tickets company read" ON public.evt_tickets;
CREATE POLICY evt_tickets_company_read ON public.evt_tickets FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR holder_user_id = auth.uid()
    OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'evt.ticket.read'))
  );

-- 10) restaurant menu: require write permission for mutations; separate select policy
DROP POLICY IF EXISTS rmc_company ON public.restaurant_menu_categories;
CREATE POLICY rmc_company_select ON public.restaurant_menu_categories FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR company_id IN (SELECT current_user_company_ids()));
CREATE POLICY rmc_company_write ON public.restaurant_menu_categories FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (company_id IN (SELECT current_user_company_ids()) AND user_has_permission(auth.uid(), company_id, 'restaurant.menu.write')))
  WITH CHECK (is_super_admin(auth.uid()) OR (company_id IN (SELECT current_user_company_ids()) AND user_has_permission(auth.uid(), company_id, 'restaurant.menu.write')));

DROP POLICY IF EXISTS rmi_company ON public.restaurant_menu_items;
CREATE POLICY rmi_company_select ON public.restaurant_menu_items FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR company_id IN (SELECT current_user_company_ids()));
CREATE POLICY rmi_company_write ON public.restaurant_menu_items FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (company_id IN (SELECT current_user_company_ids()) AND user_has_permission(auth.uid(), company_id, 'restaurant.menu.write')))
  WITH CHECK (is_super_admin(auth.uid()) OR (company_id IN (SELECT current_user_company_ids()) AND user_has_permission(auth.uid(), company_id, 'restaurant.menu.write')));

-- 11) realestate_interests: add backend rate limiting via BEFORE INSERT trigger
-- Caps inserts per (company_id, auth.uid()) to 10/minute and per company_id to 60/minute total
CREATE OR REPLACE FUNCTION public.realestate_interests_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_count integer;
  v_company_count integer;
BEGIN
  SELECT count(*) INTO v_company_count
    FROM public.realestate_interests
    WHERE company_id = NEW.company_id
      AND created_at > now() - interval '1 minute';
  IF v_company_count >= 60 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: too many interests for this company (max 60/min)'
      USING ERRCODE = 'check_violation';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT count(*) INTO v_user_count
      FROM public.realestate_interests
      WHERE company_id = NEW.company_id
        AND created_by = auth.uid()
        AND created_at > now() - interval '1 minute';
    IF v_user_count >= 10 THEN
      RAISE EXCEPTION 'rate_limit_exceeded: too many interests submitted (max 10/min per user)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS realestate_interests_rate_limit_trg ON public.realestate_interests;
CREATE TRIGGER realestate_interests_rate_limit_trg
  BEFORE INSERT ON public.realestate_interests
  FOR EACH ROW EXECUTE FUNCTION public.realestate_interests_rate_limit();
