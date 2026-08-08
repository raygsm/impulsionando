
-- ============================================================================
-- FASE 4 — WHATSAPP POR CLIENTE
-- ============================================================================

-- 1) Credenciais por tenant ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.core_whatsapp_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  label text NOT NULL,
  provider text NOT NULL DEFAULT 'evolution'
    CHECK (provider IN ('evolution','meta_cloud','twilio','zapi','unisender','custom')),
  purpose text NOT NULL DEFAULT 'transactional'
    CHECK (purpose IN ('transactional','marketing','support','sales','any')),
  instance_id text NOT NULL,
  sender_number text NOT NULL,
  display_name text,
  api_base_url text,
  access_token_encrypted text,
  webhook_secret text,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  last_health_check_at timestamptz,
  health_status text NOT NULL DEFAULT 'unknown'
    CHECK (health_status IN ('unknown','healthy','degraded','down')),
  daily_quota int,
  monthly_quota int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, label),
  UNIQUE (provider, instance_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_whatsapp_credentials TO authenticated;
GRANT ALL ON public.core_whatsapp_credentials TO service_role;
-- Hide secrets from authenticated SELECT
REVOKE SELECT (access_token_encrypted, webhook_secret) ON public.core_whatsapp_credentials FROM authenticated;

ALTER TABLE public.core_whatsapp_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa creds read authenticated"
  ON public.core_whatsapp_credentials FOR SELECT TO authenticated USING (true);

CREATE POLICY "wa creds admin manage"
  ON public.core_whatsapp_credentials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_core_whatsapp_credentials_company
  ON public.core_whatsapp_credentials(company_id) WHERE is_active;

-- 2) Regras de roteamento por evento -----------------------------------------
CREATE TABLE IF NOT EXISTS public.core_whatsapp_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  event_code_pattern text NOT NULL,
  purpose text NOT NULL DEFAULT 'transactional'
    CHECK (purpose IN ('transactional','marketing','support','sales','any')),
  credential_id uuid REFERENCES public.core_whatsapp_credentials(id) ON DELETE SET NULL,
  priority int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_whatsapp_routing_rules TO authenticated;
GRANT ALL ON public.core_whatsapp_routing_rules TO service_role;

ALTER TABLE public.core_whatsapp_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa routing read authenticated"
  ON public.core_whatsapp_routing_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "wa routing admin manage"
  ON public.core_whatsapp_routing_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_core_whatsapp_routing_company
  ON public.core_whatsapp_routing_rules(company_id, priority) WHERE is_active;

