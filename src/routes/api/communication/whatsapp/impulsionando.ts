import { createFileRoute } from '@tanstack/react-router';
import { generateText, type ModelMessage } from 'ai';
import { assemblePrompt } from '@/lib/impulsionito/context-engine.server';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const INSTANCE = 'impulsionando-impulsionito';
const AGENT_KEY = 'impulsionito-core' as const;
const TENANT_SLUG = 'impulsionando';

function cfg() {
  return {
    baseUrl: (process.env.IMPULSIONANDO_EVOLUTION_BASE_URL || process.env.EVOLUTION_BASE_URL || '').trim().replace(/\/$/, ''),
    apiKey: (process.env.IMPULSIONANDO_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY || '').trim(),
    webhookSecret: (process.env.IMPULSIONANDO_EVOLUTION_WEBHOOK_SECRET || '').trim(),
  };
}

function constantTimeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function eventName(body: any) {
  return String(body?.event || body?.type || body?.eventType || '').toUpperCase().replace(/[.-]/g, '_');
}

function instanceName(body: any) {
  return String(body?.instance || body?.instanceName || body?.data?.instance || body?.data?.instanceName || '');
}

function messageEnvelope(body: any) {
  const data = body?.data ?? body;
  const msg = data?.message ?? data?.messages?.[0]?.message ?? {};
  const key = data?.key ?? data?.messages?.[0]?.key ?? {};
  const remoteJid = String(key?.remoteJid || data?.remoteJid || data?.sender || '');
  const number = remoteJid.split('@')[0].replace(/\D/g, '');
  const text = String(
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    data?.text ||
    '',
  ).trim();
  return {
    number,
    remoteJid,
    text,
    fromMe: Boolean(key?.fromMe),
    messageId: String(key?.id || data?.id || ''),
    pushName: String(data?.pushName || data?.name || '').trim(),
  };
}

function historyToModelMessages(history: Awaited<ReturnType<typeof listConversationHistory>>): ModelMessage[] {
  return history.flatMap((m): ModelMessage[] => {
    const text = String(m.body_text || '').trim();
    if (!text) return [];
    if (m.direction === 'INBOUND' || m.author_type === 'CONTACT') return [{ role: 'user', content: text }];
    if (m.direction === 'OUTBOUND' && m.author_type === 'AGENT') return [{ role: 'assistant', content: text }];
    return [];
  });
}

