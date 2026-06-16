
-- 1) companies: campos de demo
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS demo_niche text,
  ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_companies_is_demo ON public.companies(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_companies_demo_niche ON public.companies(demo_niche) WHERE is_demo = true;

-- 2) Nichos faltantes (idempotente)
INSERT INTO public.niches (slug, name)
VALUES
  ('eventos', 'Eventos e Produtores'),
  ('comunidade', 'Comunidades e Associações')
ON CONFLICT (slug) DO NOTHING;

-- 3) demo_sessions
CREATE TABLE IF NOT EXISTS public.demo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  niche_slug text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ip inet,
  user_agent text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at))::int
      ELSE NULL END
  ) STORED,
  score integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.demo_sessions TO authenticated;
GRANT ALL ON public.demo_sessions TO service_role;
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_sessions staff read"
  ON public.demo_sessions FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "demo_sessions self write"
  ON public.demo_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "demo_sessions self update"
  ON public.demo_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_impulsionando_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_demo_sessions_niche ON public.demo_sessions(niche_slug);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_user ON public.demo_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_started ON public.demo_sessions(started_at DESC);

-- 4) demo_actions
CREATE TABLE IF NOT EXISTS public.demo_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.demo_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  niche_slug text NOT NULL,
  module text NOT NULL,
  action_key text NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.demo_actions TO authenticated;
GRANT ALL ON public.demo_actions TO service_role;
ALTER TABLE public.demo_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_actions staff read"
  ON public.demo_actions FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "demo_actions self write"
  ON public.demo_actions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.demo_sessions s
      WHERE s.id = session_id
        AND (s.user_id = auth.uid() OR public.is_impulsionando_staff(auth.uid()))
    )
  );

CREATE INDEX IF NOT EXISTS idx_demo_actions_session ON public.demo_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_demo_actions_niche ON public.demo_actions(niche_slug);
CREATE INDEX IF NOT EXISTS idx_demo_actions_module ON public.demo_actions(module);

-- 5) demo_score(): 0..100 com base em ações pesadas, módulos distintos e duração.
CREATE OR REPLACE FUNCTION public.demo_score(_session_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_pts int := 0;
  v_module_pts int := 0;
  v_duration_pts int := 0;
  v_duration int;
  v_modules int;
  v_total int;
BEGIN
  -- Pontos por ações executadas (soma de weight, cap 60)
  SELECT LEAST(60, COALESCE(SUM(weight), 0))
    INTO v_action_pts
  FROM public.demo_actions
  WHERE session_id = _session_id;

  -- Pontos por módulos distintos visitados (5 pts cada, cap 25)
  SELECT LEAST(25, COUNT(DISTINCT module) * 5)
    INTO v_module_pts
  FROM public.demo_actions
  WHERE session_id = _session_id;

  -- Pontos por engajamento (duração até 15 min = +15)
  SELECT COALESCE(duration_seconds, EXTRACT(EPOCH FROM (now() - started_at))::int)
    INTO v_duration
  FROM public.demo_sessions WHERE id = _session_id;

  v_duration_pts := LEAST(15, GREATEST(0, (v_duration / 60)));

  v_total := v_action_pts + v_module_pts + v_duration_pts;
  RETURN LEAST(100, GREATEST(0, v_total));
END;
$$;

GRANT EXECUTE ON FUNCTION public.demo_score(uuid) TO authenticated, service_role;
