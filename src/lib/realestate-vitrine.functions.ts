/**
 * Vitrine imobiliária — server functions para o admin.
 * Listagens, atualização de status, contadores, atribuição.
 */
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

const ListInterestsInput = z.object({
  companyId: z.string().uuid(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(200).default(50),
})

export const listVitrineInterests = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListInterestsInput>) => ListInterestsInput.parse(d))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize
    const to = from + data.pageSize - 1
    let q = context.supabase
      .from('realestate_interests')
      .select(`id, created_at, updated_at, kind, status, contact_name, contact_email, contact_phone, contact_whatsapp,
               message, source, last_action_at, responded_at, broker_user_id, lead_id,
               property:property_id ( id, title, reference_code )`, { count: 'exact' })
      .eq('company_id', data.companyId)
      .order('created_at', { ascending: false })
      .range(from, to)
    if (data.status && data.status !== 'todos') q = q.eq('status', data.status)
    if (data.search && data.search.trim()) {
      const s = `%${data.search.trim()}%`
      q = q.or(`contact_name.ilike.${s},contact_email.ilike.${s},contact_phone.ilike.${s}`)
    }
    const { data: rows, error, count } = await q
    if (error) throw error
    return { rows: rows ?? [], total: count ?? 0 }
  })

const UpdateInterestInput = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  status: z.enum(['novo', 'em_atendimento', 'respondido', 'convertido', 'perdido', 'arquivado']).optional(),
  brokerUserId: z.string().uuid().nullable().optional(),
})

export const updateVitrineInterest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof UpdateInterestInput>) => UpdateInterestInput.parse(d))
  .handler(async ({ data, context }) => {
    const patch: { last_action_at: string; status?: string; responded_at?: string; broker_user_id?: string | null } = { last_action_at: new Date().toISOString() }
    if (data.status) {
      patch.status = data.status
      if (data.status === 'respondido') patch.responded_at = new Date().toISOString()
    }
    if (data.brokerUserId !== undefined) patch.broker_user_id = data.brokerUserId
    const { data: row, error } = await context.supabase
      .from('realestate_interests')
      .update(patch)
      .eq('id', data.id)
      .eq('company_id', data.companyId)
      .select('id, status, broker_user_id')
      .single()
    if (error) throw error
    return row
  })

const ListMessagesInput = z.object({
  companyId: z.string().uuid(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(200).default(50),
})

export const listVitrineMessages = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListMessagesInput>) => ListMessagesInput.parse(d))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize
    const to = from + data.pageSize - 1
    let q = context.supabase
      .from('realestate_internal_messages')
      .select(`id, created_at, updated_at, channel, request_kind, status, subject, body,
               contact_name, contact_email, contact_phone, assigned_user_id, replies_count, last_reply_at,
               property:property_id ( id, title, reference_code ), interest_id, intent_id, lead_id`,
              { count: 'exact' })
      .eq('company_id', data.companyId)
      .order('created_at', { ascending: false })
      .range(from, to)
    if (data.status && data.status !== 'todos') q = q.eq('status', data.status)
    if (data.search && data.search.trim()) {
      const s = `%${data.search.trim()}%`
      q = q.or(`subject.ilike.${s},contact_name.ilike.${s},contact_email.ilike.${s}`)
    }
    const { data: rows, error, count } = await q
    if (error) throw error
    return { rows: rows ?? [], total: count ?? 0 }
  })

const UpdateMessageInput = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  status: z.enum(['nova', 'em_atendimento', 'respondida', 'arquivada']).optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
})

export const updateVitrineMessage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof UpdateMessageInput>) => UpdateMessageInput.parse(d))
  .handler(async ({ data, context }) => {
    const patch: { status?: string; last_reply_at?: string; assigned_user_id?: string | null } = {}
    if (data.status) {
      patch.status = data.status
      if (data.status === 'respondida') {
        patch.last_reply_at = new Date().toISOString()
      }
    }
    if (data.assignedUserId !== undefined) patch.assigned_user_id = data.assignedUserId
    const { data: row, error } = await context.supabase
      .from('realestate_internal_messages')
      .update(patch)
      .eq('id', data.id)
      .eq('company_id', data.companyId)
      .select('id, status, assigned_user_id')
      .single()
    if (error) throw error
    return row
  })

const CountersInput = z.object({ companyId: z.string().uuid() })

