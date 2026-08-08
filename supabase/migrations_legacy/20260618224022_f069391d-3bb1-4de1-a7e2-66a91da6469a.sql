
-- ============ ARQUITETURA: Macro Nichos / Subnichos / Templates ============
CREATE TABLE IF NOT EXISTS public.core_macro_nichos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.core_macro_nichos TO anon, authenticated;
GRANT ALL ON public.core_macro_nichos TO service_role;
ALTER TABLE public.core_macro_nichos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "macro nichos public read" ON public.core_macro_nichos FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.core_subnichos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_id uuid NOT NULL REFERENCES public.core_macro_nichos(id) ON DELETE CASCADE,
  slug text NOT NULL,
  nome text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (macro_id, slug)
);
GRANT SELECT ON public.core_subnichos TO anon, authenticated;
GRANT ALL ON public.core_subnichos TO service_role;
ALTER TABLE public.core_subnichos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subnichos public read" ON public.core_subnichos FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.core_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subnicho_id uuid NOT NULL REFERENCES public.core_subnichos(id) ON DELETE CASCADE,
  slug text NOT NULL,
  nome text NOT NULL,
  descricao text,
  modulos text[] NOT NULL DEFAULT '{}',
  destaque boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subnicho_id, slug)
);
GRANT SELECT ON public.core_templates TO anon, authenticated;
GRANT ALL ON public.core_templates TO service_role;
ALTER TABLE public.core_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates public read" ON public.core_templates FOR SELECT USING (true);

-- ============ PLANOS EMPRESARIAIS COM PESO EM PONTOS ============
CREATE TABLE IF NOT EXISTS public.core_company_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,        -- essencial | ideal | full
  nome text NOT NULL,
  pontos_consumo int NOT NULL,      -- 1 | 3 | 5
  preco_sm numeric(4,2) NOT NULL,   -- em salários mínimos (0.5 | 1 | 2)
  max_modulos int,                  -- 3 | 6 | NULL = ilimitado
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.core_company_plans TO anon, authenticated;
GRANT ALL ON public.core_company_plans TO service_role;
ALTER TABLE public.core_company_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company plans public read" ON public.core_company_plans FOR SELECT USING (true);

-- ============ PLANOS WHITE LABEL (PONTOS) ============
CREATE TABLE IF NOT EXISTS public.wl_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,        -- wl1..wl4
  nome text NOT NULL,
  mensalidade_sm numeric(4,2) NOT NULL,
  pontos_adicionais int NOT NULL,
  pontos_capacidade int NOT NULL,   -- acumulada
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wl_plans TO anon, authenticated;
GRANT ALL ON public.wl_plans TO service_role;
ALTER TABLE public.wl_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl plans public read" ON public.wl_plans FOR SELECT USING (true);

-- ============ ASSINATURAS WHITE LABEL ============
CREATE TABLE IF NOT EXISTS public.wl_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,                            -- auth.users.id do White Label
  plan_slug text NOT NULL REFERENCES public.wl_plans(slug),
  capacidade_pontos int NOT NULL,                    -- snapshot da capacidade na contratação
  auto_upgrade boolean NOT NULL DEFAULT true,
  auto_downgrade boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wl_subscriptions TO authenticated;
GRANT ALL ON public.wl_subscriptions TO service_role;
ALTER TABLE public.wl_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl own subscription read" ON public.wl_subscriptions
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "wl own subscription write" ON public.wl_subscriptions
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "wl own subscription update" ON public.wl_subscriptions
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

-- ============ VÍNCULO CLIENTE EMPRESARIAL ↔ WHITE LABEL ============
CREATE TABLE IF NOT EXISTS public.wl_company_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wl_owner_id uuid NOT NULL,
  company_id uuid NOT NULL,
  plan_slug text NOT NULL REFERENCES public.core_company_plans(slug),
  pontos_consumidos int NOT NULL,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wl_owner_id, company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wl_company_links TO authenticated;
GRANT ALL ON public.wl_company_links TO service_role;
ALTER TABLE public.wl_company_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl links read own" ON public.wl_company_links
  FOR SELECT TO authenticated USING (wl_owner_id = auth.uid());
CREATE POLICY "wl links write own" ON public.wl_company_links
  FOR ALL TO authenticated USING (wl_owner_id = auth.uid()) WITH CHECK (wl_owner_id = auth.uid());

-- ============ MÉTRICAS DE TALENTOS (extensão) ============
ALTER TABLE public.talentos_matches
  ADD COLUMN IF NOT EXISTS contratado_em timestamptz,
  ADD COLUMN IF NOT EXISTS desligado_em timestamptz;

-- ============ SEED ARQUITETURA ============
INSERT INTO public.core_macro_nichos (slug, nome, ordem) VALUES
  ('saude', 'Saúde', 10),
  ('alimentacao', 'Alimentação e Bebidas', 20),
  ('fornecedores', 'Fornecedores e Indústria', 30),
  ('imobiliario', 'Imobiliário', 40),
  ('servicos', 'Serviços', 50),
  ('educacao', 'Educação', 60),
  ('eventos', 'Eventos e Experiências', 70)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.core_subnichos (macro_id, slug, nome, ordem)
