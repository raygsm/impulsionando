
UPDATE public.mpago_credentials
SET access_token_secret_name = 'MPAGO_CHRISMED_ACCESS_TOKEN_PROD',
    webhook_secret_name = 'MPAGO_CHRISMED_WEBHOOK_SECRET_PROD',
    active = true,
    updated_at = now()
WHERE company_id = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'
  AND environment = 'production';

INSERT INTO public.audit_logs (company_id, action, entity, entity_id, metadata, category, severity)
VALUES (
  '642096b5-a9ff-4521-a82a-c004f6d2e2d2',
  'mpago_credentials.production.activate',
  'mpago_credentials',
  '642096b5-a9ff-4521-a82a-c004f6d2e2d2',
  jsonb_build_object(
    'environment','production',
    'access_token_secret_name','MPAGO_CHRISMED_ACCESS_TOKEN_PROD',
    'webhook_secret_name','MPAGO_CHRISMED_WEBHOOK_SECRET_PROD',
    'active', true,
    'source','lovable_agent_wave_H3'
  ),
  'billing',
  'notice'
);
