-- 1) chrismed_service_offerings: column-level privileges para anon
REVOKE SELECT ON public.chrismed_service_offerings FROM anon;
GRANT SELECT (id, slug, name, description, modality, price_cents, duration_minutes,
              requires_prepayment, refund_window_hours, reschedule_window_hours,
              active, display_order)
  ON public.chrismed_service_offerings TO anon;
COMMENT ON POLICY "Public reads active offerings" ON public.chrismed_service_offerings IS
  'Leitura pública de ofertas ativas; colunas sensíveis (company_id, cid_categories, metadata) bloqueadas por GRANT de coluna para anon.';

-- 2) mp_reminder_settings: leitura só para admins do Core
DROP POLICY IF EXISTS "reminder settings read" ON public.mp_reminder_settings;
CREATE POLICY "mp_reminder_settings: admin reads"
  ON public.mp_reminder_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_impulsionando_staff(auth.uid()));

-- 3) talentos_candidatos: PII só com match engajado (stage != 'novo')
DROP POLICY IF EXISTS "empresas leem candidatos com vinculo" ON public.talentos_candidatos;
CREATE POLICY "empresas leem candidatos com match engajado"
  ON public.talentos_candidatos FOR SELECT TO authenticated
  USING (
    ativo = true
    AND visivel_rede = true
    AND (
      is_impulsionando_staff(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.talentos_matches m
        WHERE m.candidato_id = talentos_candidatos.id
          AND user_belongs_to_company(auth.uid(), m.company_id)
          AND m.stage::text <> 'novo'
      )
    )
  );

-- 4) realtime.messages: default-deny para qualquer logado
DO $$
BEGIN
  EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'realtime.messages: RLS já habilitado ou sem permissão (%).', SQLERRM;
END $$;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "realtime: default deny" ON realtime.messages';
  EXECUTE $POL$
    CREATE POLICY "realtime: default deny" ON realtime.messages
    FOR ALL TO authenticated, anon
    USING (false) WITH CHECK (false)
  $POL$;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'realtime.messages policy: %', SQLERRM;
END $$;

-- 5) Auditoria
INSERT INTO public.runtime_events (level, scope, message, context)
VALUES ('info','core.security',
  'Hardening aplicado: chrismed_service_offerings (colunas anon), mp_reminder_settings (admin), talentos_candidatos (match engajado), realtime.messages (deny default)',
  jsonb_build_object('findings_closed', 4));