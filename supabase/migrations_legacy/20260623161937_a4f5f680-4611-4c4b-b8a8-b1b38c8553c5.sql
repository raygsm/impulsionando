
-- 1) Campos novos no item de remessa: a logística preenche na entrega
ALTER TABLE public.riomed_shipment_items
  ADD COLUMN IF NOT EXISTS warranty_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warranty_starts_at date,
  ADD COLUMN IF NOT EXISTS warranty_ends_at   date;

-- 2) Trigger: quando o envio passa para 'delivered', gera garantias dos itens
CREATE OR REPLACE FUNCTION public.riomed_generate_warranties_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delivered date;
  v_item RECORD;
BEGIN
  -- dispara apenas na transição para delivered (status ou delivered_at)
  IF NEW.status IS DISTINCT FROM 'delivered' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'delivered' THEN
    RETURN NEW;
  END IF;

  v_delivered := COALESCE(NEW.delivered_at, now())::date;

  FOR v_item IN
    SELECT id, product_id, serial_number, warranty_days
    FROM public.riomed_shipment_items
    WHERE shipment_id = NEW.id
      AND COALESCE(warranty_days, 0) > 0
  LOOP
    -- preenche datas no próprio item
    UPDATE public.riomed_shipment_items
       SET warranty_starts_at = v_delivered,
           warranty_ends_at   = v_delivered + (v_item.warranty_days || ' days')::interval
     WHERE id = v_item.id;

    -- registro permanente em riomed_warranties (idempotente por source_id)
    INSERT INTO public.riomed_warranties (
      company_id, source_type, source_id, product_id, serial_number,
      hospital_id, starts_at, ends_at, status, metadata
    )
    SELECT
      NEW.company_id, 'shipment_item', v_item.id, v_item.product_id, v_item.serial_number,
      NEW.hospital_id, v_delivered,
      v_delivered + (v_item.warranty_days || ' days')::interval,
      'active',
      jsonb_build_object('shipment_id', NEW.id, 'warranty_days', v_item.warranty_days)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.riomed_warranties
      WHERE source_type = 'shipment_item' AND source_id = v_item.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_riomed_warranty_on_delivery ON public.riomed_shipments;
CREATE TRIGGER trg_riomed_warranty_on_delivery
AFTER INSERT OR UPDATE OF status, delivered_at ON public.riomed_shipments
FOR EACH ROW
EXECUTE FUNCTION public.riomed_generate_warranties_on_delivery();

-- 3) Visão simplificada: histórico permanente do cliente com contador
CREATE OR REPLACE VIEW public.riomed_my_warranties AS
SELECT
  w.id,
  w.company_id,
  w.hospital_id,
  w.product_id,
  p.name        AS product_name,
  p.sku         AS product_sku,
  w.serial_number,
  w.starts_at,
  w.ends_at,
  s.id          AS shipment_id,
  s.shipment_code,
  s.delivered_at,
  GREATEST(0, (w.ends_at - CURRENT_DATE))::int   AS days_remaining,
  (w.ends_at < CURRENT_DATE)                     AS is_finished,
  w.status,
  w.created_at
FROM public.riomed_warranties w
LEFT JOIN public.riomed_products  p ON p.id = w.product_id
LEFT JOIN public.riomed_shipment_items si ON si.id = w.source_id AND w.source_type = 'shipment_item'
LEFT JOIN public.riomed_shipments  s  ON s.id = si.shipment_id;

GRANT SELECT ON public.riomed_my_warranties TO authenticated, service_role;
