
-- =====================================================================
-- ONDA 1 — Form Builder + Bolívia + Implantação Rio Med
-- =====================================================================

-- 1) FORM BUILDER ------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.core_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity text NOT NULL,
  section text,
  key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'team',
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  help_text text,
  placeholder text,
  example text,
  default_value jsonb,
  sort_order int NOT NULL DEFAULT 0,
  conditional jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, entity, key),
  CONSTRAINT cfd_field_type_chk CHECK (field_type IN (
    'text','longtext','number','currency','date','time','datetime',
    'document','phone','whatsapp','email','address','postal_code','city',
    'department','country','select','multiselect','checkbox','file','image',
    'signature','url','product_code','qrcode','barcode','photo_required','geolocation'
  )),
  CONSTRAINT cfd_visibility_chk CHECK (visibility IN ('public','team','manager'))
);

CREATE INDEX IF NOT EXISTS cfd_company_entity_idx
  ON public.core_field_definitions (company_id, entity, sort_order)
  WHERE is_active;

GRANT SELECT ON public.core_field_definitions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_field_definitions TO authenticated;
GRANT ALL ON public.core_field_definitions TO service_role;

ALTER TABLE public.core_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cfd_anon_read_public ON public.core_field_definitions
  FOR SELECT TO anon
  USING (is_active AND visibility = 'public');

CREATE POLICY cfd_company_read ON public.core_field_definitions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = core_field_definitions.company_id)
  );

CREATE POLICY cfd_company_write ON public.core_field_definitions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = core_field_definitions.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = core_field_definitions.company_id)
  );


CREATE TABLE IF NOT EXISTS public.core_field_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.core_field_definitions(id) ON DELETE CASCADE,
  value text NOT NULL,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, value)
);

CREATE INDEX IF NOT EXISTS cfo_field_idx ON public.core_field_options (field_id, sort_order);

GRANT SELECT ON public.core_field_options TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_field_options TO authenticated;
GRANT ALL ON public.core_field_options TO service_role;

ALTER TABLE public.core_field_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY cfo_anon_read ON public.core_field_options
  FOR SELECT TO anon
  USING (
    is_active AND EXISTS (
      SELECT 1 FROM public.core_field_definitions f
      WHERE f.id = core_field_options.field_id AND f.is_active AND f.visibility = 'public'
    )
  );

CREATE POLICY cfo_company_read ON public.core_field_options
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.core_field_definitions f
      WHERE f.id = core_field_options.field_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = f.company_id)
        )
    )
  );

CREATE POLICY cfo_company_write ON public.core_field_options
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.core_field_definitions f
      WHERE f.id = core_field_options.field_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = f.company_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.core_field_definitions f
      WHERE f.id = core_field_options.field_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = f.company_id)
        )
    )
  );


CREATE TABLE IF NOT EXISTS public.core_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.core_field_definitions(id) ON DELETE CASCADE,
  entity text NOT NULL,
  record_id uuid NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, record_id)
);

CREATE INDEX IF NOT EXISTS cfv_lookup_idx ON public.core_field_values (company_id, entity, record_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_field_values TO authenticated;
GRANT ALL ON public.core_field_values TO service_role;

ALTER TABLE public.core_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY cfv_company_rw ON public.core_field_values
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = core_field_values.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = core_field_values.company_id)
  );


-- 2) GEO BOLÍVIA -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.geo_bo_departments (
  code text PRIMARY KEY,
  name text NOT NULL,
  capital text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.geo_bo_departments TO anon, authenticated;
GRANT ALL ON public.geo_bo_departments TO service_role;

ALTER TABLE public.geo_bo_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY gbd_read ON public.geo_bo_departments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY gbd_admin_write ON public.geo_bo_departments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


CREATE TABLE IF NOT EXISTS public.geo_bo_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code text NOT NULL REFERENCES public.geo_bo_departments(code) ON DELETE CASCADE,
  name text NOT NULL,
  is_capital boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_code, name)
);

CREATE INDEX IF NOT EXISTS gbc_dept_idx ON public.geo_bo_cities (department_code) WHERE is_active;

GRANT SELECT ON public.geo_bo_cities TO anon, authenticated;
GRANT ALL ON public.geo_bo_cities TO service_role;

