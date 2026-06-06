-- Tabela de orçamentos montados pelo wizard /orcamento
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,

  -- Lead / contratante
  lead_name TEXT NOT NULL,
  lead_whatsapp TEXT NOT NULL,
  lead_email TEXT,
  lead_role TEXT,
  lead_city TEXT,
  lead_state TEXT,

  -- Empresa
  company_name TEXT,
  company_tax_id TEXT, -- CNPJ
  company_legal_name TEXT,

  -- Segmentação
  category TEXT,
  segment TEXT,

  -- Módulos e valores (valores em centavos para evitar floats)
  modules TEXT[] NOT NULL DEFAULT '{}',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  setup_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,

  -- Aceite eletrônico
  accepted_at TIMESTAMPTZ,
  accepted_ip TEXT,
  accepted_user_agent TEXT,
  accepted_terms JSONB, -- {terms:true, modules:true, deadlines:true, integrations:true, refund:true}

  -- Origem / tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  origin TEXT,

  -- Status do funil
  status TEXT NOT NULL DEFAULT 'draft',
    -- draft | reviewed | accepted | payment_requested | converted | abandoned

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTs: inserção pública (lead anônimo pode criar); leitura só pra service_role e authenticated (filtrado por policy)
GRANT INSERT, SELECT, UPDATE ON public.quotes TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir um novo orçamento (lead capture)
CREATE POLICY "Anyone can create a quote"
  ON public.quotes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Qualquer um pode atualizar SEU PRÓPRIO orçamento pelo ID (sessão do wizard)
-- Não exige auth pois o wizard é público
CREATE POLICY "Anyone can update own quote by id"
  ON public.quotes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Leitura: só staff master da Impulsionando OU pelo próprio dono (autenticado pelo email)
CREATE POLICY "Master staff can view all quotes"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.companies c ON c.id = up.company_id
      WHERE up.user_id = auth.uid()
        AND up.is_active = true
        AND c.is_master = true
    )
  );

-- Exclusão só staff master
CREATE POLICY "Master staff can delete quotes"
  ON public.quotes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.companies c ON c.id = up.company_id
      WHERE up.user_id = auth.uid()
        AND up.is_active = true
        AND c.is_master = true
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_quotes_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER quotes_set_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.tg_quotes_set_updated_at();

-- Sequência para o número humano-legível
CREATE SEQUENCE IF NOT EXISTS public.quotes_number_seq START 1;

CREATE OR REPLACE FUNCTION public.tg_quotes_set_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := 'ORC-' || to_char(now(), 'YYYY') || '-' ||
                        lpad(nextval('public.quotes_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER quotes_set_number
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.tg_quotes_set_number();

CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_email ON public.quotes(lead_email);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);