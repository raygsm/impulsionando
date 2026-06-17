CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$ BEGIN
  PERFORM cron.unschedule('clube-journey-tick-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'clube-journey-tick-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/clube-journey-tick',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXd2bGhzZmR0enRrYm5jbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjQ3MzEsImV4cCI6MjA5NjA0MDczMX0.Buo6dQXlBMqMWQe8-0-mnESAz8Vu4dNCKWyzts6N4aI"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);