ALTER TABLE public.geo_bo_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY gbc_read ON public.geo_bo_cities
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY gbc_admin_write ON public.geo_bo_cities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- Seed departments + capitais
INSERT INTO public.geo_bo_departments (code, name, capital, sort_order) VALUES
  ('LP','La Paz','La Paz',1),
  ('SC','Santa Cruz','Santa Cruz de la Sierra',2),
  ('CB','Cochabamba','Cochabamba',3),
  ('OR','Oruro','Oruro',4),
  ('PT','Potosí','Potosí',5),
  ('CH','Chuquisaca','Sucre',6),
  ('TJ','Tarija','Tarija',7),
  ('BN','Beni','Trinidad',8),
  ('PD','Pando','Cobija',9)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.geo_bo_cities (department_code, name, is_capital) VALUES
  ('LP','La Paz',true),('LP','El Alto',false),('LP','Viacha',false),
  ('SC','Santa Cruz de la Sierra',true),('SC','Montero',false),('SC','Warnes',false),('SC','Camiri',false),
  ('CB','Cochabamba',true),('CB','Quillacollo',false),('CB','Sacaba',false),
  ('OR','Oruro',true),('OR','Challapata',false),
  ('PT','Potosí',true),('PT','Llallagua',false),('PT','Uyuni',false),('PT','Villazón',false),
  ('CH','Sucre',true),('CH','Monteagudo',false),
  ('TJ','Tarija',true),('TJ','Yacuiba',false),('TJ','Villamontes',false),('TJ','Bermejo',false),
  ('BN','Trinidad',true),('BN','Riberalta',false),('BN','Guayaramerín',false),
  ('PD','Cobija',true)
ON CONFLICT (department_code, name) DO NOTHING;


-- 3) IMPLANTAÇÃO -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.core_implantation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  group_name text,
  status text NOT NULL DEFAULT 'pending',
  is_auto boolean NOT NULL DEFAULT false,
  auto_check jsonb,
  resolved_at timestamptz,
  resolved_by uuid,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code),
  CONSTRAINT cit_status_chk CHECK (status IN ('pending','in_progress','done','blocked','na'))
);

CREATE INDEX IF NOT EXISTS cit_company_idx ON public.core_implantation_tasks (company_id, status, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_implantation_tasks TO authenticated;
GRANT ALL ON public.core_implantation_tasks TO service_role;

ALTER TABLE public.core_implantation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY cit_company_rw ON public.core_implantation_tasks
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = core_implantation_tasks.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = core_implantation_tasks.company_id)
  );


-- 4) TRIGGER updated_at compartilhado ----------------------------------

CREATE OR REPLACE FUNCTION public._touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['core_field_definitions','core_field_options','core_field_values','geo_bo_departments','geo_bo_cities','core_implantation_tasks']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%1$s ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_touch_%1$s BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at()', t);
  END LOOP;
END $$;


-- 5) SEED — pendências de implantação da Rio Med -----------------------

WITH rio AS (
  SELECT c.id AS company_id
  FROM public.companies c
  JOIN public.core_tenant_identity ti ON ti.company_id = c.id
  WHERE ti.subdomain = 'riomed'
  LIMIT 1
)
INSERT INTO public.core_implantation_tasks (company_id, code, title, group_name, sort_order, is_auto, description)
SELECT rio.company_id, x.code, x.title, x.group_name, x.sort_order, x.is_auto, x.description
FROM rio,
LATERAL (VALUES
  ('whatsapp_oficial','Validar WhatsApp oficial','Comunicação',10,false,'Confirmar número, ativar Business API e testar envio de template.'),
  ('cadastrar_vendedores','Cadastrar vendedores','Equipe',20,false,'Criar perfis de vendedor, definir metas e regras de distribuição.'),
  ('cadastrar_fornecedores','Cadastrar fornecedores','Equipe',30,false,'Abrir área pública de fornecedores e aprovar os principais.'),
  ('cadastrar_tecnicos','Cadastrar técnicos','Equipe',40,false,'Abrir área pública de técnicos e validar especialidades.'),
  ('importar_inventario','Importar inventário','Estoque',50,true,'Importar planilha do sistema atual da Rio Med — sem retrabalho.'),
  ('produtos_sem_imagem','Revisar produtos sem imagem','Estoque',60,true,'Identificar SKUs sem foto e priorizar captura.'),
  ('produtos_sem_preco','Revisar produtos sem preço','Estoque',70,true,'Identificar SKUs sem preço público e definir política.'),
  ('produtos_duplicados','Revisar produtos duplicados','Estoque',80,false,'Mesclar SKUs duplicados detectados.'),
  ('validar_categorias','Validar categorias','Estoque',90,false,'Revisar árvore de categorias e segmentos médicos.'),
  ('validar_campos_obrigatorios','Validar campos obrigatórios','Configuração',100,false,'Definir quais campos são obrigatórios em cada cadastro.'),
  ('configurar_gateway','Configurar gateway de pagamento','Financeiro',110,false,'Conectar gateway e testar cobrança real.'),
  ('configurar_dominio','Configurar domínio','Plataforma',120,false,'Apontar domínio próprio e validar SSL.'),
  ('testar_busca_codigo','Testar busca por código','Qualidade',130,false,'Validar busca por SKU/código interno.'),
  ('testar_busca_foto','Testar busca por foto','Qualidade',140,false,'Validar reconhecimento de imagem e sugestões.'),
  ('testar_agente_virtual','Testar agente virtual','Qualidade',150,false,'Simular conversas reais com o agente virtual.'),
  ('testar_crm','Testar CRM','Qualidade',160,false,'Validar atendimento dentro do CRM com WhatsApp oficial.'),
  ('testar_orcamento','Testar geração de orçamento','Qualidade',170,false,'Gerar orçamento, enviar ao cliente e converter em pedido.'),
  ('testar_carrinho','Testar carrinho','Qualidade',180,false,'Adicionar itens, finalizar e validar pagamento.'),
  ('testar_baixa_estoque','Testar baixa de estoque','Qualidade',190,false,'Validar baixa automática ao fechar pedido.')
) AS x(code, title, group_name, sort_order, is_auto, description)
ON CONFLICT (company_id, code) DO NOTHING;


