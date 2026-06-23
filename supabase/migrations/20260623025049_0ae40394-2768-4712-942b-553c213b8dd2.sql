-- Provisiona Rogério Junqueira (riotrade@hotmail.com) como admin master Impulsionando
DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email = 'riotrade@hotmail.com' LIMIT 1;

  IF v_existing IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'riotrade@hotmail.com',
      crypt('Impulsionando@2026', gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('full_name','Rogério Junqueira'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email','riotrade@hotmail.com','email_verified', true),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  ELSE
    v_user_id := v_existing;
    UPDATE auth.users
       SET encrypted_password = crypt('Impulsionando@2026', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now(),
           raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
                                || jsonb_build_object('full_name','Rogério Junqueira')
     WHERE id = v_user_id;
  END IF;

  -- Garante papel admin (idempotente sem ON CONFLICT por causa de company_id NULL)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = v_user_id AND role = 'admin'::app_role AND company_id IS NULL
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin'::app_role);
  END IF;
END $$;