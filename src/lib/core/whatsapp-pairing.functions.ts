import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const PROVIDER = 'evolution_api';
const DEFAULT_BASE_URL_ENV = 'IMPULSIONANDO_EVOLUTION_BASE_URL';
const DEFAULT_API_KEY_ENV = 'IMPULSIONANDO_EVOLUTION_API_KEY';
const DEFAULT_WEBHOOK_SECRET_ENV = 'IMPULSIONANDO_EVOLUTION_WEBHOOK_SECRET';

async function assertTenantAccess(supabase: any, userId: string, tenantSlug: string) {
  const { data: isStaff } = await supabase.rpc('is_impulsionando_staff', { p_user_id: userId });
  if (isStaff) return;

  const { data: tenant } = await supabase.from('communication_tenants').select('id').eq('slug', tenantSlug).eq('active', true).maybeSingle();
  if (!tenant) throw new Error('TENANT_NOT_FOUND');

  const { data: member } = await supabase.from('communication_tenant_members').select('id').eq('tenant_id', tenant.id).eq('user_id', userId).maybeSingle();
  if (!member) throw new Error('FORBIDDEN_TENANT_ACCESS');
}

function providerConfig() {
  const baseUrl = (process.env[DEFAULT_BASE_URL_ENV] || process.env.EVOLUTION_BASE_URL || '').trim().replace(/\/$/, '');
  const apiKey = (process.env[DEFAULT_API_KEY_ENV] || process.env.EVOLUTION_API_KEY || '').trim();
  const webhookSecret = (process.env[DEFAULT_WEBHOOK_SECRET_ENV] || process.env.EVOLUTION_WEBHOOK_SECRET || '').trim();
  return { baseUrl, apiKey, webhookSecret };
}

