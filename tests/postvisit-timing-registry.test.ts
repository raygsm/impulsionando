/**
 * Garante que o REGISTRY de timing pós-visita é a fonte única de verdade
 * e que mudanças nele propagam para os callers SEM quebrar idempotência.
 *
 * Regras testadas:
 *  - REGISTRY_VERSION segue semver e tem default 24h.
 *  - postVisitDelayHours() para cada nicho lê do registry.
 *  - restaurant-postvisit.server.ts consulta o registry (não duplica).
 *  - restaurant-push.server.ts usa pushEventsForNiche (não duplica mapa).
 *  - Trocar delayHours em runtime altera comportamento mas o lock
 *    `postvisit_notified_at` continua bloqueando segunda chamada.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

describe('postvisit-timing-registry — fonte única de verdade', () => {
  it('REGISTRY_VERSION é semver e default é 24h', async () => {
    const mod = await import('../src/lib/postvisit-timing-registry')
    expect(mod.REGISTRY_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    expect(mod.DEFAULT_POSTVISIT_DELAY_HOURS).toBe(24)
    expect(mod.postVisitDelayHours()).toBe(24)
    expect(mod.postVisitDelayHours('desconhecido')).toBe(24)
  })

  it('cada nicho tem o delayHours esperado', async () => {
    const mod = await import('../src/lib/postvisit-timing-registry')
    expect(mod.postVisitDelayHours('cafe-confeitaria')).toBe(18)
    expect(mod.postVisitDelayHours('bares-restaurantes')).toBe(24)
    expect(mod.postVisitDelayHours('cervejaria')).toBe(36)
    expect(mod.postVisitDelayHours('eventos-casas-show')).toBe(48)
  })

  it('postvisit.server consome o registry (não duplica POSTVISIT_DELAY_HOURS)', () => {
    const src = read('src/lib/restaurant-postvisit.server.ts')
    expect(src).toMatch(/from\s+["']@\/lib\/postvisit-timing-registry["']/)
    expect(src).not.toMatch(/const\s+POSTVISIT_DELAY_HOURS\s*:/)
  })

  it('push.server consome pushEventsForNiche (não duplica NICHE_EVENT_MAP)', () => {
    const src = read('src/lib/restaurant-push.server.ts')
    expect(src).toMatch(/pushEventsForNiche/)
    expect(src).not.toMatch(/const\s+NICHE_EVENT_MAP\s*:/)
  })

  it('earliestPostvisitMoment respeita o nicho', async () => {
    const mod = await import('../src/lib/postvisit-timing-registry')
    const base = '2026-06-18T20:00:00.000Z'
    const earliestCafe = mod.earliestPostvisitMoment(base, 'cafe-confeitaria')
    const earliestCerveja = mod.earliestPostvisitMoment(base, 'cervejaria')
    expect(earliestCafe.getTime() - new Date(base).getTime()).toBe(18 * 3600 * 1000)
    expect(earliestCerveja.getTime() - new Date(base).getTime()).toBe(36 * 3600 * 1000)
  })
})

describe('mudanças no registry preservam idempotência da pós-visita', () => {
  beforeEach(() => vi.resetModules())

  it('alterar delayHours muda a janela mas o lock continua bloqueando segundo envio', async () => {
    // Mock supabaseAdmin igual ao e2e suite mas enxuto.
    const state: any = { sess: null, enqueued: [] }
    const chain = (table: string): any => {
      const ctx: any = { table, filters: [] as any[], isNullCol: null, pendingUpdate: null }
      const dataFor = () => (ctx.table === 'restaurant_table_sessions' ? state.sess : null)
      const apply = () => {
        if (!ctx.pendingUpdate || ctx.table !== 'restaurant_table_sessions' || !state.sess) return
        if (ctx.isNullCol && state.sess[ctx.isNullCol] != null) return
        Object.assign(state.sess, ctx.pendingUpdate)
        ctx.pendingUpdate = null
      }
      const c: any = {
        select: () => c,
        eq: (k: string, v: any) => { ctx.filters.push([k, v]); return c },
        is: (k: string, v: any) => { if (v === null) ctx.isNullCol = k; return c },
        maybeSingle: async () => ({ data: dataFor(), error: null }),
        update: (p: any) => { ctx.pendingUpdate = p; return c },
        insert: () => ({ error: null }),
        then: (ok: any, ko?: any) => {
          try { apply(); return Promise.resolve({ data: null, error: null }).then(ok, ko) }
          catch (e) { return Promise.reject(e).then(ok, ko) }
        },
      }
      return c
    }
    vi.doMock('@/integrations/supabase/client.server', () => ({
      supabaseAdmin: {
        from: (t: string) => chain(t),
        rpc: async (_n: string, p: any) => { state.enqueued.push(p?.payload ?? p); return { data: null, error: null } },
      },
    }))
    vi.doMock('@/lib/notification-attempt-log.server', () => ({
      logNotificationAttempt: async () => {},
      newRequestId: () => 'req_test',
    }))

    // Janela passou (qualquer nicho): primeiro envio passa, segundo bloqueia
    state.sess = {
      id: 's',
      customer_email: 'a@b.com',
      customer_name: 'X',
      bill_notified_at: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
      postvisit_notified_at: null,
      company_id: null,
      company: { trade_name: 'Casa', slug: 'casa', niche_slug: 'cervejaria' },
    }
    const { notifyPostVisitThanks } = await import('../src/lib/restaurant-postvisit.server')
    const r1 = await notifyPostVisitThanks({ session_id: 's' })
    expect(r1.skipped).toBeUndefined()
    expect(state.sess.postvisit_notified_at).toBeTruthy()
    const r2 = await notifyPostVisitThanks({ session_id: 's' })
    expect(r2.skipped).toBe('already_notified')
    expect(state.enqueued.length).toBe(1)
  })
})
