
-- Block affiliates from self-updating financial fields (pix_key / bank_data).
-- Only Impulsionando staff (or users with aff.affiliate.write) may change them.
CREATE OR REPLACE FUNCTION public.tg_aff_affiliates_block_financial_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / migrations / triggers without auth context: allow
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Staff Impulsionando or users with explicit aff.affiliate.write permission may edit
  IF public.is_impulsionando_staff(auth.uid())
     OR public.user_has_permission(auth.uid(), NEW.company_id, 'aff.affiliate.write') THEN
    RETURN NEW;
  END IF;

  IF NEW.pix_key IS DISTINCT FROM OLD.pix_key
     OR NEW.bank_data IS DISTINCT FROM OLD.bank_data THEN
    RAISE EXCEPTION 'Alteração de PIX/dados bancários requer aprovação da equipe Impulsionando';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_aff_affiliates_block_financial_self_update ON public.aff_affiliates;
CREATE TRIGGER tg_aff_affiliates_block_financial_self_update
BEFORE UPDATE ON public.aff_affiliates
FOR EACH ROW
EXECUTE FUNCTION public.tg_aff_affiliates_block_financial_self_update();
