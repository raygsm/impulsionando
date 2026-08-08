
-- Delta A: environment flag
DO $$ BEGIN
  CREATE TYPE public.company_environment AS ENUM ('demo','teste','real');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS environment public.company_environment NOT NULL DEFAULT 'real';

-- Delta B: site_templates
CREATE TABLE IF NOT EXISTS public.site_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  niche text,
  description text,
  pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_colors jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_templates TO authenticated;
GRANT ALL ON public.site_templates TO service_role;
ALTER TABLE public.site_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage site_templates" ON public.site_templates
  FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE TRIGGER trg_site_templates_updated BEFORE UPDATE ON public.site_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Delta C: ai_prompt_library
CREATE TABLE IF NOT EXISTS public.ai_prompt_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  niche text,
  purpose text,
  prompt text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  usage_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompt_library TO authenticated;
GRANT ALL ON public.ai_prompt_library TO service_role;
ALTER TABLE public.ai_prompt_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage ai_prompt_library" ON public.ai_prompt_library
  FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE TRIGGER trg_ai_prompt_library_updated BEFORE UPDATE ON public.ai_prompt_library
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Delta D: generated_pages
CREATE TABLE IF NOT EXISTS public.generated_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  generation_id uuid REFERENCES public.ai_project_generations(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.site_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_used text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_pages TO authenticated;
GRANT ALL ON public.generated_pages TO service_role;
ALTER TABLE public.generated_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage generated_pages" ON public.generated_pages
  FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE TRIGGER trg_generated_pages_updated BEFORE UPDATE ON public.generated_pages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Backfill: trials → demo
UPDATE public.companies c SET environment = 'demo'
WHERE c.is_master = false
  AND EXISTS (
    SELECT 1 FROM public.trial_subscriptions t
    JOIN public.user_profiles up ON up.user_id = t.user_id
    WHERE up.company_id = c.id
  );
