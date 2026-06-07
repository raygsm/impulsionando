CREATE TABLE IF NOT EXISTS public.ai_project_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  client_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  project_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_analysis jsonb NULL,
  ai_model text NULL,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','analisado','aprovado','provisionado','cancelado','falhou')),
  error_message text NULL,
  created_by uuid NOT NULL,
  approved_by uuid NULL,
  approved_at timestamptz NULL,
  provisioned_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_project_generations TO authenticated;
GRANT ALL ON public.ai_project_generations TO service_role;
ALTER TABLE public.ai_project_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff Impulsionando gerencia gerações IA"
  ON public.ai_project_generations FOR ALL
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE TRIGGER trg_ai_project_generations_updated_at
  BEFORE UPDATE ON public.ai_project_generations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES public.ai_project_generations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('logo','institucional','apoio')),
  bucket_path text NOT NULL,
  original_name text NULL,
  mime_type text NULL,
  size_bytes integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_project_files TO authenticated;
GRANT ALL ON public.ai_project_files TO service_role;
ALTER TABLE public.ai_project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff Impulsionando gerencia arquivos de gerações IA"
  ON public.ai_project_files FOR ALL
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_ai_project_files_generation ON public.ai_project_files(generation_id);
CREATE INDEX IF NOT EXISTS idx_ai_project_generations_status ON public.ai_project_generations(status, created_at DESC);