
-- ============================================================
-- Sprint 1 — Revisão: triggers de auditoria, updated_at,
-- e endurecimento de RLS contra escalonamento de privilégio.
-- ============================================================

-- 1) Triggers de updated_at em todas as tabelas com a coluna
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema='public' AND column_name='updated_at'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();',
      r.table_name, r.table_name
    );
  END LOOP;
END $$;

-- 2) Triggers de auditoria em tabelas sensíveis
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT unnest(ARRAY[
    'companies','company_units','sectors','user_profiles',
    'company_modules','company_settings','profile_permissions'
  ]) AS t
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS tg_audit_%1$s ON public.%1$s;
       CREATE TRIGGER tg_audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$s
       FOR EACH ROW EXECUTE FUNCTION public.tg_audit();',
      r.t
    );
  END LOOP;
END $$;

-- 3) Endurecer RLS de user_profiles: impedir escalonamento de privilégio.
--    O policy anterior permitia que QUALQUER usuário da empresa inserisse
--    vínculos (inclusive promovendo-se a Super Admin).
DROP POLICY IF EXISTS up_write ON public.user_profiles;

CREATE POLICY up_insert ON public.user_profiles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.user_has_permission(auth.uid(), company_id, 'users.write')
);

CREATE POLICY up_update ON public.user_profiles
FOR UPDATE TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.user_has_permission(auth.uid(), company_id, 'users.write')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.user_has_permission(auth.uid(), company_id, 'users.write')
);

CREATE POLICY up_delete ON public.user_profiles
FOR DELETE TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.user_has_permission(auth.uid(), company_id, 'users.write')
);

-- Bloquear que perfis master (super-admin, suporte, etc.) sejam atribuídos
-- por qualquer um que não seja Super Admin Impulsionando.
CREATE OR REPLACE FUNCTION public.tg_block_master_profile_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _is_master boolean;
BEGIN
  SELECT is_master_profile INTO _is_master FROM public.profiles WHERE id = NEW.profile_id;
  IF _is_master AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode atribuir perfis master';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_block_master_profile_escalation ON public.user_profiles;
CREATE TRIGGER tg_block_master_profile_escalation
BEFORE INSERT OR UPDATE OF profile_id ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_block_master_profile_escalation();
