
CREATE TABLE IF NOT EXISTS public.infinitepay_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'infinitepay',
  environment TEXT NOT NULL DEFAULT 'production',
  order_nsu TEXT NOT NULL UNIQUE,
  empresa_id UUID,
  cliente_id UUID,
  user_id UUID,
  modulo_id TEXT,
  plano_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  description TEXT,
  amount INTEGER NOT NULL,
  paid_amount INTEGER,
  installments INTEGER,
  capture_method TEXT,
  transaction_nsu TEXT,
  invoice_slug TEXT,
  receipt_url TEXT,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  raw_request JSONB,
  raw_response JSONB,
  webhook_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.infinitepay_payments TO authenticated;
GRANT ALL ON public.infinitepay_payments TO service_role;

ALTER TABLE public.infinitepay_payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_infinitepay_payments_status ON public.infinitepay_payments(status);
CREATE INDEX IF NOT EXISTS idx_infinitepay_payments_empresa ON public.infinitepay_payments(empresa_id);
CREATE INDEX IF NOT EXISTS idx_infinitepay_payments_user ON public.infinitepay_payments(user_id);

CREATE POLICY "Users see own infinitepay payments"
  ON public.infinitepay_payments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR (empresa_id IS NOT NULL AND public.user_belongs_to_company(auth.uid(), empresa_id))
  );

CREATE POLICY "Users insert own infinitepay payments"
  ON public.infinitepay_payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin updates infinitepay payments"
  ON public.infinitepay_payments FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_infinitepay_payments_updated_at
  BEFORE UPDATE ON public.infinitepay_payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
