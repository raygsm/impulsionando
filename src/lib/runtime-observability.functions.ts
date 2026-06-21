// Observabilidade de runtime do core Impulsionando.
// - logRuntimeEvent: ingest público autenticado (qualquer usuário logado pode emitir telemetria do seu contexto).
// - listRuntimeEvents / getObservabilityOverview: leitura restrita a admin do core (RLS + assert).
// - captureServerError: helper para envolver handlers com captura automática de exceção.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'] as const
export type RuntimeLevel = (typeof LEVELS)[number]

async function assertCoreAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' })
  if (!isAdmin) throw new Error('Forbidden: requer admin do core')
}

const LogSchema = z.object({
  level: z.enum(LEVELS),
  scope: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(2000),
  context: z.record(z.string(), z.unknown()).optional(),
  companyId: z.string().uuid().nullish(),
  requestId: z.string().max(120).optional(),
  route: z.string().max(240).optional(),
})

export const logRuntimeEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LogSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin.from('runtime_events').insert({
      level: data.level,
      scope: data.scope,
      message: data.message,
      context: data.context ?? {},
      company_id: data.companyId ?? null,
      user_id: context.userId,
      request_id: data.requestId ?? null,
      route: data.route ?? null,
    } as never)
    if (error) {
      // Não propaga falha de log para o caller — apenas avisa no console do worker.
      console.warn('[runtime-observability] insert falhou:', error.message)
      return { ok: false }
    }
    return { ok: true }
  })

const ListSchema = z.object({
  days: z.number().int().min(1).max(90).default(7),
  level: z.enum(LEVELS).optional(),
  scope: z.string().trim().max(120).optional(),
  companyId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(500).default(100),
})

export const listRuntimeEvents = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertCoreAdmin(context)
    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString()
    let q = context.supabase
      .from('runtime_events')
      .select('id, level, scope, message, context, company_id, user_id, route, occurred_at')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(data.limit)
    if (data.level) q = q.eq('level', data.level)
    if (data.scope) q = q.eq('scope', data.scope)
    if (data.companyId) q = q.eq('company_id', data.companyId)
    if (data.search) q = q.ilike('message', `%${data.search}%`)
    const { data: rows, error } = await q
    if (error) throw new Error(error.message)
    return { events: rows ?? [] }
  })

export const getObservabilityOverview = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(1).max(30).default(1) }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertCoreAdmin(context)
    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString()
    const { data: rows, error } = await context.supabase
      .from('runtime_events')
      .select('level, scope, company_id, occurred_at')
      .gte('occurred_at', since)
      .limit(5000)
    if (error) throw new Error(error.message)
    const list = (rows ?? []) as Array<{ level: string; scope: string; company_id: string | null }>
    const total = list.length
    const byLevel: Record<string, number> = {}
    const byScope: Record<string, number> = {}
    const byCompany: Record<string, number> = {}
    for (const r of list) {
      byLevel[r.level] = (byLevel[r.level] ?? 0) + 1
      if (r.level === 'error' || r.level === 'fatal') {
        byScope[r.scope] = (byScope[r.scope] ?? 0) + 1
        if (r.company_id) byCompany[r.company_id] = (byCompany[r.company_id] ?? 0) + 1
      }
    }
    const topScopes = Object.entries(byScope).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([scope, count]) => ({ scope, count }))
    const topCompanies = Object.entries(byCompany).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([companyId, count]) => ({ companyId, count }))
    return {
      windowDays: data.days,
      total,
      errors: (byLevel.error ?? 0) + (byLevel.fatal ?? 0),
      warns: byLevel.warn ?? 0,
      infos: byLevel.info ?? 0,
      topScopes,
      topCompanies,
    }
  })

/**
 * Helper para envolver handlers de server fn com captura automática de exceção.
 * Uso (dentro do .handler):
 *   return captureServerError({ scope: 'tenant-provisioning.provision', supabaseAdmin }, async () => { ...lógica... })
 */
export async function captureServerError<T>(
  params: {
    scope: string
    companyId?: string | null
    userId?: string | null
    context?: Record<string, unknown>
    /** Cliente admin já carregado pelo caller (para evitar import duplicado). */
    supabaseAdmin: any
  },
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const e = err as Error
    try {
      await params.supabaseAdmin.from('runtime_events').insert({
        level: 'error',
        scope: params.scope,
        message: e?.message ?? 'erro desconhecido',
        context: { ...(params.context ?? {}), stack: e?.stack?.slice(0, 4000) ?? null },
        company_id: params.companyId ?? null,
        user_id: params.userId ?? null,
      } as never)
    } catch {
      // silencioso — logger nunca deve mascarar o erro original
    }
    throw err
  }
}