SELECT m.id, x.slug, x.nome, x.ordem
FROM public.core_macro_nichos m
JOIN (VALUES
  ('saude','clinicas-medicas','Clínicas Médicas',10),
  ('saude','consultorios','Consultórios',20),
  ('saude','psicologia','Psicologia',30),
  ('saude','fisioterapia','Fisioterapia',40),
  ('saude','nutricao','Nutrição',50),
  ('saude','terapias','Terapias',60),
  ('saude','psiquiatria','Psiquiatria',70),
  ('saude','saude-ocupacional','Saúde Ocupacional',80),
  ('saude','laboratorios','Laboratórios',90),
  ('saude','diagnostico-imagem','Diagnóstico por Imagem',100),
  ('saude','telemedicina','Telemedicina',110),
  ('alimentacao','restaurantes','Restaurantes',10),
  ('alimentacao','bares','Bares',20),
  ('alimentacao','gastrobares','Gastrobares',30),
  ('alimentacao','hamburguerias','Hamburguerias',40),
  ('alimentacao','pizzarias','Pizzarias',50),
  ('alimentacao','cafeterias','Cafeterias',60),
  ('alimentacao','adegas','Adegas',70),
  ('alimentacao','casas-de-chopp','Casas de Chopp',80),
  ('alimentacao','food-trucks','Food Trucks',90),
  ('alimentacao','dark-kitchens','Dark Kitchens',100),
  ('fornecedores','microcervejarias','Microcervejarias',10),
  ('fornecedores','distribuidoras','Distribuidoras',20),
  ('fornecedores','vinicolas','Vinícolas',30),
  ('fornecedores','destilarias','Destilarias',40),
  ('fornecedores','torrefacoes','Torrefações',50),
  ('fornecedores','atacadistas','Atacadistas',60),
  ('fornecedores','importadoras','Importadoras',70),
  ('fornecedores','industrias-alimenticias','Indústrias Alimentícias',80),
  ('imobiliario','imobiliarias','Imobiliárias',10),
  ('imobiliario','corretores','Corretores',20),
  ('imobiliario','administradoras','Administradoras',30),
  ('imobiliario','temporada','Temporada',40),
  ('imobiliario','condominios','Condomínios',50),
  ('imobiliario','incorporadoras','Incorporadoras',60),
  ('servicos','marketing','Marketing',10),
  ('servicos','contabilidade','Contabilidade',20),
  ('servicos','advocacia','Advocacia',30),
  ('servicos','tecnologia','Tecnologia',40),
  ('servicos','rh','RH',50),
  ('servicos','engenharia','Engenharia',60),
  ('servicos','arquitetura','Arquitetura',70),
  ('servicos','consultoria','Consultoria',80),
  ('educacao','escolas','Escolas',10),
  ('educacao','cursos-livres','Cursos Livres',20),
  ('educacao','idiomas','Idiomas',30),
  ('educacao','faculdades','Faculdades',40),
  ('educacao','pos-graduacao','Pós-graduação',50),
  ('educacao','educacao-corporativa','Educação Corporativa',60),
  ('eventos','casas-de-eventos','Casas de Eventos',10),
  ('eventos','congressos','Congressos',20),
  ('eventos','feiras','Feiras',30),
  ('eventos','casamentos','Casamentos',40),
  ('eventos','formaturas','Formaturas',50),
  ('eventos','shows','Shows',60),
  ('eventos','organizadores','Organizadores',70)
) AS x(macro_slug, slug, nome, ordem) ON m.slug = x.macro_slug
ON CONFLICT (macro_id, slug) DO NOTHING;

-- ============ SEED PLANOS EMPRESAS ============
INSERT INTO public.core_company_plans (slug, nome, pontos_consumo, preco_sm, max_modulos, features, ordem) VALUES
  ('essencial', 'Essencial', 1, 0.5, 3,
    '["CRM","Agenda","Financeiro básico","Usuários ilimitados","Suporte padrão"]'::jsonb, 10),
  ('ideal', 'Ideal', 3, 1.0, 6,
    '["Até 6 módulos","Automações","Dashboards avançados","Integrações","Usuários ilimitados"]'::jsonb, 20),
  ('full', 'Full', 5, 2.0, NULL,
    '["Módulos ilimitados","Automações avançadas","IA","Integrações completas","BI avançado","Recursos premium"]'::jsonb, 30)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome, pontos_consumo = EXCLUDED.pontos_consumo,
  preco_sm = EXCLUDED.preco_sm, max_modulos = EXCLUDED.max_modulos,
  features = EXCLUDED.features;

-- ============ SEED PLANOS WHITE LABEL ============
INSERT INTO public.wl_plans (slug, nome, mensalidade_sm, pontos_adicionais, pontos_capacidade, ordem) VALUES
  ('wl1','White Label 1',1,10,10,10),
  ('wl2','White Label 2',2,13,23,20),
  ('wl3','White Label 3',3,18,41,30),
  ('wl4','White Label 4',4,20,61,40)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome, mensalidade_sm = EXCLUDED.mensalidade_sm,
  pontos_adicionais = EXCLUDED.pontos_adicionais,
  pontos_capacidade = EXCLUDED.pontos_capacidade;
