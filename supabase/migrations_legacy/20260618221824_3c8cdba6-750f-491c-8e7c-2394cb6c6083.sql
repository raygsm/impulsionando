
-- ===========================================================
-- 1) WHITE LABEL EDUCACIONAL
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.educ_white_label_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid UNIQUE,
  nome_exibicao text NOT NULL,
  logo_url text,
  favicon_url text,
  cor_primaria text NOT NULL DEFAULT '#0F172A',
  cor_secundaria text NOT NULL DEFAULT '#3B82F6',
  cor_fundo text NOT NULL DEFAULT '#FFFFFF',
  dominio_personalizado text,
  hero_titulo text,
  hero_subtitulo text,
  cta_label text,
  cta_url text,
  rodape_texto text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.educ_white_label_branding TO authenticated;
GRANT SELECT ON public.educ_white_label_branding TO anon;
GRANT ALL ON public.educ_white_label_branding TO service_role;

ALTER TABLE public.educ_white_label_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wl branding read all"
  ON public.educ_white_label_branding FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "wl branding write mantenedora"
  ON public.educ_white_label_branding FOR ALL
  TO authenticated
  USING (public.has_educ_role(auth.uid(), 'mantenedora'))
  WITH CHECK (public.has_educ_role(auth.uid(), 'mantenedora'));

CREATE TRIGGER educ_wl_branding_set_updated
  BEFORE UPDATE ON public.educ_white_label_branding
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================
-- 2) IMPULSIONANDO TALENTOS
-- ===========================================================
DO $$ BEGIN
  CREATE TYPE public.talentos_stage AS ENUM ('novo','favorito','entrevista','contratado','descartado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.talentos_faixa_etaria AS ENUM ('18-25','26-35','36-45','46-55','56-65','66-75','76+');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Candidatos
CREATE TABLE IF NOT EXISTS public.talentos_candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  cep text NOT NULL,
  bairro text,
  cidade text,
  estado text,
  foto_url text,
  cargo_desejado text NOT NULL,
  nicho text,
  experiencia text,
  faixa_etaria public.talentos_faixa_etaria,
  escolaridade text,
  curso_superior text,
  instituicao text,
  cursando text,
  cursando_instituicao text,
  cursando_previsao date,
  disponibilidade text,
  modelo_trabalho text,
  pretensao_salarial text,
  video_url text,
  tags text[] NOT NULL DEFAULT '{}',
  habilidades text[] NOT NULL DEFAULT '{}',
  idiomas text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  visivel_rede boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX talentos_candidatos_cidade_idx ON public.talentos_candidatos(cidade);
CREATE INDEX talentos_candidatos_nicho_idx ON public.talentos_candidatos(nicho);
CREATE INDEX talentos_candidatos_cargo_idx ON public.talentos_candidatos(cargo_desejado);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.talentos_candidatos TO authenticated;
GRANT ALL ON public.talentos_candidatos TO service_role;

ALTER TABLE public.talentos_candidatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidato gerencia o proprio"
  ON public.talentos_candidatos FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "empresas leem candidatos visiveis"
  ON public.talentos_candidatos FOR SELECT
  TO authenticated
  USING (ativo = true AND visivel_rede = true);

CREATE TRIGGER talentos_candidatos_set_updated
  BEFORE UPDATE ON public.talentos_candidatos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Currículos / extrações
CREATE TABLE IF NOT EXISTS public.talentos_curriculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES public.talentos_candidatos(id) ON DELETE CASCADE,
  arquivo_url text NOT NULL,
  formato text,
  texto_bruto text,
  extracao jsonb,
  processado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.talentos_curriculos TO authenticated;
GRANT ALL ON public.talentos_curriculos TO service_role;

ALTER TABLE public.talentos_curriculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curriculo dono"
  ON public.talentos_curriculos FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.talentos_candidatos c WHERE c.id = candidato_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.talentos_candidatos c WHERE c.id = candidato_id AND c.user_id = auth.uid()));

-- Configuração de Rede de Talentos por empresa
CREATE TABLE IF NOT EXISTS public.talentos_company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid UNIQUE NOT NULL,
  participa boolean NOT NULL DEFAULT false,
  receber_automatico boolean NOT NULL DEFAULT false,
  nicho text,
  cidades_interesse text[] NOT NULL DEFAULT '{}',
  bairros_interesse text[] NOT NULL DEFAULT '{}',
  raio_km integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.talentos_company_settings TO authenticated;
GRANT ALL ON public.talentos_company_settings TO service_role;

ALTER TABLE public.talentos_company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talentos settings empresa"
  ON public.talentos_company_settings FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE TRIGGER talentos_company_settings_set_updated
  BEFORE UPDATE ON public.talentos_company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Vagas
CREATE TABLE IF NOT EXISTS public.talentos_vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  titulo text NOT NULL,
  nicho text,
  cargo text NOT NULL,
  cidade text,
  bairro text,
  modelo_trabalho text,
  experiencia_minima text,
  escolaridade_minima text,
  faixa_salarial text,
  descricao text,
  habilidades_desejadas text[] NOT NULL DEFAULT '{}',
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.talentos_vagas TO authenticated;
GRANT ALL ON public.talentos_vagas TO service_role;

ALTER TABLE public.talentos_vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vagas dono"
  ON public.talentos_vagas FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "vagas leitura ativas"
  ON public.talentos_vagas FOR SELECT
  TO authenticated
  USING (ativa = true);

CREATE TRIGGER talentos_vagas_set_updated
  BEFORE UPDATE ON public.talentos_vagas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Matches
