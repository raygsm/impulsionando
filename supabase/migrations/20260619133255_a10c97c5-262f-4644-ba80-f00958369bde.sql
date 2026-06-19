CREATE OR REPLACE FUNCTION public.tg_companies_validate_status()
RETURNS TRIGGER
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
     AND NEW.status_financial NOT IN ('adimplente','a_vencer','inadimplente','suspensa','cortesia') THEN
    RAISE EXCEPTION 'status_financial inválido: %', NEW.status_financial USING ERRCODE = '22023';
  END IF;
  IF NEW.status_technical IS NOT NULL
     AND NEW.status_technical NOT IN ('configuracao','testes','operacional','atualizacao','migracao') THEN
    RAISE EXCEPTION 'status_technical inválido: %', NEW.status_technical USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;