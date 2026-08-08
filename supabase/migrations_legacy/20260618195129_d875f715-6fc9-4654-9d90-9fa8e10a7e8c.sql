
-- Phase A: Imobiliária campaigns & blasts
ALTER TABLE public.realestate_search_intents 
  ADD COLUMN IF NOT EXISTS consent_marketing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_blast_at timestamptz;

CREATE TABLE IF NOT EXISTS public.realestate_blasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.realestate_properties(id) ON DELETE SET NULL,
  title text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email')),
  filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  body text NOT NULL,
  audience_count integer NOT NULL DEFAULT 0,
  enqueued_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','completed','failed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realestate_blasts_company ON public.realestate_blasts(company_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_blasts TO authenticated;
GRANT ALL ON public.realestate_blasts TO service_role;

ALTER TABLE public.realestate_blasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realestate_blasts_read" ON public.realestate_blasts
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );

CREATE POLICY "realestate_blasts_write" ON public.realestate_blasts
  FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.write'))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (public.user_belongs_to_company(auth.uid(), company_id)
        AND public.user_has_permission(auth.uid(), company_id, 'realestate.property.write'))
  );

CREATE TRIGGER trg_realestate_blasts_updated_at
  BEFORE UPDATE ON public.realestate_blasts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
