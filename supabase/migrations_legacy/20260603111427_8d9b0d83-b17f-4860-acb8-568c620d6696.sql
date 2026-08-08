
-- ============================================================
-- IMPULSIONANDO SISTEMAS — FUNDAÇÃO SAAS MULTIEMPRESA
-- ============================================================

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.niches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id uuid REFERENCES public.niches(id) ON DELETE SET NULL,
  name text NOT NULL,
  legal_name text,
  document text,
  email text,
  phone text,
  logo_url text,
  is_master boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_master_company ON public.companies(is_master) WHERE is_master = true;

CREATE TABLE public.company_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  address text,
  city text,
  state text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_units_company ON public.company_units(company_id);

CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.company_units(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sectors_company ON public.sectors(company_id);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_master_profile boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  module text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_permissions (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, permission_id)
);

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.company_units(id) ON DELETE SET NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  display_name text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id, profile_id)
);
CREATE INDEX idx_user_profiles_user ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_company ON public.user_profiles(company_id);

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  category text,
  is_core boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  enabled_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, module_id)
);

CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  value_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, key)
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  before jsonb,
  after jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- updated_at triggers
DO $$ DECLARE t text;
BEGIN FOR t IN SELECT unnest(ARRAY['niches','companies','company_units','sectors','profiles','user_profiles','modules','company_modules','company_settings']) LOOP
  EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t);
END LOOP; END $$;

-- ============================================================
-- SECURITY DEFINER HELPERS (avoid RLS recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_super_admin(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.profiles p ON p.id = up.profile_id
    WHERE up.user_id = _user
      AND up.is_active = true
      AND p.is_master_profile = true
      AND p.slug = 'super-admin-impulsionando'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_impulsionando_staff(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.profiles p ON p.id = up.profile_id
    WHERE up.user_id = _user
      AND up.is_active = true
      AND p.is_master_profile = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = _user AND company_id = _company AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(_user uuid, _company uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin(_user) OR EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.profile_permissions pp ON pp.profile_id = up.profile_id
    JOIN public.permissions perm ON perm.id = pp.permission_id
    WHERE up.user_id = _user
      AND up.company_id = _company
      AND up.is_active = true
      AND perm.code = _perm
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_company_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT company_id FROM public.user_profiles
  WHERE user_id = auth.uid() AND is_active = true;
$$;

-- ============================================================
-- AUDIT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _company uuid; _id text;
BEGIN
  _company := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'company_id')::uuid, NULL);
  _id := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'id'), NULL);
  INSERT INTO public.audit_logs(company_id, user_id, action, entity, entity_id, before, after)
  VALUES (
    _company, auth.uid(), TG_OP, TG_TABLE_NAME, _id,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE TRIGGER audit_company_units AFTER INSERT OR UPDATE OR DELETE ON public.company_units
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE TRIGGER audit_company_modules AFTER INSERT OR UPDATE OR DELETE ON public.company_modules
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE TRIGGER audit_company_settings AFTER INSERT OR UPDATE OR DELETE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE TRIGGER audit_user_profiles AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();

-- ============================================================
-- BOOTSTRAP: first user becomes Super Admin of Impulsionando
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _master_company uuid; _super_profile uuid; _has_super boolean;
BEGIN
  SELECT id INTO _master_company FROM public.companies WHERE is_master = true LIMIT 1;
  SELECT id INTO _super_profile FROM public.profiles WHERE slug = 'super-admin-impulsionando' LIMIT 1;
  SELECT EXISTS(SELECT 1 FROM public.user_profiles up
    JOIN public.profiles p ON p.id = up.profile_id
    WHERE p.slug = 'super-admin-impulsionando' AND up.is_active = true) INTO _has_super;

  IF NOT _has_super AND _master_company IS NOT NULL AND _super_profile IS NOT NULL THEN
    INSERT INTO public.user_profiles(user_id, company_id, profile_id, display_name, email)
    VALUES (NEW.id, _master_company, _super_profile,
            COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
            NEW.email);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GRANTS
-- ============================================================
DO $$ DECLARE t text;
BEGIN FOR t IN SELECT unnest(ARRAY['niches','companies','company_units','sectors','profiles','permissions','profile_permissions','user_profiles','modules','company_modules','company_settings','audit_logs']) LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
END LOOP; END $$;

-- ============================================================
-- RLS POLICIES — global catalogs (read for all auth, write super admin)
-- ============================================================
CREATE POLICY niches_read ON public.niches FOR SELECT TO authenticated USING (true);
CREATE POLICY niches_write ON public.niches FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_write ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY perms_read ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY perms_write ON public.permissions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY pp_read ON public.profile_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY pp_write ON public.profile_permissions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY modules_read ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY modules_write ON public.modules FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ============================================================
-- RLS POLICIES — tenant tables
-- ============================================================

-- companies
CREATE POLICY companies_select ON public.companies FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR id IN (SELECT public.current_user_company_ids()));
CREATE POLICY companies_insert ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR id IN (SELECT public.current_user_company_ids()))
  WITH CHECK (public.is_super_admin(auth.uid()) OR id IN (SELECT public.current_user_company_ids()));
CREATE POLICY companies_delete ON public.companies FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- company_units
CREATE POLICY units_select ON public.company_units FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY units_write ON public.company_units FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

-- sectors
CREATE POLICY sectors_select ON public.sectors FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY sectors_write ON public.sectors FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

-- user_profiles
CREATE POLICY up_select ON public.user_profiles FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );
CREATE POLICY up_write ON public.user_profiles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

-- company_modules
CREATE POLICY cm_select ON public.company_modules FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY cm_write ON public.company_modules FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- company_settings
CREATE POLICY cs_select ON public.company_settings FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY cs_write ON public.company_settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.user_belongs_to_company(auth.uid(), company_id));

