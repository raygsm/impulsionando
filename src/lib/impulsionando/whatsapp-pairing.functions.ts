import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const TENANT_SLUG = 'impulsionando';
const INSTANCE = 'impulsionando-impulsionito';
const PAIRING_TTL_MS = 2 * 60 * 1000;

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (!data) throw new Error('Forbidden: admin only');
}

function cfg() {
  return {
    baseUrl: (process.env.IMPULSIONANDO_EVOLUTION_BASE_URL || process.env.EVOLUTION_BASE_URL || '').trim().replace(/\/$/, ''),
    apiKey: (process.env.IMPULSIONANDO_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY || '').trim(),
    webhookSecret: (process.env.IMPULSIONANDO_EVOLUTION_WEBHOOK_SECRET || '').trim(),
  };
}

async function tenantAndEndpoint(supabase: any) {
  const { data: tenant, error } = await supabase
    .from('communication_tenants')
    .select('id,company_id')
    .eq('slug', TENANT_SLUG)
    .eq('active', true)
    .maybeSingle();
  if (error || !tenant) throw new Error('impulsionando_tenant_unavailable');

  const { data: endpoint } = await supabase
    .from('communication_channel_endpoints')
    .select('id,agent_id,status,provider,address,last_healthcheck_at,last_error,config')
    .eq('tenant_id', tenant.id)
    .eq('channel', 'whatsapp')
    .eq('is_primary', true)
    .maybeSingle();

  if (!endpoint) throw new Error('impulsionando_whatsapp_endpoint_unavailable');
  return { tenant, endpoint };
}

async function evolution(baseUrl: string, apiKey: string, path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', apikey: apiKey, ...(init?.headers || {}) },
    signal: AbortSignal.timeout(12000),
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 500) }; }
  return { response, data };
}

function providerStateOf(data: any): string | null {
  return data?.instance?.state || data?.state || data?.data?.state || null;
}

export const getImpulsionandoWhatsAppPairing = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = (context as any).user?.id || (context as any).session?.user?.id;
    if (!userId) throw new Error('Unauthorized');
    await assertAdmin(supabase, userId);

    const { tenant, endpoint } = await tenantAndEndpoint(supabase);
    const { baseUrl, apiKey, webhookSecret } = cfg();
    const credentialsConfigured = Boolean(baseUrl && apiKey);
    let providerState: string | null = null;
    let providerReachable = false;

    if (credentialsConfigured) {
      try {
        const { response, data } = await evolution(baseUrl, apiKey, `/instance/connectionState/${INSTANCE}`);
        providerReachable = response.status !== 502 && response.status !== 503 && response.status !== 504;
        providerState = providerStateOf(data);
      } catch {
        providerReachable = false;
      }
    }

    const connected = ['open', 'connected', 'CONNECTED'].includes(String(providerState));
    if (connected && endpoint.status !== 'ACTIVE') {
      await supabase.from('communication_channel_endpoints').update({
        provider: 'evolution_api',
        status: 'ACTIVE',
        last_error: null,
        last_healthcheck_at: new Date().toISOString(),
      }).eq('id', endpoint.id);
      await supabase.from('communication_whatsapp_pairing_sessions').update({
        status: 'CONNECTED',
        qr_payload: null,
        qr_expires_at: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq('tenant_id', tenant.id).eq('provider_session_id', INSTANCE).neq('status', 'CONNECTED');
    }

    return {
      ok: true,
      tenant: TENANT_SLUG,
      instance: INSTANCE,
      endpointStatus: connected ? 'ACTIVE' : endpoint.status,
      endpointProvider: connected ? 'evolution_api' : endpoint.provider,
      endpointAddress: endpoint.address,
      credentialsConfigured,
      webhookConfigured: Boolean(webhookSecret),
      providerReachable,
      providerState,
      connected,
    };
  });

