
-- ============ CRM Module ============

-- PIPELINES
CREATE TABLE public.crm_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipelines TO authenticated;
GRANT ALL ON public.crm_pipelines TO service_role;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_pip_select ON public.crm_pipelines FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY crm_pip_write ON public.crm_pipelines FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.pipeline.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.pipeline.write'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_pipelines FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_audit_crm_pipelines AFTER INSERT OR UPDATE OR DELETE ON public.crm_pipelines FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE INDEX idx_crm_pipelines_company ON public.crm_pipelines(company_id);

-- STAGES
CREATE TABLE public.crm_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  pipeline_id uuid NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  sort_order integer NOT NULL DEFAULT 0,
  stage_type text NOT NULL DEFAULT 'open' CHECK (stage_type IN ('open','won','lost')),
  win_probability integer NOT NULL DEFAULT 0 CHECK (win_probability BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_stages TO authenticated;
GRANT ALL ON public.crm_stages TO service_role;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_stg_select ON public.crm_stages FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY crm_stg_write ON public.crm_stages FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.pipeline.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.pipeline.write'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_stages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_audit_crm_stages AFTER INSERT OR UPDATE OR DELETE ON public.crm_stages FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE INDEX idx_crm_stages_pipeline ON public.crm_stages(pipeline_id, sort_order);

-- LEADS
CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  unit_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  document text,
  source text,
  tags text[] NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','working','qualified','disqualified','converted')),
  notes text,
  owner_user_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_lead_select ON public.crm_leads FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY crm_lead_insert ON public.crm_leads FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.lead.write'));
CREATE POLICY crm_lead_update ON public.crm_leads FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.lead.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.lead.write'));
CREATE POLICY crm_lead_delete ON public.crm_leads FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.lead.delete'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_audit_crm_leads AFTER INSERT OR UPDATE OR DELETE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE INDEX idx_crm_leads_company ON public.crm_leads(company_id, created_at DESC);
CREATE INDEX idx_crm_leads_owner ON public.crm_leads(owner_user_id);

-- OPPORTUNITIES
CREATE TABLE public.crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  pipeline_id uuid NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE RESTRICT,
  stage_id uuid NOT NULL REFERENCES public.crm_stages(id) ON DELETE RESTRICT,
  title text NOT NULL,
  value numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  expected_close_at date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','won','lost')),
  lost_reason text,
  owner_user_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunities TO authenticated;
GRANT ALL ON public.crm_opportunities TO service_role;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_opp_select ON public.crm_opportunities FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY crm_opp_insert ON public.crm_opportunities FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.opportunity.write'));
CREATE POLICY crm_opp_update ON public.crm_opportunities FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.opportunity.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.opportunity.write'));
CREATE POLICY crm_opp_delete ON public.crm_opportunities FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.opportunity.delete'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_opportunities FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_audit_crm_opportunities AFTER INSERT OR UPDATE OR DELETE ON public.crm_opportunities FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE INDEX idx_crm_opp_pipeline_stage ON public.crm_opportunities(pipeline_id, stage_id, sort_order);
CREATE INDEX idx_crm_opp_company_status ON public.crm_opportunities(company_id, status);

-- ACTIVITIES (follow-up)
CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('note','call','email','meeting','task','whatsapp')),
  subject text NOT NULL,
  content text,
  due_at timestamptz,
  done_at timestamptz,
  owner_user_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_act_select ON public.crm_activities FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY crm_act_write ON public.crm_activities FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.activity.write'))
  WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'crm.activity.write'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tg_audit_crm_activities AFTER INSERT OR UPDATE OR DELETE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE INDEX idx_crm_activities_company ON public.crm_activities(company_id, due_at);
CREATE INDEX idx_crm_activities_lead ON public.crm_activities(lead_id);
CREATE INDEX idx_crm_activities_opp ON public.crm_activities(opportunity_id);

-- ============ Seeds ============

