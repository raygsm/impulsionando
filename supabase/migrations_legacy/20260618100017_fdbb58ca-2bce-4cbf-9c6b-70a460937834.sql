
-- Drop previous anon exposure
DROP POLICY IF EXISTS companies_public_vitrine_safe_read ON public.companies;
DROP VIEW IF EXISTS public.public_companies_vitrine;
REVOKE ALL ON public.companies FROM anon;

-- Dedicated safe table — no PII columns ever stored here
CREATE TABLE IF NOT EXISTS public.companies_vitrine_public (
  id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  trade_name text,
  logo_url text,
  public_slug text UNIQUE NOT NULL,
  segment text,
  company_type text,
  primary_color text,
  secondary_color text,
  address_city text,
  address_state text,
  website text,
  instagram text,
  facebook text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.companies_vitrine_public TO anon, authenticated;
GRANT ALL ON public.companies_vitrine_public TO service_role;
ALTER TABLE public.companies_vitrine_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_vitrine_public_read
ON public.companies_vitrine_public
FOR SELECT TO anon, authenticated
USING (true);

-- Sync trigger from companies -> companies_vitrine_public
CREATE OR REPLACE FUNCTION public.sync_companies_vitrine_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.companies_vitrine_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.vitrine_enabled = true AND NEW.public_slug IS NOT NULL THEN
    INSERT INTO public.companies_vitrine_public AS v (
      id, name, trade_name, logo_url, public_slug, segment, company_type,
      primary_color, secondary_color, address_city, address_state,
      website, instagram, facebook, updated_at
    ) VALUES (
      NEW.id, NEW.name, NEW.trade_name, NEW.logo_url, NEW.public_slug, NEW.segment, NEW.company_type,
      NEW.primary_color, NEW.secondary_color, NEW.address_city, NEW.address_state,
      NEW.website, NEW.instagram, NEW.facebook, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      trade_name = EXCLUDED.trade_name,
      logo_url = EXCLUDED.logo_url,
      public_slug = EXCLUDED.public_slug,
      segment = EXCLUDED.segment,
      company_type = EXCLUDED.company_type,
      primary_color = EXCLUDED.primary_color,
      secondary_color = EXCLUDED.secondary_color,
      address_city = EXCLUDED.address_city,
      address_state = EXCLUDED.address_state,
      website = EXCLUDED.website,
      instagram = EXCLUDED.instagram,
      facebook = EXCLUDED.facebook,
      updated_at = now();
  ELSE
    DELETE FROM public.companies_vitrine_public WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_companies_vitrine_public ON public.companies;
CREATE TRIGGER trg_sync_companies_vitrine_public
AFTER INSERT OR UPDATE OR DELETE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.sync_companies_vitrine_public();

-- Initial seed
INSERT INTO public.companies_vitrine_public (
  id, name, trade_name, logo_url, public_slug, segment, company_type,
  primary_color, secondary_color, address_city, address_state,
  website, instagram, facebook
)
SELECT
  id, name, trade_name, logo_url, public_slug, segment, company_type,
  primary_color, secondary_color, address_city, address_state,
  website, instagram, facebook
FROM public.companies
WHERE vitrine_enabled = true AND public_slug IS NOT NULL
ON CONFLICT (id) DO NOTHING;
