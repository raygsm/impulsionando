-- 1. Enum
DO $$ BEGIN
  CREATE TYPE public.realestate_approval_status AS ENUM ('pending', 'approved', 'changes_requested', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Columns on properties
ALTER TABLE public.realestate_properties
  ADD COLUMN IF NOT EXISTS approval_status public.realestate_approval_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text;

-- Backfill existing rows: already approved
UPDATE public.realestate_properties SET approval_status='approved' WHERE approval_status IS NULL;

-- 3. Approval history
CREATE TABLE IF NOT EXISTS public.realestate_property_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.realestate_properties(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('submitted','approved','rejected','changes_requested')),
  actor_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_realestate_property_reviews_property ON public.realestate_property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_realestate_property_reviews_company ON public.realestate_property_reviews(company_id);

GRANT SELECT, INSERT ON public.realestate_property_reviews TO authenticated;
GRANT ALL ON public.realestate_property_reviews TO service_role;

ALTER TABLE public.realestate_property_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rev_read" ON public.realestate_property_reviews FOR SELECT
USING (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'realestate.property.read')));

CREATE POLICY "rev_write" ON public.realestate_property_reviews FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'realestate.property.write')));

-- 4. New permission
INSERT INTO public.permissions(code, module, description)
VALUES ('realestate.property.approve','imobiliaria','Aprovar/rejeitar imóveis na carteira')
ON CONFLICT (code) DO NOTHING;

-- 5. Index on approval_status for queue queries
CREATE INDEX IF NOT EXISTS idx_realestate_properties_approval ON public.realestate_properties(company_id, approval_status);
