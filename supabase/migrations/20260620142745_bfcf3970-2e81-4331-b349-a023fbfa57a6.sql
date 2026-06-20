CREATE TABLE public.realestate_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  document text,
  document_type text CHECK (document_type IN ('cpf','cnpj')),
  email text,
  phone text,
  whatsapp text,
  address jsonb,
  bank_account jsonb,
  notes text,
  preferred_contact text CHECK (preferred_contact IN ('whatsapp','email','phone')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  portal_invited_at timestamptz,
  portal_last_login_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, document)
);

CREATE INDEX idx_realestate_owners_company ON public.realestate_owners(company_id);
CREATE INDEX idx_realestate_owners_user ON public.realestate_owners(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_realestate_owners_status ON public.realestate_owners(company_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realestate_owners TO authenticated;
GRANT ALL ON public.realestate_owners TO service_role;

ALTER TABLE public.realestate_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members read owners"
ON public.realestate_owners FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = realestate_owners.company_id
      AND ur.role IN ('admin','gestor','operador')
  )
);

CREATE POLICY "company members write owners"
ON public.realestate_owners FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = realestate_owners.company_id
      AND ur.role IN ('admin','gestor')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = realestate_owners.company_id
      AND ur.role IN ('admin','gestor')
  )
);

CREATE POLICY "owner reads own record"
ON public.realestate_owners FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.realestate_owners_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_realestate_owners_touch
BEFORE UPDATE ON public.realestate_owners
FOR EACH ROW EXECUTE FUNCTION public.realestate_owners_touch();

ALTER TABLE public.realestate_properties
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.realestate_owners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_realestate_properties_owner
  ON public.realestate_properties(owner_id) WHERE owner_id IS NOT NULL;