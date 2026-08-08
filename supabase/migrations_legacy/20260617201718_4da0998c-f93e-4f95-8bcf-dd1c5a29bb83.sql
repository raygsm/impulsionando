
-- 1. New permissions
INSERT INTO public.permissions(code, module, description) VALUES
  ('comm.attendance.read','comm','Ver presença na comunidade'),
  ('comm.attendance.write','comm','Registrar presença na comunidade'),
  ('comm.donation.read','comm','Ver doações'),
  ('comm.donation.write','comm','Gerenciar doações'),
  ('comm.membership.read','comm','Ver assinaturas/mensalidades da comunidade'),
  ('comm.membership.write','comm','Gerenciar assinaturas da comunidade'),
  ('contab.client.read','contab','Ver clientes contábeis'),
  ('contab.department.read','contab','Ver departamentos contábeis'),
  ('contab.document.read','contab','Ver documentos contábeis'),
  ('contab.reminder.read','contab','Ver lembretes de obrigações'),
  ('contab.task.read','contab','Ver tarefas contábeis'),
  ('evt.event.write','evt','Criar/editar eventos'),
  ('evt.ticket.write','evt','Criar/editar ingressos'),
  ('evt.transfer.write','evt','Aprovar transferências de ingresso'),
  ('evt.checkin.write','evt','Registrar check-ins de eventos'),
  ('restaurant.session.read','restaurant','Ver sessões de mesa do restaurante'),
  ('restaurant.session.write','restaurant','Abrir/editar sessões de mesa'),
  ('restaurant.table.write','restaurant','Gerenciar mesas e QR tokens')
ON CONFLICT (code) DO NOTHING;

-- 2. aff_crm_events — require customer.read for PII access
DROP POLICY IF EXISTS aff_crm_events_select ON public.aff_crm_events;
CREATE POLICY aff_crm_events_select ON public.aff_crm_events FOR SELECT TO authenticated
USING (
  is_impulsionando_staff(auth.uid())
  OR (
    user_belongs_to_company(auth.uid(), company_id)
    AND user_has_permission(auth.uid(), company_id, 'aff.crm.read')
    AND user_has_permission(auth.uid(), company_id, 'customer.read')
  )
);

-- 3. aff_wallet_alerts — only the affiliate themself or aff.affiliate.read/write
DROP POLICY IF EXISTS "aff_wallet_alerts: company members read" ON public.aff_wallet_alerts;
DROP POLICY IF EXISTS "aff_wallet_alerts: company members update" ON public.aff_wallet_alerts;
CREATE POLICY aff_wallet_alerts_read ON public.aff_wallet_alerts FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.aff_affiliates a
    WHERE a.id = aff_wallet_alerts.affiliate_id AND a.user_id = auth.uid()
  )
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.read'))
);
CREATE POLICY aff_wallet_alerts_update ON public.aff_wallet_alerts FOR UPDATE TO authenticated
USING (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.aff_affiliates a
    WHERE a.id = aff_wallet_alerts.affiliate_id AND a.user_id = auth.uid()
  )
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.write'))
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.aff_affiliates a
    WHERE a.id = aff_wallet_alerts.affiliate_id AND a.user_id = auth.uid()
  )
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.write'))
);

-- 4. comm_attendance
DROP POLICY IF EXISTS "comm_at read" ON public.comm_attendance;
DROP POLICY IF EXISTS "comm_at write" ON public.comm_attendance;
CREATE POLICY comm_at_read ON public.comm_attendance FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'comm.attendance.read'))
  OR EXISTS (SELECT 1 FROM public.comm_members m
             WHERE m.id = comm_attendance.member_id AND m.member_user_id = auth.uid())
);
CREATE POLICY comm_at_write ON public.comm_attendance FOR ALL TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'comm.attendance.write')))
WITH CHECK (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'comm.attendance.write')));

-- 5. comm_donations
DROP POLICY IF EXISTS "comm_do read" ON public.comm_donations;
DROP POLICY IF EXISTS "comm_do write" ON public.comm_donations;
CREATE POLICY comm_do_read ON public.comm_donations FOR SELECT TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'comm.donation.read')));
CREATE POLICY comm_do_write ON public.comm_donations FOR ALL TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'comm.donation.write')))
WITH CHECK (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'comm.donation.write')));

-- 6. comm_memberships
DROP POLICY IF EXISTS "comm_ms read" ON public.comm_memberships;
DROP POLICY IF EXISTS "comm_ms write" ON public.comm_memberships;
CREATE POLICY comm_ms_read ON public.comm_memberships FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'comm.membership.read'))
  OR EXISTS (SELECT 1 FROM public.comm_members m
             WHERE m.id = comm_memberships.member_id AND m.member_user_id = auth.uid())
);
CREATE POLICY comm_ms_write ON public.comm_memberships FOR ALL TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'comm.membership.write')))
WITH CHECK (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'comm.membership.write')));

-- 7. contab_* read perms
DROP POLICY IF EXISTS contab_clients_select ON public.contab_clients;
CREATE POLICY contab_clients_select ON public.contab_clients FOR SELECT TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND (user_has_permission(auth.uid(), company_id, 'contab.client.read')
                OR user_has_permission(auth.uid(), company_id, 'contab.client.write'))));

