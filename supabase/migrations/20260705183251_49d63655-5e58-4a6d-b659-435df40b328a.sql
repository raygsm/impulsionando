-- 1) Backfill: habilitar vitrine para parceiros reais já cadastrados.
UPDATE public.companies
   SET vitrine_enabled = true
 WHERE COALESCE(vitrine_enabled, false) = false
   AND public_slug IS NOT NULL
   AND public_slug NOT IN ('impulsionando','core','impulsionando-brasil','impulsionando-sistemas','relacionamento')
   AND name NOT ILIKE '%E2E%'
   AND name NOT ILIKE 'Demo %'
   AND name NOT ILIKE '%arquivad%'
   AND name NOT ILIKE '%legado%';

-- 2) Trigger: auto-publicar novos parceiros na vitrine ao ganharem public_slug.
CREATE OR REPLACE FUNCTION public.auto_enable_vitrine_for_partners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.public_slug IS NOT NULL
     AND NEW.public_slug NOT IN ('impulsionando','core','impulsionando-brasil','impulsionando-sistemas','relacionamento')
     AND NEW.name NOT ILIKE '%E2E%'
     AND NEW.name NOT ILIKE 'Demo %'
     AND NEW.name NOT ILIKE '%arquivad%'
     AND NEW.name NOT ILIKE '%legado%'
  THEN
    IF TG_OP = 'INSERT' AND COALESCE(NEW.vitrine_enabled, false) = false THEN
      NEW.vitrine_enabled := true;
    ELSIF TG_OP = 'UPDATE'
       AND (OLD.public_slug IS NULL OR OLD.public_slug = '')
       AND COALESCE(NEW.vitrine_enabled, false) = false
    THEN
      NEW.vitrine_enabled := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_enable_vitrine_for_partners ON public.companies;
CREATE TRIGGER trg_auto_enable_vitrine_for_partners
BEFORE INSERT OR UPDATE OF public_slug, name ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.auto_enable_vitrine_for_partners();