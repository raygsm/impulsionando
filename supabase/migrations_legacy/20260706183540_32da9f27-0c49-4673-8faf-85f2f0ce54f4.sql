
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- remove agendamento anterior (idempotente)
DO $$
BEGIN
  PERFORM cron.unschedule('comm-center-tick');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'comm-center-tick',
  '*/1 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://impulsionando.lovable.app/api/public/comm/tick',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXd2bGhzZmR0enRrYm5jbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjQ3MzEsImV4cCI6MjA5NjA0MDczMX0.Buo6dQXlBMqMWQe8-0-mnESAz8Vu4dNCKWyzts6N4aI'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
