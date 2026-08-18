import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { generateText, type ModelMessage } from "ai";
import { assemblePrompt } from "@/lib/impulsionito/context-engine.server";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import {
  listConversationHistory,
  recordInboundMessage,
  recordOutboundMessage,
} from "@/lib/agents/omnichannel.server";

const AGENT_KEY = "impulsionito-core" as const;
const TENANT = "impulsionando";
const SOURCE = "meta_impulsionando";

type MetaChannel = "whatsapp" | "instagram";

type InboundMetaMessage = {
  channel: MetaChannel;
  externalUserId: string;
  text: string;
  providerMessageId?: string | null;
  endpointAddress?: string | null;
  phoneNumberId?: string | null;
  metadata?: Record<string, unknown>;
};

function verifySignature(raw: string, header: string | null) {
  const secret = process.env.IMPULSIONANDO_META_APP_SECRET ?? "";
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const supplied = header.slice(7);
  if (expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
}

function historyToMessages(
  history: Awaited<ReturnType<typeof listConversationHistory>>,
): ModelMessage[] {
  return history.flatMap((m): ModelMessage[] => {
    const text = (m.body_text ?? "").trim();
    if (!text) return [];
    if (m.direction === "INBOUND" || m.author_type === "CONTACT") {
      return [{ role: "user", content: text }];
    }
    if (m.direction === "OUTBOUND" && m.author_type === "AGENT") {
      return [{ role: "assistant", content: text }];
    }
    return [];
  });
}

async function sendWhatsApp(to: string, text: string, phoneNumberId?: string | null) {
  const token = process.env.IMPULSIONANDO_META_WHATSAPP_TOKEN ?? "";
  const phoneId = phoneNumberId || process.env.IMPULSIONANDO_META_PHONE_NUMBER_ID || "";
  if (!token || !phoneId) throw new Error("whatsapp_credentials_missing");

  const version = process.env.IMPULSIONANDO_META_GRAPH_VERSION || "v23.0";
  const response = await fetch(
    `https://graph.facebook.com/${version}/${encodeURIComponent(phoneId)}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text.slice(0, 4096) },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`whatsapp_send_${response.status}:${detail.slice(0, 240)}`);
  }
  return await response.json();
}

async function sendInstagram(to: string, text: string) {
  const token = process.env.IMPULSIONANDO_META_INSTAGRAM_TOKEN ?? process.env.IMPULSIONANDO_META_PAGE_TOKEN ?? "";
  const igAccountId = process.env.IMPULSIONANDO_META_IG_ACCOUNT_ID ?? "";
  if (!token || !igAccountId) throw new Error("instagram_credentials_missing");

  const version = process.env.IMPULSIONANDO_META_GRAPH_VERSION || "v23.0";
  const response = await fetch(
    `https://graph.instagram.com/${version}/${encodeURIComponent(igAccountId)}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: to },
        message: { text: text.slice(0, 2000) },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`instagram_send_${response.status}:${detail.slice(0, 240)}`);
  }
  return await response.json();
}

function extractInbound(body: any): InboundMetaMessage[] {
  const out: InboundMetaMessage[] = [];

  if (body?.object === "whatsapp_business_account") {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change?.value ?? {};
        for (const message of value.messages ?? []) {
          const text = message?.text?.body;
          if (!text || !message?.from) continue;
          out.push({
            channel: "whatsapp",
            externalUserId: String(message.from),
            text: String(text),
            providerMessageId: message.id ?? null,
            phoneNumberId: value?.metadata?.phone_number_id ?? null,
            endpointAddress: value?.metadata?.display_phone_number ?? null,
            metadata: {
              message_type: message.type,
              timestamp: message.timestamp,
              wa_id: value?.contacts?.[0]?.wa_id ?? null,
              display_name: value?.contacts?.[0]?.profile?.name ?? null,
            },
          });
        }
      }
    }
    return out;
  }

  if (body?.object === "instagram") {
    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        const text = event?.message?.text;
        if (!text || event?.message?.is_echo || !event?.sender?.id) continue;
        out.push({
          channel: "instagram",
          externalUserId: String(event.sender.id),
          text: String(text),
          providerMessageId: event.message?.mid ?? null,
          endpointAddress: event?.recipient?.id ? String(event.recipient.id) : null,
          metadata: { timestamp: event.timestamp },
        });
      }
    }
  }

  return out;
}

async function processMessage(input: InboundMetaMessage) {
  const provider = input.channel === "whatsapp" ? "meta_cloud" : "meta_graph";
  const displayName = typeof input.metadata?.display_name === "string"
    ? input.metadata.display_name
    : null;

  const ledger = await recordInboundMessage({
    agentKey: AGENT_KEY,
    channel: input.channel,
    provider,
    externalUserId: input.externalUserId,
    bodyText: input.text,
    providerMessageId: input.providerMessageId ?? null,
    endpointAddress: input.endpointAddress ?? null,
    displayName,
    metadata: {
      ...(input.metadata ?? {}),
      source: SOURCE,
      tenant: TENANT,
      root_agent_key: AGENT_KEY,
    },
  });

  const history = historyToMessages(
    await listConversationHistory(ledger.conversation_id, 30),
  );
  const assembled = assemblePrompt(undefined, {
    channel: input.channel,
    tenant: TENANT,
    audience: "public_social",
  });
  const resolved = resolveProvider({});

  const { text: answer } = await generateText({
    model: resolved.model,
    system: assembled.system,
    messages: history.slice(-30),
    temperature: 0.35,
    maxOutputTokens: 900,
  });

  let external: any = null;
  try {
    external = input.channel === "whatsapp"
      ? await sendWhatsApp(input.externalUserId, answer, input.phoneNumberId)
      : await sendInstagram(input.externalUserId, answer);

    const providerMessageId = String(
      external?.messages?.[0]?.id ?? external?.message_id ?? external?.messageId ?? "",
    ) || null;

    await recordOutboundMessage({
      conversationId: ledger.conversation_id,
      bodyText: answer,
      channel: input.channel,
      provider,
      endpointId: ledger.endpoint_id,
      providerMessageId,
      status: "SENT",
      metadata: {
        source: SOURCE,
        tenant: TENANT,
        agent_key: AGENT_KEY,
        model_provider: resolved.provider,
        model: resolved.modelId,
      },
    });
  } catch (error) {
    await recordOutboundMessage({
      conversationId: ledger.conversation_id,
      bodyText: answer,
      channel: input.channel,
      provider,
      endpointId: ledger.endpoint_id,
      status: "FAILED",
      metadata: {
        source: SOURCE,
        tenant: TENANT,
        agent_key: AGENT_KEY,
        delivery_error: error instanceof Error ? error.message : "unknown",
      },
    });
    throw error;
  }
}

export const Route = createFileRoute("/api/public/hooks/meta-impulsionando")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const verifyToken = process.env.IMPULSIONANDO_META_VERIFY_TOKEN ?? "";

        if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
          return new Response("invalid signature", { status: 401 });
        }

        let body: any;
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const messages = extractInbound(body).filter(
          (m) => m.externalUserId && m.text.trim(),
        );

        for (const message of messages) {
          try {
            await processMessage(message);
          } catch (error) {
            console.error("[meta-impulsionando] message processing failed", error);
          }
        }

        return new Response("EVENT_RECEIVED", { status: 200 });
      },
    },
  },
});
