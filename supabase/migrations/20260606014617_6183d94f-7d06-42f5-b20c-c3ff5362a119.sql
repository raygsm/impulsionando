
-- Eventos de status do WhatsApp (Z-API) — entrega, leitura, falha
CREATE TABLE public.whatsapp_message_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id     uuid REFERENCES public.message_outbox(id) ON DELETE SET NULL,
  external_id   text NOT NULL,           -- messageId vindo da Z-API
  phone         text,                    -- destinatário normalizado
  status        text NOT NULL,           -- SENT | RECEIVED | DELIVERED | READ | PLAYED | FAILED | DISCONNECTED | CONNECTED
  error_code    text,
  error_message text,
  instance_id   text,
  momment       timestamptz,             -- timestamp original do evento (Z-API: epoch ms)
  raw           jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_events_external_id ON public.whatsapp_message_events(external_id);
CREATE INDEX idx_wa_events_outbox      ON public.whatsapp_message_events(outbox_id);
CREATE INDEX idx_wa_events_status      ON public.whatsapp_message_events(status);
CREATE INDEX idx_wa_events_received_at ON public.whatsapp_message_events(received_at DESC);

GRANT SELECT ON public.whatsapp_message_events TO authenticated;
GRANT ALL    ON public.whatsapp_message_events TO service_role;

ALTER TABLE public.whatsapp_message_events ENABLE ROW LEVEL SECURITY;

-- Só equipe Impulsionando enxerga; inserts/updates vêm do service_role (webhook).
CREATE POLICY "Staff Impulsionando lê eventos WhatsApp"
  ON public.whatsapp_message_events
  FOR SELECT TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));
