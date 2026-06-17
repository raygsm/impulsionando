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
  status: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
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

export const exportVitrineDataset = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ExportInput>) => ExportInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase
    const filters = (q: any) => {
      let qq = q.eq('company_id', data.companyId)
      if (data.status && data.status !== 'todos') qq = qq.eq('status', data.status)
      if (data.from) qq = qq.gte('created_at', data.from)
      if (data.to) qq = qq.lte('created_at', data.to)
      return qq
    }

    if (data.dataset === 'interests') {
      let q = filters(sb.from('realestate_interests').select(`id, created_at, kind, status, contact_name, contact_email, contact_phone, contact_whatsapp, message, source, lead_id, property:property_id (title, reference_code)`).order('created_at', { ascending: false }).limit(10000))
      if (data.search?.trim()) {
        const s = `%${data.search.trim()}%`
        q = q.or(`contact_name.ilike.${s},contact_email.ilike.${s},contact_phone.ilike.${s}`)
      }
      const { data: rows, error } = await q
      if (error) throw error
      const csv = toCsv(
        (rows ?? []).map((r: any) => ({
          ...r,
          property_title: r.property?.title ?? '',
          property_ref: r.property?.reference_code ?? '',
        })),
        [
          { key: 'created_at', label: 'Data' }, { key: 'kind', label: 'Tipo' }, { key: 'status', label: 'Status' },
          { key: 'contact_name', label: 'Nome' }, { key: 'contact_email', label: 'E-mail' },
          { key: 'contact_phone', label: 'Telefone' }, { key: 'contact_whatsapp', label: 'WhatsApp' },
          { key: 'property_ref', label: 'Cód. imóvel' }, { key: 'property_title', label: 'Imóvel' },
          { key: 'source', label: 'Origem' }, { key: 'lead_id', label: 'Lead ID' }, { key: 'message', label: 'Mensagem' },
        ],
      )
      return { filename: `interessados-${new Date().toISOString().slice(0, 10)}.csv`, csv, total: rows?.length ?? 0 }
    }

    if (data.dataset === 'searches') {
      let q = filters(sb.from('realestate_search_intents').select(`id, created_at, status, contact_name, contact_email, contact_phone, operation, property_type, city, neighborhood, min_price, max_price, min_bedrooms, max_bedrooms, source, lead_id`).order('created_at', { ascending: false }).limit(10000))
      if (data.search?.trim()) {
        const s = `%${data.search.trim()}%`
        q = q.or(`contact_name.ilike.${s},contact_email.ilike.${s}`)
      }
      const { data: rows, error } = await q
      if (error) throw error
      const csv = toCsv((rows ?? []) as any, [
        { key: 'created_at', label: 'Data' }, { key: 'status', label: 'Status' },
        { key: 'contact_name', label: 'Nome' }, { key: 'contact_email', label: 'E-mail' },
        { key: 'contact_phone', label: 'Telefone' },
        { key: 'operation', label: 'Operação' }, { key: 'property_type', label: 'Tipo' },
        { key: 'city', label: 'Cidade' }, { key: 'neighborhood', label: 'Bairro' },
        { key: 'min_price', label: 'Preço mín.' }, { key: 'max_price', label: 'Preço máx.' },
        { key: 'min_bedrooms', label: 'Dorms. mín.' }, { key: 'max_bedrooms', label: 'Dorms. máx.' },
        { key: 'source', label: 'Origem' }, { key: 'lead_id', label: 'Lead ID' },
      ])
      return { filename: `buscas-salvas-${new Date().toISOString().slice(0, 10)}.csv`, csv, total: rows?.length ?? 0 }
    }

    let q = filters(sb.from('realestate_internal_messages').select(`id, created_at, channel, request_kind, status, subject, contact_name, contact_email, contact_phone, replies_count, last_reply_at, lead_id`).order('created_at', { ascending: false }).limit(10000))
    if (data.search?.trim()) {
      const s = `%${data.search.trim()}%`
      q = q.or(`subject.ilike.${s},contact_name.ilike.${s},contact_email.ilike.${s}`)
    }
    const { data: rows, error } = await q
    if (error) throw error
    const csv = toCsv((rows ?? []) as any, [
      { key: 'created_at', label: 'Data' }, { key: 'channel', label: 'Canal' },
      { key: 'request_kind', label: 'Tipo' }, { key: 'status', label: 'Status' },
      { key: 'subject', label: 'Assunto' }, { key: 'contact_name', label: 'Nome' },
      { key: 'contact_email', label: 'E-mail' }, { key: 'contact_phone', label: 'Telefone' },
      { key: 'replies_count', label: 'Respostas' }, { key: 'last_reply_at', label: 'Última resposta' },
      { key: 'lead_id', label: 'Lead ID' },
    ])
    return { filename: `mensagens-${new Date().toISOString().slice(0, 10)}.csv`, csv, total: rows?.length ?? 0 }
  })
