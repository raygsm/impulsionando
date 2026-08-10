-- Current-core Mercado Pago contract for CHRISMED.
-- Secrets are referenced by Vault/env names; raw access tokens never live here.

CREATE OR REPLACE FUNCTION public.chrismed_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE IF NOT EXISTS public.mpago_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  access_token_secret_name text NOT NULL,
  public_key text NOT NULL,
  webhook_secret_name text,
  user_id_mp text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, environment)
);

CREATE TABLE IF NOT EXISTS public.mpago_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  external_reference text NOT NULL,
  mp_payment_id text UNIQUE,
  mp_preference_id text,
  payment_method text NOT NULL CHECK (payment_method IN ('pix','credit_card','debit_card','boleto','wallet','other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','authorized','in_process','rejected','refunded','cancelled','charged_back')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'BRL',
  description text,
  payer_email text,
  payer_name text,
  payer_doc text,
  context_type text,
  context_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  pix_qr_code text,
  pix_qr_code_base64 text,
  pix_expires_at timestamptz,
  card_last4 text,
  installments integer,
  approved_at timestamptz,
  rejected_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mpago_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  external_reference text NOT NULL,
  mp_preapproval_id text UNIQUE,
  plan_slug text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','paused','cancelled','expired')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly','yearly','weekly')),
  payer_email text NOT NULL,
  payer_id uuid,
  next_payment_date timestamptz,
  started_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mpago_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  mp_event_id text,
  mp_resource_id text,
  action text,
  raw_payload jsonb NOT NULL,
  signature_valid boolean,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  processing_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mp_event_id, event_type)
);

CREATE TABLE IF NOT EXISTS public.mpago_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.mpago_payments(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  mp_refund_id text UNIQUE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chrismed_service_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  modality text NOT NULL CHECK (modality IN ('presencial','telemedicina','domiciliar','retorno')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  duration_minutes integer NOT NULL DEFAULT 30,
  requires_prepayment boolean NOT NULL DEFAULT true,
  refund_window_hours integer NOT NULL DEFAULT 24,
  reschedule_window_hours integer NOT NULL DEFAULT 12,
  cid_categories text[],
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_mpago_payments_company ON public.mpago_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_mpago_payments_status ON public.mpago_payments(status);
CREATE INDEX IF NOT EXISTS idx_mpago_payments_context ON public.mpago_payments(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_mpago_payments_ext_ref ON public.mpago_payments(external_reference);
CREATE INDEX IF NOT EXISTS idx_mpago_webhook_processed ON public.mpago_webhook_events(processed, received_at);
CREATE INDEX IF NOT EXISTS idx_mpago_webhook_resource ON public.mpago_webhook_events(mp_resource_id);

ALTER TABLE public.mpago_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpago_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpago_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpago_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpago_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chrismed_service_offerings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.mpago_credentials, public.mpago_payments, public.mpago_subscriptions,
  public.mpago_webhook_events, public.mpago_refunds FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.chrismed_service_offerings FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.chrismed_touch_updated_at() FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mpago_credentials, public.mpago_payments,
  public.mpago_subscriptions, public.mpago_webhook_events, public.mpago_refunds TO authenticated;
GRANT ALL ON public.mpago_credentials, public.mpago_payments, public.mpago_subscriptions,
  public.mpago_webhook_events, public.mpago_refunds TO service_role;
GRANT SELECT ON public.chrismed_service_offerings TO anon, authenticated;
GRANT ALL ON public.chrismed_service_offerings TO service_role;

DROP POLICY IF EXISTS mpago_credentials_staff ON public.mpago_credentials;
CREATE POLICY mpago_credentials_staff ON public.mpago_credentials FOR ALL TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())))
  WITH CHECK (public.is_impulsionando_staff((SELECT auth.uid())));
DROP POLICY IF EXISTS mpago_payments_staff ON public.mpago_payments;
CREATE POLICY mpago_payments_staff ON public.mpago_payments FOR ALL TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())))
  WITH CHECK (public.is_impulsionando_staff((SELECT auth.uid())));
DROP POLICY IF EXISTS mpago_subscriptions_staff ON public.mpago_subscriptions;
CREATE POLICY mpago_subscriptions_staff ON public.mpago_subscriptions FOR ALL TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())))
  WITH CHECK (public.is_impulsionando_staff((SELECT auth.uid())));
DROP POLICY IF EXISTS mpago_webhooks_staff ON public.mpago_webhook_events;
CREATE POLICY mpago_webhooks_staff ON public.mpago_webhook_events FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())));
DROP POLICY IF EXISTS mpago_refunds_staff ON public.mpago_refunds;
CREATE POLICY mpago_refunds_staff ON public.mpago_refunds FOR ALL TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())))
  WITH CHECK (public.is_impulsionando_staff((SELECT auth.uid())));
DROP POLICY IF EXISTS chrismed_offerings_public ON public.chrismed_service_offerings;
CREATE POLICY chrismed_offerings_public ON public.chrismed_service_offerings FOR SELECT TO anon, authenticated
  USING (active);
DROP POLICY IF EXISTS chrismed_offerings_staff ON public.chrismed_service_offerings;
CREATE POLICY chrismed_offerings_staff ON public.chrismed_service_offerings FOR ALL TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())))
  WITH CHECK (public.is_impulsionando_staff((SELECT auth.uid())));

DROP TRIGGER IF EXISTS trg_mpago_credentials_updated ON public.mpago_credentials;
CREATE TRIGGER trg_mpago_credentials_updated BEFORE UPDATE ON public.mpago_credentials
  FOR EACH ROW EXECUTE FUNCTION public.chrismed_touch_updated_at();
DROP TRIGGER IF EXISTS trg_mpago_payments_updated ON public.mpago_payments;
CREATE TRIGGER trg_mpago_payments_updated BEFORE UPDATE ON public.mpago_payments
  FOR EACH ROW EXECUTE FUNCTION public.chrismed_touch_updated_at();
DROP TRIGGER IF EXISTS trg_mpago_subscriptions_updated ON public.mpago_subscriptions;
CREATE TRIGGER trg_mpago_subscriptions_updated BEFORE UPDATE ON public.mpago_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.chrismed_touch_updated_at();
DROP TRIGGER IF EXISTS trg_mpago_refunds_updated ON public.mpago_refunds;
CREATE TRIGGER trg_mpago_refunds_updated BEFORE UPDATE ON public.mpago_refunds
  FOR EACH ROW EXECUTE FUNCTION public.chrismed_touch_updated_at();
DROP TRIGGER IF EXISTS trg_chrismed_offerings_updated ON public.chrismed_service_offerings;
CREATE TRIGGER trg_chrismed_offerings_updated BEFORE UPDATE ON public.chrismed_service_offerings
  FOR EACH ROW EXECUTE FUNCTION public.chrismed_touch_updated_at();
