
-- Função auxiliar de updated_at (idempotente)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $f$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$f$;

-- 1. core_settings
CREATE TABLE IF NOT EXISTS public.core_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_editable boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.core_settings TO authenticated;
GRANT ALL ON public.core_settings TO service_role;
ALTER TABLE public.core_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "core_settings_read_auth" ON public.core_settings;
CREATE POLICY "core_settings_read_auth" ON public.core_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "core_settings_write_staff" ON public.core_settings;
CREATE POLICY "core_settings_write_staff" ON public.core_settings FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- 2. core_menu_items
CREATE TABLE IF NOT EXISTS public.core_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.core_menu_items(id) ON DELETE CASCADE,
  label text NOT NULL,
  icon text,
  route text,
  sort_order integer NOT NULL DEFAULT 0,
  scope text NOT NULL DEFAULT 'core',
  audience text[] NOT NULL DEFAULT '{}',
  niche_slugs text[] NOT NULL DEFAULT '{}',
  required_module_slug text,
  required_plan_codes text[] NOT NULL DEFAULT '{}',
  required_permission text,
  is_visible boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_core_menu_items_scope ON public.core_menu_items(scope, sort_order);
CREATE INDEX IF NOT EXISTS idx_core_menu_items_parent ON public.core_menu_items(parent_id);
GRANT SELECT ON public.core_menu_items TO authenticated;
GRANT ALL ON public.core_menu_items TO service_role;
ALTER TABLE public.core_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "core_menu_items_read_auth" ON public.core_menu_items;
CREATE POLICY "core_menu_items_read_auth" ON public.core_menu_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "core_menu_items_write_staff" ON public.core_menu_items;
CREATE POLICY "core_menu_items_write_staff" ON public.core_menu_items FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- 3. core_feature_flags
CREATE TABLE IF NOT EXISTS public.core_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_slug text REFERENCES public.modules(slug) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  default_value boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_slug, key)
);
GRANT SELECT ON public.core_feature_flags TO authenticated;
GRANT ALL ON public.core_feature_flags TO service_role;
ALTER TABLE public.core_feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "core_feature_flags_read_auth" ON public.core_feature_flags;
CREATE POLICY "core_feature_flags_read_auth" ON public.core_feature_flags FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "core_feature_flags_write_staff" ON public.core_feature_flags;
CREATE POLICY "core_feature_flags_write_staff" ON public.core_feature_flags FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- 4. core_company_feature_values
CREATE TABLE IF NOT EXISTS public.core_company_feature_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  flag_key text NOT NULL,
  module_slug text,
  value boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, module_slug, flag_key)
);
CREATE INDEX IF NOT EXISTS idx_core_company_feature_values_company ON public.core_company_feature_values(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_company_feature_values TO authenticated;
GRANT ALL ON public.core_company_feature_values TO service_role;
ALTER TABLE public.core_company_feature_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "core_company_feature_values_staff_all" ON public.core_company_feature_values;
CREATE POLICY "core_company_feature_values_staff_all" ON public.core_company_feature_values FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));
DROP POLICY IF EXISTS "core_company_feature_values_tenant_read" ON public.core_company_feature_values;
CREATE POLICY "core_company_feature_values_tenant_read" ON public.core_company_feature_values FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id));

-- 5. core_dashboard_widgets
CREATE TABLE IF NOT EXISTS public.core_dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_key text NOT NULL,
  widget_key text NOT NULL,
  title text NOT NULL,
  description text,
  widget_type text NOT NULL DEFAULT 'metric',
  data_source text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience text[] NOT NULL DEFAULT '{}',
  niche_slugs text[] NOT NULL DEFAULT '{}',
  required_module_slug text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(dashboard_key, widget_key)
);
GRANT SELECT ON public.core_dashboard_widgets TO authenticated;
GRANT ALL ON public.core_dashboard_widgets TO service_role;
ALTER TABLE public.core_dashboard_widgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "core_dashboard_widgets_read_auth" ON public.core_dashboard_widgets;
CREATE POLICY "core_dashboard_widgets_read_auth" ON public.core_dashboard_widgets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "core_dashboard_widgets_write_staff" ON public.core_dashboard_widgets;
CREATE POLICY "core_dashboard_widgets_write_staff" ON public.core_dashboard_widgets FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- 6. core_niche_modules
CREATE TABLE IF NOT EXISTS public.core_niche_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id uuid NOT NULL REFERENCES public.niches(id) ON DELETE CASCADE,
  module_slug text NOT NULL REFERENCES public.modules(slug) ON DELETE CASCADE,
  is_recommended boolean NOT NULL DEFAULT true,
  is_optional boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(niche_id, module_slug)
);
GRANT SELECT ON public.core_niche_modules TO authenticated;
GRANT ALL ON public.core_niche_modules TO service_role;
ALTER TABLE public.core_niche_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "core_niche_modules_read_auth" ON public.core_niche_modules;
CREATE POLICY "core_niche_modules_read_auth" ON public.core_niche_modules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "core_niche_modules_write_staff" ON public.core_niche_modules;
CREATE POLICY "core_niche_modules_write_staff" ON public.core_niche_modules FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- 7. Triggers updated_at
DO $$ DECLARE t text;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'core_settings','core_menu_items','core_feature_flags',
  'core_company_feature_values','core_dashboard_widgets','core_niche_modules'])
LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON public.%1$s; CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t);
END LOOP; END $$;

-- 8. Seed inicial core_settings
INSERT INTO public.core_settings(key, value, label, description, category) VALUES
  ('minimum_wage', '{"amount": 1518.00, "currency": "BRL", "year": 2026}'::jsonb, 'Salário mínimo vigente', 'Base de cálculo de planos Essencial e Ideal', 'financeiro'),
  ('default_due_day', '{"day": 5}'::jsonb, 'Dia padrão de vencimento', 'Vencimento das mensalidades novas', 'financeiro'),
  ('trial_days', '{"days": 3}'::jsonb, 'Duração do trial', 'Dias de trial antes de exigir pagamento', 'comercial'),
  ('suspension_grace_days', '{"days": 5}'::jsonb, 'Tolerância antes da suspensão', 'Dias após o vencimento antes de suspender', 'financeiro'),
  ('platform_brand', '{"name": "Impulsionando Tecnologia", "support_email": "contato@impulsionando.com.br"}'::jsonb, 'Identidade da plataforma', 'Nome e contato de suporte exibidos publicamente', 'institucional')
ON CONFLICT (key) DO NOTHING;
