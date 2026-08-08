-- Central de Agentes — estrutura mínima
CREATE TABLE IF NOT EXISTS public.agent_demands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  cliente text,
  projeto text,
  tipo_entrega text,
  objetivo text,
  contexto text,
  agentes_selecionados text[] DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'criada' CHECK (status IN ('criada','em_analise','concluida','erro')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_demands TO authenticated;
GRANT ALL ON public.agent_demands TO service_role;
ALTER TABLE public.agent_demands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_demands super admin all" ON public.agent_demands FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "agent_demands owner read" ON public.agent_demands FOR SELECT TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "agent_demands owner insert" ON public.agent_demands FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "agent_demands owner update" ON public.agent_demands FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE TRIGGER trg_agent_demands_updated BEFORE UPDATE ON public.agent_demands
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.agent_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES public.agent_demands(id) ON DELETE CASCADE,
  agent_id text,
  output_type text,
  content jsonb,
  is_final boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_outputs TO authenticated;
GRANT ALL ON public.agent_outputs TO service_role;
ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_outputs by demand" ON public.agent_outputs FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.agent_demands d WHERE d.id = demand_id AND d.created_by = auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.agent_demands d WHERE d.id = demand_id AND d.created_by = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid REFERENCES public.agent_demands(id) ON DELETE CASCADE,
  event text NOT NULL,
  details jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_logs TO authenticated;
GRANT ALL ON public.agent_logs TO service_role;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_logs by demand" ON public.agent_logs FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR (demand_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.agent_demands d WHERE d.id = demand_id AND d.created_by = auth.uid()))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR (demand_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.agent_demands d WHERE d.id = demand_id AND d.created_by = auth.uid()))
  );