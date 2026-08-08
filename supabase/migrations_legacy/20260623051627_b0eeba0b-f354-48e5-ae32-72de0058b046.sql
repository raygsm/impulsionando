UPDATE public.riomed_n8n_workflows
SET config = jsonb_set(coalesce(config,'{}'::jsonb), '{status}', '"ready"'),
    updated_at = now()
WHERE company_id = '5bdcdef4-f0dc-4453-b935-a192ad514938'
  AND trigger_event IN ('facebook.leadgen','instagram.leadgen','broadcast.scheduled','cron.daily_08h');