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

CREATE INDEX IF NOT EXISTS core_ai_brain_knowledge_brain_idx ON public.core_ai_brain_knowledge(brain_id);
CREATE INDEX IF NOT EXISTS core_ai_brain_knowledge_company_idx ON public.core_ai_brain_knowledge(company_id);
CREATE INDEX IF NOT EXISTS core_ai_brain_events_company_idx ON public.core_ai_brain_events(company_id,created_at DESC);

DROP TRIGGER IF EXISTS core_ai_brains_set_updated_at ON public.core_ai_brains;
CREATE TRIGGER core_ai_brains_set_updated_at BEFORE UPDATE ON public.core_ai_brains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS core_ai_brain_knowledge_set_updated_at ON public.core_ai_brain_knowledge;
CREATE TRIGGER core_ai_brain_knowledge_set_updated_at BEFORE UPDATE ON public.core_ai_brain_knowledge FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
