-- TEAMS
CREATE TABLE IF NOT EXISTS public.realestate_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  leader_user_id uuid,
  goal_monthly numeric,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_teams TO authenticated;
GRANT ALL ON public.realestate_teams TO service_role;
ALTER TABLE public.realestate_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_company_read" ON public.realestate_teams FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "team_company_write" ON public.realestate_teams FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.realestate_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.realestate_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'broker',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_team_members TO authenticated;
GRANT ALL ON public.realestate_team_members TO service_role;
ALTER TABLE public.realestate_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_read" ON public.realestate_team_members FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM public.realestate_teams t
                     WHERE t.company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())));
CREATE POLICY "team_member_write" ON public.realestate_team_members FOR ALL TO authenticated
  USING (team_id IN (SELECT id FROM public.realestate_teams t
                     WHERE t.company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')))
  WITH CHECK (true);

-- DISTRIBUTION RULES (one active rule per company)
CREATE TABLE IF NOT EXISTS public.realestate_distribution_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  strategy text NOT NULL DEFAULT 'round_robin',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_distribution_rules TO authenticated;
GRANT ALL ON public.realestate_distribution_rules TO service_role;
ALTER TABLE public.realestate_distribution_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "distrule_read" ON public.realestate_distribution_rules FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "distrule_write" ON public.realestate_distribution_rules FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- LEAD ASSIGNMENTS (audit trail)
CREATE TABLE IF NOT EXISTS public.realestate_lead_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  broker_user_id uuid,
  team_id uuid,
  strategy text NOT NULL DEFAULT 'manual',
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.realestate_lead_assignments TO authenticated;
GRANT ALL ON public.realestate_lead_assignments TO service_role;
ALTER TABLE public.realestate_lead_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assign_read" ON public.realestate_lead_assignments FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "assign_insert" ON public.realestate_lead_assignments FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_realestate_teams_uat BEFORE UPDATE ON public.realestate_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_realestate_distrules_uat BEFORE UPDATE ON public.realestate_distribution_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();