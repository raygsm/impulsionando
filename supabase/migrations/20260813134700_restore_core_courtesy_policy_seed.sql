ALTER TABLE public.core_courtesy_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_courtesy_events TO authenticated;
GRANT ALL ON public.core_courtesy_events TO service_role;

DROP POLICY IF EXISTS core_courtesy_staff_read ON public.core_courtesy_events;
CREATE POLICY core_courtesy_staff_read
  ON public.core_courtesy_events FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS core_courtesy_staff_write ON public.core_courtesy_events;
CREATE POLICY core_courtesy_staff_write
  ON public.core_courtesy_events FOR ALL TO authenticated
  USING (public.is_impulsionando_staff((SELECT auth.uid())))
  WITH CHECK (public.is_impulsionando_staff((SELECT auth.uid())));

INSERT INTO public.core_settings(key,value,label,description,category)
VALUES ('full_courtesy_days_default','30'::jsonb,'Cortesia Full — dias padrão','Duração padrão aplicada em novas cortesias Full','billing')
ON CONFLICT (key) DO NOTHING;