-- Permissions
INSERT INTO public.permissions (code, module, description) VALUES
  ('crm.lead.read', 'crm', 'Visualizar leads'),
  ('crm.lead.write', 'crm', 'Criar/editar leads'),
  ('crm.lead.delete', 'crm', 'Excluir leads'),
  ('crm.pipeline.read', 'crm', 'Visualizar funis'),
  ('crm.pipeline.write', 'crm', 'Gerenciar funis e etapas'),
  ('crm.opportunity.read', 'crm', 'Visualizar oportunidades'),
  ('crm.opportunity.write', 'crm', 'Criar/editar/mover oportunidades'),
  ('crm.opportunity.delete', 'crm', 'Excluir oportunidades'),
  ('crm.activity.read', 'crm', 'Visualizar atividades'),
  ('crm.activity.write', 'crm', 'Criar/editar atividades')
ON CONFLICT (code) DO NOTHING;

-- Concede CRM full a Gestor da Empresa e Administrador da Unidade; leitura/escrita básica a Recepção e Operador
INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT pr.id, pe.id
FROM public.profiles pr
JOIN public.permissions pe ON pe.module = 'crm'
WHERE pr.slug IN ('gestor-da-empresa','administrador-da-unidade')
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT pr.id, pe.id
FROM public.profiles pr
JOIN public.permissions pe ON pe.code IN ('crm.lead.read','crm.lead.write','crm.pipeline.read','crm.opportunity.read','crm.opportunity.write','crm.activity.read','crm.activity.write')
WHERE pr.slug IN ('recepcao','operador')
ON CONFLICT DO NOTHING;

-- CRM Module
INSERT INTO public.modules (slug, name, description, icon, category, is_core, sort_order)
VALUES ('crm', 'CRM', 'Gestão de leads, funis e oportunidades', 'kanban-square', 'vendas', false, 10)
ON CONFLICT (slug) DO NOTHING;

-- Default pipeline + stages for every existing company (skip master)
DO $$
DECLARE c record; pid uuid;
BEGIN
  FOR c IN SELECT id FROM public.companies WHERE is_master = false LOOP
    IF NOT EXISTS (SELECT 1 FROM public.crm_pipelines WHERE company_id = c.id) THEN
      INSERT INTO public.crm_pipelines(company_id, name, description, is_default, sort_order)
      VALUES (c.id, 'Funil Padrão', 'Pipeline inicial gerado automaticamente', true, 0)
      RETURNING id INTO pid;
      INSERT INTO public.crm_stages(company_id, pipeline_id, name, color, sort_order, stage_type, win_probability) VALUES
        (c.id, pid, 'Novo', '#64748b', 0, 'open', 10),
        (c.id, pid, 'Qualificado', '#3b82f6', 1, 'open', 30),
        (c.id, pid, 'Proposta', '#a855f7', 2, 'open', 60),
        (c.id, pid, 'Negociação', '#f59e0b', 3, 'open', 80),
        (c.id, pid, 'Ganhou', '#10b981', 4, 'won', 100),
        (c.id, pid, 'Perdeu', '#ef4444', 5, 'lost', 0);
    END IF;
  END LOOP;
END $$;

-- Trigger: ao criar uma nova empresa, gerar pipeline padrão automaticamente
CREATE OR REPLACE FUNCTION public.tg_bootstrap_company_crm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  IF NEW.is_master THEN RETURN NEW; END IF;
  INSERT INTO public.crm_pipelines(company_id, name, description, is_default, sort_order)
  VALUES (NEW.id, 'Funil Padrão', 'Pipeline inicial gerado automaticamente', true, 0)
  RETURNING id INTO pid;
  INSERT INTO public.crm_stages(company_id, pipeline_id, name, color, sort_order, stage_type, win_probability) VALUES
    (NEW.id, pid, 'Novo', '#64748b', 0, 'open', 10),
    (NEW.id, pid, 'Qualificado', '#3b82f6', 1, 'open', 30),
    (NEW.id, pid, 'Proposta', '#a855f7', 2, 'open', 60),
    (NEW.id, pid, 'Negociação', '#f59e0b', 3, 'open', 80),
    (NEW.id, pid, 'Ganhou', '#10b981', 4, 'won', 100),
    (NEW.id, pid, 'Perdeu', '#ef4444', 5, 'lost', 0);
  RETURN NEW;
END $$;

CREATE TRIGGER tg_bootstrap_company_crm AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_bootstrap_company_crm();

-- Habilita módulo CRM para empresas existentes
INSERT INTO public.company_modules(company_id, module_id, is_enabled)
SELECT c.id, m.id, true FROM public.companies c, public.modules m
WHERE m.slug = 'crm' AND c.is_master = false
ON CONFLICT DO NOTHING;
