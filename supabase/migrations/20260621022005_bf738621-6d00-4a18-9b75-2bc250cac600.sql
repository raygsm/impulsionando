
-- 1. Estender mpago_payments com colunas necessárias ao provisionamento
ALTER TABLE public.mpago_payments
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS modulo_id text,
  ADD COLUMN IF NOT EXISTS plano_id text,
  ADD COLUMN IF NOT EXISTS module_slugs text[],
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS provisioning_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS provisioning_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS provisioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'production';

CREATE INDEX IF NOT EXISTS idx_mpago_payments_user_id ON public.mpago_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_mpago_payments_empresa_id ON public.mpago_payments(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mpago_payments_provisioning_status ON public.mpago_payments(provisioning_status);

-- Política RLS adicional: dono lê o próprio
DO $$ BEGIN
  CREATE POLICY "Owners read own mpago payments"
    ON public.mpago_payments FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Drop da tabela e dependências do InfinitePay
DROP TABLE IF EXISTS public.infinitepay_payments CASCADE;
