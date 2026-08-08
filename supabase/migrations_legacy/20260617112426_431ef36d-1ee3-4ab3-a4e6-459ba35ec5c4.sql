
CREATE OR REPLACE FUNCTION public.mark_membership_invoice_paid(_invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inv public.consumer_membership_invoices;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_inv FROM public.consumer_membership_invoices WHERE id = _invoice_id;
  IF v_inv IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_inv.status = 'paid' THEN RETURN jsonb_build_object('ok', true, 'already_paid', true); END IF;

  UPDATE public.consumer_membership_invoices
    SET status = 'paid', paid_at = v_now, updated_at = v_now
    WHERE id = _invoice_id;

  UPDATE public.consumer_memberships
    SET status = 'ativa',
        current_period_start = COALESCE(current_period_end, v_now),
        current_period_end   = COALESCE(current_period_end, v_now) + interval '30 days',
        updated_at = v_now
    WHERE id = v_inv.membership_id;

  RETURN jsonb_build_object('ok', true, 'membership_id', v_inv.membership_id);
END; $$;

CREATE OR REPLACE FUNCTION public.mark_billing_invoice_paid(_invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inv public.billing_invoices;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_inv FROM public.billing_invoices WHERE id = _invoice_id;
  IF v_inv IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_inv.status = 'paid' THEN RETURN jsonb_build_object('ok', true, 'already_paid', true); END IF;

  UPDATE public.billing_invoices
    SET status = 'paid', paid_at = v_now, updated_at = v_now
    WHERE id = _invoice_id;

  RETURN jsonb_build_object('ok', true, 'contract_id', v_inv.contract_id);
END; $$;

REVOKE ALL ON FUNCTION public.mark_membership_invoice_paid(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_membership_invoice_paid(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.mark_billing_invoice_paid(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_billing_invoice_paid(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_mark_invoice_paid(_kind text, _invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_allowed boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text IN ('master','manager','support','admin')
  ) INTO v_allowed;
  IF NOT v_allowed THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;

  IF _kind = 'consumer' THEN
    RETURN public.mark_membership_invoice_paid(_invoice_id);
  ELSIF _kind = 'erp' THEN
    RETURN public.mark_billing_invoice_paid(_invoice_id);
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_kind');
  END IF;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_mark_invoice_paid(text, uuid) TO authenticated;
