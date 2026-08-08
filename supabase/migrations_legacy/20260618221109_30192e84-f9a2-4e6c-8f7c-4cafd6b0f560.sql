
-- Enum de papéis
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'educ_role') THEN
    CREATE TYPE public.educ_role AS ENUM ('mantenedora','polo','coordenador','consultor','aluno');
  END IF;
END$$;

-- Polos
CREATE TABLE public.educ_polos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  bairro TEXT,
  responsavel TEXT,
  telefone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  cursos_ofertados TEXT[] NOT NULL DEFAULT '{}',
  capacidade INTEGER,
  meta_matriculas_mes INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, codigo)
);
CREATE INDEX educ_polos_company_idx ON public.educ_polos (company_id);

-- Atribuição de papel por usuário e polo
CREATE TABLE public.educ_role_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  polo_id UUID REFERENCES public.educ_polos(id) ON DELETE CASCADE,
  role public.educ_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id, polo_id, role)
);
CREATE INDEX educ_role_assignments_user_idx ON public.educ_role_assignments (user_id);
CREATE INDEX educ_role_assignments_polo_idx ON public.educ_role_assignments (polo_id);

-- Leads
CREATE TABLE public.educ_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  polo_id UUID REFERENCES public.educ_polos(id) ON DELETE SET NULL,
  consultor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  curso_interesse TEXT,
  origem TEXT,
  campanha TEXT,
  stage TEXT NOT NULL DEFAULT 'novo',
  valor_estimado NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX educ_leads_polo_idx ON public.educ_leads (polo_id);
CREATE INDEX educ_leads_company_idx ON public.educ_leads (company_id);

-- Matrículas
CREATE TABLE public.educ_matriculas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  polo_id UUID REFERENCES public.educ_polos(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.educ_leads(id) ON DELETE SET NULL,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  curso TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  status_financeiro TEXT NOT NULL DEFAULT 'em_dia',
  valor_mensalidade NUMERIC(12,2),
  matriculado_em DATE NOT NULL DEFAULT CURRENT_DATE,
  evasao_em DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX educ_matriculas_polo_idx ON public.educ_matriculas (polo_id);
CREATE INDEX educ_matriculas_company_idx ON public.educ_matriculas (company_id);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.educ_polos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.educ_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.educ_matriculas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.educ_role_assignments TO authenticated;
GRANT ALL ON public.educ_polos TO service_role;
GRANT ALL ON public.educ_leads TO service_role;
GRANT ALL ON public.educ_matriculas TO service_role;
GRANT ALL ON public.educ_role_assignments TO service_role;

-- Função utilitária sem recursão
CREATE OR REPLACE FUNCTION public.has_educ_role(_user_id UUID, _role public.educ_role, _polo_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.educ_role_assignments
    WHERE user_id = _user_id
      AND role = _role
      AND (_polo_id IS NULL OR polo_id = _polo_id OR role = 'mantenedora')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_educ_role(UUID, public.educ_role, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_educ_role(UUID, public.educ_role, UUID) TO authenticated, service_role;

-- RLS
ALTER TABLE public.educ_polos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educ_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educ_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educ_matriculas ENABLE ROW LEVEL SECURITY;

-- Polos: mantenedora gerencia tudo; polo/coordenador veem o próprio
CREATE POLICY "polos manten select" ON public.educ_polos FOR SELECT TO authenticated
USING (public.has_educ_role(auth.uid(),'mantenedora') OR
       EXISTS (SELECT 1 FROM public.educ_role_assignments ra
               WHERE ra.user_id = auth.uid() AND ra.polo_id = educ_polos.id));
CREATE POLICY "polos manten write" ON public.educ_polos FOR ALL TO authenticated
USING (public.has_educ_role(auth.uid(),'mantenedora'))
WITH CHECK (public.has_educ_role(auth.uid(),'mantenedora'));

-- Role assignments: mantenedora gerencia; usuário vê os próprios
CREATE POLICY "ra mantenedora all" ON public.educ_role_assignments FOR ALL TO authenticated
USING (public.has_educ_role(auth.uid(),'mantenedora'))
WITH CHECK (public.has_educ_role(auth.uid(),'mantenedora'));
CREATE POLICY "ra self read" ON public.educ_role_assignments FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Leads
CREATE POLICY "leads select escopo" ON public.educ_leads FOR SELECT TO authenticated
USING (
  public.has_educ_role(auth.uid(),'mantenedora') OR
  EXISTS (SELECT 1 FROM public.educ_role_assignments ra
          WHERE ra.user_id = auth.uid()
            AND ra.polo_id = educ_leads.polo_id
            AND ra.role IN ('polo','coordenador'))
  OR consultor_id = auth.uid()
);
CREATE POLICY "leads insert" ON public.educ_leads FOR INSERT TO authenticated
WITH CHECK (
  public.has_educ_role(auth.uid(),'mantenedora') OR
  EXISTS (SELECT 1 FROM public.educ_role_assignments ra
          WHERE ra.user_id = auth.uid()
            AND ra.polo_id = educ_leads.polo_id
            AND ra.role IN ('polo','coordenador','consultor'))
);
CREATE POLICY "leads update escopo" ON public.educ_leads FOR UPDATE TO authenticated
USING (
  public.has_educ_role(auth.uid(),'mantenedora') OR
  consultor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.educ_role_assignments ra
          WHERE ra.user_id = auth.uid()
            AND ra.polo_id = educ_leads.polo_id
            AND ra.role IN ('polo','coordenador'))
);
CREATE POLICY "leads delete manten" ON public.educ_leads FOR DELETE TO authenticated
USING (public.has_educ_role(auth.uid(),'mantenedora'));

-- Matrículas: mantenedora tudo; polo/coordenador do seu polo; aluno vê a sua
CREATE POLICY "matric select" ON public.educ_matriculas FOR SELECT TO authenticated
USING (
  public.has_educ_role(auth.uid(),'mantenedora') OR
  aluno_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.educ_role_assignments ra
          WHERE ra.user_id = auth.uid()
            AND ra.polo_id = educ_matriculas.polo_id
            AND ra.role IN ('polo','coordenador','consultor'))
);
CREATE POLICY "matric write" ON public.educ_matriculas FOR ALL TO authenticated
USING (
  public.has_educ_role(auth.uid(),'mantenedora') OR
  EXISTS (SELECT 1 FROM public.educ_role_assignments ra
          WHERE ra.user_id = auth.uid()
            AND ra.polo_id = educ_matriculas.polo_id
            AND ra.role IN ('polo','coordenador'))
)
WITH CHECK (
  public.has_educ_role(auth.uid(),'mantenedora') OR
  EXISTS (SELECT 1 FROM public.educ_role_assignments ra
          WHERE ra.user_id = auth.uid()
            AND ra.polo_id = educ_matriculas.polo_id
            AND ra.role IN ('polo','coordenador'))
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER educ_polos_set_updated BEFORE UPDATE ON public.educ_polos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER educ_leads_set_updated BEFORE UPDATE ON public.educ_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER educ_matriculas_set_updated BEFORE UPDATE ON public.educ_matriculas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