-- 3) Fallback global ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.core_whatsapp_fallback_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','niche')),
  niche_slug text,
  credential_id uuid NOT NULL REFERENCES public.core_whatsapp_credentials(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, niche_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_whatsapp_fallback_config TO authenticated;
GRANT ALL ON public.core_whatsapp_fallback_config TO service_role;

ALTER TABLE public.core_whatsapp_fallback_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa fallback read authenticated"
  ON public.core_whatsapp_fallback_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "wa fallback admin manage"
  ON public.core_whatsapp_fallback_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Resolver: empresa → credencial ------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_whatsapp_credential(
  _company_id uuid,
  _event_code text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cred_id uuid;
  _niche_slug text;
BEGIN
  -- 1) Rota específica do tenant para esse event_code
  IF _event_code IS NOT NULL THEN
    SELECT r.credential_id INTO _cred_id
      FROM public.core_whatsapp_routing_rules r
     WHERE r.is_active
       AND r.company_id = _company_id
       AND _event_code ~ r.event_code_pattern
     ORDER BY r.priority ASC, r.created_at ASC
     LIMIT 1;
    IF _cred_id IS NOT NULL THEN RETURN _cred_id; END IF;
  END IF;

  -- 2) Qualquer credencial ativa e verificada do próprio tenant
  SELECT id INTO _cred_id
    FROM public.core_whatsapp_credentials
   WHERE company_id = _company_id
     AND is_active
   ORDER BY is_verified DESC, created_at ASC
   LIMIT 1;
  IF _cred_id IS NOT NULL THEN RETURN _cred_id; END IF;

  -- 3) Fallback por nicho
  SELECT n.slug INTO _niche_slug
    FROM public.companies c
    LEFT JOIN public.niches n ON n.id = c.niche_id
   WHERE c.id = _company_id;

  IF _niche_slug IS NOT NULL THEN
    SELECT credential_id INTO _cred_id
      FROM public.core_whatsapp_fallback_config
     WHERE is_active AND scope = 'niche' AND niche_slug = _niche_slug
     LIMIT 1;
    IF _cred_id IS NOT NULL THEN RETURN _cred_id; END IF;
  END IF;

  -- 4) Fallback global
  SELECT credential_id INTO _cred_id
    FROM public.core_whatsapp_fallback_config
   WHERE is_active AND scope = 'global'
   LIMIT 1;
  RETURN _cred_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_whatsapp_credential(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_whatsapp_credential(uuid, text) TO authenticated, service_role;

-- 5) Assert: pronto para enviar -----------------------------------------------
CREATE OR REPLACE FUNCTION public.assert_whatsapp_ready(_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _cred uuid;
BEGIN
  _cred := public.resolve_whatsapp_credential(_company_id, NULL);
  IF _cred IS NULL THEN
    RAISE EXCEPTION 'WHATSAPP_NOT_CONFIGURED: no credential available for company %', _company_id
      USING ERRCODE = 'P0001';
  END IF;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assert_whatsapp_ready(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_whatsapp_ready(uuid) TO authenticated, service_role;

-- 6) Trigger em message_outbox: anota credencial resolvida em payload --------
CREATE OR REPLACE FUNCTION public.trg_message_outbox_route_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cred public.core_whatsapp_credentials;
  _cred_id uuid;
BEGIN
  IF NEW.channel <> 'whatsapp' OR NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- pular se já tem instance resolvida
  IF (NEW.payload ? 'whatsapp')
     AND (NEW.payload->'whatsapp' ? 'credential_id') THEN
    RETURN NEW;
  END IF;

  _cred_id := public.resolve_whatsapp_credential(NEW.company_id, NEW.event_code);
  IF _cred_id IS NULL THEN
    NEW.status := 'failed';
    NEW.last_error := 'WHATSAPP_NOT_CONFIGURED';
    RETURN NEW;
  END IF;

  SELECT * INTO _cred FROM public.core_whatsapp_credentials WHERE id = _cred_id;

  NEW.payload := COALESCE(NEW.payload, '{}'::jsonb) || jsonb_build_object(
    'whatsapp', jsonb_build_object(
      'credential_id', _cred.id,
      'provider',      _cred.provider,
      'instance_id',   _cred.instance_id,
      'sender_number', _cred.sender_number,
      'display_name',  _cred.display_name,
      'api_base_url',  _cred.api_base_url,
      'is_fallback',   (_cred.company_id <> NEW.company_id)
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_outbox_route_whatsapp ON public.message_outbox;
CREATE TRIGGER trg_message_outbox_route_whatsapp
  BEFORE INSERT OR UPDATE OF channel, event_code, company_id ON public.message_outbox
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_message_outbox_route_whatsapp();

-- 7) updated_at triggers ------------------------------------------------------
DROP TRIGGER IF EXISTS trg_core_wa_creds_updated_at ON public.core_whatsapp_credentials;
CREATE TRIGGER trg_core_wa_creds_updated_at
  BEFORE UPDATE ON public.core_whatsapp_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_core_wa_routing_updated_at ON public.core_whatsapp_routing_rules;
CREATE TRIGGER trg_core_wa_routing_updated_at
  BEFORE UPDATE ON public.core_whatsapp_routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_core_wa_fallback_updated_at ON public.core_whatsapp_fallback_config;
CREATE TRIGGER trg_core_wa_fallback_updated_at
  BEFORE UPDATE ON public.core_whatsapp_fallback_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) View consolidada ---------------------------------------------------------
CREATE OR REPLACE VIEW public.v_company_whatsapp_status AS
SELECT
  c.id   AS company_id,
  c.name AS company_name,
  (SELECT count(*) FROM public.core_whatsapp_credentials w
     WHERE w.company_id = c.id AND w.is_active) AS own_credentials_count,
  (SELECT bool_or(w.is_verified) FROM public.core_whatsapp_credentials w
     WHERE w.company_id = c.id AND w.is_active) AS has_verified_own,
  public.resolve_whatsapp_credential(c.id, NULL) AS effective_credential_id,
  CASE
    WHEN public.resolve_whatsapp_credential(c.id, NULL) IS NULL THEN 'not_configured'
    WHEN EXISTS (SELECT 1 FROM public.core_whatsapp_credentials w
                  WHERE w.id = public.resolve_whatsapp_credential(c.id, NULL)
                    AND w.company_id = c.id) THEN 'own'
    ELSE 'fallback'
  END AS routing_mode
FROM public.companies c;

ALTER VIEW public.v_company_whatsapp_status SET (security_invoker = true);
GRANT SELECT ON public.v_company_whatsapp_status TO authenticated;
