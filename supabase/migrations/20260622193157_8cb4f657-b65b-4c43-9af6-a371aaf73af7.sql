-- Onda 10: Governance, Audit, Fine-grained RBAC, Operational Logs

CREATE TABLE public.riomed_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.riomed_audit_log TO authenticated;
GRANT ALL ON public.riomed_audit_log TO service_role;
ALTER TABLE public.riomed_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_audit_admin_select" ON public.riomed_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "riomed_audit_insert" ON public.riomed_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE INDEX idx_riomed_audit_company_created ON public.riomed_audit_log(company_id, created_at DESC);
CREATE INDEX idx_riomed_audit_entity ON public.riomed_audit_log(entity_type, entity_id);

CREATE TABLE public.riomed_user_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scope TEXT NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id, scope)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_user_scopes TO authenticated;
GRANT ALL ON public.riomed_user_scopes TO service_role;
ALTER TABLE public.riomed_user_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_scopes_admin_all" ON public.riomed_user_scopes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "riomed_scopes_self_select" ON public.riomed_user_scopes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.riomed_has_scope(_user_id UUID, _company_id UUID, _scope TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.riomed_user_scopes
    WHERE user_id = _user_id AND company_id = _company_id AND scope = _scope
      AND (expires_at IS NULL OR expires_at > now())
  ) OR public.has_role(_user_id, 'admin');
$$;

CREATE TABLE public.riomed_operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info',
  source TEXT NOT NULL,
  event_code TEXT NOT NULL,
  message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.riomed_operational_events TO authenticated;
GRANT ALL ON public.riomed_operational_events TO service_role;
ALTER TABLE public.riomed_operational_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_opevents_admin_select" ON public.riomed_operational_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "riomed_opevents_insert" ON public.riomed_operational_events FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE INDEX idx_riomed_opevents_company_created ON public.riomed_operational_events(company_id, created_at DESC);
CREATE INDEX idx_riomed_opevents_level ON public.riomed_operational_events(level, created_at DESC);

CREATE TABLE public.riomed_governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  policy_key TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, policy_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_governance_policies TO authenticated;
GRANT ALL ON public.riomed_governance_policies TO service_role;
ALTER TABLE public.riomed_governance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riomed_governance_admin_all" ON public.riomed_governance_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_riomed_user_scopes_updated_at BEFORE UPDATE ON public.riomed_user_scopes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_riomed_governance_policies_updated_at BEFORE UPDATE ON public.riomed_governance_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.riomed_log_audit(
  _company_id UUID, _actor_id UUID, _actor_email TEXT, _action TEXT,
  _entity_type TEXT, _entity_id TEXT, _before JSONB, _after JSONB, _metadata JSONB
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.riomed_audit_log(company_id, actor_id, actor_email, action, entity_type, entity_id, before_data, after_data, metadata)
  VALUES (_company_id, _actor_id, _actor_email, _action, _entity_type, _entity_id, _before, _after, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.riomed_log_event(
  _company_id UUID, _level TEXT, _source TEXT, _event_code TEXT,
  _message TEXT, _payload JSONB, _correlation_id TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.riomed_operational_events(company_id, level, source, event_code, message, payload, correlation_id)
  VALUES (_company_id, COALESCE(_level, 'info'), _source, _event_code, _message, COALESCE(_payload, '{}'::jsonb), _correlation_id)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;