
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS longitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS companies_latlng_idx ON public.companies (latitude, longitude);
CREATE INDEX IF NOT EXISTS companies_rating_idx ON public.companies (rating_avg DESC);

ALTER TABLE public.companies_vitrine_public
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_zip text,
  ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS longitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.ecosystem_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

GRANT SELECT ON public.ecosystem_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecosystem_reviews TO authenticated;
GRANT ALL ON public.ecosystem_reviews TO service_role;

ALTER TABLE public.ecosystem_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ecosystem_reviews_public_read" ON public.ecosystem_reviews;
CREATE POLICY "ecosystem_reviews_public_read" ON public.ecosystem_reviews
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ecosystem_reviews_insert_own" ON public.ecosystem_reviews;
CREATE POLICY "ecosystem_reviews_insert_own" ON public.ecosystem_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ecosystem_reviews_update_own" ON public.ecosystem_reviews;
CREATE POLICY "ecosystem_reviews_update_own" ON public.ecosystem_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ecosystem_reviews_delete_own" ON public.ecosystem_reviews;
CREATE POLICY "ecosystem_reviews_delete_own" ON public.ecosystem_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_ecosystem_reviews_updated ON public.ecosystem_reviews;
CREATE TRIGGER trg_ecosystem_reviews_updated
  BEFORE UPDATE ON public.ecosystem_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.recompute_company_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _company uuid;
BEGIN
  _company := COALESCE(NEW.company_id, OLD.company_id);
  UPDATE public.companies c
     SET rating_avg = COALESCE((SELECT ROUND(AVG(stars)::numeric, 2) FROM public.ecosystem_reviews WHERE company_id = _company), 0),
         rating_count = COALESCE((SELECT COUNT(*) FROM public.ecosystem_reviews WHERE company_id = _company), 0)
   WHERE c.id = _company;
  UPDATE public.companies_vitrine_public v
     SET rating_avg = (SELECT rating_avg FROM public.companies WHERE id = _company),
         rating_count = (SELECT rating_count FROM public.companies WHERE id = _company)
   WHERE v.id = _company;
  RETURN NULL;
END$$;

DROP TRIGGER IF EXISTS trg_ecosystem_reviews_recompute ON public.ecosystem_reviews;
CREATE TRIGGER trg_ecosystem_reviews_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.ecosystem_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_company_rating();
