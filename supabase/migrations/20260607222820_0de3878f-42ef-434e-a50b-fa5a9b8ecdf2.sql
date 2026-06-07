ALTER TABLE public.ai_project_generations
  ADD COLUMN IF NOT EXISTS provisioning_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS provisioning_started_at timestamptz;