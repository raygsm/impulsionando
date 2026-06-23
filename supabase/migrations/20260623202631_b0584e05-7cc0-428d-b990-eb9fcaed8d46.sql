
ALTER TABLE public.eco_marketplace_listings
  ADD COLUMN IF NOT EXISTS vitrine_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS vitrine_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vitrine_approved_by UUID;

CREATE INDEX IF NOT EXISTS eco_marketplace_listings_vitrine_idx
  ON public.eco_marketplace_listings (vitrine_opt_in, status)
  WHERE vitrine_opt_in = true;

CREATE OR REPLACE FUNCTION public.eco_marketplace_listings_vitrine_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.vitrine_opt_in = true THEN
    IF NEW.discount_pct IS NULL OR NEW.discount_pct < 1 THEN
      RAISE EXCEPTION 'Listagens da Vitrine precisam de desconto mínimo de 1%% para o Clube Impulsionito'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS eco_marketplace_listings_vitrine_validate_trg ON public.eco_marketplace_listings;
CREATE TRIGGER eco_marketplace_listings_vitrine_validate_trg
  BEFORE INSERT OR UPDATE ON public.eco_marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.eco_marketplace_listings_vitrine_validate();
