
-- =========== core_integrations ==========
CREATE TABLE IF NOT EXISTS public.core_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_refs JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured','connected','error','disabled')),
  last_test_at TIMESTAMPTZ,
  last_error TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_integrations TO authenticated;
GRANT ALL ON public.core_integrations TO service_role;
ALTER TABLE public.core_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY core_integrations_staff_all ON public.core_integrations
  FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- =========== core_integration_logs ==========
CREATE TABLE IF NOT EXISTS public.core_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_slug TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','error','pending')),
  request JSONB,
  response JSONB,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.core_integration_logs TO authenticated;
GRANT ALL ON public.core_integration_logs TO service_role;
ALTER TABLE public.core_integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY core_integration_logs_staff_read ON public.core_integration_logs
  FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_core_integration_logs_slug_date
  ON public.core_integration_logs (integration_slug, created_at DESC);

-- =========== core_briefings (Sob Medida) ==========
CREATE TABLE IF NOT EXISTS public.core_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_whatsapp TEXT NOT NULL,
  company_name TEXT NOT NULL,
  niche TEXT,
  team_size TEXT,
  budget_range TEXT,
  urgency TEXT,
  current_tools TEXT,
  goals TEXT,
  required_modules TEXT[],
  integrations_needed TEXT,
  notes TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','quoted','won','lost','archived')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_briefings TO authenticated;
GRANT INSERT ON public.core_briefings TO anon;
GRANT ALL ON public.core_briefings TO service_role;
ALTER TABLE public.core_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY core_briefings_public_insert ON public.core_briefings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY core_briefings_staff_read ON public.core_briefings
  FOR SELECT TO authenticated USING (public.is_impulsionando_staff(auth.uid()));
CREATE POLICY core_briefings_staff_update ON public.core_briefings
  FOR UPDATE TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));
CREATE POLICY core_briefings_staff_delete ON public.core_briefings
  FOR DELETE TO authenticated USING (public.is_impulsionando_staff(auth.uid()));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public._core_int_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_core_integrations_updated ON public.core_integrations;
CREATE TRIGGER trg_core_integrations_updated BEFORE UPDATE ON public.core_integrations
  FOR EACH ROW EXECUTE FUNCTION public._core_int_set_updated_at();

DROP TRIGGER IF EXISTS trg_core_briefings_updated ON public.core_briefings;
CREATE TRIGGER trg_core_briefings_updated BEFORE UPDATE ON public.core_briefings
  FOR EACH ROW EXECUTE FUNCTION public._core_int_set_updated_at();

-- Seed known integrations
INSERT INTO public.core_integrations (slug, name, environment, status, config)
VALUES
  ('n8n', 'N8N — Automações', 'production', 'not_configured',
   '{"base_url":"","webhooks":{"new_customer":"","trial_started":"","invoice_created":"","payment_confirmed":"","appointment_created":"","appointment_rescheduled":"","appointment_cancelled":"","email_sent":"","whatsapp_sent":"","realestate_lead":"","affiliate_invited":""}}'::jsonb),
  ('mercadopago', 'Mercado Pago — Checkout Transparente', 'sandbox', 'not_configured',
   '{"public_key":"","webhook_url":"","payment_methods":["pix","credit_card","boleto"],"recipient_account":""}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
