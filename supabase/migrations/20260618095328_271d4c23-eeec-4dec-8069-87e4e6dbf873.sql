
-- =========================================================================
-- A) Adiciona checagem de permissão de LEITURA nas SELECT policies que só
--    validavam pertencimento à empresa.
-- =========================================================================

DROP POLICY IF EXISTS comm_communities_select ON public.comm_communities;
CREATE POLICY comm_communities_select ON public.comm_communities
  FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'comm.community.read')
    )
  );

DROP POLICY IF EXISTS rmc_company_select ON public.restaurant_menu_categories;
CREATE POLICY rmc_company_select ON public.restaurant_menu_categories
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'restaurant.menu.read')
    )
  );

DROP POLICY IF EXISTS rmi_company_select ON public.restaurant_menu_items;
CREATE POLICY rmi_company_select ON public.restaurant_menu_items
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'restaurant.menu.read')
    )
  );

DROP POLICY IF EXISTS "evt_ck company read" ON public.evt_checkins;
CREATE POLICY "evt_ck company read" ON public.evt_checkins
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'evt.checkin.read')
    )
  );

DROP POLICY IF EXISTS "evt_tt company read" ON public.evt_ticket_types;
CREATE POLICY "evt_tt company read" ON public.evt_ticket_types
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'evt.ticket_type.read')
    )
  );

-- =========================================================================
-- B) Separa write de comm_members e exige permissão comm.member.write.
-- =========================================================================

DROP POLICY IF EXISTS "comm_m write" ON public.comm_members;

CREATE POLICY "comm_m insert" ON public.comm_members
  FOR INSERT
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'comm.member.write')
    )
  );

CREATE POLICY "comm_m update" ON public.comm_members
  FOR UPDATE
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'comm.member.write')
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'comm.member.write')
    )
  );

CREATE POLICY "comm_m delete" ON public.comm_members
  FOR DELETE
  USING (
    is_super_admin(auth.uid())
    OR (
      user_belongs_to_company(auth.uid(), company_id)
      AND user_has_permission(auth.uid(), company_id, 'comm.member.write')
    )
  );

-- =========================================================================
-- C) Substitui SELECT direto em user_profiles dentro das policies pelo
--    helper canônico user_belongs_to_company().
-- =========================================================================

-- billing_pix_charges
DROP POLICY IF EXISTS "owners read own pix charges" ON public.billing_pix_charges;
CREATE POLICY "owners read own pix charges" ON public.billing_pix_charges
  FOR SELECT
  USING (
    company_id IS NOT NULL
    AND user_belongs_to_company(auth.uid(), company_id)
  );

-- contab_contracts
DROP POLICY IF EXISTS ctr_select ON public.contab_contracts;
CREATE POLICY ctr_select ON public.contab_contracts
  FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

DROP POLICY IF EXISTS ctr_write ON public.contab_contracts;
CREATE POLICY ctr_write ON public.contab_contracts
  FOR ALL
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.contract.write')
    )
  )
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.contract.write')
    )
  );

-- contab_irpf_journeys
DROP POLICY IF EXISTS irpf_j_select ON public.contab_irpf_journeys;
CREATE POLICY irpf_j_select ON public.contab_irpf_journeys
  FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

DROP POLICY IF EXISTS irpf_j_write ON public.contab_irpf_journeys;
CREATE POLICY irpf_j_write ON public.contab_irpf_journeys
  FOR ALL
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.irpf.write')
    )
  )
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.irpf.write')
    )
  );

-- contab_irpf_steps (navega via journey -> company_id)
DROP POLICY IF EXISTS irpf_s_select ON public.contab_irpf_steps;
CREATE POLICY irpf_s_select ON public.contab_irpf_steps
  FOR SELECT
  USING (
    journey_id IN (
      SELECT j.id FROM public.contab_irpf_journeys j
      WHERE user_belongs_to_company(auth.uid(), j.company_id)
    )
  );

