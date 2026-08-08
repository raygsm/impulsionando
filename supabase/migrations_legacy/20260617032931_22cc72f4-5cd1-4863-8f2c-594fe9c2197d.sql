-- ===========================================================
-- CORE IMPULSIONANDO — Migração consolidada P0
-- ===========================================================

-- 1) CADASTROS MESTRES (listas controladas)
CREATE TABLE IF NOT EXISTS public.core_master_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  parent_id UUID REFERENCES public.core_master_data(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_unique ON public.core_master_data(COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), domain, key);
CREATE INDEX IF NOT EXISTS idx_master_domain ON public.core_master_data(domain, active);
CREATE INDEX IF NOT EXISTS idx_master_company ON public.core_master_data(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_master_data TO authenticated;
GRANT ALL ON public.core_master_data TO service_role;
ALTER TABLE public.core_master_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_select" ON public.core_master_data;
CREATE POLICY "master_select" ON public.core_master_data FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "master_admin_all" ON public.core_master_data;
CREATE POLICY "master_admin_all" ON public.core_master_data FOR ALL TO authenticated
  USING ((company_id IS NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
         OR company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
  WITH CHECK ((company_id IS NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
              OR company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- 2) CATÁLOGO DE MÓDULOS
CREATE TABLE IF NOT EXISTS public.core_module_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_with TEXT[] NOT NULL DEFAULT '{}',
  niches TEXT[] NOT NULL DEFAULT '{}',
  base_price_cents INT NOT NULL DEFAULT 0,
  setup_price_cents INT NOT NULL DEFAULT 0,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.core_module_catalog TO authenticated, anon;
GRANT ALL ON public.core_module_catalog TO service_role;
ALTER TABLE public.core_module_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "catalog_read" ON public.core_module_catalog;
CREATE POLICY "catalog_read" ON public.core_module_catalog FOR SELECT TO authenticated, anon USING (active = true);
DROP POLICY IF EXISTS "catalog_admin" ON public.core_module_catalog;
CREATE POLICY "catalog_admin" ON public.core_module_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) REGRAS DE REMARCAÇÃO
CREATE TABLE IF NOT EXISTS public.core_reschedule_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  min_hours_before INT NOT NULL DEFAULT 24,
  max_hours_before INT NOT NULL DEFAULT 720,
  max_reschedule_count INT NOT NULL DEFAULT 2,
  fee_enabled BOOLEAN NOT NULL DEFAULT false,
  fee_cents INT NOT NULL DEFAULT 0,
  auto_reschedule BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  block_slot_until_approval BOOLEAN NOT NULL DEFAULT true,
  release_old_slot_immediately BOOLEAN NOT NULL DEFAULT true,
  notify_patient BOOLEAN NOT NULL DEFAULT true,
  notify_clinic BOOLEAN NOT NULL DEFAULT true,
  notify_professional BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_reschedule_rules TO authenticated;
GRANT ALL ON public.core_reschedule_rules TO service_role;
ALTER TABLE public.core_reschedule_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resched_company" ON public.core_reschedule_rules;
CREATE POLICY "resched_company" ON public.core_reschedule_rules FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- 4) REGRAS DE REEMBOLSO
CREATE TABLE IF NOT EXISTS public.core_refund_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  auto_refund BOOLEAN NOT NULL DEFAULT false,
  manual_refund BOOLEAN NOT NULL DEFAULT true,
  allow_partial BOOLEAN NOT NULL DEFAULT true,
  allow_full BOOLEAN NOT NULL DEFAULT true,
  request_deadline_days INT NOT NULL DEFAULT 7,
  accepted_reasons TEXT[] NOT NULL DEFAULT ARRAY['arrependimento','servico_nao_prestado','duplicidade','erro_cobranca'],
  same_holder_required BOOLEAN NOT NULL DEFAULT true,
  validate_cpf_cnpj BOOLEAN NOT NULL DEFAULT true,
  validate_card BOOLEAN NOT NULL DEFAULT true,
  validate_pix_payer BOOLEAN NOT NULL DEFAULT true,
  requires_audit_log BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_refund_rules TO authenticated;
GRANT ALL ON public.core_refund_rules TO service_role;
ALTER TABLE public.core_refund_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "refund_company" ON public.core_refund_rules;
CREATE POLICY "refund_company" ON public.core_refund_rules FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- 5) AMBIENTES DE DEMONSTRAÇÃO
CREATE TABLE IF NOT EXISTS public.demo_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  seed_volume TEXT NOT NULL DEFAULT 'medio' CHECK (seed_volume IN ('pequeno','medio','grande')),
  template_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  capture_lead_when TEXT NOT NULL DEFAULT 'antes' CHECK (capture_lead_when IN ('antes','durante','depois','nunca')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.demo_environments TO authenticated, anon;
GRANT ALL ON public.demo_environments TO service_role;
ALTER TABLE public.demo_environments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_env_read" ON public.demo_environments;
CREATE POLICY "demo_env_read" ON public.demo_environments FOR SELECT TO authenticated, anon USING (active = true);
DROP POLICY IF EXISTS "demo_env_admin" ON public.demo_environments;
CREATE POLICY "demo_env_admin" ON public.demo_environments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6) SESSÕES DE DEMONSTRAÇÃO
CREATE TABLE IF NOT EXISTS public.demo_visit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_id UUID REFERENCES public.demo_environments(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  viewed_modules TEXT[] NOT NULL DEFAULT '{}',
  selected_modules TEXT[] NOT NULL DEFAULT '{}',
  attempted_contract BOOLEAN NOT NULL DEFAULT false,
  abandoned BOOLEAN NOT NULL DEFAULT false,
  converted_lead_id UUID,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_demo_visit_env ON public.demo_visit_sessions(environment_id);
CREATE INDEX IF NOT EXISTS idx_demo_visit_niche ON public.demo_visit_sessions(niche);
GRANT SELECT, INSERT, UPDATE ON public.demo_visit_sessions TO authenticated, anon;
GRANT ALL ON public.demo_visit_sessions TO service_role;
ALTER TABLE public.demo_visit_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_sess_insert" ON public.demo_visit_sessions;
CREATE POLICY "demo_sess_insert" ON public.demo_visit_sessions FOR INSERT TO authenticated, anon WITH CHECK (niche IS NOT NULL);
DROP POLICY IF EXISTS "demo_sess_update_recent" ON public.demo_visit_sessions;
CREATE POLICY "demo_sess_update_recent" ON public.demo_visit_sessions FOR UPDATE TO authenticated, anon
  USING (started_at > now() - interval '24 hours')
  WITH CHECK (started_at > now() - interval '24 hours');
DROP POLICY IF EXISTS "demo_sess_admin_read" ON public.demo_visit_sessions;
CREATE POLICY "demo_sess_admin_read" ON public.demo_visit_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 7) LEADS DE DEMONSTRAÇÃO
CREATE TABLE IF NOT EXISTS public.demo_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.demo_visit_sessions(id) ON DELETE SET NULL,
  environment_id UUID REFERENCES public.demo_environments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  niche TEXT,
  viewed_modules TEXT[] NOT NULL DEFAULT '{}',
  selected_modules TEXT[] NOT NULL DEFAULT '{}',
  origin TEXT NOT NULL DEFAULT 'Demonstração',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','contatado','em_negociacao','convertido','perdido')),
  marketing_lead_id UUID REFERENCES public.marketing_leads(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_demo_leads_email ON public.demo_leads(email);
CREATE INDEX IF NOT EXISTS idx_demo_leads_status ON public.demo_leads(status);
GRANT INSERT ON public.demo_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.demo_leads TO authenticated;
GRANT ALL ON public.demo_leads TO service_role;
ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_leads_insert" ON public.demo_leads;
CREATE POLICY "demo_leads_insert" ON public.demo_leads FOR INSERT TO anon, authenticated
  WITH CHECK (name IS NOT NULL AND email IS NOT NULL AND phone IS NOT NULL);
DROP POLICY IF EXISTS "demo_leads_admin_read" ON public.demo_leads;
CREATE POLICY "demo_leads_admin_read" ON public.demo_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "demo_leads_admin_update" ON public.demo_leads;
CREATE POLICY "demo_leads_admin_update" ON public.demo_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "demo_leads_admin_delete" ON public.demo_leads;
CREATE POLICY "demo_leads_admin_delete" ON public.demo_leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 8) Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'core_master_data','core_module_catalog','core_reschedule_rules',
    'core_refund_rules','demo_environments','demo_leads'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s
                    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;