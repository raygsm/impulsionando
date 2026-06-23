
-- Hardening: insert events somente quando usuário tem acesso ao ticket
DROP POLICY IF EXISTS "events insert authenticated" ON public.support_ticket_events;
CREATE POLICY "events insert scoped" ON public.support_ticket_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_ticket_events.ticket_id
        AND (
          t.company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
          OR t.requester_user_id = auth.uid()
          OR t.consumer_user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- pg_cron: rodar a cada 5 minutos
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE existing int;
BEGIN
  SELECT COUNT(*) INTO existing FROM cron.job WHERE jobname = 'support-tick';
  IF existing > 0 THEN
    PERFORM cron.unschedule('support-tick');
  END IF;
END $$;

SELECT cron.schedule(
  'support-tick',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://impulsionando.lovable.app/api/public/cron/support-tick',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXd2bGhzZmR0enRrYm5jbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjQ3MzEsImV4cCI6MjA5NjA0MDczMX0.Buo6dQXlBMqMWQe8-0-mnESAz8Vu4dNCKWyzts6N4aI"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  );
  $$
);
