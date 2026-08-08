ALTER PUBLICATION supabase_realtime ADD TABLE public.inv_products;
ALTER TABLE public.inv_products REPLICA IDENTITY FULL;