
ALTER TABLE public.mp_orders 
  ADD COLUMN IF NOT EXISTS decision_notes text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS invoiced_at timestamptz;

ALTER PUBLICATION supabase_realtime ADD TABLE public.mp_orders;
ALTER TABLE public.mp_orders REPLICA IDENTITY FULL;
