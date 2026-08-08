
-- 1) Tipo de empresa (estende valores possíveis)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS company_kind text;

-- 2) Status estruturados (separados do "status" textual antigo)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS status_commercial text,
  ADD COLUMN IF NOT EXISTS status_financial text,
  ADD COLUMN IF NOT EXISTS status_technical text;

-- 3) Backfill
UPDATE public.companies SET
  company_kind = CASE
    WHEN is_master THEN 'interna'
    WHEN COALESCE(is_demo, false) THEN 'demo'
    ELSE 'real'
  END
WHERE company_kind IS NULL;

UPDATE public.companies SET
  status_commercial = CASE
    WHEN COALESCE(is_active, true) THEN 'ativa'
    ELSE 'pausada'
  END
WHERE status_commercial IS NULL;

UPDATE public.companies
  SET status_financial = 'adimplente'
WHERE status_financial IS NULL;

UPDATE public.companies
  SET status_technical = 'operacional'
WHERE status_technical IS NULL;

-- 4) Validação via trigger (evita CHECKs imutáveis e permite evoluir lista no futuro)
CREATE OR REPLACE FUNCTION public.tg_companies_validate_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.company_kind IS NOT NULL
     AND NEW.company_kind NOT IN ('real','demo','sandbox','interna') THEN
    RAISE EXCEPTION 'company_kind inválido: %', NEW.company_kind USING ERRCODE = '22023';
  END IF;
  IF NEW.status_commercial IS NOT NULL
     AND NEW.status_commercial NOT IN ('lead','proposta','contratada','implantacao','ativa','pausada','cancelada') THEN
    RAISE EXCEPTION 'status_commercial inválido: %', NEW.status_commercial USING ERRCODE = '22023';
  END IF;
  IF NEW.status_financial IS NOT NULL
     AND NEW.status_financial NOT IN ('adimplente','a_vencer','inadimplente','suspensa') THEN
    RAISE EXCEPTION 'status_financial inválido: %', NEW.status_financial USING ERRCODE = '22023';
  END IF;
  IF NEW.status_technical IS NOT NULL
     AND NEW.status_technical NOT IN ('configuracao','testes','operacional','atualizacao','migracao') THEN
    RAISE EXCEPTION 'status_technical inválido: %', NEW.status_technical USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_validate_status ON public.companies;
CREATE TRIGGER trg_companies_validate_status
BEFORE INSERT OR UPDATE OF company_kind, status_commercial, status_financial, status_technical
ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_companies_validate_status();

-- 5) Índices para filtros do painel de Empresas
CREATE INDEX IF NOT EXISTS idx_companies_company_kind ON public.companies(company_kind);
CREATE INDEX IF NOT EXISTS idx_companies_status_commercial ON public.companies(status_commercial);
