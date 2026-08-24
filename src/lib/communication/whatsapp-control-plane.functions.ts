import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

const PAIRING_TTL_MS = 2 * 60 * 1000;

function evolutionConfig() {
  return {
    baseUrl: (process.env.EVOLUTION_BASE_URL || '').trim().replace(/\/$/, ''),
    apiKey: (process.env.EVOLUTION_API_KEY || '').trim(),
    origin: (process.env.EVOLUTION_ORIGIN || 'https://impulsionando.com.br').trim(),
  };
}

async function evolution(path: string, init?: RequestInit) {
  const { baseUrl, apiKey, origin } = evolutionConfig();
  if (!baseUrl || !apiKey) throw new Error('EVOLUTION_GATEWAY_NOT_CONFIGURED');
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      apikey: apiKey,
      Origin: origin,
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(12_000),
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 500) }; }
  return { response, data };
}

function providerStateOf(data: any): string | null {
  return data?.instance?.state || data?.state || data?.data?.state || null;
}

function isConnectedState(state: unknown) {
  return ['open', 'connected', 'CONNECTED'].includes(String(state));
}

async function isStaff(supabase: any, userId: string) {
  const { data } = await supabase.rpc('is_impulsionando_staff', { _user: userId });
  return Boolean(data);
}

async function canManageTenant(supabase: any, userId: string, tenantId: string) {
  if (await isStaff(supabase, userId)) return true;
  const { data } = await supabase
    .from('communication_tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .in('role', ['OWNER', 'ADMIN'])
    .maybeSingle();
  return Boolean(data);
}

async function resolveTenant(supabase: any, slug: string) {
  const { data: tenant, error } = await supabase
    .from('communication_tenants')
    .select('id,company_id,slug,display_name,active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error || !tenant) throw new Error('WHATSAPP_TENANT_NOT_FOUND');

  const { data: settings } = await supabase
    .from('communication_whatsapp_tenant_settings')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle();
  if (!settings) throw new Error('WHATSAPP_TENANT_NOT_PROVISIONED');

  const { data: endpoint } = await supabase
    .from('communication_channel_endpoints')
    .select('id,agent_id,status,provider,address,display_address,last_healthcheck_at,last_error,config')
    .eq('tenant_id', tenant.id)
    .eq('channel', 'whatsapp')
    .eq('is_primary', true)
    .maybeSingle();
  if (!endpoint) throw new Error('WHATSAPP_ENDPOINT_NOT_FOUND');

  return { tenant, settings, endpoint };
}

async function syncConnectionState(supabase: any, tenant: any, settings: any, endpoint: any) {
  const cfg = evolutionConfig();
  let providerReachable = false;
  let providerState: string | null = null;
  let providerError: string | null = null;

  if (cfg.baseUrl && cfg.apiKey && settings.enabled) {
    try {
      const { response, data } = await evolution(`/instance/connectionState/${encodeURIComponent(settings.instance_name)}`);
      providerReachable = response.status < 500;
      providerState = providerStateOf(data);
      if (!response.ok && response.status !== 404) providerError = `HTTP_${response.status}`;
    } catch (error) {
      providerError = error instanceof Error ? error.message : String(error);
    }
  }

  const connected = isConnectedState(providerState);
  const now = new Date().toISOString();
  const nextStatus = connected ? 'ACTIVE' : settings.enabled ? 'PENDING_CONNECTION' : 'DISABLED';

  if (endpoint.status !== nextStatus || endpoint.provider !== 'evolution_api' || endpoint.last_error !== providerError) {
    await supabase
      .from('communication_channel_endpoints')
      .update({
        provider: 'evolution_api',
        status: nextStatus,
        last_error: providerError,
        last_healthcheck_at: now,
        updated_at: now,
      })
      .eq('id', endpoint.id);
  }

  if (connected) {
    await supabase
      .from('communication_whatsapp_pairing_sessions')
      .update({
        status: 'CONNECTED',
        qr_payload: null,
        qr_expires_at: null,
        connected_at: now,
        disconnected_at: null,
        last_seen_at: now,
        last_error: null,
        updated_at: now,
      })
      .eq('tenant_id', tenant.id)
      .eq('provider_session_id', settings.instance_name)
      .neq('status', 'CONNECTED');
  }

  return {
    connected,
    providerReachable,
    providerState,
    providerError,
    endpointStatus: nextStatus,
  };
}

export const listWhatsAppTenantConnections = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const staff = await isStaff(supabase, userId);

    let tenantsQuery = supabase
      .from('communication_tenants')
      .select('id,company_id,slug,display_name,active')
      .eq('active', true)
      .order('display_name');

    if (!staff) {
      const { data: memberships } = await supabase
        .from('communication_tenant_members')
        .select('tenant_id')
        .eq('user_id', userId);
      const ids = (memberships ?? []).map((m: any) => m.tenant_id);
      if (!ids.length) return { items: [] };
      tenantsQuery = tenantsQuery.in('id', ids);
    }

    const { data: tenants, error } = await tenantsQuery;
    if (error) throw new Error(error.message);

    const items = [];
    for (const tenant of tenants ?? []) {
      const { data: settings } = await supabase
        .from('communication_whatsapp_tenant_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();
      const { data: endpoint } = await supabase
        .from('communication_channel_endpoints')
        .select('id,agent_id,status,provider,address,display_address,last_healthcheck_at,last_error,config')
        .eq('tenant_id', tenant.id)
        .eq('channel', 'whatsapp')
        .eq('is_primary', true)
        .maybeSingle();
      if (!settings || !endpoint) continue;
      const live = await syncConnectionState(supabase, tenant, settings, endpoint);
      items.push({
        tenantId: tenant.id,
        companyId: tenant.company_id,
        slug: tenant.slug,
        displayName: tenant.display_name,
        enabled: settings.enabled,
        allowTenantReconnect: settings.allow_tenant_reconnect,
        autoReconnect: settings.auto_reconnect,
        agentEnabled: settings.agent_enabled,
        instance: settings.instance_name,
        address: endpoint.address,
        provider: 'evolution_api',
        ...live,
      });
    }
    return { items };
  });

const TenantInput = z.object({ slug: z.string().min(2).max(80) });

export const getTenantWhatsAppConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TenantInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenant, settings, endpoint } = await resolveTenant(supabase, data.slug);
    const staff = await isStaff(supabase, context.userId);
    if (!staff) {
      const { data: member } = await supabase
        .from('communication_tenant_members')
        .select('role')
        .eq('tenant_id', tenant.id)
        .eq('user_id', context.userId)
        .maybeSingle();
      if (!member) throw new Error('FORBIDDEN');
    }
    const live = await syncConnectionState(supabase, tenant, settings, endpoint);
    return {
      tenantId: tenant.id,
      companyId: tenant.company_id,
      slug: tenant.slug,
      displayName: tenant.display_name,
      enabled: settings.enabled,
      allowTenantReconnect: settings.allow_tenant_reconnect,
      autoReconnect: settings.auto_reconnect,
      agentEnabled: settings.agent_enabled,
      instance: settings.instance_name,
      address: endpoint.address,
      provider: 'evolution_api',
      credentialsConfigured: Boolean(evolutionConfig().baseUrl && evolutionConfig().apiKey),
      ...live,
    };
  });

