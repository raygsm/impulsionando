DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'maintenance_notifier_tick') THEN
    PERFORM cron.unschedule('maintenance_notifier_tick');
  END IF;
END $$;

SELECT cron.schedule(
  'maintenance_notifier_tick',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/maintenance-notifier',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXd2bGhzZmR0enRrYm5jbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjQ3MzEsImV4cCI6MjA5NjA0MDczMX0.Buo6dQXlBMqMWQe8-0-mnESAz8Vu4dNCKWyzts6N4aI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);