DROP POLICY IF EXISTS contab_dept_select ON public.contab_departments;
CREATE POLICY contab_dept_select ON public.contab_departments FOR SELECT TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND (user_has_permission(auth.uid(), company_id, 'contab.department.read')
                OR user_has_permission(auth.uid(), company_id, 'contab.department.write'))));

DROP POLICY IF EXISTS contab_documents_select ON public.contab_documents;
CREATE POLICY contab_documents_select ON public.contab_documents FOR SELECT TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND (user_has_permission(auth.uid(), company_id, 'contab.document.read')
                OR user_has_permission(auth.uid(), company_id, 'contab.document.write'))));

DROP POLICY IF EXISTS contab_rem_select ON public.contab_reminders;
CREATE POLICY contab_rem_select ON public.contab_reminders FOR SELECT TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND (user_has_permission(auth.uid(), company_id, 'contab.reminder.read')
                OR user_has_permission(auth.uid(), company_id, 'contab.obligation.write'))));

DROP POLICY IF EXISTS contab_tasks_select ON public.contab_tasks;
CREATE POLICY contab_tasks_select ON public.contab_tasks FOR SELECT TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND (user_has_permission(auth.uid(), company_id, 'contab.task.read')
                OR user_has_permission(auth.uid(), company_id, 'contab.task.write'))));

-- 8. evt_* writes require dedicated perms
DROP POLICY IF EXISTS "evt_events company write" ON public.evt_events;
CREATE POLICY evt_events_company_write ON public.evt_events FOR ALL TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'evt.event.write')))
WITH CHECK (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'evt.event.write')));

DROP POLICY IF EXISTS "evt_tickets company write" ON public.evt_tickets;
CREATE POLICY evt_tickets_company_write ON public.evt_tickets FOR ALL TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'evt.ticket.write')))
WITH CHECK (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'evt.ticket.write')));

DROP POLICY IF EXISTS "evt_tr company write" ON public.evt_ticket_transfers;
CREATE POLICY evt_tr_company_write ON public.evt_ticket_transfers FOR ALL TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'evt.transfer.write')))
WITH CHECK (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'evt.transfer.write')));

DROP POLICY IF EXISTS "evt_ck company write" ON public.evt_checkins;
CREATE POLICY evt_ck_company_write ON public.evt_checkins FOR ALL TO authenticated
USING (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'evt.checkin.write')))
WITH CHECK (is_super_admin(auth.uid())
       OR (user_belongs_to_company(auth.uid(), company_id)
           AND user_has_permission(auth.uid(), company_id, 'evt.checkin.write')));

-- 9. restaurant_table_sessions
DROP POLICY IF EXISTS rts_company_read ON public.restaurant_table_sessions;
DROP POLICY IF EXISTS rts_company_update ON public.restaurant_table_sessions;
DROP POLICY IF EXISTS rts_company_write ON public.restaurant_table_sessions;
CREATE POLICY rts_company_read ON public.restaurant_table_sessions FOR SELECT TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id)
       AND (user_has_permission(auth.uid(), company_id, 'restaurant.session.read')
            OR user_has_permission(auth.uid(), company_id, 'restaurant.session.write')));
CREATE POLICY rts_company_update ON public.restaurant_table_sessions FOR UPDATE TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id)
       AND user_has_permission(auth.uid(), company_id, 'restaurant.session.write'))
WITH CHECK (user_belongs_to_company(auth.uid(), company_id)
            AND user_has_permission(auth.uid(), company_id, 'restaurant.session.write'));
CREATE POLICY rts_company_write ON public.restaurant_table_sessions FOR INSERT TO authenticated
WITH CHECK (user_belongs_to_company(auth.uid(), company_id)
            AND user_has_permission(auth.uid(), company_id, 'restaurant.session.write'));

-- 10. restaurant_tables (writes require restaurant.table.write)
DROP POLICY IF EXISTS rt_company_update ON public.restaurant_tables;
DROP POLICY IF EXISTS rt_company_delete ON public.restaurant_tables;
DROP POLICY IF EXISTS rt_company_write ON public.restaurant_tables;
CREATE POLICY rt_company_update ON public.restaurant_tables FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles up
               WHERE up.user_id = auth.uid() AND up.company_id = restaurant_tables.company_id)
       AND user_has_permission(auth.uid(), restaurant_tables.company_id, 'restaurant.table.write'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up
                    WHERE up.user_id = auth.uid() AND up.company_id = restaurant_tables.company_id)
            AND user_has_permission(auth.uid(), restaurant_tables.company_id, 'restaurant.table.write'));
CREATE POLICY rt_company_delete ON public.restaurant_tables FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles up
               WHERE up.user_id = auth.uid() AND up.company_id = restaurant_tables.company_id)
       AND user_has_permission(auth.uid(), restaurant_tables.company_id, 'restaurant.table.write'));
CREATE POLICY rt_company_write ON public.restaurant_tables FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up
                    WHERE up.user_id = auth.uid() AND up.company_id = restaurant_tables.company_id)
            AND user_has_permission(auth.uid(), restaurant_tables.company_id, 'restaurant.table.write'));
