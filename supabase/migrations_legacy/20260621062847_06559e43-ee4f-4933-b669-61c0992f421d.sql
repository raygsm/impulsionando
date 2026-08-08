-- Trigger automático: ao baixar fatura, enfileira agradecimento + NPS + cross-sell
-- Fecha o ciclo retenção→expansão sem intervenção humana.
-- Diferencial: nenhum concorrente (Bling/Omie/Asaas/Conta Azul) dispara
-- jornada pós-pagamento integrada com WhatsApp+email+pesquisa+upsell.

CREATE OR REPLACE FUNCTION public.enqueue_post_payment_journey()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_company_name text;
  v_payer_email text;
  v_payer_phone text;
  v_kind text;
  v_amount numeric;
BEGIN
  -- só dispara quando muda para paid
  IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN RETURN NEW; END IF;
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'billing_invoices' THEN
    v_kind := 'erp';
    v_amount := NEW.amount;
    SELECT bc.company_id, c.name, c.contact_email, c.contact_phone
      INTO v_company_id, v_company_name, v_payer_email, v_payer_phone
    FROM billing_contracts bc
    JOIN companies c ON c.id = bc.company_id
    WHERE bc.id = NEW.contract_id;
  ELSIF TG_TABLE_NAME = 'consumer_membership_invoices' THEN
    v_kind := 'consumer';
    v_amount := NEW.amount;
    SELECT cm.company_id, c.name, cp.email, cp.phone
      INTO v_company_id, v_company_name, v_payer_email, v_payer_phone
    FROM consumer_memberships cm
    JOIN companies c ON c.id = cm.company_id
    LEFT JOIN consumer_profiles cp ON cp.id = cm.consumer_id
    WHERE cm.id = NEW.membership_id;
  ELSE
    RETURN NEW;
  END IF;

  IF v_company_id IS NULL THEN RETURN NEW; END IF;

  -- 1) Agradecimento imediato
  INSERT INTO message_outbox (
    company_id, channel, recipient_email, recipient_phone,
    event_code, payload, status, scheduled_at,
    reference_type, reference_id
  )
  SELECT
    v_company_id, ch, v_payer_email, v_payer_phone,
    'payment.thanks',
    jsonb_build_object(
      'company_name', v_company_name,
      'amount', v_amount,
      'kind', v_kind,
      'subject', 'Recebemos seu pagamento — obrigado!',
      'message', 'Obrigado! Confirmamos o recebimento de R$ ' || to_char(v_amount, 'FM999G999G990D00') || '. Seguimos com você na jornada Impulsionando.'
    ),
    'pending', now(),
    v_kind || '_invoice', NEW.id
  FROM (VALUES ('email'), ('whatsapp')) AS ch_t(ch)
  WHERE (ch = 'email' AND v_payer_email IS NOT NULL)
     OR (ch = 'whatsapp' AND v_payer_phone IS NOT NULL);

  -- 2) NPS em D+3
  INSERT INTO message_outbox (
    company_id, channel, recipient_email, recipient_phone,
    event_code, payload, status, scheduled_at,
    reference_type, reference_id
  )
  SELECT
    v_company_id, ch, v_payer_email, v_payer_phone,
    'payment.nps',
    jsonb_build_object(
      'company_name', v_company_name,
      'subject', 'Como foi sua experiência?',
      'message', 'De 0 a 10, o quanto você indicaria a ' || v_company_name || ' para um amigo?'
    ),
    'pending', now() + interval '3 days',
    v_kind || '_invoice', NEW.id
  FROM (VALUES ('email'), ('whatsapp')) AS ch_t(ch)
  WHERE (ch = 'email' AND v_payer_email IS NOT NULL)
     OR (ch = 'whatsapp' AND v_payer_phone IS NOT NULL);

  -- 3) Cross-sell em D+7 (somente ERP — premium tem própria jornada)
  IF v_kind = 'erp' THEN
    INSERT INTO message_outbox (
      company_id, channel, recipient_email, recipient_phone,
      event_code, payload, status, scheduled_at,
      reference_type, reference_id
    )
    SELECT
      v_company_id, ch, v_payer_email, v_payer_phone,
      'payment.upsell',
      jsonb_build_object(
        'company_name', v_company_name,
        'subject', 'Conheça o Clube Premium Impulsionando',
        'message', 'Ative o Clube Premium e ofereça benefícios exclusivos para seus melhores clientes — fidelização automática.'
      ),
      'pending', now() + interval '7 days',
      v_kind || '_invoice', NEW.id
    FROM (VALUES ('email'), ('whatsapp')) AS ch_t(ch)
    WHERE (ch = 'email' AND v_payer_email IS NOT NULL)
       OR (ch = 'whatsapp' AND v_payer_phone IS NOT NULL);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_billing_invoice_paid_journey ON public.billing_invoices;
CREATE TRIGGER trg_billing_invoice_paid_journey
  AFTER UPDATE OF status ON public.billing_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_post_payment_journey();

DROP TRIGGER IF EXISTS trg_consumer_invoice_paid_journey ON public.consumer_membership_invoices;
CREATE TRIGGER trg_consumer_invoice_paid_journey
  AFTER UPDATE OF status ON public.consumer_membership_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_post_payment_journey();