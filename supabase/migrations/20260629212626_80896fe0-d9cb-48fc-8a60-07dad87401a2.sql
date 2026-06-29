CREATE TABLE IF NOT EXISTS public.core_incident_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.core_incidents(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('investigating','identified','monitoring','resolved','update')),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS core_incident_updates_incident_idx
  ON public.core_incident_updates(incident_id, created_at DESC);

GRANT SELECT ON public.core_incident_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_incident_updates TO authenticated;
GRANT ALL ON public.core_incident_updates TO service_role;

ALTER TABLE public.core_incident_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read incident updates"
  ON public.core_incident_updates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage incident updates"
  ON public.core_incident_updates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));