DROP POLICY IF EXISTS irpf_s_write ON public.contab_irpf_steps;
CREATE POLICY irpf_s_write ON public.contab_irpf_steps
  FOR ALL
  USING (
    journey_id IN (
      SELECT j.id FROM public.contab_irpf_journeys j
      WHERE user_belongs_to_company(auth.uid(), j.company_id)
        AND (
          has_role(auth.uid(), 'admin'::app_role)
          OR user_has_permission(auth.uid(), j.company_id, 'contab.irpf.write')
        )
    )
  )
  WITH CHECK (
    journey_id IN (
      SELECT j.id FROM public.contab_irpf_journeys j
      WHERE user_belongs_to_company(auth.uid(), j.company_id)
        AND (
          has_role(auth.uid(), 'admin'::app_role)
          OR user_has_permission(auth.uid(), j.company_id, 'contab.irpf.write')
        )
    )
  );

-- contab_office_finance
DROP POLICY IF EXISTS off_fin_select ON public.contab_office_finance;
CREATE POLICY off_fin_select ON public.contab_office_finance
  FOR SELECT
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.finance.read')
      OR user_has_permission(auth.uid(), company_id, 'contab.finance.write')
    )
  );

DROP POLICY IF EXISTS off_fin_write ON public.contab_office_finance;
CREATE POLICY off_fin_write ON public.contab_office_finance
  FOR ALL
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.finance.write')
    )
  )
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.finance.write')
    )
  );

-- contab_onboarding
DROP POLICY IF EXISTS onb_select ON public.contab_onboarding;
CREATE POLICY onb_select ON public.contab_onboarding
  FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

DROP POLICY IF EXISTS onb_write ON public.contab_onboarding;
CREATE POLICY onb_write ON public.contab_onboarding
  FOR ALL
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.onboarding.write')
    )
  )
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'contab.onboarding.write')
    )
  );

-- contract_documents
DROP POLICY IF EXISTS contract_documents_company_read ON public.contract_documents;
CREATE POLICY contract_documents_company_read ON public.contract_documents
  FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

-- contract_signatures
DROP POLICY IF EXISTS contract_signatures_company_read ON public.contract_signatures;
CREATE POLICY contract_signatures_company_read ON public.contract_signatures
  FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

-- core_master_data
DROP POLICY IF EXISTS master_select ON public.core_master_data;
CREATE POLICY master_select ON public.core_master_data
  FOR SELECT
  USING (
    company_id IS NULL
    OR user_belongs_to_company(auth.uid(), company_id)
  );

-- core_refund_rules
DROP POLICY IF EXISTS refund_select ON public.core_refund_rules;
CREATE POLICY refund_select ON public.core_refund_rules
  FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

DROP POLICY IF EXISTS refund_write ON public.core_refund_rules;
CREATE POLICY refund_write ON public.core_refund_rules
  FOR ALL
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'company.settings.write')
    )
  )
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'company.settings.write')
    )
  );

-- core_reschedule_rules
DROP POLICY IF EXISTS resched_select ON public.core_reschedule_rules;
CREATE POLICY resched_select ON public.core_reschedule_rules
  FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

DROP POLICY IF EXISTS resched_write ON public.core_reschedule_rules;
CREATE POLICY resched_write ON public.core_reschedule_rules
  FOR ALL
  USING (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'company.settings.write')
    )
  )
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), company_id, 'company.settings.write')
    )
  );

-- restaurant_table_invoices
DROP POLICY IF EXISTS "Equipe da empresa vê as cobranças de mesa" ON public.restaurant_table_invoices;
CREATE POLICY "Equipe da empresa vê as cobranças de mesa" ON public.restaurant_table_invoices
  FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id));

-- webhook_runs
DROP POLICY IF EXISTS webhook_runs_company_read ON public.webhook_runs;
CREATE POLICY webhook_runs_company_read ON public.webhook_runs
  FOR SELECT TO authenticated
  USING (
    company_id IS NOT NULL
    AND user_belongs_to_company(auth.uid(), company_id)
  );
