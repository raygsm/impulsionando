CREATE TABLE public.cotacao_bob_usd (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate numeric(10,4) NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  captured_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cotacao_bob_usd TO anon;
GRANT SELECT ON public.cotacao_bob_usd TO authenticated;
GRANT ALL ON public.cotacao_bob_usd TO service_role;

ALTER TABLE public.cotacao_bob_usd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active rates"
  ON public.cotacao_bob_usd FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage rates"
  ON public.cotacao_bob_usd FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX cotacao_bob_usd_captured_idx ON public.cotacao_bob_usd(captured_at DESC) WHERE is_active = true;

CREATE TRIGGER cotacao_bob_usd_set_updated_at
BEFORE UPDATE ON public.cotacao_bob_usd
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed cotação inicial oficial (Bolívia ~ 6.96 BOB/USD)
INSERT INTO public.cotacao_bob_usd (rate, source, metadata)
VALUES (6.96, 'seed', '{"note":"Cotação oficial referencial Bolívia"}'::jsonb);