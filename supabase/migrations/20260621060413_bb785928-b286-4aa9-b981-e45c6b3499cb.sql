-- Habilita realtime para fila ao vivo do salão de restaurante e slots de agenda
ALTER TABLE public.sales_order_items REPLICA IDENTITY FULL;
ALTER TABLE public.restaurant_table_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.agenda_appointments REPLICA IDENTITY FULL;
ALTER TABLE public.inv_movements REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_order_items; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_table_sessions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.agenda_appointments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.inv_movements; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;