function safeInstanceName(tenantSlug: string, agentKey: string) {
  const raw = `${tenantSlug}-${agentKey}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return raw.slice(0, 64);
}

async function evolution(baseUrl: string, apiKey: string, path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', apikey: apiKey, ...(init?.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 500) }; }
  return { response, data };
}

async function contextForTenant(supabase: any, tenantSlug: string) {
  const { data: tenant, error: tenantError } = await supabase
    .from('communication_tenants')
    .select('id,company_id,slug,display_name,active')
    .eq('slug', tenantSlug)
    .eq('active', true)
    .maybeSingle();
  if (tenantError || !tenant) throw new Error('TENANT_NOT_FOUND');

  const { data: endpoint } = await supabase
    .from('communication_channel_endpoints')
    .select('id,status,provider,address,is_primary,secret_reference,webhook_path,config')
    .eq('tenant_id', tenant.id)
    .eq('channel', 'whatsapp')
    .eq('is_primary', true)
    .maybeSingle();

  const { data: agent } = await supabase
    .from('communication_agents')
    .select('id,name')
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!agent) throw new Error('ACTIVE_AGENT_NOT_FOUND');

  const { data: runtime } = await supabase
    .from('communication_agent_runtime')
    .select('agent_key,instance_type,active')
    .eq('agent_id', agent.id)
    .eq('active', true)
    .maybeSingle();
  if (!runtime?.agent_key) throw new Error('ACTIVE_AGENT_RUNTIME_NOT_FOUND');

  const instance = endpoint?.config?.evolution_instance || safeInstanceName(tenant.slug, runtime.agent_key);
  return { tenant, endpoint, agent, runtime, instance };
}

export const getCoreWhatsAppPairing = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }: any) => {
    const supabase = context.supabase as any;
    const userId = context.user?.id || context.session?.user?.id;
    const tenantSlug = String(data?.tenantSlug || '').trim();
    if (!userId) throw new Error('UNAUTHORIZED');
    if (!tenantSlug) throw new Error('TENANT_REQUIRED');
    await assertTenantAccess(supabase, userId, tenantSlug);

    const ctx = await contextForTenant(supabase, tenantSlug);
    const { baseUrl, apiKey } = providerConfig();
    const credentialsConfigured = Boolean(baseUrl && apiKey);
    let providerState: string | null = null;
    let providerReachable = false;

    if (credentialsConfigured) {
      try {
        const { response, data: providerData } = await evolution(baseUrl, apiKey, `/instance/connectionState/${ctx.instance}`);
        providerReachable = response.status !== 502 && response.status !== 503 && response.status !== 504;
        providerState = providerData?.instance?.state || providerData?.state || providerData?.data?.state || null;
      } catch {
        providerReachable = false;
      }
    }

    return {
      ok: true,
      tenant: ctx.tenant.slug,
      tenantName: ctx.tenant.display_name,
      agentKey: ctx.runtime.agent_key,
      agentName: ctx.agent.name,
      instance: ctx.instance,
      endpointStatus: ctx.endpoint?.status || 'NOT_PROVISIONED',
      endpointProvider: ctx.endpoint?.provider || null,
      endpointAddress: ctx.endpoint?.address || null,
      credentialsConfigured,
      providerReachable,
      providerState,
      connected: ['open', 'connected', 'CONNECTED'].includes(String(providerState)),
    };
  });

export const startCoreWhatsAppPairing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }: any) => {
    const supabase = context.supabase as any;
    const userId = context.user?.id || context.session?.user?.id;
    const tenantSlug = String(data?.tenantSlug || '').trim();
    if (!userId) throw new Error('UNAUTHORIZED');
    if (!tenantSlug) throw new Error('TENANT_REQUIRED');
    await assertTenantAccess(supabase, userId, tenantSlug);

    const ctx = await contextForTenant(supabase, tenantSlug);
    const { baseUrl, apiKey, webhookSecret } = providerConfig();
    if (!baseUrl || !apiKey || !webhookSecret) {
      return { ok: false, blocked: true, reason: 'EVOLUTION_PROVIDER_NOT_CONFIGURED' };
    }

    let qr: string | null = null;
    let pairingCode: string | null = null;
    let connect = await evolution(baseUrl, apiKey, `/instance/connect/${ctx.instance}`);

    if (connect.response.status === 404) {
      const created = await evolution(baseUrl, apiKey, '/instance/create', {
        method: 'POST',
        body: JSON.stringify({ instanceName: ctx.instance, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      });
      if (!created.response.ok && ![403, 409].includes(created.response.status)) {
        throw new Error(`EVOLUTION_CREATE_FAILED_${created.response.status}`);
      }
      qr = created.data?.qrcode?.base64 || created.data?.base64 || null;
      pairingCode = created.data?.qrcode?.pairingCode || created.data?.pairingCode || null;
      connect = await evolution(baseUrl, apiKey, `/instance/connect/${ctx.instance}`);
    }

    if (!connect.response.ok) throw new Error(`EVOLUTION_CONNECT_FAILED_${connect.response.status}`);
    qr = connect.data?.base64 || connect.data?.qrcode?.base64 || connect.data?.data?.Qrcode || connect.data?.data?.qrcode || qr;
    pairingCode = connect.data?.pairingCode || connect.data?.qrcode?.pairingCode || pairingCode;

    const webhookUrl = `https://${tenantSlug === 'impulsionando' ? 'impulsionando.com.br' : `${tenantSlug}.impulsionando.com.br`}/api/agents/omnichannel/evolution/whatsapp?tenant=${encodeURIComponent(tenantSlug)}`;
    const webhookResult = await evolution(baseUrl, apiKey, `/webhook/set/${ctx.instance}`, {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        headers: { 'x-impulsionando-webhook-secret': webhookSecret },
        base64: true,
      }),
    });
    if (!webhookResult.response.ok) throw new Error(`EVOLUTION_WEBHOOK_FAILED_${webhookResult.response.status}`);

    if (ctx.endpoint?.id) {
      await supabase.from('communication_channel_endpoints').update({
        provider: PROVIDER,
        status: 'PENDING_CONNECTION',
        secret_reference: `env:${DEFAULT_API_KEY_ENV}`,
        webhook_path: '/api/agents/omnichannel/evolution/whatsapp',
        config: {
          ...(ctx.endpoint.config || {}),
          provider: PROVIDER,
          connection_method: 'dashboard_qr',
          evolution_instance: ctx.instance,
          agent_key: ctx.runtime.agent_key,
          qr_pairing: true,
          requires_credentials: false,
        },
        last_error: null,
        last_healthcheck_at: new Date().toISOString(),
      }).eq('id', ctx.endpoint.id);
    }

    return {
      ok: true,
      blocked: false,
      qr,
      pairingCode,
      instance: ctx.instance,
      tenant: ctx.tenant.slug,
      agentKey: ctx.runtime.agent_key,
    };
  });
