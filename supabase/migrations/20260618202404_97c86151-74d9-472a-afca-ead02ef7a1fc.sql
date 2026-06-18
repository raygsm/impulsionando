
CREATE TABLE IF NOT EXISTS public.mp_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.mp_orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  notes text,
  actor_user_id uuid REFERENCES auth.users(id),
  actor_display_name text,
  actor_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mp_order_events_order ON public.mp_order_events(order_id, created_at);

GRANT SELECT, INSERT ON public.mp_order_events TO authenticated;
GRANT ALL ON public.mp_order_events TO service_role;

ALTER TABLE public.mp_order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_can_read_order_events" ON public.mp_order_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mp_orders o
      LEFT JOIN public.mp_suppliers s ON s.id = o.supplier_id
      LEFT JOIN public.mp_buyers b ON b.id = o.buyer_id
      WHERE o.id = mp_order_events.order_id
        AND (
          public.mp_user_in_company(auth.uid(), s.company_id)
          OR public.mp_user_in_company(auth.uid(), b.company_id)
        )
    )
  );

CREATE POLICY "members_can_insert_order_events" ON public.mp_order_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mp_orders o
      LEFT JOIN public.mp_suppliers s ON s.id = o.supplier_id
      LEFT JOIN public.mp_buyers b ON b.id = o.buyer_id
      WHERE o.id = mp_order_events.order_id
        AND (
          public.mp_user_in_company(auth.uid(), s.company_id)
          OR public.mp_user_in_company(auth.uid(), b.company_id)
        )
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.mp_order_events;
