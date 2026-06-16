
CREATE TABLE public.core_export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('csv','pdf')),
  scope text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX core_export_logs_user_idx ON public.core_export_logs(user_id, created_at DESC);
CREATE INDEX core_export_logs_scope_idx ON public.core_export_logs(scope, created_at DESC);

GRANT SELECT, INSERT ON public.core_export_logs TO authenticated;
GRANT ALL ON public.core_export_logs TO service_role;

ALTER TABLE public.core_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY cel_select ON public.core_export_logs FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()) OR user_id = auth.uid());

CREATE POLICY cel_insert ON public.core_export_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
