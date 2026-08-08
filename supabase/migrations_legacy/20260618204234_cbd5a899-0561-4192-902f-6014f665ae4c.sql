
-- Planos
CREATE TABLE IF NOT EXISTS public.mp_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  interval text NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly','yearly','one_time')),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mp_plans TO anon, authenticated;
GRANT ALL ON public.mp_plans TO service_role;
ALTER TABLE public.mp_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.mp_plans
  FOR SELECT USING (active = true);
CREATE POLICY "plans admin write" ON public.mp_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.mp_plans (slug, name, description, price_cents, interval, display_order, features) VALUES
  ('essencial', 'Essencial', 'Plano inicial para começar a operar com a Impulsionando.', 9700, 'monthly', 1,
    '["Acesso ao Core","Até 1 unidade","Suporte por chat"]'::jsonb),
  ('full', 'Full', 'Para operações que precisam de tudo da plataforma.', 29700, 'monthly', 2,
    '["Tudo do Essencial","Múltiplas unidades","Marketplace B2B","Suporte prioritário"]'::jsonb),
  ('white-label', 'White Label', 'Marca própria, gestão de revenda e múltiplos clientes.', 99700, 'monthly', 3,
    '["Tudo do Full","Marca própria","Gestão de revendedores","Split de pagamento"]'::jsonb),
  ('consumidor', 'Clube do Consumidor Premium', 'Acesso ao clube com benefícios em bares e restaurantes.', 1990, 'monthly', 4,
    '["Benefícios em bares parceiros","Eventos exclusivos","Programa de pontos"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Pagamentos (registro financeiro)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id uuid,
  plan_id uuid REFERENCES public.mp_plans(id) ON DELETE SET NULL,
  subscription_id text,
  payment_id text UNIQUE,
  payment_method text,
  status text NOT NULL DEFAULT 'pending',
  amount_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  due_date timestamptz,
  paid_at timestamptz,
  raw_response jsonb,
  webhook_received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments owner read" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "payments admin read" ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payments owner insert" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Assinaturas
CREATE TABLE IF NOT EXISTS public.mp_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.mp_plans(id) ON DELETE SET NULL,
  mp_preapproval_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  next_billing_at timestamptz,
  canceled_at timestamptz,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mp_subscriptions TO authenticated;
GRANT ALL ON public.mp_subscriptions TO service_role;
ALTER TABLE public.mp_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs owner read" ON public.mp_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "subs admin read" ON public.mp_subscriptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Log de webhooks
CREATE TABLE IF NOT EXISTS public.mp_webhook_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text,
  resource_id text,
  payload jsonb,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.mp_webhook_log TO service_role;
ALTER TABLE public.mp_webhook_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wh log admin read" ON public.mp_webhook_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Triggers updated_at
CREATE OR REPLACE FUNCTION public.mp_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_mp_plans_touch ON public.mp_plans;
CREATE TRIGGER trg_mp_plans_touch BEFORE UPDATE ON public.mp_plans
  FOR EACH ROW EXECUTE FUNCTION public.mp_touch_updated_at();

DROP TRIGGER IF EXISTS trg_payments_touch ON public.payments;
CREATE TRIGGER trg_payments_touch BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.mp_touch_updated_at();

DROP TRIGGER IF EXISTS trg_mp_subs_touch ON public.mp_subscriptions;
CREATE TRIGGER trg_mp_subs_touch BEFORE UPDATE ON public.mp_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.mp_touch_updated_at();
