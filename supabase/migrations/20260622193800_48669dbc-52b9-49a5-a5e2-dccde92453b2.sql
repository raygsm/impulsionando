-- Onda 11: N8N + AI Agents + Funnel Automations

CREATE TABLE public.riomed_n8n_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  webhook_url TEXT,
  trigger_event TEXT,
  funnel_stage TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_n8n_workflows TO authenticated;
GRANT ALL ON public.riomed_n8n_workflows TO service_role;
ALTER TABLE public.riomed_n8n_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_n8n_wf_admin" ON public.riomed_n8n_workflows FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.riomed_n8n_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.riomed_n8n_workflows(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  trigger_payload JSONB DEFAULT '{}'::jsonb,
  response_payload JSONB,
  error_message TEXT,
  duration_ms INT,
  triggered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.riomed_n8n_executions TO authenticated;
GRANT ALL ON public.riomed_n8n_executions TO service_role;
ALTER TABLE public.riomed_n8n_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_n8n_exec_admin_select" ON public.riomed_n8n_executions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "riomed_n8n_exec_insert" ON public.riomed_n8n_executions FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "riomed_n8n_exec_admin_update" ON public.riomed_n8n_executions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_riomed_n8n_exec_wf ON public.riomed_n8n_executions(workflow_id, created_at DESC);

CREATE TABLE public.riomed_ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_key TEXT NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  funnel_stage TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  system_prompt TEXT NOT NULL,
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_ai_agents TO authenticated;
GRANT ALL ON public.riomed_ai_agents TO service_role;
ALTER TABLE public.riomed_ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_ai_agents_admin" ON public.riomed_ai_agents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.riomed_ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.riomed_ai_agents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  cost_credits NUMERIC(12,4) DEFAULT 0,
  error_message TEXT,
  triggered_by UUID,
  related_entity_type TEXT,
  related_entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.riomed_ai_runs TO authenticated;
GRANT ALL ON public.riomed_ai_runs TO service_role;
ALTER TABLE public.riomed_ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_ai_runs_admin_select" ON public.riomed_ai_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "riomed_ai_runs_insert" ON public.riomed_ai_runs FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "riomed_ai_runs_admin_update" ON public.riomed_ai_runs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_riomed_ai_runs_agent ON public.riomed_ai_runs(agent_id, created_at DESC);

CREATE TABLE public.riomed_funnel_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  funnel_stage TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  agent_id UUID REFERENCES public.riomed_ai_agents(id) ON DELETE SET NULL,
  workflow_id UUID REFERENCES public.riomed_n8n_workflows(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_funnel_automations TO authenticated;
GRANT ALL ON public.riomed_funnel_automations TO service_role;
ALTER TABLE public.riomed_funnel_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_funnel_aut_admin" ON public.riomed_funnel_automations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.riomed_automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.riomed_funnel_automations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  steps_completed INT DEFAULT 0,
  error_message TEXT,
  ai_run_id UUID REFERENCES public.riomed_ai_runs(id) ON DELETE SET NULL,
  n8n_execution_id UUID REFERENCES public.riomed_n8n_executions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.riomed_automation_runs TO authenticated;
GRANT ALL ON public.riomed_automation_runs TO service_role;
ALTER TABLE public.riomed_automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_aut_runs_admin_select" ON public.riomed_automation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "riomed_aut_runs_insert" ON public.riomed_automation_runs FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "riomed_aut_runs_admin_update" ON public.riomed_automation_runs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_riomed_aut_runs_automation ON public.riomed_automation_runs(automation_id, created_at DESC);

CREATE TRIGGER trg_n8n_wf_updated_at BEFORE UPDATE ON public.riomed_n8n_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_agents_updated_at BEFORE UPDATE ON public.riomed_ai_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_funnel_aut_updated_at BEFORE UPDATE ON public.riomed_funnel_automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();