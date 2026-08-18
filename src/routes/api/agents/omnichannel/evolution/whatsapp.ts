import { createFileRoute } from '@tanstack/react-router';
import { generateText, type ModelMessage } from 'ai';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { assemblePrompt } from '@/lib/impulsionito/context-engine.server';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { listConversationHistory, recordInboundMessage, recordOutboundMessage, type OmnichannelAgentKey } from '@/lib/agents/omnichannel.server';

const PROVIDER = 'evolution_api';

function config() {
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

function textFrom(payload: any) {
  return String(payload?.data?.message?.conversation || payload?.data?.message?.extendedTextMessage?.text || payload?.message?.conversation || payload?.message?.extendedTextMessage?.text || '').trim();
}

function remoteJidFrom(payload: any) {
  return String(payload?.data?.key?.remoteJid || payload?.key?.remoteJid || '').trim();
}

function messageIdFrom(payload: any) {
  const value = payload?.data?.key?.id || payload?.key?.id || payload?.data?.id || payload?.id;
  return value ? String(value) : null;
}

function instanceFrom(payload: any) {
  return String(payload?.instance || payload?.data?.instance || payload?.instanceName || '').trim();
}

function eventFrom(payload: any) {
  return String(payload?.event || payload?.type || '').toUpperCase().replace(/[.-]/g, '_');
}

function fromMe(payload: any) {
  return Boolean(payload?.data?.key?.fromMe ?? payload?.key?.fromMe ?? false);
}

function historyToMessages(history: Awaited<ReturnType<typeof listConversationHistory>>): ModelMessage[] {
  return history.flatMap((m): ModelMessage[] => {
    const content = String(m.body_text || '').trim();
    if (!content) return [];
    if (m.direction === 'INBOUND' || m.author_type === 'CONTACT') return [{ role: 'user', content }];
    if (m.direction === 'OUTBOUND' || m.author_type === 'AGENT') return [{ role: 'assistant', content }];
    return [];
  }).slice(-30);
}

async function resolveRuntime(tenantSlug: string, instance: string) {
  const { data: tenant } = await supabaseAdmin.from('communication_tenants' as never).select('id,slug,display_name,active' as never).eq('slug' as never, tenantSlug).eq('active' as never, true).maybeSingle();
  if (!tenant) throw new Error('tenant_not_found');
  const tenantId = String((tenant as any).id);

  const { data: endpoint } = await supabaseAdmin.from('communication_channel_endpoints' as never)
    .select('id,address,status,provider,config' as never)
    .eq('tenant_id' as never, tenantId).eq('channel' as never, 'whatsapp').eq('is_primary' as never, true).maybeSingle();
  if (!endpoint) throw new Error('endpoint_not_found');
  const endpointConfig = ((endpoint as any).config || {}) as Record<string, unknown>;
  if (String(endpointConfig.evolution_instance || '') !== instance) throw new Error('instance_tenant_mismatch');
  if (String((endpoint as any).provider || '') !== PROVIDER) throw new Error('provider_mismatch');

  const agentKey = String(endpointConfig.agent_key || '');
  if (!agentKey) throw new Error('agent_key_missing');
  const { data: runtime } = await supabaseAdmin.from('communication_agent_runtime' as never)
    .select('agent_id,agent_key,system_prompt_ref,knowledge_scope,model_policy,privacy_policy,handoff_policy,capabilities,config,active' as never)
    .eq('agent_key' as never, agentKey).eq('active' as never, true).maybeSingle();
  if (!runtime) throw new Error('runtime_not_found');

  return { tenant: tenant as any, endpoint: endpoint as any, runtime: runtime as any, agentKey: agentKey as OmnichannelAgentKey };
}

async function sendText(baseUrl: string, apiKey: string, instance: string, number: string, text: string) {
  const response = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instance)}`, {
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

async function updateConnection(endpointId: string, event: string, payload: any) {
  if (!['CONNECTION_UPDATE', 'CONNECTION_UPDATE_'].includes(event)) return;
  const state = String(payload?.data?.state || payload?.state || payload?.data?.status || '').toLowerCase();
  const connected = ['open', 'connected'].includes(state);
  await supabaseAdmin.from('communication_channel_endpoints' as never).update({
    status: connected ? 'ACTIVE' : 'PENDING_CONNECTION',
    last_healthcheck_at: new Date().toISOString(),
    last_error: connected ? null : (state || 'connection_not_open'),
  } as never).eq('id' as never, endpointId);
}

export const Route = createFileRoute('/api/agents/omnichannel/evolution/whatsapp')({
  server: { handlers: { POST: async ({ request }) => {
    const { baseUrl, apiKey, webhookSecret } = config();
    if (!baseUrl || !apiKey || !webhookSecret) return Response.json({ ok: false, error: 'provider_not_configured' }, { status: 503 });
    if (!safeEqual(request.headers.get('x-impulsionando-webhook-secret') || '', webhookSecret)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const tenantSlug = String(url.searchParams.get('tenant') || '').trim().toLowerCase();
    if (!/^[a-z0-9-]{2,80}$/.test(tenantSlug)) return Response.json({ ok: false, error: 'invalid_tenant' }, { status: 400 });

    let payload: any;
    try { payload = await request.json(); } catch { return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
    const instance = instanceFrom(payload);
    if (!instance) return Response.json({ ok: false, error: 'missing_instance' }, { status: 400 });

    let ctx;
    try { ctx = await resolveRuntime(tenantSlug, instance); }
    catch (error) { console.error('[evolution/whatsapp] runtime resolution rejected', error); return Response.json({ ok: false, error: 'route_rejected' }, { status: 403 }); }

    const event = eventFrom(payload);
    if (event === 'CONNECTION_UPDATE') {
      await updateConnection(String(ctx.endpoint.id), event, payload);
      return Response.json({ ok: true, event });
    }
    if (event === 'QRCODE_UPDATED') return Response.json({ ok: true, event });
    if (event && event !== 'MESSAGES_UPSERT') return Response.json({ ok: true, ignored: event });
    if (fromMe(payload)) return Response.json({ ok: true, ignored: 'from_me' });

    const text = textFrom(payload);
    const remoteJid = remoteJidFrom(payload);
    const providerMessageId = messageIdFrom(payload);
    if (!text || !remoteJid) return Response.json({ ok: true, ignored: 'non_text_or_missing_identity' });
    const externalUserId = remoteJid.replace(/@s\.whatsapp\.net$/i, '');

    let ledger;
    try {
      ledger = await recordInboundMessage({
        agentKey: ctx.agentKey,
        channel: 'whatsapp',
        provider: PROVIDER,
        externalUserId,
        bodyText: text,
        providerMessageId,
        endpointAddress: ctx.endpoint.address || null,
        metadata: { tenant: tenantSlug, agent_key: ctx.agentKey, instance, source: 'evolution_whatsapp' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (/duplicate|unique|already/i.test(msg)) return Response.json({ ok: true, duplicate: true });
      console.error('[evolution/whatsapp] inbound ledger failed', error);
      return Response.json({ ok: false, error: 'ledger_unavailable' }, { status: 503 });
    }

    let messages: ModelMessage[] = [{ role: 'user', content: text }];
    try {
      const persisted = historyToMessages(await listConversationHistory(ledger.conversation_id, 30));
      if (persisted.length) messages = persisted;
    } catch (error) { console.error('[evolution/whatsapp] history read failed', error); }

    const runtimeConfig = (ctx.runtime.config || {}) as Record<string, unknown>;
    const runtimeInstructions = String(runtimeConfig.whatsapp_system_prompt || runtimeConfig.system_prompt || '').trim();
    const brain = runtimeInstructions ? { promptMaster: runtimeInstructions, promptVersion: 1, rules: [], services: [], plans: [], modules: [], niches: [], faq: [], knowledge: [], approvedLearnings: [] } : undefined;
    const prompt = assemblePrompt(brain as any, { pathname: '/whatsapp', channel: 'whatsapp', tenant: tenantSlug, audience: 'whatsapp_contact' });

    let answer = '';
    let providerName = 'unknown';
    let modelId = 'unknown';
    try {
      const resolved = resolveProvider({});
      providerName = resolved.provider;
      modelId = resolved.modelId;
      const result = await generateText({ model: resolved.model, system: prompt.system, messages, temperature: 0.3, maxOutputTokens: 900 });
      answer = result.text.trim();
    } catch (error) {
      console.error('[evolution/whatsapp] llm failed', error);
      answer = 'Estou temporariamente sem acesso ao meu motor principal. Sua mensagem ficou registrada e eu não vou inventar informações. Tente novamente em alguns instantes.';
    }
    if (!answer) return Response.json({ ok: true, no_reply: true });

    try {
      const sent = await sendText(baseUrl, apiKey, instance, externalUserId, answer);
      const outboundId = sent?.key?.id || sent?.id || sent?.messageId || null;
      await recordOutboundMessage({
        conversationId: ledger.conversation_id, bodyText: answer, channel: 'whatsapp', provider: PROVIDER,
        providerMessageId: outboundId ? String(outboundId) : null, endpointId: ledger.endpoint_id, status: 'SENT',
        metadata: { tenant: tenantSlug, agent_key: ctx.agentKey, instance, provider: providerName, model: modelId },
      });
    } catch (error) {
      console.error('[evolution/whatsapp] outbound failed', error);
      try { await recordOutboundMessage({ conversationId: ledger.conversation_id, bodyText: answer, channel: 'whatsapp', provider: PROVIDER, endpointId: ledger.endpoint_id, status: 'FAILED', metadata: { tenant: tenantSlug, agent_key: ctx.agentKey, instance, provider: providerName, model: modelId } }); } catch { /* best effort */ }
      return Response.json({ ok: false, error: 'outbound_failed' }, { status: 502 });
    }

    return Response.json({ ok: true, tenant: tenantSlug, agent: ctx.agentKey });
  } } },
});
