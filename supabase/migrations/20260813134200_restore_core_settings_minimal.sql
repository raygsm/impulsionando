-- Restore only the Core foundation confirmed missing in production on 2026-08-13.
-- Idempotent and intentionally narrower than the legacy 20260616190329 migration.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

DROP POLICY IF EXISTS core_settings_read_auth ON public.core_settings;
CREATE POLICY core_settings_read_auth
  ON public.core_settings FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS core_settings_write_staff ON public.core_settings;
CREATE POLICY core_settings_write_staff
  ON public.core_settings FOR ALL TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())))
  WITH CHECK (public.is_impulsionando_staff((SELECT auth.uid())));

DROP TRIGGER IF EXISTS trg_core_settings_updated_at ON public.core_settings;
CREATE TRIGGER trg_core_settings_updated_at
  BEFORE UPDATE ON public.core_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.core_settings(key, value, label, description, category) VALUES
  ('minimum_wage', '{"amount":1518.00,"currency":"BRL","year":2026}'::jsonb, 'Salário mínimo vigente', 'Base de cálculo de planos', 'financeiro'),
  ('default_due_day', '{"day":5}'::jsonb, 'Dia padrão de vencimento', 'Vencimento das mensalidades novas', 'financeiro'),
  ('trial_days', '{"days":3}'::jsonb, 'Duração do trial', 'Dias de trial antes de exigir pagamento', 'comercial'),
  ('suspension_grace_days', '{"days":5}'::jsonb, 'Tolerância antes da suspensão', 'Dias após o vencimento antes de suspender', 'financeiro'),
  ('platform_brand', '{"name":"Impulsionando Tecnologia","support_email":"contato@impulsionando.com.br"}'::jsonb, 'Identidade da plataforma', 'Nome e contato de suporte', 'institucional')
ON CONFLICT (key) DO NOTHING;
