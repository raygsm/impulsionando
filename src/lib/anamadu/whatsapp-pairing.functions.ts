import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const TENANT_SLUG = 'anamadu';
const INSTANCE = 'anamadu-annita';

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (!data) throw new Error('Forbidden: admin only');
}

function cfg() {
  return {
    baseUrl: process.env.ANAMADU_EVOLUTION_BASE_URL?.trim().replace(/\/$/, '') || '',
    apiKey: process.env.ANAMADU_EVOLUTION_API_KEY?.trim() || '',
  };
}

async function tenantAndEndpoint(supabase: any) {
  const { data: tenant, error } = await supabase.from('communication_tenants').select('id,company_id').eq('slug', TENANT_SLUG).eq('active', true).maybeSingle();
  if (error || !tenant) throw new Error('anamadu_tenant_unavailable');
  const { data: endpoint } = await supabase.from('communication_channel_endpoints').select('id,status,provider,address,last_healthcheck_at,last_error,config').eq('tenant_id', tenant.id).eq('channel', 'whatsapp').eq('is_primary', true).maybeSingle();
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

export const getAnaMaduWhatsAppPairing = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = (context as any).user?.id || (context as any).session?.user?.id;
    if (!userId) throw new Error('Unauthorized');
    await assertAdmin(supabase, userId);
    const { endpoint } = await tenantAndEndpoint(supabase);
    const { baseUrl, apiKey } = cfg();
    const credentialsConfigured = Boolean(baseUrl && apiKey);
    let providerState: string | null = null;
    let providerReachable = false;
    if (credentialsConfigured) {
      try {
        const { response, data } = await evolution(baseUrl, apiKey, `/instance/connectionState/${INSTANCE}`);
        providerReachable = response.status !== 502 && response.status !== 503 && response.status !== 504;
        providerState = data?.instance?.state || data?.state || data?.data?.state || null;
      } catch { providerReachable = false; }
    }
    return {
      ok: true,
      tenant: TENANT_SLUG,
      instance: INSTANCE,
      endpointStatus: endpoint?.status || 'NOT_PROVISIONED',
      endpointProvider: endpoint?.provider || null,
      endpointAddress: endpoint?.address || null,
      credentialsConfigured,
      providerReachable,
      providerState,
      connected: ['open','connected','CONNECTED'].includes(String(providerState)),
    };
  });

export const startAnaMaduWhatsAppPairing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = (context as any).user?.id || (context as any).session?.user?.id;
    if (!userId) throw new Error('Unauthorized');
    await assertAdmin(supabase, userId);
    const { tenant, endpoint } = await tenantAndEndpoint(supabase);
    const { baseUrl, apiKey } = cfg();
    if (!baseUrl || !apiKey) return { ok: false, blocked: true, reason: 'ANAMADU_EVOLUTION_CREDENTIALS_MISSING' };

    let qr: string | null = null;
    let pairingCode: string | null = null;
    let connect = await evolution(baseUrl, apiKey, `/instance/connect/${INSTANCE}`);
    if (connect.response.status === 404) {
      const created = await evolution(baseUrl, apiKey, '/instance/create', {
        method: 'POST',
        body: JSON.stringify({ instanceName: INSTANCE, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      });
      if (!created.response.ok && created.response.status !== 409) throw new Error(`evolution_create_failed_${created.response.status}`);
      qr = created.data?.qrcode?.base64 || created.data?.base64 || null;
      pairingCode = created.data?.qrcode?.pairingCode || created.data?.pairingCode || null;
      connect = await evolution(baseUrl, apiKey, `/instance/connect/${INSTANCE}`);
    }
    if (!connect.response.ok) throw new Error(`evolution_connect_failed_${connect.response.status}`);
    qr = connect.data?.base64 || connect.data?.qrcode?.base64 || connect.data?.data?.Qrcode || connect.data?.data?.qrcode || qr;
    pairingCode = connect.data?.pairingCode || connect.data?.qrcode?.pairingCode || pairingCode;

    const webhookSecret = process.env.ANAMADU_EVOLUTION_WEBHOOK_SECRET?.trim() || '';
    if (webhookSecret) {
      await evolution(baseUrl, apiKey, `/webhook/set/${INSTANCE}`, {
        method: 'POST',
        body: JSON.stringify({
          enabled: true,
          url: 'https://anamadu.impulsionando.com.br/api/anamadu/whatsapp/webhook',
          events: ['MESSAGES_UPSERT','CONNECTION_UPDATE','QRCODE_UPDATED'],
          headers: { 'x-impulsionando-webhook-secret': webhookSecret },
          base64: true,
        }),
      });
    }

    if (endpoint?.id) {
      await supabase.from('communication_channel_endpoints').update({
        provider: 'evolution_api',
        status: 'PENDING_CONNECTION',
        secret_reference: 'ANAMADU_EVOLUTION_API_KEY',
        webhook_path: '/api/anamadu/whatsapp/webhook',
        config: { ...(endpoint.config || {}), instance: INSTANCE, qr_pairing: true, requires_credentials: false, provider: 'evolution_api' },
        last_error: null,
        last_healthcheck_at: new Date().toISOString(),
      }).eq('id', endpoint.id);
    }
    return { ok: true, blocked: false, qr, pairingCode, instance: INSTANCE, tenantId: tenant.id };
  });
