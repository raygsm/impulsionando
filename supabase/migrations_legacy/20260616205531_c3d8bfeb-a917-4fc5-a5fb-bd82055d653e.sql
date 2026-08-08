
DROP VIEW IF EXISTS public.n8n_runs_by_company;
CREATE VIEW public.n8n_runs_by_company
WITH (security_invoker = on) AS
SELECT
  r.tenant_id AS company_id,
  r.regua,
  r.workflow_name,
  r.status,
  date_trunc('day', r.started_at) AS day,
  count(*) AS total,
  count(*) FILTER (WHERE r.status = 'failed') AS failures,
  count(*) FILTER (WHERE r.status = 'ok') AS oks
FROM public.n8n_workflow_runs r
GROUP BY 1,2,3,4,5;
GRANT SELECT ON public.n8n_runs_by_company TO authenticated;
GRANT SELECT ON public.n8n_runs_by_company TO service_role;

REVOKE EXECUTE ON FUNCTION public.evt_checkin_by_qr(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.evt_transfer_ticket(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evt_checkin_by_qr(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.evt_transfer_ticket(uuid, text, text, text, text) TO authenticated;
