
-- ============================================================
-- CORE IMPULSIONANDO — RLS HARDENING (auditoria de segurança)
-- Substitui políticas USING (true) por regras tenant-scoped.
-- ============================================================

-- 1) core_fiscal_invoices
DROP POLICY IF EXISTS "fiscal invoices read authenticated" ON public.core_fiscal_invoices;
CREATE POLICY "fiscal invoices read scoped"
ON public.core_fiscal_invoices FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR public.user_belongs_to_company(auth.uid(), beneficiary_company_id)
);

-- 2) core_fiscal_invoice_events
DROP POLICY IF EXISTS "fiscal events read authenticated" ON public.core_fiscal_invoice_events;
CREATE POLICY "fiscal events read scoped"
ON public.core_fiscal_invoice_events FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.core_fiscal_invoices fi
    WHERE fi.id = core_fiscal_invoice_events.invoice_id
      AND public.user_belongs_to_company(auth.uid(), fi.beneficiary_company_id)
  )
);

-- 3) core_fiscal_issuer_config (somente staff/admin)
DROP POLICY IF EXISTS "fiscal issuer read authenticated" ON public.core_fiscal_issuer_config;
CREATE POLICY "fiscal issuer read staff"
ON public.core_fiscal_issuer_config FOR SELECT TO authenticated
USING (public.is_impulsionando_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 4) core_compliance_requirements
DROP POLICY IF EXISTS "compliance_req_read_auth" ON public.core_compliance_requirements;
CREATE POLICY "compliance_req_read_scoped"
ON public.core_compliance_requirements FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR company_id IS NULL
  OR public.user_belongs_to_company(auth.uid(), company_id)
);

-- 5) core_funnel_dispatch_queue (PII)
DROP POLICY IF EXISTS "funnel_dispatch_read" ON public.core_funnel_dispatch_queue;
CREATE POLICY "funnel_dispatch_read_scoped"
ON public.core_funnel_dispatch_queue FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR (company_id IS NOT NULL AND public.user_belongs_to_company(auth.uid(), company_id))
);

-- 6) core_funnel_rules (somente staff/admin)
DROP POLICY IF EXISTS "funnel_rules_read" ON public.core_funnel_rules;
CREATE POLICY "funnel_rules_read_staff"
ON public.core_funnel_rules FOR SELECT TO authenticated
USING (public.is_impulsionando_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 7) core_incidents (somente staff/admin)
DROP POLICY IF EXISTS "incidents_read" ON public.core_incidents;
CREATE POLICY "incidents_read_staff"
ON public.core_incidents FOR SELECT TO authenticated
USING (public.is_impulsionando_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 8) core_tenant_email_aliases
DROP POLICY IF EXISTS "tenant email aliases readable by authenticated" ON public.core_tenant_email_aliases;
CREATE POLICY "tenant_email_aliases_read_scoped"
ON public.core_tenant_email_aliases FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.user_belongs_to_company(auth.uid(), company_id)
);

-- 9) core_tenant_identity
DROP POLICY IF EXISTS "tenant identity readable by authenticated" ON public.core_tenant_identity;
CREATE POLICY "tenant_identity_read_scoped"
ON public.core_tenant_identity FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.user_belongs_to_company(auth.uid(), company_id)
);

-- 10) core_whatsapp_credentials (segredos!)
DROP POLICY IF EXISTS "wa creds read authenticated" ON public.core_whatsapp_credentials;
CREATE POLICY "wa_creds_read_scoped"
ON public.core_whatsapp_credentials FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR public.user_belongs_to_company(auth.uid(), company_id)
);

-- 11) core_whatsapp_fallback_config
DROP POLICY IF EXISTS "wa fallback read authenticated" ON public.core_whatsapp_fallback_config;
CREATE POLICY "wa_fallback_read_staff"
ON public.core_whatsapp_fallback_config FOR SELECT TO authenticated
USING (public.is_impulsionando_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 12) core_whatsapp_routing_rules
DROP POLICY IF EXISTS "wa routing read authenticated" ON public.core_whatsapp_routing_rules;
CREATE POLICY "wa_routing_read_scoped"
ON public.core_whatsapp_routing_rules FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (company_id IS NOT NULL AND public.user_belongs_to_company(auth.uid(), company_id))
);

-- ============================================================
-- Índices recomendados (performance multi-tenant)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_beneficiary
  ON public.core_fiscal_invoices (beneficiary_company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoice_events_invoice
  ON public.core_fiscal_invoice_events (invoice_id);
CREATE INDEX IF NOT EXISTS idx_funnel_dispatch_queue_company
  ON public.core_funnel_dispatch_queue (company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_credentials_company
  ON public.core_whatsapp_credentials (company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_identity_company
  ON public.core_tenant_identity (company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_email_aliases_company
  ON public.core_tenant_email_aliases (company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_company
  ON public.core_compliance_requirements (company_id);
