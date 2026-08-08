-- Tabela de auditoria das execuções de backup do banco
CREATE TABLE public.core_backup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed')),
  trigger text NOT NULL DEFAULT 'cron' CHECK (trigger IN ('cron','manual')),
  destination text NOT NULL DEFAULT 'pending' CHECK (destination IN ('pending','s3','r2','gcs','supabase_storage','local')),
  storage_key text,
  storage_url text,
  size_bytes bigint,
  tables_count integer,
  rows_count bigint,
  duration_ms integer,
  error_message text,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_core_backup_runs_started_at ON public.core_backup_runs (started_at DESC);
CREATE INDEX idx_core_backup_runs_status ON public.core_backup_runs (status);

GRANT SELECT ON public.core_backup_runs TO authenticated;
GRANT ALL ON public.core_backup_runs TO service_role;

ALTER TABLE public.core_backup_runs ENABLE ROW LEVEL SECURITY;

-- Apenas admin master pode ver logs de backup
CREATE POLICY "Admin master pode ver backups"
  ON public.core_backup_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role gerencia backups"
  ON public.core_backup_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.core_backup_runs IS 'Log auditável de execuções de backup do banco (schema + data) para storage externo';