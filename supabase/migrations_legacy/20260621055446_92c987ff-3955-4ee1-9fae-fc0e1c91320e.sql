DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'evt_ticket_types',
    'agenda_open_slots',
    'restaurant_tables',
    'restaurant_menu_items',
    'realestate_properties',
    'mp_catalog_items'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  END LOOP;
END $$;