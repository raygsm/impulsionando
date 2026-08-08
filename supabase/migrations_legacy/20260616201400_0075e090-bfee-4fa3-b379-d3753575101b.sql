
-- 1) Bloquear auto-escalação em user_permission_overrides
CREATE OR REPLACE FUNCTION public.tg_block_self_permission_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- service_role / migrações: sem auth.uid()
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  -- Super admin pode tudo
  IF public.is_super_admin(auth.uid()) THEN RETURN NEW; END IF;
  -- Ninguém pode conceder/alterar override para si mesmo
  IF NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Usuários não podem conceder ou alterar permissões para si mesmos. Solicite a um Super Admin.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS block_self_permission_grant ON public.user_permission_overrides;
CREATE TRIGGER block_self_permission_grant
  BEFORE INSERT OR UPDATE ON public.user_permission_overrides
  FOR EACH ROW EXECUTE FUNCTION public.tg_block_self_permission_grant();

-- Também impedir auto-DELETE de overrides de denial pelo próprio usuário
CREATE OR REPLACE FUNCTION public.tg_block_self_permission_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN OLD; END IF;
  IF public.is_super_admin(auth.uid()) THEN RETURN OLD; END IF;
  IF OLD.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Usuários não podem remover suas próprias permissões.'
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS block_self_permission_delete ON public.user_permission_overrides;
CREATE TRIGGER block_self_permission_delete
  BEFORE DELETE ON public.user_permission_overrides
  FOR EACH ROW EXECUTE FUNCTION public.tg_block_self_permission_delete();

-- 2) aff_crm_events: apenas staff Impulsionando + gestores com permissão (sem path para afiliado ler PII)
DROP POLICY IF EXISTS aff_crm_events_select ON public.aff_crm_events;
CREATE POLICY aff_crm_events_select ON public.aff_crm_events
  FOR SELECT TO authenticated
  USING (
    public.is_impulsionando_staff(auth.uid())
    OR (
      public.user_belongs_to_company(auth.uid(), company_id)
      AND public.user_has_permission(auth.uid(), company_id, 'aff.crm.read')
    )
  );

-- 3) aff_affiliates: restringir colunas que o próprio afiliado pode atualizar
-- Substituir o UPDATE policy genérico por um que bloqueia mudanças sensíveis (comissões, status, company_id, tier)
CREATE OR REPLACE FUNCTION public.tg_aff_affiliate_protect_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.is_super_admin(auth.uid()) THEN RETURN NEW; END IF;
  -- Se quem está atualizando É o próprio afiliado E não tem permissão de write
  IF NEW.user_id = auth.uid()
     AND NOT public.user_has_permission(auth.uid(), NEW.company_id, 'aff.affiliate.write')
  THEN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.status IS DISTINCT FROM OLD.status
       OR COALESCE(to_jsonb(NEW) -> 'tier', 'null'::jsonb)
          IS DISTINCT FROM COALESCE(to_jsonb(OLD) -> 'tier', 'null'::jsonb)
       OR COALESCE(to_jsonb(NEW) -> 'commission_rate', 'null'::jsonb)
          IS DISTINCT FROM COALESCE(to_jsonb(OLD) -> 'commission_rate', 'null'::jsonb)
       OR COALESCE(to_jsonb(NEW) -> 'commission_percent', 'null'::jsonb)
          IS DISTINCT FROM COALESCE(to_jsonb(OLD) -> 'commission_percent', 'null'::jsonb)
       OR COALESCE(to_jsonb(NEW) -> 'manager_id', 'null'::jsonb)
          IS DISTINCT FROM COALESCE(to_jsonb(OLD) -> 'manager_id', 'null'::jsonb)
    THEN
      RAISE EXCEPTION 'Campos sensíveis (status, comissão, empresa, tier, manager) só podem ser alterados por gestores.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS aff_affiliate_protect_self_update ON public.aff_affiliates;
CREATE TRIGGER aff_affiliate_protect_self_update
  BEFORE UPDATE ON public.aff_affiliates
  FOR EACH ROW EXECUTE FUNCTION public.tg_aff_affiliate_protect_self_update();