CREATE TABLE IF NOT EXISTS public.talentos_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  candidato_id uuid NOT NULL REFERENCES public.talentos_candidatos(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES public.talentos_vagas(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  motivos text[] NOT NULL DEFAULT '{}',
  stage public.talentos_stage NOT NULL DEFAULT 'novo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, candidato_id, vaga_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.talentos_matches TO authenticated;
GRANT ALL ON public.talentos_matches TO service_role;

ALTER TABLE public.talentos_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches dono empresa"
  ON public.talentos_matches FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "matches candidato leitura"
  ON public.talentos_matches FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.talentos_candidatos c WHERE c.id = candidato_id AND c.user_id = auth.uid()));

CREATE TRIGGER talentos_matches_set_updated
  BEFORE UPDATE ON public.talentos_matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================
-- 3) SEED EDUCACAO — popular dashboard com dados de exemplo
-- ===========================================================
WITH polos AS (
  INSERT INTO public.educ_polos (codigo, nome, cidade, estado, bairro, responsavel, status, cursos_ofertados, capacidade, meta_matriculas_mes)
  VALUES
    ('POLO-RJ-01','Polo Centro RJ','Rio de Janeiro','RJ','Centro','Ana Souza','ativo', ARRAY['Administração','Pedagogia','TI'], 400, 60),
    ('POLO-SP-01','Polo Pinheiros SP','São Paulo','SP','Pinheiros','Bruno Lima','ativo', ARRAY['Direito','Marketing'], 500, 80),
    ('POLO-MG-01','Polo Savassi BH','Belo Horizonte','MG','Savassi','Carla Mendes','ativo', ARRAY['Enfermagem','Gestão'], 300, 40),
    ('POLO-PR-01','Polo Batel CWB','Curitiba','PR','Batel','Diego Castro','ativo', ARRAY['Engenharia','TI'], 350, 50)
  ON CONFLICT (company_id, codigo) DO NOTHING
  RETURNING id, codigo
)
SELECT 1;

-- Leads
INSERT INTO public.educ_leads (polo_id, nome, email, telefone, curso_interesse, origem, campanha, stage, valor_estimado)
SELECT p.id, v.nome, v.email, v.telefone, v.curso, v.origem, v.campanha, v.stage, v.valor
FROM public.educ_polos p
JOIN (VALUES
  ('POLO-RJ-01','Carlos Silva','carlos@ex.com','21999990001','Administração','meta_ads','Volta às Aulas 2026','contato',680.00),
  ('POLO-RJ-01','Mariana Rocha','mari@ex.com','21999990002','Pedagogia','google_ads','EAD Pedagogia',     'visita',560.00),
  ('POLO-RJ-01','João Pereira','joao@ex.com','21999990003','TI','organico','Indique e Ganhe',             'matriculado',820.00),
  ('POLO-SP-01','Fernanda Dias','fer@ex.com','11999990004','Direito','meta_ads','Direito 2026',          'novo',1200.00),
  ('POLO-SP-01','Pedro Almeida','pedro@ex.com','11999990005','Marketing','tiktok','Marketing Black',    'visita',780.00),
  ('POLO-SP-01','Luana Castro','luana@ex.com','11999990006','Direito','meta_ads','Direito 2026',         'matriculado',1200.00),
  ('POLO-SP-01','Rafael Lopes','rafa@ex.com','11999990007','Marketing','google_ads','Marketing Black','perdido',780.00),
  ('POLO-MG-01','Beatriz Nunes','bia@ex.com','31999990008','Enfermagem','meta_ads','Saúde em Foco',     'contato',900.00),
  ('POLO-MG-01','Thiago Moura','thi@ex.com','31999990009','Gestão','organico','Indique e Ganhe',         'matriculado',640.00),
  ('POLO-PR-01','Camila Reis','cami@ex.com','41999990010','Engenharia','google_ads','Engenharia 2026',  'visita',1500.00),
  ('POLO-PR-01','Bruno Faria','brunof@ex.com','41999990011','TI','tiktok','TI sem Fronteiras',           'matriculado',820.00),
  ('POLO-PR-01','Aline Souza','aline@ex.com','41999990012','TI','meta_ads','TI sem Fronteiras',          'novo',820.00)
) AS v(codigo,nome,email,telefone,curso,origem,campanha,stage,valor) ON v.codigo = p.codigo
WHERE NOT EXISTS (SELECT 1 FROM public.educ_leads l WHERE l.email = v.email);

-- Matrículas (com evasões e inadimplência)
INSERT INTO public.educ_matriculas (polo_id, lead_id, curso, status, status_financeiro, valor_mensalidade, matriculado_em, evasao_em)
SELECT p.id, l.id, v.curso, v.status, v.fin, v.valor, v.dt::date, v.evasao::date
FROM public.educ_polos p
JOIN (VALUES
  ('POLO-RJ-01','joao@ex.com','TI','ativo','em_dia',820.00,'2026-04-10', NULL),
  ('POLO-SP-01','luana@ex.com','Direito','ativo','inadimplente',1200.00,'2026-03-12', NULL),
  ('POLO-MG-01','thi@ex.com','Gestão','ativo','em_dia',640.00,'2026-02-20', NULL),
  ('POLO-PR-01','brunof@ex.com','TI','evadido','em_dia',820.00,'2026-01-15','2026-05-10'),
  ('POLO-RJ-01','mari@ex.com','Pedagogia','ativo','em_dia',560.00,'2026-05-05', NULL),
  ('POLO-SP-01','pedro@ex.com','Marketing','ativo','inadimplente',780.00,'2026-04-22', NULL)
) AS v(codigo,email,curso,status,fin,valor,dt,evasao) ON v.codigo = p.codigo
JOIN public.educ_leads l ON l.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM public.educ_matriculas m WHERE m.lead_id = l.id);
