
INSERT INTO public.permissions(code, module, description)
VALUES ('contab.finance.read','contab','Permite visualizar receitas/custos internos do escritório contábil')
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.audit_sensitive_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company uuid;
  _entity_id text;
  _before jsonb;
  _after jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _company := (to_jsonb(OLD)->>'company_id')::uuid;
    _entity_id := (to_jsonb(OLD)->>'id');
    _before := to_jsonb(OLD);
    _after := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    _company := (to_jsonb(NEW)->>'company_id')::uuid;
    _entity_id := (to_jsonb(NEW)->>'id');
    _before := to_jsonb(OLD);
    _after := to_jsonb(NEW);
  ELSE
    _company := (to_jsonb(NEW)->>'company_id')::uuid;
    _entity_id := (to_jsonb(NEW)->>'id');
    _before := NULL;
    _after := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs(company_id, user_id, action, entity, entity_id, before, after, metadata)
  VALUES (
    _company, auth.uid(), lower(TG_OP), TG_TABLE_NAME, _entity_id, _before, _after,
    jsonb_build_object('sensitive', true,
      'category', CASE WHEN TG_TABLE_NAME LIKE 'core_refund%' THEN 'refund'
                       WHEN TG_TABLE_NAME LIKE 'core_reschedule%' THEN 'reschedule'
                       ELSE 'other' END)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_core_refund_rules ON public.core_refund_rules;
CREATE TRIGGER trg_audit_core_refund_rules
AFTER INSERT OR UPDATE OR DELETE ON public.core_refund_rules
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS trg_audit_core_reschedule_rules ON public.core_reschedule_rules;
CREATE TRIGGER trg_audit_core_reschedule_rules
AFTER INSERT OR UPDATE OR DELETE ON public.core_reschedule_rules
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

CREATE OR REPLACE FUNCTION public.log_security_event(
  _entity text,
  _action text,
  _company uuid DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs(company_id, user_id, user_email, action, entity, entity_id, metadata)
  VALUES (_company, auth.uid(), _email,
    coalesce(_action,'denied'), coalesce(_entity,'unknown'), _entity_id,
    coalesce(_metadata,'{}'::jsonb) || jsonb_build_object('source','app','logged_at', now()))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(text,text,uuid,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_security_event(text,text,uuid,text,jsonb) TO authenticated;
