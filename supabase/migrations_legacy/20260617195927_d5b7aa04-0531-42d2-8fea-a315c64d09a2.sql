
-- 1) Tabela de auditoria do cron
CREATE TABLE IF NOT EXISTS public.clube_cron_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL DEFAULT 'clube-journey-tick',
  status text NOT NULL CHECK (status IN ('success','error','partial')),
  enqueued int NOT NULL DEFAULT 0,
  skipped int NOT NULL DEFAULT 0,
  error_count int NOT NULL DEFAULT 0,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.clube_cron_log TO authenticated;
GRANT ALL ON public.clube_cron_log TO service_role;

ALTER TABLE public.clube_cron_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ccl_admin_select" ON public.clube_cron_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_clube_cron_log_started ON public.clube_cron_log (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_clube_journey_log_step ON public.clube_journey_log (step_id);

-- 2) Atualiza trigger de Pix: notifica quando vira available
CREATE OR REPLACE FUNCTION public.clube_after_pix_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
  v_status text := 'available';
  v_prev_status text;
  v_receipt_id uuid;
  v_was_inserted boolean := false;
BEGIN
  IF NEW.status IS DISTINCT FROM 'paid' OR OLD.status IS NOT DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;
  IF NEW.contract_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user
  FROM public.consumer_memberships WHERE id = NEW.contract_id LIMIT 1;
  IF v_user IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.receipt_url IS NULL OR length(trim(NEW.receipt_url)) = 0 THEN
    v_status := 'pending_upload';
  END IF;

  -- captura status anterior se já existia
  SELECT id, status INTO v_receipt_id, v_prev_status
  FROM public.clube_receipts
  WHERE reference_type = 'billing_pix_charges' AND reference_id = NEW.id
  LIMIT 1;

  IF v_receipt_id IS NULL THEN
    v_was_inserted := true;
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
    RAISE WARNING 'clube_after_pix_paid: %', SQLERRM;
    RETURN NEW;
  END;

  -- Notifica: inserção direta available OU transição pending_upload -> available
  IF (v_was_inserted AND v_status = 'available')
     OR (NOT v_was_inserted AND v_prev_status = 'pending_upload' AND v_status = 'available') THEN
    BEGIN
      INSERT INTO public.notifications(user_id, category, severity, title, message, action_url, action_label)
      VALUES (
        v_user, 'billing', 'success',
        'Comprovante disponível',
        'Seu comprovante Pix já pode ser baixado na aba Comprovantes do Clube.',
        '/clube?tab=receipts', 'Ver comprovante'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'clube_after_pix_paid notif: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
