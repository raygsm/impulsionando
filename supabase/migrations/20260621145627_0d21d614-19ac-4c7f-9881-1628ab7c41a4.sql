
-- ============================================================================
-- FASE 3 — IDENTIDADE POR CLIENTE (SUBDOMÍNIOS + E-MAILS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.core_tenant_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  subdomain text NOT NULL UNIQUE,
  root_domain text NOT NULL DEFAULT 'impulsionando.com.br',
  full_domain text GENERATED ALWAYS AS (subdomain || '.' || root_domain) STORED,
  custom_domain text UNIQUE,
  dns_status text NOT NULL DEFAULT 'pending'
    CHECK (dns_status IN ('pending','provisioning','active','failed','disabled')),
  dns_last_checked_at timestamptz,
  dns_error text,
  ssl_status text NOT NULL DEFAULT 'pending'
    CHECK (ssl_status IN ('pending','issued','failed','renewing')),
  ssl_issued_at timestamptz,
  ssl_expires_at timestamptz,
  provisioned_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT core_tenant_identity_subdomain_format
    CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_tenant_identity TO authenticated;
GRANT ALL ON public.core_tenant_identity TO service_role;

ALTER TABLE public.core_tenant_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant identity readable by authenticated"
  ON public.core_tenant_identity FOR SELECT TO authenticated USING (true);

CREATE POLICY "tenant identity admin manage"
  ON public.core_tenant_identity FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_core_tenant_identity_company ON public.core_tenant_identity(company_id);
CREATE INDEX IF NOT EXISTS idx_core_tenant_identity_dns_status ON public.core_tenant_identity(dns_status);

CREATE TABLE IF NOT EXISTS public.core_tenant_email_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  identity_id uuid REFERENCES public.core_tenant_identity(id) ON DELETE CASCADE,
  alias text NOT NULL,
  purpose text NOT NULL
    CHECK (purpose IN ('contato','financeiro','suporte','comercial','no-reply','custom')),
  full_address text NOT NULL,
  forward_to text,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  dns_status text NOT NULL DEFAULT 'pending'
    CHECK (dns_status IN ('pending','active','failed','disabled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, alias),
  UNIQUE (full_address)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_tenant_email_aliases TO authenticated;
GRANT ALL ON public.core_tenant_email_aliases TO service_role;

ALTER TABLE public.core_tenant_email_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant email aliases readable by authenticated"
  ON public.core_tenant_email_aliases FOR SELECT TO authenticated USING (true);

CREATE POLICY "tenant email aliases admin manage"
  ON public.core_tenant_email_aliases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_core_tenant_email_aliases_company ON public.core_tenant_email_aliases(company_id);
CREATE INDEX IF NOT EXISTS idx_core_tenant_email_aliases_identity ON public.core_tenant_email_aliases(identity_id);

CREATE OR REPLACE FUNCTION public.normalize_subdomain(_input text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE _s text;
BEGIN
  IF _input IS NULL OR length(trim(_input)) = 0 THEN RETURN NULL; END IF;
  _s := lower(trim(_input));
  _s := translate(_s, 'áàâãäåéèêëíìîïóòôõöúùûüçñ', 'aaaaaaeeeeiiiiooooouuuucn');
  _s := regexp_replace(_s, '[^a-z0-9]+', '-', 'g');
  _s := regexp_replace(_s, '^-+|-+$', '', 'g');
  _s := regexp_replace(_s, '-{2,}', '-', 'g');
  IF length(_s) > 50 THEN
    _s := substring(_s, 1, 50);
    _s := regexp_replace(_s, '-+$', '', 'g');
  END IF;
  IF length(_s) = 0 THEN RETURN NULL; END IF;
  RETURN _s;
END;
$$;

CREATE OR REPLACE FUNCTION public.provision_tenant_identity(_company_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company RECORD; _base text; _try text; _i int := 0;
  _identity_id uuid; _root text := 'impulsionando.com.br';
BEGIN
  SELECT id, public_slug, name, subdomain INTO _company FROM public.companies WHERE id = _company_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'company_not_found: %', _company_id; END IF;

  SELECT id INTO _identity_id FROM public.core_tenant_identity WHERE company_id = _company_id;
  IF _identity_id IS NOT NULL THEN RETURN _identity_id; END IF;

  _base := public.normalize_subdomain(
    COALESCE(_company.subdomain, _company.public_slug, _company.name, 'cliente-' || left(_company_id::text, 8))
  );
  IF _base IS NULL OR length(_base) < 2 THEN
    _base := 'cliente-' || left(_company_id::text, 8);
  END IF;

  _try := _base;
  WHILE EXISTS (SELECT 1 FROM public.core_tenant_identity WHERE subdomain = _try) LOOP
    _i := _i + 1;
    _try := _base || '-' || _i::text;
    IF _i > 50 THEN
      _try := _base || '-' || left(replace(_company_id::text,'-',''), 8);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.core_tenant_identity (company_id, subdomain, root_domain, dns_status, provisioned_at)
  VALUES (_company_id, _try, _root, 'pending', now())
  RETURNING id INTO _identity_id;

  INSERT INTO public.core_tenant_email_aliases
    (company_id, identity_id, alias, purpose, full_address, is_default, dns_status)
  VALUES
    (_company_id, _identity_id, 'contato',    'contato',    'contato@'    || _try || '.' || _root, true, 'pending'),
    (_company_id, _identity_id, 'financeiro', 'financeiro', 'financeiro@' || _try || '.' || _root, true, 'pending'),
    (_company_id, _identity_id, 'suporte',    'suporte',    'suporte@'    || _try || '.' || _root, true, 'pending'),
    (_company_id, _identity_id, 'comercial',  'comercial',  'comercial@'  || _try || '.' || _root, true, 'pending'),
    (_company_id, _identity_id, 'no-reply',   'no-reply',   'no-reply@'   || _try || '.' || _root, true, 'pending')
  ON CONFLICT DO NOTHING;

  UPDATE public.companies
     SET subdomain = _try, updated_at = now()
   WHERE id = _company_id
     AND (subdomain IS NULL OR length(trim(subdomain)) = 0);

  INSERT INTO public.runtime_events (level, scope, message, context, company_id, occurred_at)
  VALUES ('info', 'core.identity', 'tenant_identity.provisioned',
          jsonb_build_object('identity_id', _identity_id, 'subdomain', _try, 'root_domain', _root),
          _company_id, now());

  RETURN _identity_id;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.runtime_events (level, scope, message, context, company_id, occurred_at)
  VALUES ('error', 'core.identity', 'tenant_identity.provision_failed',
          jsonb_build_object('error', SQLERRM), _company_id, now());
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tenant_subdomain(_company_id uuid, _new_subdomain text)
RETURNS public.core_tenant_identity LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _norm text; _row public.core_tenant_identity; _root text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  _norm := public.normalize_subdomain(_new_subdomain);
  IF _norm IS NULL OR length(_norm) < 2 THEN
    RAISE EXCEPTION 'invalid_subdomain: %', _new_subdomain;
  END IF;

  IF EXISTS (SELECT 1 FROM public.core_tenant_identity WHERE subdomain = _norm AND company_id <> _company_id) THEN
    RAISE EXCEPTION 'subdomain_taken: %', _norm;
  END IF;

  UPDATE public.core_tenant_identity
     SET subdomain = _norm, dns_status = 'pending', ssl_status = 'pending', updated_at = now()
   WHERE company_id = _company_id
   RETURNING * INTO _row;

  IF NOT FOUND THEN
    PERFORM public.provision_tenant_identity(_company_id);
    UPDATE public.core_tenant_identity
       SET subdomain = _norm, updated_at = now()
     WHERE company_id = _company_id
     RETURNING * INTO _row;
  END IF;

  _root := _row.root_domain;

  UPDATE public.core_tenant_email_aliases
     SET full_address = alias || '@' || _norm || '.' || _root,
         dns_status   = 'pending',
         updated_at   = now()
   WHERE company_id = _company_id
     AND purpose IN ('contato','financeiro','suporte','comercial','no-reply');

  UPDATE public.companies SET subdomain = _norm, updated_at = now() WHERE id = _company_id;

  INSERT INTO public.runtime_events (level, scope, message, context, company_id, occurred_at)
  VALUES ('info', 'core.identity', 'tenant_identity.renamed',
          jsonb_build_object('subdomain', _norm), _company_id, now());

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_companies_provision_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.provision_tenant_identity(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_provision_identity ON public.companies;
CREATE TRIGGER trg_companies_provision_identity
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.trg_companies_provision_identity();

DROP TRIGGER IF EXISTS trg_core_tenant_identity_updated_at ON public.core_tenant_identity;
CREATE TRIGGER trg_core_tenant_identity_updated_at
  BEFORE UPDATE ON public.core_tenant_identity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_core_tenant_email_aliases_updated_at ON public.core_tenant_email_aliases;
CREATE TRIGGER trg_core_tenant_email_aliases_updated_at
  BEFORE UPDATE ON public.core_tenant_email_aliases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.v_tenant_identity_status AS
SELECT
  c.id           AS company_id,
  c.name         AS company_name,
  c.public_slug  AS company_slug,
  ti.id          AS identity_id,
  ti.subdomain, ti.root_domain, ti.full_domain, ti.custom_domain,
  ti.dns_status, ti.ssl_status, ti.provisioned_at,
  (SELECT count(*) FROM public.core_tenant_email_aliases a
     WHERE a.company_id = c.id AND a.is_active) AS active_aliases_count,
  (SELECT jsonb_agg(jsonb_build_object(
      'alias', a.alias, 'purpose', a.purpose,
      'full_address', a.full_address, 'dns_status', a.dns_status
    ) ORDER BY a.purpose)
    FROM public.core_tenant_email_aliases a
    WHERE a.company_id = c.id AND a.is_active) AS aliases
FROM public.companies c
LEFT JOIN public.core_tenant_identity ti ON ti.company_id = c.id;

GRANT SELECT ON public.v_tenant_identity_status TO authenticated;

DO $$
DECLARE _c RECORD;
BEGIN
  FOR _c IN
    SELECT id FROM public.companies
     WHERE id NOT IN (SELECT company_id FROM public.core_tenant_identity)
  LOOP
    PERFORM public.provision_tenant_identity(_c.id);
  END LOOP;
END $$;
