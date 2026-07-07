
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','notice','warning','critical')),
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'admin'
    CHECK (category IN ('admin','auth','security','billing','data','system'));

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category   ON public.audit_logs (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company    ON public.audit_logs (company_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action      text,
  _entity      text,
  _entity_id   text DEFAULT NULL,
  _before      jsonb DEFAULT NULL,
  _after       jsonb DEFAULT NULL,
  _metadata    jsonb DEFAULT '{}'::jsonb,
  _company_id  uuid DEFAULT NULL,
  _ip          inet DEFAULT NULL,
  _user_agent  text DEFAULT NULL,
  _severity    text DEFAULT 'info',
  _category    text DEFAULT 'admin'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _email text;
  _id uuid;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _actor;
  INSERT INTO public.audit_logs (
    company_id, user_id, user_email, action, entity, entity_id,
    before, after, metadata, ip_address, user_agent, severity, category
  ) VALUES (
    _company_id, _actor, _email, _action, _entity, _entity_id,
    _before, _after, coalesce(_metadata,'{}'::jsonb), _ip, _user_agent, _severity, _category
  ) RETURNING id INTO _id;
  RETURN _id;
END;
$$;

DROP POLICY IF EXISTS "audit_logs_read_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_read_admin" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid()
          AND up.company_id = public.audit_logs.company_id
      )
    )
  );
