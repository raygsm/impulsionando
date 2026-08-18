import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

async function tenantForUser(supabase: any, userId: string) {
  const { data: memberships, error } = await supabase
    .from('communication_tenant_members')
    .select('tenant_id,role,communication_tenants(id,slug,name,company_id)')
    .eq('user_id', userId)
    .limit(20);
  if (error) throw new Error('Não foi possível identificar sua empresa.');
  const first = memberships?.[0];
  if (!first?.tenant_id) throw new Error('Seu usuário ainda não está vinculado a um ambiente de comunicação.');
  return { tenantId: first.tenant_id as string, tenant: first.communication_tenants, role: first.role as string };
}

export const getCommunicationWorkspace = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const userId = context.userId;
    const { tenantId, tenant, role } = await tenantForUser(supabase, userId);

    const [ratesRes, numbersRes, campaignsRes, importsRes, voicesRes] = await Promise.all([
      supabase.from('communication_usage_rates').select('channel,usage_type,unit_price_cents,currency,tenant_id,effective_from').eq('active', true).is('effective_until', null).or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).order('tenant_id', { ascending: false }),
      supabase.from('communication_whatsapp_numbers').select('id,phone_e164,display_name,purpose,queue_position,connection_status,health_status,compliance_status,is_enabled,is_default_official,last_healthcheck_at,last_error,created_at').eq('tenant_id', tenantId).order('purpose').order('queue_position', { ascending: true, nullsFirst: false }),
      supabase.from('communication_campaigns').select('id,name,channel,status,unit_price_cents,billable,scheduled_for,started_at,completed_at,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20),
      supabase.from('communication_import_batches').select('id,source_file_name,status,row_count,valid_rows,invalid_rows,headers,suggested_mapping,confirmed_mapping,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
      supabase.from('communication_voice_assets').select('id,name,voice_gender,language,status,duration_seconds,audio_ref,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
    ]);

    const ratesByChannel = new Map<string, any>();
    for (const row of ratesRes.data ?? []) if (!ratesByChannel.has(row.channel)) ratesByChannel.set(row.channel, row);

    const campaignIds = (campaignsRes.data ?? []).map((c: any) => c.id);
    let metrics: any[] = [];
    if (campaignIds.length) {
      const { data } = await supabase.from('communication_campaign_metrics').select('*').eq('tenant_id', tenantId).in('campaign_id', campaignIds);
      metrics = data ?? [];
    }

    return {
      tenant,
      role,
      rates: Array.from(ratesByChannel.values()),
      numbers: numbersRes.data ?? [],
      campaigns: campaignsRes.data ?? [],
      metrics,
      imports: importsRes.data ?? [],
      voices: voicesRes.data ?? [],
    };
  });

const numberSchema = z.object({
  phone: z.string().min(10),
  displayName: z.string().max(80).optional(),
  purpose: z.enum(['official_passive','campaign_outbound']),
});

export const addWhatsAppNumber = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => numberSchema.parse(v))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenantId } = await tenantForUser(supabase, context.userId);
    const { data: normalized } = await supabase.rpc('communication_normalize_br_phone', { p_value: data.phone });
    if (!normalized) throw new Error('Número inválido. Informe DDD e número do celular.');
    let queuePosition: number | null = null;
    if (data.purpose === 'campaign_outbound') {
      const { data: rows } = await supabase.from('communication_whatsapp_numbers').select('queue_position').eq('tenant_id', tenantId).eq('purpose','campaign_outbound').order('queue_position', { ascending: false }).limit(1);
      queuePosition = Number(rows?.[0]?.queue_position ?? 0) + 1;
    }
    const { data: row, error } = await supabase.from('communication_whatsapp_numbers').insert({
      tenant_id: tenantId,
      phone_e164: normalized,
      display_name: data.displayName || null,
      purpose: data.purpose,
      queue_position: queuePosition,
      provider: 'impulsionando_crm',
      connection_status: 'PENDING_CONNECTION',
      health_status: 'unknown',
      compliance_status: 'pending',
      is_default_official: data.purpose === 'official_passive',
      metadata: { connection_method: 'crm_dashboard_qr' },
    }).select('id,phone_e164,purpose,queue_position,connection_status').single();
    if (error) throw new Error(error.message.includes('duplicate') ? 'Este número já está cadastrado.' : 'Não foi possível adicionar o número.');
    return row;
  });

export const createVoiceAssetDraft = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ name: z.string().min(2).max(100), text: z.string().min(2).max(5000), gender: z.enum(['female','male']) }).parse(v))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenantId } = await tenantForUser(supabase, context.userId);
    const { data: row, error } = await supabase.from('communication_voice_assets').insert({
      tenant_id: tenantId,
      created_by: context.userId,
      name: data.name,
      source_text: data.text,
      voice_gender: data.gender,
      language: 'pt-BR',
      status: 'draft',
      synthesis_cost_cents: 0,
      metadata: { synthesis: 'impulsionito', free: true },
    }).select('id,name,voice_gender,status').single();
    if (error) throw new Error('Não foi possível salvar o texto de voz.');
    return row;
  });

export const createImportBatch = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ fileName: z.string().min(1), fileType: z.string().optional(), headers: z.array(z.string()).min(1) }).parse(v))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenantId } = await tenantForUser(supabase, context.userId);
    const { data: suggested, error: mapError } = await supabase.rpc('communication_suggest_import_mapping', { p_headers: data.headers });
    if (mapError) throw new Error('Não foi possível analisar as colunas da planilha.');
    const { data: row, error } = await supabase.from('communication_import_batches').insert({
      tenant_id: tenantId,
      created_by: context.userId,
      source_file_name: data.fileName,
      source_file_type: data.fileType || null,
      status: 'mapping_required',
      headers: data.headers,
      suggested_mapping: suggested ?? {},
    }).select('id,headers,suggested_mapping,status').single();
    if (error) throw new Error('Não foi possível iniciar a importação.');
    return row;
  });

export const confirmImportMapping = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ batchId: z.string().uuid(), mapping: z.record(z.string(), z.string().nullable()) }).parse(v))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenantId } = await tenantForUser(supabase, context.userId);
    const used = new Set(Object.values(data.mapping).filter(Boolean));
    const { data: batch } = await supabase.from('communication_import_batches').select('headers').eq('id', data.batchId).eq('tenant_id', tenantId).single();
    if (!batch) throw new Error('Importação não encontrada.');
    const ignored = (batch.headers ?? []).filter((h: string) => !used.has(h));
    const { error } = await supabase.from('communication_import_batches').update({ confirmed_mapping: data.mapping, ignored_columns: ignored, status: 'ready', updated_at: new Date().toISOString() }).eq('id', data.batchId).eq('tenant_id', tenantId);
    if (error) throw new Error('Não foi possível confirmar as colunas.');
    return { ok: true, ignoredColumns: ignored };
  });
