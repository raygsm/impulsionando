
-- Idempotência forte: um comprovante por par (reference_type, reference_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clube_receipts_ref_unique
  ON public.clube_receipts(reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- Status amigável dos comprovantes
ALTER TABLE public.clube_receipts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available';

-- Recria o gatilho com validações, tratamento de erro e status correto
CREATE OR REPLACE FUNCTION public.clube_after_pix_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid;
  v_status text := 'available';
BEGIN
  -- Dispara apenas em transição para 'paid'
  IF NEW.status IS DISTINCT FROM 'paid' OR OLD.status IS NOT DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;
  IF NEW.contract_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve membro a partir do contrato/assinatura
  SELECT user_id INTO v_user
  FROM public.consumer_memberships
  WHERE id = NEW.contract_id
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE NOTICE 'clube_after_pix_paid: membership % sem user_id', NEW.contract_id;
    RETURN NEW;
  END IF;

  -- Sem URL → comprovante pendente
  IF NEW.receipt_url IS NULL OR length(trim(NEW.receipt_url)) = 0 THEN
    v_status := 'pending_upload';
  END IF;

  BEGIN
    INSERT INTO public.clube_receipts(
      user_id, kind, reference_type, reference_id,
      title, amount_cents, receipt_url, issued_at, status, meta
    )
    VALUES (
      v_user, 'pix', 'billing_pix_charges', NEW.id,
      'Comprovante Pix - ' || COALESCE(NEW.plan_code, 'plano'),
      COALESCE(NEW.unique_amount_cents, 0),
      NEW.receipt_url,
      COALESCE(NEW.paid_at, now()),
      v_status,
      jsonb_build_object('txid', NEW.txid, 'payer_name', NEW.payer_name, 'plan_code', NEW.plan_code)
    )
    ON CONFLICT (reference_type, reference_id) WHERE reference_id IS NOT NULL DO UPDATE
      SET receipt_url = COALESCE(EXCLUDED.receipt_url, public.clube_receipts.receipt_url),
          amount_cents = EXCLUDED.amount_cents,
          status = CASE
            WHEN EXCLUDED.receipt_url IS NOT NULL AND length(trim(EXCLUDED.receipt_url)) > 0 THEN 'available'
            ELSE public.clube_receipts.status
          END,
          meta = public.clube_receipts.meta || EXCLUDED.meta;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'clube_after_pix_paid: falha ao gravar comprovante para charge %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
