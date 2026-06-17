
ALTER TABLE public.aff_affiliates
  ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lifetime_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lifetime_granted_by UUID,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_pending NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_last_movement_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.aff_wallet_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  affiliate_id UUID NOT NULL REFERENCES public.aff_affiliates(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  related_customer_id UUID,
  related_sale_id UUID,
  amount NUMERIC(14,2),
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_wallet_alerts TO authenticated;
GRANT ALL ON public.aff_wallet_alerts TO service_role;

ALTER TABLE public.aff_wallet_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aff_wallet_alerts: company members read"
  ON public.aff_wallet_alerts FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "aff_wallet_alerts: service write"
  ON public.aff_wallet_alerts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "aff_wallet_alerts: company members update"
  ON public.aff_wallet_alerts FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS aff_wallet_alerts_aff_idx ON public.aff_wallet_alerts(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS aff_wallet_alerts_unread_idx ON public.aff_wallet_alerts(affiliate_id) WHERE is_read = false;

CREATE OR REPLACE FUNCTION public.enforce_single_super_admin_master()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE existing_count INT;
BEGIN
  IF NEW.role = 'super_admin' THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.user_roles
    WHERE role = 'super_admin' AND user_id <> NEW.user_id;
    IF existing_count >= 1 THEN
      RAISE EXCEPTION 'SUPER_ADMIN_MASTER unico: ja existe um super_admin no sistema. Revogue o anterior antes de promover outro.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_super_admin_master ON public.user_roles;
CREATE TRIGGER trg_enforce_single_super_admin_master
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_super_admin_master();

CREATE OR REPLACE FUNCTION public.permission_matrix()
RETURNS TABLE (
  profile_id UUID,
  profile_name TEXT,
  profile_slug TEXT,
  is_master_profile BOOLEAN,
  permission_id UUID,
  permission_code TEXT,
  permission_module TEXT,
  granted BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ap.id, ap.name, ap.slug, ap.is_master_profile,
    p.id, p.code, p.module,
    EXISTS (
      SELECT 1 FROM public.profile_permissions pp
      WHERE pp.profile_id = ap.id AND pp.permission_id = p.id
    )
  FROM public.profiles ap
  CROSS JOIN public.permissions p
  ORDER BY ap.name, p.module, p.code;
$$;

CREATE OR REPLACE FUNCTION public.permission_matrix_toggle(
  _profile_id UUID,
  _permission_id UUID,
  _granted BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'super_admin') OR public.user_has_permission(auth.uid(), 'profiles.write')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _granted THEN
    INSERT INTO public.profile_permissions (profile_id, permission_id)
    VALUES (_profile_id, _permission_id)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.profile_permissions
    WHERE profile_id = _profile_id AND permission_id = _permission_id;
  END IF;
END;
$$;
