/**
 * Phase 5E — sink/noop email + WhatsApp adapters.
 * Never opens provider network sockets. COMMUNICATION_SINK=true is the safe default path.
 */
import {
  DeliveryStatus,
  type CommunicationAdapterSendInput,
  type CommunicationAdapterSendResult,
  type EmailCommunicationAdapter,
  type WhatsAppCommunicationAdapter,
} from "@impulsionando/contracts";

function sinkResult(
  input: CommunicationAdapterSendInput,
  channel: "email" | "whatsapp",
): CommunicationAdapterSendResult {
  return {
    ok: true,
    provider: "sink",
    providerMessageId: `sink:${channel}:${input.deliveryId}`,
    status: DeliveryStatus.Delivered,
  };
}

/** No-op email adapter — writes delivery state only via caller. */
export class SinkEmailAdapter implements EmailCommunicationAdapter {
  readonly channel = "email" as const;

  async send(input: CommunicationAdapterSendInput): Promise<CommunicationAdapterSendResult> {
    return sinkResult(input, "email");
  }
}

/** No-op WhatsApp adapter — never calls Evolution/Meta/etc. */
export class SinkWhatsAppAdapter implements WhatsAppCommunicationAdapter {
  readonly channel = "whatsapp" as const;

  async send(input: CommunicationAdapterSendInput): Promise<CommunicationAdapterSendResult> {
    return sinkResult(input, "whatsapp");
  }
}

export function createSinkAdapter(
  channel: "email" | "whatsapp",
): EmailCommunicationAdapter | WhatsAppCommunicationAdapter {
  return channel === "email" ? new SinkEmailAdapter() : new SinkWhatsAppAdapter();
}
