
DO $$
DECLARE
  v_url text;
  v_existing int;
BEGIN
  SELECT value INTO v_url FROM public.core_settings WHERE key = 'public_base_url' LIMIT 1;
  IF v_url IS NULL THEN
    v_url := 'https://impulsionando.lovable.app';
  END IF;

  SELECT count(*) INTO v_existing FROM cron.job WHERE jobname = 'postmortem_actions_tick';
  IF v_existing > 0 THEN PERFORM cron.unschedule('postmortem_actions_tick'); END IF;

  PERFORM cron.schedule(
    'postmortem_actions_tick',
    '17 */6 * * *',
    format($f$select net.http_post(url:=%L, headers:='{"content-type":"application/json"}'::jsonb, body:='{}'::jsonb) as request_id;$f$, v_url || '/api/public/hooks/postmortem-actions')
  );
END $$;

INSERT INTO public.core_admin_menu
  (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, enabled)
SELECT
  'impulsionando', 'seguranca_governanca', 'Segurança & Governança', 4,
  'postmortem_actions', 'Ações de Postmortem', 95,
  '/admin/postmortems', 'ListChecks', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_admin_menu
  WHERE route = '/admin/postmortems' AND item_key = 'postmortem_actions'
);
