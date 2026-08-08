
CREATE TABLE public.mpago_credentials (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mpago_credentials TO authenticated;
GRANT ALL ON public.mpago_credentials TO service_role;
ALTER TABLE public.mpago_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admins manage MP credentials" ON public.mpago_credentials FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Company members read MP credentials" ON public.mpago_credentials FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE TABLE public.mpago_payments (
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
  payer_email text, payer_name text, payer_doc text,
  context_type text, context_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  pix_qr_code text, pix_qr_code_base64 text, pix_expires_at timestamptz,
  card_last4 text, installments integer,
  approved_at timestamptz, rejected_at timestamptz, refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mpago_payments_company ON public.mpago_payments(company_id);
CREATE INDEX idx_mpago_payments_status ON public.mpago_payments(status);
CREATE INDEX idx_mpago_payments_context ON public.mpago_payments(context_type, context_id);
CREATE INDEX idx_mpago_payments_ext_ref ON public.mpago_payments(external_reference);
GRANT SELECT, INSERT, UPDATE ON public.mpago_payments TO authenticated;
GRANT ALL ON public.mpago_payments TO service_role;
ALTER TABLE public.mpago_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members read payments" ON public.mpago_payments FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Company members create payments" ON public.mpago_payments FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Company admins update payments" ON public.mpago_payments FOR UPDATE TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.mpago_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  external_reference text NOT NULL,
  mp_preapproval_id text UNIQUE,
  plan_slug text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','paused','cancelled','expired')),
  amount_cents integer NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly','yearly','weekly')),
  payer_email text NOT NULL, payer_id uuid,
  next_payment_date timestamptz, started_at timestamptz, cancelled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mpago_subscriptions TO authenticated;
GRANT ALL ON public.mpago_subscriptions TO service_role;
ALTER TABLE public.mpago_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members read subs" ON public.mpago_subscriptions FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Company members create subs" ON public.mpago_subscriptions FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "Company admins update subs" ON public.mpago_subscriptions FOR UPDATE TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.mpago_webhook_events (
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
CREATE INDEX idx_mpago_webhook_processed ON public.mpago_webhook_events(processed, received_at);
CREATE INDEX idx_mpago_webhook_resource ON public.mpago_webhook_events(mp_resource_id);
GRANT SELECT ON public.mpago_webhook_events TO authenticated;
GRANT ALL ON public.mpago_webhook_events TO service_role;
ALTER TABLE public.mpago_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admins read webhook events" ON public.mpago_webhook_events FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.mpago_refunds (
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
GRANT SELECT, INSERT, UPDATE ON public.mpago_refunds TO authenticated;
GRANT ALL ON public.mpago_refunds TO service_role;
ALTER TABLE public.mpago_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admins manage refunds" ON public.mpago_refunds FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.chrismed_service_offerings (
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
GRANT SELECT ON public.chrismed_service_offerings TO anon, authenticated;
GRANT ALL ON public.chrismed_service_offerings TO service_role;
ALTER TABLE public.chrismed_service_offerings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active offerings" ON public.chrismed_service_offerings FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY "Company admins manage offerings" ON public.chrismed_service_offerings FOR ALL TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mpago_credentials_updated BEFORE UPDATE ON public.mpago_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mpago_payments_updated BEFORE UPDATE ON public.mpago_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mpago_subscriptions_updated BEFORE UPDATE ON public.mpago_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mpago_refunds_updated BEFORE UPDATE ON public.mpago_refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_chrismed_offerings_updated BEFORE UPDATE ON public.chrismed_service_offerings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.chrismed_service_offerings (company_id, slug, name, description, modality, price_cents, duration_minutes, requires_prepayment, refund_window_hours, reschedule_window_hours, display_order)
VALUES
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, 'consulta-presencial', 'Consulta Presencial', 'Atendimento clínico presencial na sede da CHRISMED.', 'presencial', 25000, 30, true, 24, 12, 1),
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, 'telemedicina', 'Telemedicina', 'Consulta por videochamada com prontuário eletrônico e prescrição digital.', 'telemedicina', 18000, 30, true, 6, 2, 2),
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, 'visita-domiciliar', 'Visita Domiciliar', 'Atendimento médico no endereço do paciente (sujeito à região de cobertura).', 'domiciliar', 45000, 60, true, 48, 24, 3),
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid, 'retorno', 'Consulta de Retorno', 'Reavaliação em até 30 dias após a consulta inicial.', 'retorno', 0, 20, false, 24, 12, 4);