-- audit_logs (read-only for super admin and company members; writes via trigger)
CREATE POLICY audit_select ON public.audit_logs FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.user_belongs_to_company(auth.uid(), company_id))
  );

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.niches(slug,name,description,icon) VALUES
  ('saude','Clínicas e Saúde','Clínicas médicas, consultórios e profissionais de saúde','stethoscope'),
  ('bares','Bares e Restaurantes','Operações de food service e bebidas','utensils'),
  ('cervejarias','Microcervejarias e Fornecedores','Produção e distribuição B2B','beer'),
  ('servicos','Empresas de Serviços','Prestadores de serviço em geral','briefcase'),
  ('ecommerce','E-commerce e Varejo','Lojas online e varejo físico','shopping-bag');

INSERT INTO public.profiles(slug,name,description,is_master_profile) VALUES
  ('super-admin-impulsionando','Super Admin Impulsionando','Acesso total à plataforma',true),
  ('admin-impulsionando','Admin Impulsionando','Administração da plataforma',true),
  ('suporte-impulsionando','Suporte Impulsionando','Equipe de suporte',true),
  ('gestor-empresa','Gestor da Empresa','Gestão completa da empresa cliente',false),
  ('admin-unidade','Administrador da Unidade','Gestão da unidade/filial',false),
  ('financeiro','Financeiro','Acesso ao módulo financeiro',false),
  ('recepcao','Recepção','Atendimento e agendamentos',false),
  ('operador','Operador','Operações diárias',false),
  ('profissional','Profissional','Profissional executor',false),
  ('afiliado','Afiliado','Parceiro afiliado',false),
  ('fornecedor','Fornecedor','Painel de fornecedor',false),
  ('cliente-final','Cliente Final','Cliente da empresa',false),
  ('auditor','Auditor','Acesso somente leitura para auditoria',false);

INSERT INTO public.modules(slug,name,description,icon,category,is_core,sort_order) VALUES
  ('administracao','Administração','Painel administrativo','shield','core',true,10),
  ('empresas','Empresas','Gestão de empresas clientes','building','core',true,20),
  ('nichos','Nichos','Segmentos de mercado','tags','core',true,30),
  ('unidades','Unidades','Filiais e unidades','map-pin','core',true,40),
  ('setores','Setores','Setores internos','layers','core',true,50),
  ('usuarios','Usuários','Gestão de usuários','users','core',true,60),
  ('perfis','Perfis e Permissões','Controle de acesso','key','core',true,70),
  ('configuracoes','Configurações','Parametrização','sliders','core',true,80),
  ('dashboard','Dashboard','Indicadores','bar-chart-3','core',true,90),
  ('auditoria','Auditoria','Logs e rastreabilidade','file-search','core',true,100);

-- Permissions (atomic, namespaced)
INSERT INTO public.permissions(code,module,description) VALUES
  ('companies.read','empresas','Visualizar empresas'),
  ('companies.create','empresas','Criar empresas'),
  ('companies.update','empresas','Editar empresas'),
  ('companies.delete','empresas','Excluir empresas'),
  ('units.read','unidades','Visualizar unidades'),
  ('units.create','unidades','Criar unidades'),
  ('units.update','unidades','Editar unidades'),
  ('units.delete','unidades','Excluir unidades'),
  ('sectors.read','setores','Visualizar setores'),
  ('sectors.write','setores','Gerenciar setores'),
  ('users.read','usuarios','Visualizar usuários'),
  ('users.write','usuarios','Gerenciar usuários'),
  ('profiles.read','perfis','Visualizar perfis'),
  ('profiles.write','perfis','Gerenciar perfis'),
  ('modules.read','administracao','Visualizar módulos'),
  ('modules.write','administracao','Gerenciar módulos'),
  ('settings.read','configuracoes','Visualizar configurações'),
  ('settings.write','configuracoes','Alterar configurações'),
  ('audit.read','auditoria','Visualizar auditoria'),
  ('dashboard.read','dashboard','Visualizar dashboard');

-- Master company Impulsionando
INSERT INTO public.companies(name, legal_name, is_master, is_active, status, niche_id)
SELECT 'Impulsionando Sistemas', 'Impulsionando Sistemas LTDA', true, true, 'active', id
FROM public.niches WHERE slug = 'servicos' LIMIT 1;

-- Activate all core modules for master company
INSERT INTO public.company_modules(company_id, module_id)
SELECT c.id, m.id FROM public.companies c CROSS JOIN public.modules m WHERE c.is_master = true;

-- Grant all permissions to Super Admin profile (defensive — is_super_admin already bypasses everything)
INSERT INTO public.profile_permissions(profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE p.slug IN ('super-admin-impulsionando','admin-impulsionando');

-- Gestor empresa: tudo exceto criar empresas
INSERT INTO public.profile_permissions(profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE p.slug = 'gestor-empresa' AND perm.code NOT IN ('companies.create','companies.delete');

-- Admin unidade
INSERT INTO public.profile_permissions(profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE p.slug = 'admin-unidade'
  AND perm.code IN ('units.read','units.update','sectors.read','sectors.write','users.read','users.write','dashboard.read','settings.read');

-- Recepção / Operador / Profissional: leitura básica
INSERT INTO public.profile_permissions(profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE p.slug IN ('recepcao','operador','profissional')
  AND perm.code IN ('dashboard.read','users.read','units.read','sectors.read');

-- Auditor
INSERT INTO public.profile_permissions(profile_id, permission_id)
SELECT p.id, perm.id FROM public.profiles p CROSS JOIN public.permissions perm
WHERE p.slug = 'auditor' AND perm.code LIKE '%.read';