async function sendText(number: string, text: string) {
  const { baseUrl, apiKey } = cfg();
  if (!baseUrl || !apiKey) throw new Error('evolution_credentials_missing');
  const response = await fetch(`${baseUrl}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: apiKey },
    body: JSON.stringify({ number, text }),
    signal: AbortSignal.timeout(12000),
  });
  const raw = await response.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw: raw.slice(0, 500) }; }
  if (!response.ok) throw new Error(`evolution_send_failed_${response.status}`);
  return data;
}

async function endpoint() {
  const { data: tenant } = await supabaseAdmin.from('communication_tenants').select('id').eq('slug', TENANT_SLUG).eq('active', true).maybeSingle();
  if (!tenant) throw new Error('impulsionando_tenant_unavailable');
  const { data } = await supabaseAdmin.from('communication_channel_endpoints').select('id,address,status').eq('tenant_id', tenant.id).eq('channel', 'whatsapp').eq('is_primary', true).maybeSingle();
  if (!data) throw new Error('impulsionando_whatsapp_endpoint_unavailable');
  return { tenantId: String(tenant.id), endpointId: String(data.id), address: String(data.address || '') };
}

async function updateConnection(body: any) {
  const { tenantId, endpointId } = await endpoint();
  const state = String(body?.data?.state || body?.state || body?.data?.status || '').toLowerCase();
  const connected = ['open', 'connected'].includes(state);
  const disconnected = ['close', 'closed', 'disconnected'].includes(state);
  const now = new Date().toISOString();

  await supabaseAdmin.from('communication_channel_endpoints').update({
    provider: 'evolution_api',
    status: connected ? 'ACTIVE' : disconnected ? 'PENDING_CONNECTION' : 'PENDING_CONNECTION',
    last_error: null,
    last_healthcheck_at: now,
  }).eq('id', endpointId);

  await supabaseAdmin.from('communication_whatsapp_pairing_sessions').update({
    status: connected ? 'CONNECTED' : disconnected ? 'DISCONNECTED' : 'CONNECTING',
    qr_payload: null,
    qr_expires_at: connected ? null : undefined,
    last_error: null,
    updated_at: now,
  }).eq('tenant_id', tenantId).eq('provider_session_id', INSTANCE).neq('status', connected ? 'CONNECTED' : 'DISCONNECTED');
}

async function processInbound(body: any) {
  const message = messageEnvelope(body);
  if (message.fromMe || !message.number || !message.text) return;
  if (message.remoteJid.endsWith('@g.us') || message.remoteJid.includes('status@broadcast')) return;

  const { address } = await endpoint();
  const ledger = await recordInboundMessage({
    agentKey: AGENT_KEY,
    channel: 'whatsapp',
    provider: 'evolution_api',
    externalUserId: message.number,
    bodyText: message.text,
    providerMessageId: message.messageId || null,
    endpointAddress: address,
    displayName: message.pushName || null,
    metadata: { tenant: TENANT_SLUG, agent_key: AGENT_KEY, instance: INSTANCE, source: 'evolution_webhook' },
  });

  let messages = historyToModelMessages(await listConversationHistory(ledger.conversation_id, 30));
  if (!messages.length) messages = [{ role: 'user', content: message.text }];
  if (messages.length > 30) messages = messages.slice(-30);

  const assembled = assemblePrompt(undefined, {
    pathname: '/whatsapp',
    channel: 'whatsapp',
    tenant: TENANT_SLUG,
    audience: 'whatsapp_contact',
  });
  const resolved = resolveProvider({});
  const result = await generateText({
    model: resolved.model,
    system: assembled.system,
    messages,
    temperature: 0.4,
    maxOutputTokens: 900,
  });
  const answer = result.text.trim();
  if (!answer) return;

  const sent = await sendText(message.number, answer);
  const providerMessageId = String(sent?.key?.id || sent?.messageId || sent?.id || '') || null;
  await recordOutboundMessage({
    conversationId: ledger.conversation_id,
    bodyText: answer,
    channel: 'whatsapp',
    provider: 'evolution_api',
    providerMessageId,
    endpointId: ledger.endpoint_id,
    status: 'SENT',
    metadata: { tenant: TENANT_SLUG, agent_key: AGENT_KEY, instance: INSTANCE, provider: resolved.provider, model: resolved.modelId },
  });
}

export const Route = createFileRoute('/api/communication/whatsapp/impulsionando')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { webhookSecret } = cfg();
        if (!webhookSecret) return Response.json({ error: 'webhook_not_configured' }, { status: 503 });
        const supplied = request.headers.get('x-impulsionando-webhook-secret') || '';
        if (!constantTimeEqual(supplied, webhookSecret)) return Response.json({ error: 'unauthorized' }, { status: 401 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: 'invalid_json' }, { status: 400 }); }
        const sourceInstance = instanceName(body);
        if (sourceInstance && sourceInstance !== INSTANCE) return Response.json({ ignored: true, reason: 'wrong_instance' });

        const event = eventName(body);
        try {
          if (event.includes('CONNECTION_UPDATE')) await updateConnection(body);
          else if (event.includes('MESSAGES_UPSERT')) await processInbound(body);
          return Response.json({ ok: true });
        } catch (error) {
          console.error('[impulsionando/whatsapp] webhook failed', error);
          return Response.json({ error: 'processing_failed' }, { status: 500 });
        }
      },
    },
  },
});
