-- 1) companies: public_slug + vitrine flag
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS vitrine_enabled boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS companies_public_slug_key
  ON public.companies (public_slug) WHERE public_slug IS NOT NULL;

UPDATE public.companies
SET public_slug = COALESCE(public_slug,
      lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))),
    vitrine_enabled = true
WHERE name ILIKE '%garrido%' AND public_slug IS NULL;

DROP POLICY IF EXISTS companies_public_vitrine_read ON public.companies;
CREATE POLICY companies_public_vitrine_read ON public.companies
  FOR SELECT TO anon
  USING (vitrine_enabled = true AND public_slug IS NOT NULL);

GRANT SELECT (id, name, public_slug, vitrine_enabled) ON public.companies TO anon;

DROP POLICY IF EXISTS realestate_properties_public_read ON public.realestate_properties;
CREATE POLICY realestate_properties_public_read ON public.realestate_properties
  FOR SELECT TO anon
  USING (
    is_published = true
    AND status = 'ativo'
    AND approval_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = realestate_properties.company_id
        AND c.vitrine_enabled = true
        AND c.public_slug IS NOT NULL
    )
  );
GRANT SELECT ON public.realestate_properties TO anon;

-- 2) Extend search_intents
ALTER TABLE public.realestate_search_intents
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- 3) realestate_interests
CREATE TABLE IF NOT EXISTS public.realestate_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.realestate_properties(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  broker_user_id uuid,
  kind text NOT NULL DEFAULT 'interesse'
    CHECK (kind IN ('interesse','visita','avaliacao','contato','proposta')),
  status text NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo','em_atendimento','respondido','convertido','perdido','arquivado')),
  contact_name text NOT NULL,
  contact_email text,
  contact_phone text,
  contact_whatsapp text,
  message text,
  source text NOT NULL DEFAULT 'vitrine',
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  last_action_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS realestate_interests_company_idx
  ON public.realestate_interests (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS realestate_interests_property_idx
  ON public.realestate_interests (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS realestate_interests_status_idx
  ON public.realestate_interests (company_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_interests TO authenticated;
GRANT ALL ON public.realestate_interests TO service_role;
ALTER TABLE public.realestate_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY realestate_interests_select ON public.realestate_interests
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.interest.read')));
CREATE POLICY realestate_interests_insert ON public.realestate_interests
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.interest.write')));
CREATE POLICY realestate_interests_update ON public.realestate_interests
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.interest.write')));
CREATE POLICY realestate_interests_delete ON public.realestate_interests
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.interest.close')));

-- 4) realestate_internal_messages
CREATE TABLE IF NOT EXISTS public.realestate_internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'vitrine',
  request_kind text NOT NULL DEFAULT 'interesse'
    CHECK (request_kind IN ('interesse','visita','avaliacao','contato','busca','mensagem','proposta')),
  status text NOT NULL DEFAULT 'nova'
    CHECK (status IN ('nova','em_atendimento','respondida','arquivada')),
  property_id uuid REFERENCES public.realestate_properties(id) ON DELETE SET NULL,
  intent_id uuid REFERENCES public.realestate_search_intents(id) ON DELETE SET NULL,
  interest_id uuid REFERENCES public.realestate_interests(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_email text,
  contact_phone text,
  subject text NOT NULL,
  body text NOT NULL,
  assigned_user_id uuid,
  replies_count integer NOT NULL DEFAULT 0,
  last_reply_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS realestate_messages_company_idx
  ON public.realestate_internal_messages (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS realestate_messages_status_idx
  ON public.realestate_internal_messages (company_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_internal_messages TO authenticated;
GRANT ALL ON public.realestate_internal_messages TO service_role;
ALTER TABLE public.realestate_internal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY realestate_messages_select ON public.realestate_internal_messages
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.message.read')));
CREATE POLICY realestate_messages_insert ON public.realestate_internal_messages
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.message.write')));
CREATE POLICY realestate_messages_update ON public.realestate_internal_messages
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.message.write')));
CREATE POLICY realestate_messages_delete ON public.realestate_internal_messages
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.message.close')));

-- 5) realestate_property_history
CREATE TABLE IF NOT EXISTS public.realestate_property_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.realestate_properties(id) ON DELETE CASCADE,
  event_code text NOT NULL,
  actor_user_id uuid,
  actor_lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  description text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS realestate_history_property_idx
  ON public.realestate_property_history (property_id, created_at DESC);

GRANT SELECT, INSERT ON public.realestate_property_history TO authenticated;
GRANT ALL ON public.realestate_property_history TO service_role;
ALTER TABLE public.realestate_property_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY realestate_history_select ON public.realestate_property_history
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.property.read')));
CREATE POLICY realestate_history_insert ON public.realestate_property_history
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id)
        AND user_has_permission(auth.uid(), company_id, 'realestate.property.write')));

-- 6) updated_at triggers
DROP TRIGGER IF EXISTS trg_realestate_interests_upd ON public.realestate_interests;
CREATE TRIGGER trg_realestate_interests_upd BEFORE UPDATE ON public.realestate_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_realestate_messages_upd ON public.realestate_internal_messages;
CREATE TRIGGER trg_realestate_messages_upd BEFORE UPDATE ON public.realestate_internal_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Permissions + grants
INSERT INTO public.permissions (code, module, description) VALUES
  ('realestate.interest.read', 'realestate', 'Ver interessados da vitrine imobiliária'),
  ('realestate.interest.write', 'realestate', 'Criar/editar interessados'),
  ('realestate.interest.assign', 'realestate', 'Atribuir corretor a interessados'),
  ('realestate.interest.close', 'realestate', 'Arquivar/excluir interessados'),
  ('realestate.message.read', 'realestate', 'Ver mensagens internas da vitrine'),
  ('realestate.message.write', 'realestate', 'Responder/editar mensagens internas'),
  ('realestate.message.assign', 'realestate', 'Atribuir mensagens'),
  ('realestate.message.close', 'realestate', 'Arquivar/excluir mensagens'),
  ('realestate.vitrine.admin', 'realestate', 'Administrar configurações da vitrine pública')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE prof RECORD; perm RECORD;
BEGIN
  FOR prof IN SELECT id, slug FROM public.profiles WHERE slug IN
    ('gestor-empresa','admin-unidade','admin-impulsionando','profissional','recepcao')
  LOOP
    FOR perm IN SELECT id, code FROM public.permissions WHERE code IN
      ('realestate.interest.read','realestate.interest.write','realestate.interest.assign','realestate.interest.close',
       'realestate.message.read','realestate.message.write','realestate.message.assign','realestate.message.close',
       'realestate.vitrine.admin')
    LOOP
      IF prof.slug = 'recepcao' AND perm.code NOT IN
        ('realestate.interest.read','realestate.message.read') THEN CONTINUE; END IF;
      IF prof.slug = 'profissional' AND perm.code = 'realestate.vitrine.admin' THEN CONTINUE; END IF;
      INSERT INTO public.profile_permissions (profile_id, permission_id)
      VALUES (prof.id, perm.id) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END$$;