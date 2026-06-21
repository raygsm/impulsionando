-- Fix do gatilho (comparação por texto evita erro quando enum não tem 'super_admin')
CREATE OR REPLACE FUNCTION public.enforce_single_super_admin_master()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE existing_count INT;
BEGIN
  IF NEW.role::text = 'super_admin' THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.user_roles
    WHERE role::text = 'super_admin' AND user_id <> NEW.user_id;
    IF existing_count >= 1 THEN
      RAISE EXCEPTION 'SUPER_ADMIN_MASTER unico: ja existe um super_admin no sistema. Revogue o anterior antes de promover outro.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DO $$
DECLARE
  v_user uuid;
  v_super_profile uuid := '6fbbb7e6-01ae-447f-bd66-85aeba9f54c4';
  v_master_company uuid := 'eb102fc8-5575-4c71-91dc-3ed48be9b353';
BEGIN
  SELECT id INTO v_user FROM auth.users WHERE email='raygs@hotmail.com';
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'usuário raygs@hotmail.com não encontrado em auth.users — peça para criar a conta antes';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=v_user AND role='admin' AND company_id IS NULL) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user, 'admin');
  END IF;

  INSERT INTO public.user_profiles (user_id, company_id, profile_id, is_active, display_name, email)
  VALUES (v_user, v_master_company, v_super_profile, true, 'Ray (Super Admin)', 'raygs@hotmail.com')
  ON CONFLICT (user_id, company_id, profile_id) DO UPDATE SET is_active=true, updated_at=now();

  INSERT INTO public.runtime_events (level, scope, message, context, user_id)
  VALUES (
    'info','core.governance',
    'Acesso pleno concedido: raygs@hotmail.com → admin global + Super Admin Impulsionando',
    jsonb_build_object('reason','administrador geral, pleno, indeterminado'),
    v_user
  );
END $$;