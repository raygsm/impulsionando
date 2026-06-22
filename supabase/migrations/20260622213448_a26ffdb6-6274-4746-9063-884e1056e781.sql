
ALTER TABLE public.riomed_ar_invoices
  ADD COLUMN IF NOT EXISTS fiscal_number TEXT,
  ADD COLUMN IF NOT EXISTS fiscal_emitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fiscal_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS fiscal_xml_url TEXT,
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_init_point TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT;

CREATE TABLE IF NOT EXISTS public.riomed_fiscal_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL DEFAULT '001-001-',
  next_number BIGINT NOT NULL DEFAULT 1,
  padding INT NOT NULL DEFAULT 7,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_fiscal_sequences TO authenticated;
GRANT ALL ON public.riomed_fiscal_sequences TO service_role;

ALTER TABLE public.riomed_fiscal_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "riomed_fiscal_seq_company" ON public.riomed_fiscal_sequences
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_fiscal_sequences.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_fiscal_sequences.company_id));

CREATE OR REPLACE FUNCTION public.riomed_emit_fiscal_invoice(p_ar_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company UUID;
  v_prefix TEXT;
  v_num BIGINT;
  v_pad INT;
  v_number TEXT;
BEGIN
  SELECT company_id INTO v_company FROM public.riomed_ar_invoices WHERE id = p_ar_id;
  IF v_company IS NULL THEN RAISE EXCEPTION 'AR não encontrada'; END IF;

  INSERT INTO public.riomed_fiscal_sequences(company_id) VALUES (v_company)
    ON CONFLICT (company_id) DO NOTHING;

  UPDATE public.riomed_fiscal_sequences
     SET next_number = next_number + 1, updated_at = now()
   WHERE company_id = v_company
  RETURNING prefix, next_number - 1, padding INTO v_prefix, v_num, v_pad;

  v_number := v_prefix || lpad(v_num::text, v_pad, '0');

  UPDATE public.riomed_ar_invoices
     SET fiscal_number = v_number,
         fiscal_emitted_at = now(),
         fiscal_status = 'emitted'
   WHERE id = p_ar_id;

  RETURN v_number;
END;
$$;
