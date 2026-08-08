
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS readiness_status text NOT NULL DEFAULT 'em_desenvolvimento'
    CHECK (readiness_status IN ('em_desenvolvimento','em_revisao','em_testes','certificado','publicado')),
  ADD COLUMN IF NOT EXISTS readiness_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS demo_url text,
  ADD COLUMN IF NOT EXISTS docs_url text,
  ADD COLUMN IF NOT EXISTS segments text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS certified_at timestamptz,
  ADD COLUMN IF NOT EXISTS certified_by uuid;

CREATE INDEX IF NOT EXISTS idx_modules_readiness_status ON public.modules(readiness_status);
