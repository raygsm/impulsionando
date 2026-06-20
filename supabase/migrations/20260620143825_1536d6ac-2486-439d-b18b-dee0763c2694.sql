ALTER TABLE public.realestate_owners ADD COLUMN IF NOT EXISTS portal_token uuid UNIQUE DEFAULT gen_random_uuid();
UPDATE public.realestate_owners SET portal_token = gen_random_uuid() WHERE portal_token IS NULL;
CREATE INDEX IF NOT EXISTS idx_realestate_owners_portal_token ON public.realestate_owners(portal_token);