export const startImpulsionandoWhatsAppPairing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = (context as any).user?.id || (context as any).session?.user?.id;
    if (!userId) throw new Error('Unauthorized');
    await assertAdmin(supabase, userId);

    const { tenant, endpoint } = await tenantAndEndpoint(supabase);
    const { baseUrl, apiKey, webhookSecret } = cfg();
    if (!baseUrl || !apiKey) {
      return { ok: false, blocked: true, reason: 'IMPULSIONANDO_EVOLUTION_CREDENTIALS_MISSING' };
    }

    let qr: string | null = null;
    let pairingCode: string | null = null;
    let connect = await evolution(baseUrl, apiKey, `/instance/connect/${INSTANCE}`);

    if (connect.response.status === 404) {
      const created = await evolution(baseUrl, apiKey, '/instance/create', {
        method: 'POST',
        body: JSON.stringify({ instanceName: INSTANCE, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      });
      if (!created.response.ok && created.response.status !== 409) {
        throw new Error(`evolution_create_failed_${created.response.status}`);
      }
      qr = created.data?.qrcode?.base64 || created.data?.base64 || null;
      pairingCode = created.data?.qrcode?.pairingCode || created.data?.pairingCode || null;
      connect = await evolution(baseUrl, apiKey, `/instance/connect/${INSTANCE}`);
    }

    if (!connect.response.ok) throw new Error(`evolution_connect_failed_${connect.response.status}`);
    qr = connect.data?.base64 || connect.data?.qrcode?.base64 || connect.data?.data?.Qrcode || connect.data?.data?.qrcode || qr;
    pairingCode = connect.data?.pairingCode || connect.data?.qrcode?.pairingCode || pairingCode;

    if (webhookSecret) {
      const webhook = await evolution(baseUrl, apiKey, `/webhook/set/${INSTANCE}`, {
        method: 'POST',
        body: JSON.stringify({
          enabled: true,
          url: 'https://impulsionando.com.br/api/communication/whatsapp/impulsionando',
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
          headers: { 'x-impulsionando-webhook-secret': webhookSecret },
          base64: true,
        }),
      });
      if (!webhook.response.ok) throw new Error(`evolution_webhook_failed_${webhook.response.status}`);
    }

    const now = new Date();
    const expiresAt = qr ? new Date(now.getTime() + PAIRING_TTL_MS).toISOString() : null;

    await supabase.from('communication_channel_endpoints').update({
      provider: 'evolution_api',
      status: 'PENDING_CONNECTION',
      secret_reference: 'IMPULSIONANDO_EVOLUTION_API_KEY',
      webhook_path: '/api/communication/whatsapp/impulsionando',
      config: {
        ...(endpoint.config || {}),
        instance: INSTANCE,
        qr_pairing: true,
        requires_credentials: false,
        provider: 'evolution_api',
        pairing_ui: '/admin/comunicacoes/whatsapp',
        agent_key: 'impulsionito-core',
      },
      last_error: null,
      last_healthcheck_at: now.toISOString(),
    }).eq('id', endpoint.id);

    await supabase.from('communication_whatsapp_pairing_sessions').insert({
      tenant_id: tenant.id,
      agent_id: endpoint.agent_id,
      provider: 'evolution_api',
      provider_session_id: INSTANCE,
      status: qr || pairingCode ? 'AWAITING_SCAN' : 'CONNECTING',
      qr_payload: null,
      qr_expires_at: expiresAt,
      phone_e164: endpoint.address,
      display_name: 'Impulsionando · Impulsionito',
      created_by: userId,
      metadata: { pairing_code_available: Boolean(pairingCode), qr_returned_to_authenticated_ui: Boolean(qr) },
    });

    return {
      ok: true,
      blocked: false,
      qr,
      pairingCode,
      instance: INSTANCE,
      tenantId: tenant.id,
      webhookConfigured: Boolean(webhookSecret),
      expiresAt,
    };
  });