export const startTenantWhatsAppPairing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TenantInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenant, settings, endpoint } = await resolveTenant(supabase, data.slug);
    const staff = await isStaff(supabase, context.userId);
    if (!staff && (!settings.allow_tenant_reconnect || !(await canManageTenant(supabase, context.userId, tenant.id)))) {
      throw new Error('FORBIDDEN');
    }
    if (!settings.enabled) throw new Error('WHATSAPP_DISABLED_FOR_TENANT');

    let qr: string | null = null;
    let pairingCode: string | null = null;
    const instance = settings.instance_name;
    let connect = await evolution(`/instance/connect/${encodeURIComponent(instance)}`);

    if (connect.response.status === 404) {
      const created = await evolution('/instance/create', {
        method: 'POST',
        body: JSON.stringify({ instanceName: instance, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      });
      if (!created.response.ok && created.response.status !== 409) {
        throw new Error(`EVOLUTION_CREATE_FAILED_${created.response.status}`);
      }
      qr = created.data?.qrcode?.base64 || created.data?.base64 || null;
      pairingCode = created.data?.qrcode?.pairingCode || created.data?.pairingCode || null;
      connect = await evolution(`/instance/connect/${encodeURIComponent(instance)}`);
    }

    if (!connect.response.ok) throw new Error(`EVOLUTION_CONNECT_FAILED_${connect.response.status}`);
    qr = connect.data?.base64 || connect.data?.qrcode?.base64 || connect.data?.data?.Qrcode || connect.data?.data?.qrcode || qr;
    pairingCode = connect.data?.pairingCode || connect.data?.qrcode?.pairingCode || pairingCode;

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = qr ? new Date(now.getTime() + PAIRING_TTL_MS).toISOString() : null;

    await supabase
      .from('communication_channel_endpoints')
      .update({
        provider: 'evolution_api',
        status: 'PENDING_CONNECTION',
        secret_reference: 'EVOLUTION_API_KEY',
        config: {
          ...(endpoint.config || {}),
          instance,
          qr_pairing: true,
          provider: 'evolution_api',
          tenant_managed_reconnect: settings.allow_tenant_reconnect,
          auto_reconnect: settings.auto_reconnect,
        },
        last_error: null,
        last_healthcheck_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', endpoint.id);

    await supabase.from('communication_whatsapp_pairing_sessions').insert({
      tenant_id: tenant.id,
      agent_id: endpoint.agent_id,
      provider: 'evolution_api',
      provider_session_id: instance,
      status: qr || pairingCode ? 'AWAITING_SCAN' : 'CONNECTING',
      qr_payload: null,
      qr_expires_at: expiresAt,
      phone_e164: endpoint.address,
      display_name: tenant.display_name,
      created_by: context.userId,
      reconnect_requested_at: nowIso,
      reconnect_count: 1,
      metadata: {
        pairing_code_available: Boolean(pairingCode),
        qr_returned_to_authenticated_ui: Boolean(qr),
        initiated_by_staff: staff,
      },
    });

    return { ok: true, tenantId: tenant.id, slug: tenant.slug, instance, qr, pairingCode, expiresAt };
  });

const SettingsInput = z.object({
  slug: z.string().min(2).max(80),
  enabled: z.boolean().optional(),
  allowTenantReconnect: z.boolean().optional(),
  autoReconnect: z.boolean().optional(),
  agentEnabled: z.boolean().optional(),
});

export const updateTenantWhatsAppSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SettingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenant, settings } = await resolveTenant(supabase, data.slug);
    const staff = await isStaff(supabase, context.userId);
    if (!staff && !(await canManageTenant(supabase, context.userId, tenant.id))) throw new Error('FORBIDDEN');

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof data.enabled === 'boolean') {
      if (!staff) throw new Error('ONLY_IMPULSIONANDO_CAN_ENABLE_DISABLE');
      patch.enabled = data.enabled;
    }
    if (typeof data.allowTenantReconnect === 'boolean') {
      if (!staff) throw new Error('ONLY_IMPULSIONANDO_CAN_CHANGE_RECONNECT_POLICY');
      patch.allow_tenant_reconnect = data.allowTenantReconnect;
    }
    if (typeof data.autoReconnect === 'boolean') patch.auto_reconnect = data.autoReconnect;
    if (typeof data.agentEnabled === 'boolean') patch.agent_enabled = data.agentEnabled;

    const { error } = await supabase
      .from('communication_whatsapp_tenant_settings')
      .update(patch)
      .eq('tenant_id', tenant.id);
    if (error) throw new Error(error.message);
    return { ok: true, previous: settings, updated: patch };
  });
