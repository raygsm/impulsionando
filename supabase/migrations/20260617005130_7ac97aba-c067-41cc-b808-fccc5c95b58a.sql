CREATE TABLE public.vitrine_export_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  export_id UUID NOT NULL UNIQUE,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  dataset TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  status_filter TEXT,
  search_term TEXT,
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  email_from TIMESTAMPTZ,
  email_to TIMESTAMPTZ,
  total_expected INTEGER,
  total_exported INTEGER NOT NULL DEFAULT 0,
  batches_done INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.vitrine_export_logs TO authenticated;
GRANT ALL ON public.vitrine_export_logs TO service_role;

ALTER TABLE public.vitrine_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company export logs"
  ON public.vitrine_export_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own export logs"
  ON public.vitrine_export_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own export logs"
  ON public.vitrine_export_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_vitrine_export_logs_company ON public.vitrine_export_logs(company_id, created_at DESC);
CREATE INDEX idx_vitrine_export_logs_user ON public.vitrine_export_logs(user_id, created_at DESC);

CREATE TRIGGER update_vitrine_export_logs_updated_at
  BEFORE UPDATE ON public.vitrine_export_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();