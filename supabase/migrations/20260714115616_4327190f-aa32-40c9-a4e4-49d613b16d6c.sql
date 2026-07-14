
UPDATE public.mpago_credentials
SET active = false,
    access_token_secret_name = format('mpago:%s:production:access_token', company_id),
    webhook_secret_name = format('mpago:%s:production:webhook_secret', company_id),
    updated_at = now()
WHERE company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'
  AND environment = 'production';

INSERT INTO public.audit_logs (company_id, action, entity, entity_id, metadata, category, severity)
VALUES (
  '642096b5-a9ff-4521-a82a-c004f6d2e2d2',
  'mpago_credentials.production.rollback',
  'mpago_credentials',
  '642096b5-a9ff-4521-a82a-c004f6d2e2d2',
  jsonb_build_object(
    'reason','vault_empty_after_add_secret',
    'note','add_secret grava em Edge Function env; app le core_secret_values via save_mpago_credentials',
    'next_step','usuario deve preencher form em /admin/clientes/chrismed/mercado-pago'
  ),
  'billing',
  'warning'
);
