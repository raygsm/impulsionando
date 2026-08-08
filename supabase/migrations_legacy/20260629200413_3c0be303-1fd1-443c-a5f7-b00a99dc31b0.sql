CREATE TABLE IF NOT EXISTS public.core_reliability_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  triggered_score int NOT NULL,
  triggered_grade text NOT NULL,
  n8n_failed int NOT NULL DEFAULT 0,
  webhook_failed int NOT NULL DEFAULT 0,
  open_incidents int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  resolved_score int,
  resolved_grade text,
  resolved_at timestamptz,
  outbox_in_app_id uuid REFERENCES public.message_outbox(id) ON DELETE SET NULL,
  outbox_email_id uuid REFERENCES public.message_outbox(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.core_reliability_alerts TO authenticated;
GRANT ALL ON public.core_reliability_alerts TO service_role;

ALTER TABLE public.core_reliability_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reliability_alerts_staff_read ON public.core_reliability_alerts;
CREATE POLICY reliability_alerts_staff_read ON public.core_reliability_alerts
  FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS core_reliability_alerts_company_idx
  ON public.core_reliability_alerts(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS core_reliability_alerts_open_idx
  ON public.core_reliability_alerts(status) WHERE status = 'open';

CREATE TRIGGER trg_core_reliability_alerts_updated
  BEFORE UPDATE ON public.core_reliability_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.core_admin_menu (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
SELECT 'impulsionando', 'seguranca_governanca', 'Segurança & Governança', 80, 'reliability_alerts', 'Alertas de Confiabilidade', 95, '/admin/reliability-alerts', 'BellRing', 'Alertas automáticos quando o score de um tenant cai abaixo de 70', 'staff', true
WHERE NOT EXISTS (SELECT 1 FROM public.core_admin_menu WHERE route = '/admin/reliability-alerts');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reliability_alerts_tick') THEN
    PERFORM cron.unschedule('reliability_alerts_tick');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'reliability_alerts_tick',
  '*/30 * * * *',
  $$ SELECT net.http_post(
       url := 'https://impulsionando.com.br/api/public/hooks/reliability-alerts',
       headers := jsonb_build_object('Content-Type','application/json'),
       body := jsonb_build_object('source','pg_cron')
     ); $$
);
