
CREATE TABLE IF NOT EXISTS public.runtime_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('debug','info','warn','error','fatal')),
  scope text NOT NULL,
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  company_id uuid NULL,
  user_id uuid NULL,
  request_id text NULL,
  route text NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS runtime_events_occurred_at_idx ON public.runtime_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS runtime_events_level_idx ON public.runtime_events (level, occurred_at DESC);
CREATE INDEX IF NOT EXISTS runtime_events_scope_idx ON public.runtime_events (scope, occurred_at DESC);
CREATE INDEX IF NOT EXISTS runtime_events_company_idx ON public.runtime_events (company_id, occurred_at DESC);

GRANT SELECT ON public.runtime_events TO authenticated;
GRANT ALL ON public.runtime_events TO service_role;

ALTER TABLE public.runtime_events ENABLE ROW LEVEL SECURITY;

-- Core admins veem tudo
CREATE POLICY "runtime_events: core admin reads all"
ON public.runtime_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tenant admins/gestores veem apenas eventos da própria empresa
CREATE POLICY "runtime_events: tenant reads own company"
ON public.runtime_events FOR SELECT TO authenticated
USING (
  company_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.company_id = runtime_events.company_id
  )
);

INSERT INTO public.core_menu_items (
  id, label, route, icon, audience, scope, sort_order, is_visible, is_system
) VALUES (
  gen_random_uuid(),
  'Observabilidade',
  '/core/observabilidade',
  'Activity',
  ARRAY['core']::text[],
  'core',
  27,
  true,
  true
)
ON CONFLICT DO NOTHING;
