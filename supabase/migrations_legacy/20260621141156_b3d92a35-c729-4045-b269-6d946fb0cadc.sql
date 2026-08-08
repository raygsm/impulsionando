-- 1. Dispensar exports pendentes em todos os tenants (sem clientes reais ainda)
UPDATE public.companies_migration_log
SET status='skipped',
    notes='Sem clientes reais com dados legados — onboarding finalizado sem importação.',
    updated_at=now()
WHERE step='data_export_pending' AND status='pending';

-- 2. Desativar cron core-pull-chrismed (projeto cliente ainda não publicado)
DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN ('core-pull-chrismed','core_pull_chrismed');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cron.unschedule skipped: %', SQLERRM;
END $$;

-- 3. CHRISMED → native (mesma regra: cliente novo, sem dados legados)
UPDATE public.companies
SET migration_status='native', updated_at=now()
WHERE public_slug='chrismed';

-- 4. Demais tenants (dqa-panini, imobiliaria-garrido, patricia-lenine, relacionamento, wagner-miller) → native
UPDATE public.companies
SET migration_status='native', updated_at=now()
WHERE public_slug IN ('dqa-panini','imobiliaria-garrido','patricia-lenine','relacionamento','wagner-miller');

-- 5. Arquivar companies de teste E2E
UPDATE public.companies
SET status='archived', is_active=false, updated_at=now()
WHERE (public_slug IS NULL OR public_slug='')
  AND name LIKE '%E2E%'
  AND status<>'archived';

-- 6. Registrar finalização e silenciar alerta antigo de logo Marocas
INSERT INTO public.runtime_events (level, scope, message, context)
VALUES
  ('info','core.onboarding','Ecossistema finalizado: todos os tenants em native, exports dispensados (sem clientes reais)',
   jsonb_build_object('tenants_native', ARRAY['marocas','chrismed','dqa-panini','imobiliaria-garrido','patricia-lenine','relacionamento','wagner-miller'])),
  ('info','core_pull.chrismed','Cron core-pull-chrismed desativado: projeto cliente ainda não publicado, sem fonte para puxar',
   jsonb_build_object('action','unschedule','reason','cliente_novo_nao_publicado')),
  ('info','tenant.marocas','Logo da Marocas já publicado — alerta anterior resolvido',
   jsonb_build_object('resolved_warning','logo_upload_pending'));