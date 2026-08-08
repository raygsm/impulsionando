
CREATE TABLE public.automation_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_slug TEXT,
  mode TEXT NOT NULL DEFAULT 'demo',
  regua TEXT,
  action TEXT NOT NULL DEFAULT 'download',
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.automation_approvals TO authenticated;
GRANT ALL ON public.automation_approvals TO service_role;

ALTER TABLE public.automation_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own approvals"
  ON public.automation_approvals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Users insert own approvals"
  ON public.automation_approvals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin/gestor update approvals"
  ON public.automation_approvals FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE TRIGGER automation_approvals_updated_at
  BEFORE UPDATE ON public.automation_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_automation_approvals_user ON public.automation_approvals(user_id, created_at DESC);
CREATE INDEX idx_automation_approvals_tenant ON public.automation_approvals(tenant_slug, created_at DESC);
