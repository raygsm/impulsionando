-- WMP (Wagner Miller Produções) — Onda 1
-- Tenant do core Impulsionando: leads públicos de orçamento e cadastros de parceiros.

CREATE TABLE IF NOT EXISTS public.wmp_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','em_analise','orcado','ganho','perdido')),
  -- contratante
  contratante_nome text NOT NULL,
  contratante_email text NOT NULL,
  contratante_telefone text NOT NULL,
  contratante_empresa text,
  -- evento
  evento_tipo text NOT NULL,
  evento_data date,
  evento_horario_inicio time,
  evento_horario_fim time,
  evento_publico_estimado integer,
  evento_perfil_publico text,
  evento_endereco text,
  evento_cidade text,
  evento_estado text,
  -- ambiente / acústica (JSONB livre validado no app)
  ambiente jsonb NOT NULL DEFAULT '{}'::jsonb,
  medidas jsonb NOT NULL DEFAULT '{}'::jsonb,
  acustica jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- diagnóstico determinístico salvo
  pre_diagnostico jsonb,
  -- arquivos no Storage (paths em wmp-uploads/<briefing_id>/...)
  arquivos jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- meta
  origem text DEFAULT 'site',
  utm jsonb,
  ip_hash text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS wmp_briefings_status_idx ON public.wmp_briefings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS wmp_briefings_email_idx ON public.wmp_briefings(contratante_email);

CREATE TABLE IF NOT EXISTS public.wmp_parceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','reprovado','pausado')),
  categoria text NOT NULL CHECK (categoria IN ('dj','musico','tecnico_som','tecnico_luz','tecnico_video','fornecedor','cerimonialista','outro')),
  nome text NOT NULL,
  nome_artistico text,
  email text NOT NULL,
  telefone text NOT NULL,
  cidade text,
  estado text,
  experiencia_anos integer,
  bio text,
  portfolio_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  arquivos jsonb NOT NULL DEFAULT '[]'::jsonb,
  origem text DEFAULT 'site',
  utm jsonb,
  ip_hash text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS wmp_parceiros_status_idx ON public.wmp_parceiros(status, created_at DESC);
CREATE INDEX IF NOT EXISTS wmp_parceiros_email_idx ON public.wmp_parceiros(email);

-- GRANTS (obrigatório no core)
GRANT INSERT ON public.wmp_briefings TO anon, authenticated;
GRANT SELECT, UPDATE ON public.wmp_briefings TO authenticated;
GRANT ALL ON public.wmp_briefings TO service_role;

GRANT INSERT ON public.wmp_parceiros TO anon, authenticated;
GRANT SELECT, UPDATE ON public.wmp_parceiros TO authenticated;
GRANT ALL ON public.wmp_parceiros TO service_role;

ALTER TABLE public.wmp_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmp_parceiros ENABLE ROW LEVEL SECURITY;

-- INSERT público (lead) — sem dados sensíveis voltando ao cliente
CREATE POLICY "wmp_briefings public insert"
  ON public.wmp_briefings FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "wmp_parceiros public insert"
  ON public.wmp_parceiros FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- SELECT/UPDATE só para admin (via has_role)
CREATE POLICY "wmp_briefings admin read"
  ON public.wmp_briefings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "wmp_briefings admin update"
  ON public.wmp_briefings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "wmp_parceiros admin read"
  ON public.wmp_parceiros FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "wmp_parceiros admin update"
  ON public.wmp_parceiros FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- updated_at trigger reusa função genérica se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'CREATE TRIGGER wmp_briefings_set_updated_at BEFORE UPDATE ON public.wmp_briefings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
    EXECUTE 'CREATE TRIGGER wmp_parceiros_set_updated_at BEFORE UPDATE ON public.wmp_parceiros FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
  END IF;
END$$;
