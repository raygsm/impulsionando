
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);
CREATE INDEX idx_subscriptions_env_user ON public.subscriptions(environment, user_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subs_select_self_or_staff" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_impulsionando_staff(auth.uid()));

CREATE TRIGGER tg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.master_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.companies WHERE is_master = true LIMIT 1;
$$;
