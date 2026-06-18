CREATE TABLE IF NOT EXISTS public.demo_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.demo_leads(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  plan_interest text,
  source_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.demo_survey_responses TO anon;
GRANT INSERT ON public.demo_survey_responses TO authenticated;
GRANT ALL ON public.demo_survey_responses TO service_role;

ALTER TABLE public.demo_survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a demo survey response"
  ON public.demo_survey_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can read demo survey responses"
  ON public.demo_survey_responses
  FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_demo_survey_responses_created ON public.demo_survey_responses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_survey_responses_lead ON public.demo_survey_responses (lead_id);