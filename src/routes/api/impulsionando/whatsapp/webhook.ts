import { createFileRoute } from '@tanstack/react-router';
import { generateText } from 'ai';
import { assemblePrompt } from '@/lib/impulsionito/context-engine.server';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';

const INSTANCE = 'impulsionito-core';
const TENANT = 'impulsionando';
const ENDPOINT_ADDRESS = '+5521993075000';

function cfg() {
  return {
    baseUrl: (process.env.IMPULSIONANDO_EVOLUTION_BASE_URL || process.env.EVOLUTION_BASE_URL || '').trim().replace(/\/$/, ''),
    apiKey: (process.env.IMPULSIONANDO_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY || '').trim(),
    webhookSecret: (process.env.IMPULSIONANDO_EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_WEBHOOK_SECRET || '').trim(),
  };
}

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getText(payload: any): string {
  return String(
    payload?.data?.message?.conversation ||
    payload?.data?.message?.extendedTextMessage?.text ||
    payload?.message?.conversation ||
    payload?.message?.extendedTextMessage?.text ||
    ''
  ).trim();
}

function getRemoteJid(payload: any): string {
  return String(payload?.data?.key?.remoteJid || payload?.key?.remoteJid || '').trim();
}

function getMessageId(payload: any): string | null {
  const value = payload?.data?.key?.id || payload?.key?.id || payload?.data?.id || payload?.id;
  return value ? String(value) : null;
}

function isFromMe(payload: any): boolean {
  return Boolean(payload?.data?.key?.fromMe ?? payload?.key?.fromMe ?? false);
}

async function evolutionSend(baseUrl: string, apiKey: string, number: string, text: string) {
  const response = await fetch(`${baseUrl}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: apiKey },
    body: JSON.stringify({ number, text }),
    signal: AbortSignal.timeout(15000),
  });
  const raw = await response.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
  if (!response.ok) throw new Error(`evolution_send_failed_${response.status}`);
  return data;
}

function historyToMessages(history: Awaited<ReturnType<typeof listConversationHistory>>) {
  return history.flatMap((m): Array<{ role: 'user' | 'assistant'; content: string }> => {
    const text = String(m.body_text || '').trim();
    if (!text) return [];
    if (m.direction === 'INBOUND' || m.author_type === 'CONTACT') return [{ role: 'user', content: text }];
    if (m.direction === 'OUTBOUND' || m.author_type === 'AGENT') return [{ role: 'assistant', content: text }];
    return [];
  }).slice(-30);
}

export const Route = createFileRoute('/api/impulsionando/whatsapp/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { baseUrl, apiKey, webhookSecret } = cfg();
        if (!baseUrl || !apiKey || !webhookSecret) return Response.json({ ok: false, error: 'provider_not_configured' }, { status: 503 });

        const suppliedSecret = request.headers.get('x-impulsionando-webhook-secret') || '';
        if (!safeEqual(suppliedSecret, webhookSecret)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });

        let payload: any;
        try { payload = await request.json(); } catch { return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

        const event = String(payload?.event || payload?.type || '').toUpperCase();
        if (event && event !== 'MESSAGES_UPSERT') return Response.json({ ok: true, ignored: event });
        if (isFromMe(payload)) return Response.json({ ok: true, ignored: 'from_me' });

        const text = getText(payload);
        const remoteJid = getRemoteJid(payload);
        const providerMessageId = getMessageId(payload);
        if (!text || !remoteJid) return Response.json({ ok: true, ignored: 'non_text_or_missing_identity' });

        const externalUserId = remoteJid.replace(/@s\.whatsapp\.net$/i, '');
        let ledger;
        try {
          ledger = await recordInboundMessage({
            agentKey: 'impulsionito-core',
            channel: 'whatsapp',
            provider: 'evolution_api',
            externalUserId,
            bodyText: text,
            providerMessageId,
            endpointAddress: ENDPOINT_ADDRESS,
            metadata: { tenant: TENANT, source: 'impulsionito_whatsapp', remote_jid: remoteJid, instance: INSTANCE },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (/duplicate|unique|already/i.test(message)) return Response.json({ ok: true, duplicate: true });
          console.error('[impulsionando/whatsapp] inbound ledger failed', error);
          return Response.json({ ok: false, error: 'ledger_unavailable' }, { status: 503 });
        }

        let messages: any[] = [{ role: 'user', content: text }];
        try {
          const history = await listConversationHistory(ledger.conversation_id, 30);
          const mapped = historyToMessages(history);
          if (mapped.length) messages = mapped;
        } catch (error) {
          console.error('[impulsionando/whatsapp] history failed', error);
        }

        let answer: string;
        let providerName = 'unknown';
        let modelId = 'unknown';
        try {
          const resolved = resolveProvider({});
          providerName = resolved.provider;
          modelId = resolved.modelId;
          const prompt = assemblePrompt(undefined, { pathname: '/whatsapp', channel: 'whatsapp', tenant: TENANT, audience: 'whatsapp_contact' });
          const result = await generateText({ model: resolved.model, system: prompt.system, messages, temperature: 0.35, maxOutputTokens: 900 });
          answer = result.text.trim();
        } catch (error) {
          console.error('[impulsionando/whatsapp] llm failed', error);
          answer = 'Estou temporariamente sem acesso ao meu motor principal. Sua mensagem ficou registrada e eu não vou inventar informações. Tente novamente em alguns instantes.';
        }

        if (!answer) return Response.json({ ok: true, no_reply: true });

        try {
          const sent = await evolutionSend(baseUrl, apiKey, externalUserId, answer);
          const outboundProviderId = sent?.key?.id || sent?.id || sent?.messageId || null;
          await recordOutboundMessage({
            conversationId: ledger.conversation_id,
            bodyText: answer,
            channel: 'whatsapp',
            provider: 'evolution_api',
            providerMessageId: outboundProviderId ? String(outboundProviderId) : null,
            endpointId: ledger.endpoint_id,
            status: 'SENT',
            metadata: { tenant: TENANT, agent_key: 'impulsionito-core', provider: providerName, model: modelId, instance: INSTANCE },
          });
        } catch (error) {
          console.error('[impulsionando/whatsapp] outbound failed', error);
          try {
            await recordOutboundMessage({
              conversationId: ledger.conversation_id,
              bodyText: answer,
              channel: 'whatsapp',
              provider: 'evolution_api',
              endpointId: ledger.endpoint_id,
              status: 'FAILED',
              metadata: { tenant: TENANT, agent_key: 'impulsionito-core', provider: providerName, model: modelId, instance: INSTANCE },
            });
          } catch { /* best effort */ }
          return Response.json({ ok: false, error: 'outbound_failed' }, { status: 502 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
