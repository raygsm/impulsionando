
CREATE TABLE IF NOT EXISTS public.realestate_partner_brokers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  broker_name text NOT NULL,
  email text,
  phone text,
  notes text,
  portal_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','paused')),
  contract_started_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_realestate_partner_brokers_token ON public.realestate_partner_brokers(portal_token);
CREATE INDEX IF NOT EXISTS idx_realestate_partner_brokers_company ON public.realestate_partner_brokers(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_partner_brokers TO authenticated;
GRANT ALL ON public.realestate_partner_brokers TO service_role;

ALTER TABLE public.realestate_partner_brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rpb_read" ON public.realestate_partner_brokers
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "rpb_write" ON public.realestate_partner_brokers
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.write')))
  WITH CHECK (public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.write')));

CREATE TRIGGER trg_rpb_updated_at BEFORE UPDATE ON public.realestate_partner_brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public RPC used by the partner portal (token-based, no auth)
CREATE OR REPLACE FUNCTION public.resolve_realestate_partner_token(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'partner_id', rpb.id,
    'company_id', rpb.company_id,
    'broker_name', rpb.broker_name,
    'email', rpb.email,
    'phone', rpb.phone,
    'status', rpb.status,
    'contract_started_at', rpb.contract_started_at,
    'company_name', c.name,
    'company_slug', c.public_slug
  )
  INTO result
  FROM public.realestate_partner_brokers rpb
  JOIN public.companies c ON c.id = rpb.company_id
  WHERE rpb.portal_token = _token;
  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_realestate_partner_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_realestate_partner_token(uuid) TO anon, authenticated;
