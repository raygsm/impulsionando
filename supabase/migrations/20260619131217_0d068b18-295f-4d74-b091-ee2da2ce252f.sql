-- 1) Schedules
CREATE TABLE public.marocas_report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL CHECK (period IN ('dia','semana')),
  hour smallint NOT NULL CHECK (hour BETWEEN 0 AND 23),
  weekday smallint CHECK (weekday IS NULL OR weekday BETWEEN 0 AND 6),
  channels text[] NOT NULL DEFAULT ARRAY['cockpit']::text[],
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_report_schedules TO authenticated;
GRANT ALL ON public.marocas_report_schedules TO service_role;
ALTER TABLE public.marocas_report_schedules ENABLE ROW LEVEL SECURITY;

-- 2) Runs (histórico)
CREATE TABLE public.marocas_report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  schedule_id uuid REFERENCES public.marocas_report_schedules(id) ON DELETE SET NULL,
  period text NOT NULL CHECK (period IN ('dia','semana')),
  range_from timestamptz NOT NULL,
  range_to timestamptz NOT NULL,
  channels text[] NOT NULL DEFAULT ARRAY[]::text[],
  status text NOT NULL CHECK (status IN ('success','error','partial')),
  total int NOT NULL DEFAULT 0,
  done int NOT NULL DEFAULT 0,
  late int NOT NULL DEFAULT 0,
  error text,
  triggered_by text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marocas_report_runs TO authenticated;
GRANT ALL ON public.marocas_report_runs TO service_role;
ALTER TABLE public.marocas_report_runs ENABLE ROW LEVEL SECURITY;

-- 3) Trigger updated_at
CREATE OR REPLACE FUNCTION public.marocas_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_marocas_report_schedules_touch
BEFORE UPDATE ON public.marocas_report_schedules
FOR EACH ROW EXECUTE FUNCTION public.marocas_touch_updated_at();

-- 4) Função autorização Marocas
CREATE OR REPLACE FUNCTION public.is_marocas_authorized(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'gestor'::public.app_role);
$$;
GRANT EXECUTE ON FUNCTION public.is_marocas_authorized(uuid) TO authenticated, service_role;

-- 5) Policies schedules
CREATE POLICY "schedules_select_own_or_authorized" ON public.marocas_report_schedules
FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_marocas_authorized(auth.uid())
);
CREATE POLICY "schedules_insert_own" ON public.marocas_report_schedules
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND public.is_marocas_authorized(auth.uid())
);
CREATE POLICY "schedules_update_own" ON public.marocas_report_schedules
FOR UPDATE TO authenticated USING (
  user_id = auth.uid() AND public.is_marocas_authorized(auth.uid())
) WITH CHECK (
  user_id = auth.uid() AND public.is_marocas_authorized(auth.uid())
);
CREATE POLICY "schedules_delete_own" ON public.marocas_report_schedules
FOR DELETE TO authenticated USING (
  user_id = auth.uid() AND public.is_marocas_authorized(auth.uid())
);

-- 6) Policies runs
CREATE POLICY "runs_select_authorized" ON public.marocas_report_runs
FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_marocas_authorized(auth.uid())
);
CREATE POLICY "runs_insert_self" ON public.marocas_report_runs
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND public.is_marocas_authorized(auth.uid())
);