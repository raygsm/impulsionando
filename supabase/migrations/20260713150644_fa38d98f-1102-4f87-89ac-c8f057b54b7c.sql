
CREATE TABLE IF NOT EXISTS public.hostinger_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  registered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  nameservers TEXT[] NOT NULL DEFAULT '{}',
  hostinger_domain_id TEXT,
  hostinger_order_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (domain)
);
CREATE INDEX IF NOT EXISTS hostinger_domains_company_idx ON public.hostinger_domains(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostinger_domains TO authenticated;
GRANT ALL ON public.hostinger_domains TO service_role;
ALTER TABLE public.hostinger_domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hostinger_domains_select" ON public.hostinger_domains;
CREATE POLICY "hostinger_domains_select" ON public.hostinger_domains FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = hostinger_domains.company_id));
DROP POLICY IF EXISTS "hostinger_domains_write_staff" ON public.hostinger_domains;
CREATE POLICY "hostinger_domains_write_staff" ON public.hostinger_domains FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.hostinger_mailboxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  address TEXT NOT NULL,
  quota_mb INTEGER NOT NULL DEFAULT 1024,
  status TEXT NOT NULL DEFAULT 'active',
  hostinger_mailbox_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (address)
);
CREATE INDEX IF NOT EXISTS hostinger_mailboxes_company_idx ON public.hostinger_mailboxes(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostinger_mailboxes TO authenticated;
GRANT ALL ON public.hostinger_mailboxes TO service_role;
ALTER TABLE public.hostinger_mailboxes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hostinger_mailboxes_select" ON public.hostinger_mailboxes;
CREATE POLICY "hostinger_mailboxes_select" ON public.hostinger_mailboxes FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = hostinger_mailboxes.company_id));
DROP POLICY IF EXISTS "hostinger_mailboxes_write_staff" ON public.hostinger_mailboxes;
CREATE POLICY "hostinger_mailboxes_write_staff" ON public.hostinger_mailboxes FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.hostinger_vps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  hostinger_vps_id TEXT NOT NULL,
  hostname TEXT, plan TEXT, region TEXT,
  status TEXT NOT NULL DEFAULT 'unknown',
  ipv4 TEXT[] NOT NULL DEFAULT '{}',
  ipv6 TEXT[] NOT NULL DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hostinger_vps_id)
);
CREATE INDEX IF NOT EXISTS hostinger_vps_company_idx ON public.hostinger_vps(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostinger_vps TO authenticated;
GRANT ALL ON public.hostinger_vps TO service_role;
ALTER TABLE public.hostinger_vps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hostinger_vps_select" ON public.hostinger_vps;
CREATE POLICY "hostinger_vps_select" ON public.hostinger_vps FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())
    OR (company_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.company_id = hostinger_vps.company_id)));
DROP POLICY IF EXISTS "hostinger_vps_write_staff" ON public.hostinger_vps;
CREATE POLICY "hostinger_vps_write_staff" ON public.hostinger_vps FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.hostinger_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  reference TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  hostinger_order_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hostinger_orders_company_idx ON public.hostinger_orders(company_id);
CREATE INDEX IF NOT EXISTS hostinger_orders_kind_idx ON public.hostinger_orders(kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostinger_orders TO authenticated;
GRANT ALL ON public.hostinger_orders TO service_role;
ALTER TABLE public.hostinger_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hostinger_orders_select" ON public.hostinger_orders;
CREATE POLICY "hostinger_orders_select" ON public.hostinger_orders FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = hostinger_orders.company_id));
DROP POLICY IF EXISTS "hostinger_orders_write_staff" ON public.hostinger_orders;
CREATE POLICY "hostinger_orders_write_staff" ON public.hostinger_orders FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid())) WITH CHECK (public.is_impulsionando_staff(auth.uid()));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $f$
    BEGIN NEW.updated_at = now(); RETURN NEW; END; $f$ LANGUAGE plpgsql SET search_path = public;
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_hostinger_domains_updated ON public.hostinger_domains;
CREATE TRIGGER trg_hostinger_domains_updated BEFORE UPDATE ON public.hostinger_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hostinger_mailboxes_updated ON public.hostinger_mailboxes;
CREATE TRIGGER trg_hostinger_mailboxes_updated BEFORE UPDATE ON public.hostinger_mailboxes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hostinger_vps_updated ON public.hostinger_vps;
CREATE TRIGGER trg_hostinger_vps_updated BEFORE UPDATE ON public.hostinger_vps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_hostinger_orders_updated ON public.hostinger_orders;
CREATE TRIGGER trg_hostinger_orders_updated BEFORE UPDATE ON public.hostinger_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.core_integrations (slug, name, environment, status, is_active)
SELECT 'hostinger', 'Hostinger', 'production', 'connected', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_integrations WHERE slug = 'hostinger' AND environment = 'production'
);
