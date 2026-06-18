
-- Add voucher tracking on sellouts
ALTER TABLE public.brewery_sellouts
  ADD COLUMN IF NOT EXISTS voucher_code text,
  ADD COLUMN IF NOT EXISTS coupon_redemptions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.brewery_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS brewery_sellouts_campaign_idx ON public.brewery_sellouts(campaign_id);
CREATE INDEX IF NOT EXISTS brewery_sellouts_voucher_idx ON public.brewery_sellouts(voucher_code) WHERE voucher_code IS NOT NULL;

-- Dispatch log per blast
CREATE TABLE IF NOT EXISTS public.brewery_blasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brewery_brands(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.brewery_campaigns(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email')),
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience_count integer NOT NULL DEFAULT 0,
  enqueued_count integer NOT NULL DEFAULT 0,
  voucher_code text,
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','partial','failed')),
  last_error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brewery_blasts_brand_idx ON public.brewery_blasts(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS brewery_blasts_campaign_idx ON public.brewery_blasts(campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brewery_blasts TO authenticated;
GRANT ALL ON public.brewery_blasts TO service_role;

ALTER TABLE public.brewery_blasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand owner manages blasts"
  ON public.brewery_blasts FOR ALL
  TO authenticated
  USING (public.has_brewery_access(auth.uid(), brand_id))
  WITH CHECK (public.has_brewery_access(auth.uid(), brand_id));

CREATE TRIGGER update_brewery_blasts_updated_at
  BEFORE UPDATE ON public.brewery_blasts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
