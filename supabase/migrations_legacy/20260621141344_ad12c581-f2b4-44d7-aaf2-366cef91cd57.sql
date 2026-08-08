-- 1. Reagendar pull do CHRISMED (endpoint validado HTTP 200)
DO $$
DECLARE
  v_anon text;
BEGIN
  -- desagenda se já existir (idempotência)
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN ('core-pull-chrismed','core_pull_chrismed');

  PERFORM cron.schedule(
    'core-pull-chrismed',
    '*/5 * * * *',
    $cron$
    SELECT net.http_get(
      url := 'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/core-pull-chrismed',
      headers := jsonb_build_object('apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXd2bGhzZmR0enRrYm5jbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjQ3MzEsImV4cCI6MjA5NjA0MDczMX0.Buo6dQXlBMqMWQe8-0-mnESAz8Vu4dNCKWyzts6N4aI')
    );
    $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cron schedule erro: %', SQLERRM;
END $$;

-- 2. Eventos de go-live
INSERT INTO public.runtime_events (level, scope, message, context)
VALUES
  ('info','core.golive','Core Impulsionando em operação — todos os tenants nativos ativados',
   jsonb_build_object('date', now(), 'tenants', ARRAY['marocas','chrismed','dqa-panini','imobiliaria-garrido','patricia-lenine','relacionamento','wagner-miller'])),
  ('info','core_pull.chrismed','Cron reativado: pull a cada 5min via URL estável de produção',
   jsonb_build_object('schedule','*/5 * * * *','endpoint','/api/public/hooks/core-pull-chrismed'));