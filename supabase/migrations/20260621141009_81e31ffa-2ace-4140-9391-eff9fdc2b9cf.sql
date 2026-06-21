UPDATE public.companies_migration_log
SET status='skipped',
    notes='Cliente/projeto novo — sem dados legados para importar. Onboarding finalizado.',
    updated_at=now()
WHERE company_id='32112319-058c-4c32-98c0-57968dcfa9f6'
  AND step='data_export_pending';

INSERT INTO public.runtime_events (level, scope, message, context, company_id)
VALUES (
  'info',
  'tenant.marocas',
  'Onboarding Marocas finalizado — cliente novo sem dados legados',
  jsonb_build_object('data_export','skipped','reason','novo cliente'),
  '32112319-058c-4c32-98c0-57968dcfa9f6'
);