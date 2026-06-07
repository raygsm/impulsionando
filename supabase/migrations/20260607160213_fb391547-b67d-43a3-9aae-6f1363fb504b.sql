
-- Versionamento e metadados de módulos (estende a tabela existente, não duplica)
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS current_version text NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS last_version_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS dependencies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.company_modules
  ADD COLUMN IF NOT EXISTS installed_version text,
  ADD COLUMN IF NOT EXISTS installed_at timestamptz;

-- Histórico de versões do Core (centralizado, não por cliente)
CREATE TABLE IF NOT EXISTS public.module_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  version text NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  released_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, version)
);

GRANT SELECT ON public.module_versions TO authenticated;
GRANT ALL ON public.module_versions TO service_role;

ALTER TABLE public.module_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mv_read" ON public.module_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mv_write" ON public.module_versions FOR ALL TO authenticated
  USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.module_versions
  FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

-- Define dependências canônicas dos módulos existentes (idempotente)
UPDATE public.modules SET dependencies = ARRAY['agenda']::text[] WHERE slug = 'saude' AND dependencies = '{}';
UPDATE public.modules SET dependencies = ARRAY['agenda']::text[] WHERE slug = 'area_cliente' AND dependencies = '{}';
UPDATE public.modules SET dependencies = ARRAY['commerce']::text[] WHERE slug = 'pdv' AND dependencies = '{}';
UPDATE public.modules SET dependencies = ARRAY['commerce']::text[] WHERE slug = 'delivery' AND dependencies = '{}';
UPDATE public.modules SET dependencies = ARRAY['crm']::text[] WHERE slug = 'automacao' AND dependencies = '{}';
UPDATE public.modules SET dependencies = ARRAY['financeiro']::text[] WHERE slug = 'bi' AND dependencies = '{}';

-- Preenche current_version inicial para todos
UPDATE public.modules SET current_version = '1.0.0' WHERE current_version IS NULL OR current_version = '';
UPDATE public.modules SET owner = 'Impulsionando Tecnologia' WHERE owner IS NULL;
