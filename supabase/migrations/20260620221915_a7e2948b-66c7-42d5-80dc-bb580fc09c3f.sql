
-- 1) Vincular eventos a um lote consolidado
ALTER TABLE public.core_payout_events
  ADD COLUMN IF NOT EXISTS ledger_id UUID
    REFERENCES public.core_payout_ledger(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS core_payout_events_ledger_idx
  ON public.core_payout_events(ledger_id) WHERE ledger_id IS NOT NULL;

-- Permitir status 'consolidated' nos eventos
ALTER TABLE public.core_payout_events DROP CONSTRAINT IF EXISTS core_payout_events_status_check;
ALTER TABLE public.core_payout_events ADD CONSTRAINT core_payout_events_status_check
  CHECK (status IN ('pending','approved','consolidated','refunded','chargeback','cancelled','failed'));

-- 2) Ampliar status do ledger e adicionar campos operacionais
ALTER TABLE public.core_payout_ledger DROP CONSTRAINT IF EXISTS core_payout_ledger_status_check;
ALTER TABLE public.core_payout_ledger ADD CONSTRAINT core_payout_ledger_status_check
  CHECK (status IN ('scheduled','pending','processing','paid','retained','failed','cancelled'));

ALTER TABLE public.core_payout_ledger
  ADD COLUMN IF NOT EXISTS retention_reason TEXT,
  ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marked_paid_at TIMESTAMPTZ;

-- 3) Idempotência: 1 lote por (empresa, período)
CREATE UNIQUE INDEX IF NOT EXISTS core_payout_ledger_company_period_uniq
  ON public.core_payout_ledger(company_id, period_start, period_end);
