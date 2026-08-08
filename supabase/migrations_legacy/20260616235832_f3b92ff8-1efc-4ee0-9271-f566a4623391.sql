DO $$
DECLARE
  pid uuid;
  perm uuid;
  pair record;
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES
      ('gestor-empresa','realestate.property.read'),
      ('gestor-empresa','realestate.property.write'),
      ('gestor-empresa','realestate.property.delete'),
      ('gestor-empresa','realestate.property.approve'),
      ('gestor-empresa','realestate.intent.read'),
      ('gestor-empresa','realestate.intent.write'),
      ('gestor-empresa','realestate.intent.delete'),
      ('gestor-empresa','realestate.match.read'),
      ('gestor-empresa','realestate.match.write'),

      ('admin-unidade','realestate.property.read'),
      ('admin-unidade','realestate.property.write'),
      ('admin-unidade','realestate.property.approve'),
      ('admin-unidade','realestate.intent.read'),
      ('admin-unidade','realestate.intent.write'),
      ('admin-unidade','realestate.match.read'),

      ('admin-impulsionando','realestate.property.read'),
      ('admin-impulsionando','realestate.property.write'),
      ('admin-impulsionando','realestate.property.delete'),
      ('admin-impulsionando','realestate.property.approve'),
      ('admin-impulsionando','realestate.intent.read'),
      ('admin-impulsionando','realestate.intent.write'),
      ('admin-impulsionando','realestate.intent.delete'),
      ('admin-impulsionando','realestate.match.read'),
      ('admin-impulsionando','realestate.match.write'),

      ('profissional','realestate.property.read'),
      ('profissional','realestate.property.write'),
      ('profissional','realestate.intent.read'),
      ('profissional','realestate.intent.write'),
      ('profissional','realestate.match.read'),

      ('recepcao','realestate.property.read'),
      ('recepcao','realestate.intent.read'),
      ('recepcao','realestate.match.read')
    ) AS t(profile_slug, perm_code)
  LOOP
    SELECT id INTO pid FROM public.profiles WHERE slug = pair.profile_slug;
    SELECT id INTO perm FROM public.permissions WHERE code = pair.perm_code;
    IF pid IS NOT NULL AND perm IS NOT NULL THEN
      INSERT INTO public.profile_permissions(profile_id, permission_id)
      VALUES (pid, perm)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;