
ALTER TABLE public.realestate_property_reviews
  ADD COLUMN IF NOT EXISTS previous_status text,
  ADD COLUMN IF NOT EXISTS new_status text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_realestate_property_reviews_action
  ON public.realestate_property_reviews(action);
CREATE INDEX IF NOT EXISTS idx_realestate_property_reviews_actor
  ON public.realestate_property_reviews(actor_id);
