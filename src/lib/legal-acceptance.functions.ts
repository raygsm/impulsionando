// Legal acceptance — registra aceites com hash do documento, IP e timestamp.
// Lei 14.063/2020 + MP 2.200-2/2001 (validade jurídica do aceite eletrônico).
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createHash } from 'crypto'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { withInstrumentation } from './instrumentation'

const KINDS = ['terms', 'privacy', 'nda', 'dpa', 'contract_b2b', 'cookies', 'consent_general'] as const

/** Carrega o documento legal vigente por tipo (+ nicho opcional). */
export const getCurrentLegal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: typeof KINDS[number]; niche?: string | null }) =>
    z.object({
      kind: z.enum(KINDS),
      niche: z.string().trim().max(80).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('legal.getCurrent', { user_id: context.userId }, async () => {
      const { data: doc, error } = await context.supabase
        .from('eco_legal_documents')
        .select('id, kind, niche, audience, version, title, body_md, effective_at')
        .eq('kind', data.kind)
        .eq('is_current', true)
        .or(`niche.is.null,niche.eq.${data.niche ?? 'null'}`)
        .order('niche', { nullsFirst: false })
        .order('effective_at', { ascending: false })
        .limit(1).maybeSingle()
      if (error) throw error
      return doc
    }),
  )

/** Lista documentos legais publicados (público). */
export const listLegalDocuments = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    withInstrumentation('legal.list', { user_id: context.userId }, async () => {
      const { data, error } = await context.supabase
        .from('eco_legal_documents')
        .select('id, kind, niche, audience, version, title, effective_at, is_current')
        .eq('is_current', true)
        .order('kind')
      if (error) throw error
      return data ?? []
    }),
  )

/** Registra aceite com hash do documento + IP + user agent. */
export const recordLegalAcceptance = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { document_id: string; context: string; metadata?: Record<string, unknown> }) =>
    z.object({
      document_id: z.string().uuid(),
      context: z.string().trim().min(2).max(120),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) =>
    withInstrumentation('legal.record', { user_id: context.userId }, async () => {
      const { data: doc, error: docErr } = await context.supabase
        .from('eco_legal_documents')
        .select('id, kind, version, body_md')
        .eq('id', data.document_id).single()
      if (docErr || !doc) throw docErr ?? new Error('Documento não encontrado')

      const hash = createHash('sha256').update((doc as any).body_md).digest('hex')

      const { data: prof } = await context.supabase
        .from('user_profiles').select('company_id').eq('user_id', context.userId).maybeSingle()

      const headers = (globalThis as any).Request
        ? null
        : null
      // Pull from request via TanStack getRequestHeader at runtime
      let ip: string | null = null
      let ua: string | null = null
      try {
        const { getRequestHeader } = await import('@tanstack/react-start/server')
        ip = (getRequestHeader('x-forwarded-for') ?? '').split(',')[0]?.trim() || null
        ua = getRequestHeader('user-agent') ?? null
      } catch { /* ignore in test */ }

      const { data: row, error } = await context.supabase
        .from('eco_legal_acceptances')
        .insert({
          user_id: context.userId,
          company_id: (prof as any)?.company_id ?? null,
          document_id: (doc as any).id,
          document_kind: (doc as any).kind,
          document_version: (doc as any).version,
          context: data.context,
          document_hash: hash,
          ip_address: ip,
          user_agent: ua,
          metadata: (data.metadata ?? {}) as any,
        })
        .select('id, accepted_at').single()
      if (error) throw error
      return row
    }),
  )

/** Histórico de aceites do usuário — direito de portabilidade LGPD. */
export const myLegalAcceptances = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    withInstrumentation('legal.mine', { user_id: context.userId }, async () => {
      const { data, error } = await context.supabase
        .from('eco_legal_acceptances')
        .select('id, document_kind, document_version, context, accepted_at, document_hash, ip_address')
        .eq('user_id', context.userId)
        .order('accepted_at', { ascending: false }).limit(500)
      if (error) throw error
      return (data ?? []).map((r: any) => ({ ...r, ip_address: r.ip_address ? String(r.ip_address) : null }))
    }),
  )
