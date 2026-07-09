
-- ============ core_ai_brains ============
CREATE TABLE IF NOT EXISTS public.core_ai_brains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_name text,
  tone text,
  approach text,
  languages text[] NOT NULL DEFAULT '{}',
  channels text[] NOT NULL DEFAULT '{}',
  schedule jsonb NOT NULL DEFAULT '{}'::jsonb,
  base_prompt text,
  complementary_prompt text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','inactive')),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_ai_brains TO authenticated;
GRANT ALL ON public.core_ai_brains TO service_role;
ALTER TABLE public.core_ai_brains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI brain staff full access"
  ON public.core_ai_brains FOR ALL
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "AI brain company members read"
  ON public.core_ai_brains FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id = core_ai_brains.company_id
  ));

CREATE POLICY "AI brain company members write"
  ON public.core_ai_brains FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id = core_ai_brains.company_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id = core_ai_brains.company_id
  ));

CREATE TRIGGER core_ai_brains_set_updated_at
  BEFORE UPDATE ON public.core_ai_brains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ core_ai_brain_knowledge ============
CREATE TABLE IF NOT EXISTS public.core_ai_brain_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id uuid NOT NULL REFERENCES public.core_ai_brains(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'note' CHECK (kind IN ('note','faq','doc','url','script','policy')),
  content text,
  source_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS core_ai_brain_knowledge_brain_idx ON public.core_ai_brain_knowledge(brain_id);
CREATE INDEX IF NOT EXISTS core_ai_brain_knowledge_company_idx ON public.core_ai_brain_knowledge(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_ai_brain_knowledge TO authenticated;
GRANT ALL ON public.core_ai_brain_knowledge TO service_role;
ALTER TABLE public.core_ai_brain_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI brain KB staff full access"
  ON public.core_ai_brain_knowledge FOR ALL
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "AI brain KB company members manage"
  ON public.core_ai_brain_knowledge FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id = core_ai_brain_knowledge.company_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id = core_ai_brain_knowledge.company_id
  ));

CREATE TRIGGER core_ai_brain_knowledge_set_updated_at
  BEFORE UPDATE ON public.core_ai_brain_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ core_ai_brain_events (audit) ============
CREATE TABLE IF NOT EXISTS public.core_ai_brain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id uuid REFERENCES public.core_ai_brains(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  previous_status text,
  new_status text,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS core_ai_brain_events_company_idx ON public.core_ai_brain_events(company_id, created_at DESC);

GRANT SELECT, INSERT ON public.core_ai_brain_events TO authenticated;
GRANT ALL ON public.core_ai_brain_events TO service_role;
ALTER TABLE public.core_ai_brain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI brain events staff read"
  ON public.core_ai_brain_events FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "AI brain events company read"
  ON public.core_ai_brain_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id = core_ai_brain_events.company_id
  ));

CREATE POLICY "AI brain events insert staff or member"
  ON public.core_ai_brain_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_impulsionando_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.company_id = core_ai_brain_events.company_id
    )
  );