export const getVitrineCounters = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof CountersInput>) => CountersInput.parse(d))
  .handler(async ({ data, context }) => {
    const company = data.companyId
    const tx = context.supabase

    const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    const since7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

    const [interestsTotal, interestsNew, interestsAttending, interests30, messagesNew, messagesTotal,
           searchesActive, searchesTotal, propertiesActive, propertiesFeatured, leadsVitrine] = await Promise.all([
      tx.from('realestate_interests').select('id', { count: 'exact', head: true }).eq('company_id', company),
      tx.from('realestate_interests').select('id', { count: 'exact', head: true }).eq('company_id', company).eq('status', 'novo'),
      tx.from('realestate_interests').select('id', { count: 'exact', head: true }).eq('company_id', company).eq('status', 'em_atendimento'),
      tx.from('realestate_interests').select('id', { count: 'exact', head: true }).eq('company_id', company).gte('created_at', since30),
      tx.from('realestate_internal_messages').select('id', { count: 'exact', head: true }).eq('company_id', company).eq('status', 'nova'),
      tx.from('realestate_internal_messages').select('id', { count: 'exact', head: true }).eq('company_id', company),
      tx.from('realestate_search_intents').select('id', { count: 'exact', head: true }).eq('company_id', company).eq('status', 'ativo'),
      tx.from('realestate_search_intents').select('id', { count: 'exact', head: true }).eq('company_id', company),
      tx.from('realestate_properties').select('id', { count: 'exact', head: true }).eq('company_id', company).eq('status', 'ativo').eq('is_published', true).eq('approval_status', 'approved'),
      tx.from('realestate_properties').select('id', { count: 'exact', head: true }).eq('company_id', company).eq('status', 'ativo').eq('is_published', true).eq('approval_status', 'approved'),
      tx.from('crm_leads').select('id', { count: 'exact', head: true }).eq('company_id', company).gte('created_at', since7).like('source', 'vitrine%'),
    ])

    return {
      interestsTotal: interestsTotal.count ?? 0,
      interestsNew: interestsNew.count ?? 0,
      interestsAttending: interestsAttending.count ?? 0,
      interestsLast30Days: interests30.count ?? 0,
      messagesNew: messagesNew.count ?? 0,
      messagesTotal: messagesTotal.count ?? 0,
      searchesActive: searchesActive.count ?? 0,
      searchesTotal: searchesTotal.count ?? 0,
      propertiesActive: propertiesActive.count ?? 0,
      propertiesFeatured: propertiesFeatured.count ?? 0,
      leadsFromVitrineLast7Days: leadsVitrine.count ?? 0,
    }
  })

const ExportInput = z.object({
  companyId: z.string().uuid(),
  dataset: z.enum(['interests', 'searches', 'messages']),
  status: z.string().optional(), // 'todos' | record status | 'falha' | 'enviado'
  search: z.string().optional(),
  from: z.string().optional(),       // created_at >=
  to: z.string().optional(),         // created_at <=
  emailFrom: z.string().optional(),  // email_at >=
  emailTo: z.string().optional(),    // email_at <=
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(50).max(5000).default(1000),
  exportId: z.string().uuid(),
  format: z.enum(['csv', 'pdf']).default('csv'),
  isFinal: z.boolean().default(false),
})

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => csvEscape(c.label)).join(';')
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c.key])).join(';'))
  return '\uFEFF' + [header, ...lines].join('\n')
}

const EMAIL_STATUS_FILTERS = new Set(['falha', 'enviado'])

type EmailLogSummary = { requestId: string | null; lastStatus: string | null; lastError: string | null; lastAt: string | null }

export async function fetchEmailLogMap(
  sb: any,
  field: 'interest_id' | 'intent_id',
  ids: string[],
  window?: { from?: string; to?: string },
): Promise<Map<string, EmailLogSummary>> {
  const map = new Map<string, EmailLogSummary>()
  if (ids.length === 0) return map
  const CHUNK = 200
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK)
    let q = sb
      .from('email_send_log')
      .select('id, status, error_message, metadata, created_at')
      .order('created_at', { ascending: false })
      .in(`metadata->>${field}`, slice as any)
    if (window?.from) q = q.gte('created_at', window.from)
    if (window?.to) q = q.lte('created_at', window.to)
    const { data: logs, error } = await q
    if (error) continue
    for (const log of (logs ?? []) as any[]) {
      const key = log.metadata?.[field] as string | undefined
      if (!key || map.has(key)) continue
      map.set(key, {
        requestId: log.metadata?.request_id ?? null,
        lastStatus: log.status ?? null,
        lastError: log.error_message ?? null,
        lastAt: log.created_at ?? null,
      })
    }
  }
  return map
}

