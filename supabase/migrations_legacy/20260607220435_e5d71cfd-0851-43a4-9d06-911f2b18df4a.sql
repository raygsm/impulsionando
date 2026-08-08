
-- 1) Support sessions (entrar como cliente)
CREATE TABLE public.support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_user_id uuid NOT NULL,
  super_user_email text,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_sessions_company ON public.support_sessions(company_id);
CREATE INDEX idx_support_sessions_user ON public.support_sessions(super_user_id);
GRANT SELECT, INSERT, UPDATE ON public.support_sessions TO authenticated;
GRANT ALL ON public.support_sessions TO service_role;
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_sessions_super_admin_all" ON public.support_sessions
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 2) Governance applications (auditoria de aplicações em massa)
CREATE TABLE public.governance_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('setting','version','copy_settings','clone_company')),
  scope text NOT NULL CHECK (scope IN ('all','white_label','company')),
  target_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  affected_count integer NOT NULL DEFAULT 0,
  applied_by uuid NOT NULL,
  applied_by_email text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gov_apps_applied_at ON public.governance_applications(applied_at DESC);
CREATE INDEX idx_gov_apps_kind ON public.governance_applications(kind);
GRANT SELECT, INSERT ON public.governance_applications TO authenticated;
GRANT ALL ON public.governance_applications TO service_role;
ALTER TABLE public.governance_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov_apps_super_admin_all" ON public.governance_applications
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
