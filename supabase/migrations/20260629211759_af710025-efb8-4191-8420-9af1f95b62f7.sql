
CREATE TABLE IF NOT EXISTS public.core_maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL DEFAULT 'platform',
  url TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT core_maintenance_windows_time_chk CHECK (ends_at > starts_at),
  CONSTRAINT core_maintenance_windows_status_chk CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  CONSTRAINT core_maintenance_windows_sev_chk CHECK (severity IN ('info','minor','major'))
);

CREATE INDEX IF NOT EXISTS core_maintenance_windows_starts_idx ON public.core_maintenance_windows(starts_at DESC);
CREATE INDEX IF NOT EXISTS core_maintenance_windows_status_idx ON public.core_maintenance_windows(status);

GRANT SELECT ON public.core_maintenance_windows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_maintenance_windows TO authenticated;
GRANT ALL ON public.core_maintenance_windows TO service_role;

ALTER TABLE public.core_maintenance_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read published maintenance" ON public.core_maintenance_windows;
CREATE POLICY "public can read published maintenance"
ON public.core_maintenance_windows
FOR SELECT
TO anon, authenticated
USING (published = true);

DROP POLICY IF EXISTS "admins manage maintenance" ON public.core_maintenance_windows;
CREATE POLICY "admins manage maintenance"
ON public.core_maintenance_windows
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.core_maintenance_windows_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS core_maintenance_windows_touch_trg ON public.core_maintenance_windows;
CREATE TRIGGER core_maintenance_windows_touch_trg
BEFORE UPDATE ON public.core_maintenance_windows
FOR EACH ROW EXECUTE FUNCTION public.core_maintenance_windows_touch();