export function matchesEmailFilter(emailFilter: string | null, status: string | null): boolean {
  if (!emailFilter) return true
  if (emailFilter === 'falha') return status === 'failed'
  if (emailFilter === 'enviado') return status === 'queued' || status === 'sent'
  return true
}

/**
 * Resolves which DB columns/joins each "status do admin" maps to.
 * Used by the export and validated by conceptual tests in tests/.
 */
export const ADMIN_STATUS_MAPPING = {
  novo: { source: 'realestate_interests.status', value: 'novo', joins: [] as string[] },
  interesse: { source: 'realestate_interests', joins: ['property:property_id', 'email_send_log via metadata.interest_id'] },
  busca_salva: { source: 'realestate_search_intents', joins: ['email_send_log via metadata.intent_id'] },
  mensagem_enviada: { source: 'email_send_log.status', value: ['queued', 'sent'], joins: ['realestate_interests.id = metadata.interest_id'] },
  falha: { source: 'email_send_log.status', value: 'failed', joins: ['realestate_interests.id = metadata.interest_id', 'realestate_search_intents.id = metadata.intent_id'] },
} as const

export const exportVitrineDataset = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ExportInput>) => ExportInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase
    const fromIdx = (data.page - 1) * data.pageSize
    const toIdx = fromIdx + data.pageSize - 1

    const applyStatus = data.status && data.status !== 'todos' && !EMAIL_STATUS_FILTERS.has(data.status)
    const emailFilter = data.status && EMAIL_STATUS_FILTERS.has(data.status) ? data.status : null
    const emailWindow = { from: data.emailFrom, to: data.emailTo }

    // Audit log: upsert on first batch, update progress otherwise
    if (data.page === 1) {
      await sb.from('vitrine_export_logs').upsert({
        export_id: data.exportId,
        company_id: data.companyId,
        user_id: context.userId,
        dataset: data.dataset,
        format: data.format,
        status_filter: data.status ?? null,
        search_term: data.search ?? null,
        date_from: data.from ?? null,
        date_to: data.to ?? null,
        email_from: data.emailFrom ?? null,
        email_to: data.emailTo ?? null,
        status: 'running',
      }, { onConflict: 'export_id' })
    }

    const base = (q: any) => {
      let qq = q.eq('company_id', data.companyId)
      if (applyStatus) qq = qq.eq('status', data.status)
      if (data.from) qq = qq.gte('created_at', data.from)
      if (data.to) qq = qq.lte('created_at', data.to)
      return qq
    }

    const exportIdCol = { key: 'export_id', label: 'Export ID' }
    let result: { filename: string; csv: string; rows: any[]; columns: { key: string; label: string }[]; total: number }

    try {
      if (data.dataset === 'interests') {
        let q = base(sb.from('realestate_interests').select(
          `id, created_at, kind, status, contact_name, contact_email, contact_phone, contact_whatsapp, message, source, lead_id, property:property_id (title, reference_code)`,
          { count: 'exact' },
        )).order('created_at', { ascending: false }).range(fromIdx, toIdx)
        if (data.search?.trim()) {
          const s = `%${data.search.trim()}%`
          q = q.or(`contact_name.ilike.${s},contact_email.ilike.${s},contact_phone.ilike.${s}`)
        }
        const { data: rows, error, count } = await q
        if (error) throw error
        const ids = (rows ?? []).map((r: any) => r.id)
        const logMap = await fetchEmailLogMap(sb, 'interest_id', ids, emailWindow)
        const hasEmailWindow = !!(data.emailFrom || data.emailTo)
        const mapped = (rows ?? []).map((r: any) => {
          const log = logMap.get(r.id)
          return {
            ...r,
            export_id: data.exportId,
            property_title: r.property?.title ?? '',
            property_ref: r.property?.reference_code ?? '',
            request_id: log?.requestId ?? '',
            email_status: log?.lastStatus ?? '',
            email_error: log?.lastError ?? '',
            email_at: log?.lastAt ?? '',
          }
        })
          .filter((r: any) => matchesEmailFilter(emailFilter, r.email_status || null))
          .filter((r: any) => !hasEmailWindow || !!r.email_at)
        const columns = [
          exportIdCol,
          { key: 'created_at', label: 'Data' }, { key: 'kind', label: 'Tipo' }, { key: 'status', label: 'Status' },
          { key: 'contact_name', label: 'Nome' }, { key: 'contact_email', label: 'E-mail' },
          { key: 'contact_phone', label: 'Telefone' }, { key: 'contact_whatsapp', label: 'WhatsApp' },
          { key: 'property_ref', label: 'Cód. imóvel' }, { key: 'property_title', label: 'Imóvel' },
          { key: 'source', label: 'Origem' }, { key: 'lead_id', label: 'Lead ID' },
          { key: 'request_id', label: 'Request ID' }, { key: 'email_status', label: 'E-mail status' },
          { key: 'email_at', label: 'E-mail data' }, { key: 'email_error', label: 'E-mail erro' },
          { key: 'message', label: 'Mensagem' },
        ]
        result = {
          filename: `interessados-p${data.page}-${new Date().toISOString().slice(0, 10)}.csv`,
          csv: toCsv(mapped, columns), rows: mapped, columns, total: count ?? mapped.length,
        }
      } else if (data.dataset === 'searches') {
        let q = base(sb.from('realestate_search_intents').select(
          `id, created_at, status, contact_name, contact_email, contact_phone, operation, property_type, city, neighborhood, min_price, max_price, min_bedrooms, max_bedrooms, source, lead_id`,
          { count: 'exact' },
        )).order('created_at', { ascending: false }).range(fromIdx, toIdx)
        if (data.search?.trim()) {
          const s = `%${data.search.trim()}%`
          q = q.or(`contact_name.ilike.${s},contact_email.ilike.${s}`)
        }
        const { data: rows, error, count } = await q
        if (error) throw error
        const ids = (rows ?? []).map((r: any) => r.id)
        const logMap = await fetchEmailLogMap(sb, 'intent_id', ids, emailWindow)
        const hasEmailWindow = !!(data.emailFrom || data.emailTo)
        const mapped = (rows ?? []).map((r: any) => {
          const log = logMap.get(r.id)
          return {
            ...r,
            export_id: data.exportId,
            request_id: log?.requestId ?? '',
            email_status: log?.lastStatus ?? '',
            email_error: log?.lastError ?? '',
            email_at: log?.lastAt ?? '',
          }
        })
          .filter((r: any) => matchesEmailFilter(emailFilter, r.email_status || null))
          .filter((r: any) => !hasEmailWindow || !!r.email_at)
        const columns = [
          exportIdCol,
          { key: 'created_at', label: 'Data' }, { key: 'status', label: 'Status' },
          { key: 'contact_name', label: 'Nome' }, { key: 'contact_email', label: 'E-mail' },
          { key: 'contact_phone', label: 'Telefone' },
          { key: 'operation', label: 'Operação' }, { key: 'property_type', label: 'Tipo' },
          { key: 'city', label: 'Cidade' }, { key: 'neighborhood', label: 'Bairro' },
          { key: 'min_price', label: 'Preço mín.' }, { key: 'max_price', label: 'Preço máx.' },
          { key: 'min_bedrooms', label: 'Dorms. mín.' }, { key: 'max_bedrooms', label: 'Dorms. máx.' },
          { key: 'source', label: 'Origem' }, { key: 'lead_id', label: 'Lead ID' },
          { key: 'request_id', label: 'Request ID' }, { key: 'email_status', label: 'E-mail status' },
          { key: 'email_at', label: 'E-mail data' }, { key: 'email_error', label: 'E-mail erro' },
        ]
        result = {
          filename: `buscas-salvas-p${data.page}-${new Date().toISOString().slice(0, 10)}.csv`,
          csv: toCsv(mapped, columns), rows: mapped, columns, total: count ?? mapped.length,
        }
      } else {
        let q = base(sb.from('realestate_internal_messages').select(
          `id, created_at, channel, request_kind, status, subject, contact_name, contact_email, contact_phone, replies_count, last_reply_at, lead_id, interest_id, intent_id`,
          { count: 'exact' },
        )).order('created_at', { ascending: false }).range(fromIdx, toIdx)
        if (data.search?.trim()) {
          const s = `%${data.search.trim()}%`
          q = q.or(`subject.ilike.${s},contact_name.ilike.${s},contact_email.ilike.${s}`)
        }
        const { data: rows, error, count } = await q
        if (error) throw error
        const interestIds = (rows ?? []).map((r: any) => r.interest_id).filter(Boolean) as string[]
        const intentIds = (rows ?? []).map((r: any) => r.intent_id).filter(Boolean) as string[]
        const [interestLogs, intentLogs] = await Promise.all([
          fetchEmailLogMap(sb, 'interest_id', interestIds, emailWindow),
          fetchEmailLogMap(sb, 'intent_id', intentIds, emailWindow),
        ])
        const hasEmailWindow = !!(data.emailFrom || data.emailTo)
        const mapped = (rows ?? []).map((r: any) => {
          const log = (r.interest_id && interestLogs.get(r.interest_id)) || (r.intent_id && intentLogs.get(r.intent_id)) || null
          return {
            ...r,
            export_id: data.exportId,
            request_id: log?.requestId ?? '',
            email_status: log?.lastStatus ?? '',
            email_error: log?.lastError ?? '',
            email_at: log?.lastAt ?? '',
          }
        })
          .filter((r: any) => matchesEmailFilter(emailFilter, r.email_status || null))
          .filter((r: any) => !hasEmailWindow || !!r.email_at)
        const columns = [
          exportIdCol,
          { key: 'created_at', label: 'Data' }, { key: 'channel', label: 'Canal' },
          { key: 'request_kind', label: 'Tipo' }, { key: 'status', label: 'Status' },
          { key: 'subject', label: 'Assunto' }, { key: 'contact_name', label: 'Nome' },
          { key: 'contact_email', label: 'E-mail' }, { key: 'contact_phone', label: 'Telefone' },
          { key: 'replies_count', label: 'Respostas' }, { key: 'last_reply_at', label: 'Última resposta' },
          { key: 'lead_id', label: 'Lead ID' }, { key: 'request_id', label: 'Request ID' },
          { key: 'email_status', label: 'E-mail status' }, { key: 'email_at', label: 'E-mail data' },
          { key: 'email_error', label: 'E-mail erro' },
        ]
        result = {
          filename: `mensagens-p${data.page}-${new Date().toISOString().slice(0, 10)}.csv`,
          csv: toCsv(mapped, columns), rows: mapped, columns, total: count ?? mapped.length,
        }
      }

      // progress / finish
      const { data: logRow } = await sb
        .from('vitrine_export_logs').select('total_exported, batches_done')
        .eq('export_id', data.exportId).maybeSingle()
      const totalSoFar = (logRow?.total_exported ?? 0) + result.rows.length
      const batches = (logRow?.batches_done ?? 0) + 1
      await sb.from('vitrine_export_logs').update({
        total_exported: totalSoFar,
        batches_done: batches,
        total_expected: result.total,
        status: data.isFinal ? 'completed' : 'running',
        finished_at: data.isFinal ? new Date().toISOString() : null,
      }).eq('export_id', data.exportId)

      return { ...result, page: data.page, pageSize: data.pageSize, exportId: data.exportId, totalExportedSoFar: totalSoFar, batchesDone: batches }
    } catch (err: any) {
      await sb.from('vitrine_export_logs').update({
        status: 'failed', error_message: err?.message ?? 'unknown', finished_at: new Date().toISOString(),
      }).eq('export_id', data.exportId)
      throw err
    }
  })

