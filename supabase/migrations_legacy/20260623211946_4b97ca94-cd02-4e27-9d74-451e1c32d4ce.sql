-- Garante acesso master Impulsionando em todas as tabelas riomed_*.
-- Adiciona uma policy FOR ALL idempotente por tabela: super-admin ou staff
-- Impulsionando podem ler/escrever tudo. Policies pré-existentes são preservadas.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname LIKE 'riomed_%'
  LOOP
    -- Garante RLS habilitada
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);

    -- Drop e recria a policy master (idempotente)
    EXECUTE format(
      'DROP POLICY IF EXISTS "impulsionando_master_all_access" ON public.%I',
      r.tbl
    );
    EXECUTE format(
      'CREATE POLICY "impulsionando_master_all_access" ON public.%I
         FOR ALL TO authenticated
         USING (public.is_super_admin(auth.uid()) OR public.is_impulsionando_staff(auth.uid()))
         WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_impulsionando_staff(auth.uid()))',
      r.tbl
    );
  END LOOP;
END;
$$;