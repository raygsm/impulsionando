
ALTER TABLE public.infinitepay_payments
  ADD COLUMN IF NOT EXISTS module_slugs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS provisioning_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS provisioning_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS provisioned_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_ipay_provisioning_status ON public.infinitepay_payments(provisioning_status);