const ListExportLogsInput = z.object({ companyId: z.string().uuid(), limit: z.number().int().min(1).max(100).default(25) })

export const listVitrineExportLogs = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListExportLogsInput>) => ListExportLogsInput.parse(d))
  .handler(async ({ data, context }) => {
    // RLS já restringe a user_id = auth.uid(); reforçamos o filtro explicitamente
    // para defesa em profundidade contra uma policy acidentalmente afrouxada.
    const { data: rows, error } = await context.supabase
      .from('vitrine_export_logs')
      .select('export_id, dataset, format, status, status_filter, total_exported, total_expected, batches_done, started_at, finished_at, error_message, date_from, date_to, email_from, email_to')
      .eq('company_id', data.companyId)
      .eq('user_id', context.userId)
      .order('started_at', { ascending: false })
      .limit(data.limit)
    if (error) throw error
    return { rows: rows ?? [] }
  })

const GetExportLogInput = z.object({ exportId: z.string().uuid() })

export const getVitrineExportLog = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof GetExportLogInput>) => GetExportLogInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from('vitrine_export_logs')
      .select('export_id, dataset, format, status, status_filter, total_exported, total_expected, batches_done, started_at, finished_at, error_message, company_id, user_id')
      .eq('export_id', data.exportId)
      .eq('user_id', context.userId)
      .maybeSingle()
    if (error) throw error
    return { row: row ?? null }
  })
