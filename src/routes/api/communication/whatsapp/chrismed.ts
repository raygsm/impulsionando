import { createFileRoute } from '@tanstack/react-router';
import { askOliver } from '@/lib/oliver-chat.functions';
import {
  listConversationHistory,
  recordInboundMessage,
  recordOutboundMessage,
} from '@/lib/agents/omnichannel.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const INSTANCE = 'chrismed-oliver';
const AGENT_KEY = 'chrismed-oliver' as const;
const TENANT_SLUG = 'chrismed';

function cfg() {
  return {
    baseUrl: (process.env.CHRISMED_EVOLUTION_BASE_URL || '').trim().replace(/\/$/, ''),
    apiKey: (process.env.CHRISMED_EVOLUTION_API_KEY || '').trim(),
    webhookSecret: (process.env.CHRISMED_EVOLUTION_WEBHOOK_SECRET || '').trim(),
  };
}

function constantTimeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function eventName(body: any) {
  return String(body?.event || body?.type || body?.eventType || '')
    .toUpperCase()
    .replace(/[.-]/g, '_');
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

async function endpoint() {
  const { data: tenant } = await supabaseAdmin
    .from('communication_tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .eq('active', true)
    .maybeSingle();
  if (!tenant) throw new Error('chrismed_tenant_unavailable');

  const { data } = await supabaseAdmin
    .from('communication_channel_endpoints')
    .select('id,address,status,agent_id')
    .eq('tenant_id', tenant.id)
    .eq('channel', 'whatsapp')
    .eq('is_primary', true)
    .maybeSingle();
  if (!data) throw new Error('chrismed_whatsapp_endpoint_unavailable');
  return {
    tenantId: String(tenant.id),
    endpointId: String(data.id),
    address: String(data.address || ''),
    agentId: data.agent_id ? String(data.agent_id) : null,
  };
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
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw: raw.slice(0, 500) };
  }
  if (!response.ok) throw new Error(`evolution_send_failed_${response.status}`);
  return data;
}

async function updateConnection(body: any) {
  const { tenantId, endpointId } = await endpoint();
  const state = String(body?.data?.state || body?.state || body?.data?.status || '').toLowerCase();
  const connected = ['open', 'connected'].includes(state);
  const disconnected = ['close', 'closed', 'disconnected'].includes(state);
  const now = new Date().toISOString();

  await supabaseAdmin
    .from('communication_channel_endpoints')
    .update({
      provider: 'evolution_api',
      status: connected ? 'ACTIVE' : 'PENDING_CONNECTION',
      last_error: disconnected ? 'provider_disconnected' : null,
      last_healthcheck_at: now,
      updated_at: now,
    })
    .eq('id', endpointId);

  await supabaseAdmin
    .from('communication_whatsapp_pairing_sessions')
    .update({
      status: connected ? 'CONNECTED' : disconnected ? 'DISCONNECTED' : 'CONNECTING',
      qr_payload: null,
      qr_expires_at: connected ? null : undefined,
      last_error: disconnected ? 'provider_disconnected' : null,
      updated_at: now,
    })
    .eq('tenant_id', tenantId)
    .eq('provider_session_id', INSTANCE)
    .neq('status', connected ? 'CONNECTED' : 'DISCONNECTED');
}

async function updateQr(body: any) {
  const { tenantId } = await endpoint();
  const data = body?.data ?? body;
  const qr = data?.qrcode?.base64 || data?.base64 || data?.Qrcode || data?.qrcode || null;
  if (!qr || typeof qr !== 'string') return;
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from('communication_whatsapp_pairing_sessions')
    .update({
      status: 'AWAITING_SCAN',
      qr_payload: null,
      qr_expires_at: expiresAt,
      last_error: null,
      updated_at: new Date().toISOString(),
      metadata: { qr_available: true, qr_delivered_only_to_authenticated_pairing_ui: true },
    })
    .eq('tenant_id', tenantId)
    .eq('provider_session_id', INSTANCE)
    .neq('status', 'CONNECTED');
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
    metadata: {
      tenant: TENANT_SLUG,
      agent_key: AGENT_KEY,
      instance: INSTANCE,
      source: 'evolution_webhook',
      health_context: true,
    },
  });

  const persisted = await listConversationHistory(ledger.conversation_id, 30);
  const messages = persisted.flatMap((m): Array<{ role: 'user' | 'assistant'; content: string }> => {
    const content = String(m.body_text || '').trim();
    if (!content) return [];
    if (m.direction === 'INBOUND' || m.author_type === 'CONTACT') return [{ role: 'user', content }];
    if (m.direction === 'OUTBOUND' && m.author_type === 'AGENT') return [{ role: 'assistant', content }];
    return [];
  });

  const result = await askOliver({
    data: {
      messages: messages.length ? messages.slice(-20) : [{ role: 'user', content: message.text }],
      pathname: '/whatsapp',
      lang: 'pt',
    },
  });
  const answer = String(result.reply || '').trim();
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
    metadata: {
      tenant: TENANT_SLUG,
      agent_key: AGENT_KEY,
      instance: INSTANCE,
      source: 'chrismed_oliver_whatsapp',
    },
  });
}

export const Route = createFileRoute('/api/communication/whatsapp/chrismed')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { webhookSecret } = cfg();
        if (!webhookSecret) return Response.json({ error: 'webhook_not_configured' }, { status: 503 });
        const supplied = request.headers.get('x-chrismed-webhook-secret') || '';
        if (!constantTimeEqual(supplied, webhookSecret)) {
          return Response.json({ error: 'unauthorized' }, { status: 401 });
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }
        const sourceInstance = instanceName(body);
        if (sourceInstance && sourceInstance !== INSTANCE) {
          return Response.json({ ignored: true, reason: 'wrong_instance' });
        }

        const event = eventName(body);
        try {
          if (event.includes('CONNECTION_UPDATE')) await updateConnection(body);
          else if (event.includes('QRCODE_UPDATED')) await updateQr(body);
          else if (event.includes('MESSAGES_UPSERT')) await processInbound(body);
          return Response.json({ ok: true });
        } catch (error) {
          console.error('[chrismed/whatsapp] webhook failed', error);
          return Response.json({ error: 'processing_failed' }, { status: 500 });
        }
      },
    },
  },
});