-- 6) SEED — campos base do produto (sistema, editáveis em rótulo/ordem) -

WITH rio AS (
  SELECT c.id AS company_id
  FROM public.companies c
  JOIN public.core_tenant_identity ti ON ti.company_id = c.id
  WHERE ti.subdomain = 'riomed'
  LIMIT 1
)
INSERT INTO public.core_field_definitions
  (company_id, entity, section, key, label, field_type, is_required, is_system, visibility, sort_order, help_text)
SELECT rio.company_id, 'product', x.section, x.key, x.label, x.field_type, x.is_required, true, 'team', x.sort_order, x.help_text
FROM rio,
LATERAL (VALUES
  ('Identificação','sku','SKU','product_code',true,10,'Código único do produto na Rio Med.'),
  ('Identificação','name','Nome comercial','text',true,20,'Nome que aparece para o cliente final.'),
  ('Identificação','short_description','Descrição curta','text',false,30,'Resumo de uma linha.'),
  ('Identificação','long_description','Descrição longa','longtext',false,40,'Detalhes técnicos e aplicações.'),
  ('Classificação','category','Categoria','select',false,50,'Categoria principal do produto.'),
  ('Classificação','subcategory','Subcategoria','select',false,60,'Subcategoria opcional.'),
  ('Classificação','medical_segment','Segmento médico','select',false,70,'Mobilidade, oxigenoterapia, home care, etc.'),
  ('Classificação','application','Aplicação','multiselect',false,80,'Hospital, clínica, paciente, locação, etc.'),
  ('Marca','brand','Marca','text',false,90,NULL),
  ('Marca','model','Modelo','text',false,100,NULL),
  ('Marca','manufacturer','Fabricante','text',false,110,NULL),
  ('Marca','origin_country','País de origem','country',false,120,NULL),
  ('Estoque','total_stock','Estoque total','number',false,200,NULL),
  ('Estoque','available_stock','Estoque disponível','number',false,210,NULL),
  ('Estoque','warehouse','Almoxarifado','select',false,220,NULL),
  ('Estoque','location','Localização física','text',false,230,'Corredor, prateleira, posição.'),
  ('Preço','price_sale','Preço de venda','currency',false,300,NULL),
  ('Preço','price_rent_daily','Locação diária','currency',false,310,NULL),
  ('Preço','price_rent_weekly','Locação semanal','currency',false,320,NULL),
  ('Preço','price_rent_monthly','Locação mensal','currency',false,330,NULL),
  ('Preço','cost','Custo','currency',false,340,NULL),
  ('Preço','max_discount','Desconto máximo (%)','number',false,350,NULL),
  ('Mídia','main_image','Imagem principal','image',false,400,'Foto que aparece na busca e vitrine.'),
  ('Mídia','gallery','Galeria','file',false,410,'Fotos adicionais.'),
  ('Mídia','manual','Manual','file',false,420,'PDF do manual ou ficha técnica.'),
  ('Observações','internal_notes','Observações internas','longtext',false,500,'Não aparece para o cliente.'),
  ('Observações','public_notes','Observações públicas','longtext',false,510,'Aparece na ficha pública.')
) AS x(section, key, label, field_type, is_required, sort_order, help_text)
ON CONFLICT (company_id, entity, key) DO NOTHING;
