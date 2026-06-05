CREATE OR REPLACE FUNCTION public.tg_notify_marketing_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN
    SELECT DISTINCT up.user_id, up.email, up.display_name
    FROM public.user_profiles up
    JOIN public.profiles p ON p.id = up.profile_id
    WHERE p.is_master_profile = true
      AND up.is_active = true
      AND EXISTS (
        SELECT 1
        FROM auth.users au
        WHERE au.id = up.user_id
      )
  LOOP
    BEGIN
      PERFORM public.notify_user(
        u.user_id, NULL, 'crm', 'info',
        'Novo lead do site (' || NEW.source || ')',
        COALESCE(NEW.name, NEW.email, NEW.phone, 'Sem nome informado'),
        '/marketing/leads', 'Ver leads'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'marketing lead notification failed for user %: %', u.user_id, SQLERRM;
    END;

    BEGIN
      PERFORM public.enqueue_message(
        'marketing_lead_new',
        NULL,
        u.user_id,
        u.email,
        NULL,
        u.display_name,
        jsonb_build_object(
          'lead_name', COALESCE(NEW.name,'Sem nome'),
          'lead_email', COALESCE(NEW.email,''),
          'lead_phone', COALESCE(NEW.phone,''),
          'lead_source', COALESCE(NEW.source,''),
          'lead_message', COALESCE(NEW.message,'')
        ),
        ARRAY['email','in_app']::text[],
        'marketing_lead',
        NEW.id::text
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'marketing lead message enqueue failed for user %: %', u.user_id, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.tg_notify_marketing_lead() FROM PUBLIC, anon, authenticated;