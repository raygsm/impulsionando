
-- ============================================================
-- Prompt 2: Permissionamento avançado e Central de Parametrização
-- ============================================================

-- 1) Catálogo expandido de permissões
INSERT INTO public.permissions (module, code, description) VALUES
  ('companies','companies.read','Visualizar empresas'),
  ('companies','companies.write','Criar/editar empresas'),
  ('companies','companies.delete','Excluir empresas'),
  ('units','units.read','Visualizar unidades'),
  ('units','units.write','Criar/editar unidades'),
  ('units','units.delete','Excluir unidades'),
  ('sectors','sectors.read','Visualizar setores'),
  ('sectors','sectors.write','Criar/editar setores'),
  ('sectors','sectors.delete','Excluir setores'),
  ('users','users.delete','Excluir vínculos de usuário'),
  ('profiles','profiles.read','Visualizar perfis de acesso'),
  ('profiles','profiles.write','Criar/editar perfis de acesso'),
  ('permissions','permissions.assign','Atribuir permissões a perfis'),
  ('modules','modules.toggle','Ativar/desativar módulos por empresa'),
  ('settings','settings.read','Visualizar configurações'),
  ('settings','settings.write','Editar configurações da empresa'),
  ('audit','audit.read','Visualizar auditoria')
ON CONFLICT (code) DO NOTHING;

-- 2) Overrides de permissão por usuário (grant/deny acima do perfil)
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  effect text NOT NULL CHECK (effect IN ('grant','deny')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (user_id, company_id, permission_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permission_overrides TO authenticated;
GRANT ALL ON public.user_permission_overrides TO service_role;

ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY upo_select ON public.user_permission_overrides
FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR user_id = auth.uid()
  OR public.user_belongs_to_company(auth.uid(), company_id)
);

CREATE POLICY upo_write ON public.user_permission_overrides
FOR ALL TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.user_has_permission(auth.uid(), company_id, 'users.write')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.user_has_permission(auth.uid(), company_id, 'users.write')
);

DROP TRIGGER IF EXISTS tg_audit_user_permission_overrides ON public.user_permission_overrides;
CREATE TRIGGER tg_audit_user_permission_overrides
AFTER INSERT OR UPDATE OR DELETE ON public.user_permission_overrides
FOR EACH ROW EXECUTE FUNCTION public.tg_audit();

-- 3) user_has_permission considerando overrides
CREATE OR REPLACE FUNCTION public.user_has_permission(_user uuid, _company uuid, _perm text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _override text; _from_profile boolean;
BEGIN
  IF public.is_super_admin(_user) THEN RETURN true; END IF;

  SELECT o.effect INTO _override
  FROM public.user_permission_overrides o
  JOIN public.permissions p ON p.id = o.permission_id
  WHERE o.user_id = _user AND o.company_id = _company AND p.code = _perm
  LIMIT 1;

  IF _override = 'deny' THEN RETURN false; END IF;
  IF _override = 'grant' THEN RETURN true; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.profile_permissions pp ON pp.profile_id = up.profile_id
    JOIN public.permissions perm ON perm.id = pp.permission_id
    WHERE up.user_id = _user AND up.company_id = _company
      AND up.is_active = true AND perm.code = _perm
  ) INTO _from_profile;

  RETURN COALESCE(_from_profile, false);
END $$;

-- 4) Catálogo de parâmetros (definições globais)
CREATE TABLE IF NOT EXISTS public.setting_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'geral',
  value_type text NOT NULL CHECK (value_type IN ('text','number','boolean','json')),
  default_value jsonb,
  is_company_editable boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.setting_definitions TO authenticated;
GRANT ALL ON public.setting_definitions TO service_role;

ALTER TABLE public.setting_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sd_read ON public.setting_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY sd_write ON public.setting_definitions FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS set_updated_at ON public.setting_definitions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.setting_definitions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed de parâmetros padrão
INSERT INTO public.setting_definitions (key, label, description, category, value_type, default_value, sort_order) VALUES
  ('brand.primary_color','Cor primária','Cor base do white label','aparencia','text','"#3B82F6"'::jsonb,10),
  ('brand.logo_url','URL do logo','Logo exibido no topo','aparencia','text','""'::jsonb,20),
  ('brand.app_name','Nome do aplicativo','Nome exibido no header','aparencia','text','"Impulsionando"'::jsonb,30),
  ('notifications.email_enabled','E-mails habilitados','Envio geral de e-mails','notificacoes','boolean','true'::jsonb,10),
  ('notifications.whatsapp_enabled','WhatsApp habilitado','Envio via WhatsApp','notificacoes','boolean','false'::jsonb,20),
  ('billing.currency','Moeda','Moeda padrão','financeiro','text','"BRL"'::jsonb,10),
  ('billing.invoice_prefix','Prefixo de NF','Prefixo da numeração','financeiro','text','"NF"'::jsonb,20),
  ('security.session_timeout_min','Timeout de sessão (min)','Minutos até logout','seguranca','number','60'::jsonb,10),
  ('security.require_2fa','Exigir 2FA','Obriga 2FA para login','seguranca','boolean','false'::jsonb,20)
ON CONFLICT (key) DO NOTHING;

-- 5) Categoria em company_settings (para agrupar na UI)
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'geral';
CREATE INDEX IF NOT EXISTS idx_company_settings_company_category ON public.company_settings (company_id, category);

-- 6) Seed inicial de permissões para perfis padrão (idempotente)
-- Admin → todas as permissões não-master
INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT pr.id, pe.id FROM public.profiles pr CROSS JOIN public.permissions pe
WHERE pr.slug = 'admin' AND pe.code NOT LIKE 'admin.%'
ON CONFLICT DO NOTHING;

-- Gestor → leitura ampla + escrita em users/units/sectors/settings
INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT pr.id, pe.id FROM public.profiles pr JOIN public.permissions pe ON pe.code IN (
  'companies.read','units.read','units.write','sectors.read','sectors.write',
  'users.read','users.write','profiles.read','settings.read','settings.write','audit.read'
) WHERE pr.slug = 'gestor'
ON CONFLICT DO NOTHING;

-- Administrador da Unidade → escopo unidade
INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT pr.id, pe.id FROM public.profiles pr JOIN public.permissions pe ON pe.code IN (
  'units.read','sectors.read','sectors.write','users.read','users.write','settings.read'
) WHERE pr.slug = 'administrador-unidade'
ON CONFLICT DO NOTHING;

-- Recepção / Operador / Profissional → apenas leitura básica
INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT pr.id, pe.id FROM public.profiles pr JOIN public.permissions pe ON pe.code IN (
  'units.read','sectors.read','users.read'
) WHERE pr.slug IN ('recepcao','operador','profissional')
ON CONFLICT DO NOTHING;
