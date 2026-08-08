
CREATE TABLE public.admin_dedupe_thresholds (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  min_pct NUMERIC(5,2) NOT NULL DEFAULT 5 CHECK (min_pct >= 0 AND min_pct <= 100),
  max_pct NUMERIC(5,2) NOT NULL DEFAULT 40 CHECK (max_pct >= 0 AND max_pct <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_dedupe_thresholds TO authenticated;
GRANT ALL ON public.admin_dedupe_thresholds TO service_role;

ALTER TABLE public.admin_dedupe_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dedupe thresholds"
ON public.admin_dedupe_thresholds
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all dedupe thresholds"
ON public.admin_dedupe_thresholds
FOR SELECT
TO authenticated
USING (public.is_impulsionando_staff(auth.uid()));

CREATE TABLE public.dedupe_threshold_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dedupe_pct NUMERIC(5,2) NOT NULL,
  min_pct NUMERIC(5,2) NOT NULL,
  max_pct NUMERIC(5,2) NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('below','normal','above')),
  prev_state TEXT CHECK (prev_state IN ('below','normal','above')),
  days_window INT NOT NULL,
  samples INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.dedupe_threshold_events TO authenticated;
GRANT ALL ON public.dedupe_threshold_events TO service_role;

ALTER TABLE public.dedupe_threshold_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read dedupe threshold events"
ON public.dedupe_threshold_events
FOR SELECT
TO authenticated
USING (public.is_impulsionando_staff(auth.uid()));

CREATE POLICY "Staff insert dedupe threshold events"
ON public.dedupe_threshold_events
FOR INSERT
TO authenticated
WITH CHECK (public.is_impulsionando_staff(auth.uid()) AND auth.uid() = user_id);

CREATE INDEX idx_dedupe_threshold_events_created_at ON public.dedupe_threshold_events (created_at DESC);
CREATE INDEX idx_dedupe_threshold_events_user ON public.dedupe_threshold_events (user_id, created_at DESC);

CREATE TRIGGER update_admin_dedupe_thresholds_updated_at
BEFORE UPDATE ON public.admin_dedupe_thresholds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
