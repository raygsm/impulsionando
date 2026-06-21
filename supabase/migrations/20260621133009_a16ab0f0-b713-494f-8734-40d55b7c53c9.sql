-- 1) Novos campos em companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS migration_status text NOT NULL DEFAULT 'native',
  ADD COLUMN IF NOT EXISTS migration_source_project_id text,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS consolidation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS consolidated_at timestamptz,
  ADD COLUMN IF NOT EXISTS service_radius_km integer,
  ADD COLUMN IF NOT EXISTS vitrine_show_external boolean NOT NULL DEFAULT false;

-- Validação de migration_status via trigger (CHECK não permite mudanças futuras facilmente)
CREATE OR REPLACE FUNCTION public.validate_company_migration_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.migration_status NOT IN ('native','pending','in_progress','migrated','archived') THEN
    RAISE EXCEPTION 'migration_status invalido: %', NEW.migration_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_validate_migration_status ON public.companies;
CREATE TRIGGER trg_companies_validate_migration_status
  BEFORE INSERT OR UPDATE OF migration_status ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_migration_status();

-- 2) Log de migração
CREATE TABLE IF NOT EXISTS public.companies_migration_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  step text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  payload jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies_migration_log TO authenticated;
GRANT ALL ON public.companies_migration_log TO service_role;

ALTER TABLE public.companies_migration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff Impulsionando lê log de migração"
  ON public.companies_migration_log FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff Impulsionando insere log de migração"
  ON public.companies_migration_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff Impulsionando atualiza log de migração"
  ON public.companies_migration_log FOR UPDATE
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff Impulsionando remove log de migração"
  ON public.companies_migration_log FOR DELETE
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_companies_migration_log_company ON public.companies_migration_log(company_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_companies_migration_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_migration_log_touch ON public.companies_migration_log;
CREATE TRIGGER trg_companies_migration_log_touch
  BEFORE UPDATE ON public.companies_migration_log
  FOR EACH ROW EXECUTE FUNCTION public.touch_companies_migration_log();

-- 3) Index para busca por CEP/nicho na vitrine
CREATE INDEX IF NOT EXISTS idx_companies_vitrine_lookup
  ON public.companies(niche_id, address_zip)
  WHERE vitrine_enabled = true AND is_active = true;