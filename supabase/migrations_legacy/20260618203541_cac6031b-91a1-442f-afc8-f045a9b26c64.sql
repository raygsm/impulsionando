
-- 1) Presets de exportação
CREATE TABLE IF NOT EXISTS public.mp_export_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  format text NOT NULL DEFAULT 'csv' CHECK (format IN ('csv','pdf')),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_run_at timestamptz,
  last_count int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_export_presets TO authenticated;
GRANT ALL ON public.mp_export_presets TO service_role;
ALTER TABLE public.mp_export_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presets owner all" ON public.mp_export_presets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.mp_export_presets_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_mp_export_presets_touch ON public.mp_export_presets;
CREATE TRIGGER trg_mp_export_presets_touch BEFORE UPDATE ON public.mp_export_presets
  FOR EACH ROW EXECUTE FUNCTION public.mp_export_presets_touch();

-- 2) Reminder settings (singleton-ish)
CREATE TABLE IF NOT EXISTS public.mp_reminder_settings (
  id int PRIMARY KEY DEFAULT 1,
  threshold_hours int NOT NULL DEFAULT 24 CHECK (threshold_hours BETWEEN 1 AND 720),
  target_statuses text[] NOT NULL DEFAULT ARRAY['pending_approval','approved','in_production'],
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
GRANT SELECT ON public.mp_reminder_settings TO authenticated;
GRANT ALL ON public.mp_reminder_settings TO service_role;
ALTER TABLE public.mp_reminder_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminder settings read" ON public.mp_reminder_settings
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.mp_reminder_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3) Função para enviar lembretes (evita duplicar usando mp_order_events)
CREATE OR REPLACE FUNCTION public.mp_send_pending_reminders()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s record;
  o record;
  sup_company uuid;
  buy_company uuid;
  sup_name text;
  buy_name text;
  notif_count int := 0;
  order_count int := 0;
BEGIN
  SELECT * INTO s FROM public.mp_reminder_settings WHERE id = 1;
  IF NOT FOUND OR NOT s.active THEN
    RETURN jsonb_build_object('skipped', true);
  END IF;

  FOR o IN
    SELECT mo.id, mo.order_number, mo.status, mo.supplier_id, mo.buyer_id, mo.placed_at,
           EXTRACT(EPOCH FROM (now() - COALESCE(mo.approved_at, mo.placed_at)))/3600 AS hours_pending
    FROM public.mp_orders mo
    WHERE mo.status = ANY(s.target_statuses)
      AND COALESCE(mo.approved_at, mo.placed_at) < now() - (s.threshold_hours || ' hours')::interval
      AND NOT EXISTS (
        SELECT 1 FROM public.mp_order_events e
        WHERE e.order_id = mo.id
          AND e.event_type = 'reminder_sent'
          AND e.created_at > now() - interval '24 hours'
      )
  LOOP
    SELECT company_id, display_name INTO sup_company, sup_name FROM public.mp_suppliers WHERE id = o.supplier_id;
    SELECT company_id, display_name INTO buy_company, buy_name FROM public.mp_buyers WHERE id = o.buyer_id;
    order_count := order_count + 1;

    -- notifica fornecedor
    IF sup_company IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, company_id, category, severity, title, message, action_url)
      SELECT up.user_id, sup_company, 'marketplace', 'warning',
             'Pedido pendente há ' || ROUND(o.hours_pending) || 'h',
             'Pedido #' || o.order_number || ' de ' || COALESCE(buy_name,'comprador') || ' aguarda ação.',
             '/cervejaria/marketplace?order=' || o.id
      FROM public.user_profiles up
      WHERE up.company_id = sup_company AND up.is_active = true;
      GET DIAGNOSTICS notif_count = ROW_COUNT;
    END IF;
    -- notifica comprador
    IF buy_company IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, company_id, category, severity, title, message, action_url)
      SELECT up.user_id, buy_company, 'marketplace', 'info',
             'Pedido ainda pendente',
             'Pedido #' || o.order_number || ' com ' || COALESCE(sup_name,'fornecedor') || ' está ' || o.status || ' há ' || ROUND(o.hours_pending) || 'h.',
             '/bar/marketplace?order=' || o.id
      FROM public.user_profiles up
      WHERE up.company_id = buy_company AND up.is_active = true;
    END IF;

    -- registra evento p/ não duplicar
    INSERT INTO public.mp_order_events (order_id, event_type, notes, actor_role)
    VALUES (o.id, 'reminder_sent',
            'Lembrete automático após ' || ROUND(o.hours_pending) || 'h em ' || o.status, 'system');
  END LOOP;

  RETURN jsonb_build_object('orders_notified', order_count, 'ran_at', now());
END $$;

GRANT EXECUTE ON FUNCTION public.mp_send_pending_reminders() TO service_role;

-- 4) Agenda pg_cron (a cada 30 min)
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mp-pending-reminders') THEN
    PERFORM cron.unschedule('mp-pending-reminders');
  END IF;
  PERFORM cron.schedule(
    'mp-pending-reminders',
    '*/30 * * * *',
    $cron$ SELECT public.mp_send_pending_reminders(); $cron$
  );
END $$;
