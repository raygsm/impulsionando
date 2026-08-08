CREATE OR REPLACE FUNCTION public.tg_block_master_profile_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _is_master boolean;
BEGIN
  SELECT is_master_profile INTO _is_master FROM public.profiles WHERE id = NEW.profile_id;
  -- Service role / contextos sem usuário autenticado (migrações, seeds, testes) são permitidos
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF _is_master AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode atribuir perfis master';
  END IF;
  RETURN NEW;
END $function$;