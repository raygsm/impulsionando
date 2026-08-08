
CREATE TABLE public.admin_dedupe_threshold_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_min_pct NUMERIC(5,2),
  old_max_pct NUMERIC(5,2),
  new_min_pct NUMERIC(5,2) NOT NULL,
  new_max_pct NUMERIC(5,2) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_dedupe_threshold_audit TO authenticated;
GRANT ALL ON public.admin_dedupe_threshold_audit TO service_role;

ALTER TABLE public.admin_dedupe_threshold_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read dedupe threshold audit"
ON public.admin_dedupe_threshold_audit
FOR SELECT
TO authenticated
USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff insert dedupe threshold audit"
ON public.admin_dedupe_threshold_audit
FOR INSERT
TO authenticated
WITH CHECK (public.is_impulsionando_staff(auth.uid()) AND auth.uid() = changed_by);

CREATE INDEX idx_admin_dedupe_threshold_audit_changed_at
  ON public.admin_dedupe_threshold_audit (changed_at DESC);
CREATE INDEX idx_admin_dedupe_threshold_audit_target
  ON public.admin_dedupe_threshold_audit (target_user, changed_at DESC);

ALTER TABLE public.dedupe_threshold_events
  ADD COLUMN IF NOT EXISTS causes JSONB NOT NULL DEFAULT '{}'::jsonb;
