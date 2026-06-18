/**
 * E2E (server-side) — Capítulo 03 → Capítulo 07.
 *
 * Simula o garçom concluindo a entrega (notifyItemReady) e fechando a conta,
 * e verifica que:
 *   - notifyItemReady NÃO dispara nenhum canal ao cliente.
 *   - O e-mail/push pós-visita só sai depois da janela do nicho.
 *   - O guard de template interno lança quando alguém tenta enviar
 *     `restaurant-order-ready` por um canal de cliente.
 *   - Push só sai com opt-in e dentro da whitelist/segmentação por nicho.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---- mock do supabaseAdmin --------------------------------------------------

type Row = Record<string, any>
const state = {
  items: new Map<string, Row>(),
  sessions: new Map<string, Row>(),
  prefs: [] as Row[],
  suppressed: [] as Row[],
  emailLog: [] as Row[],
  enqueued: [] as Row[],
}

function resetState() {
  state.items.clear()
  state.sessions.clear()
  state.prefs.length = 0
  state.suppressed.length = 0
  state.emailLog.length = 0
  state.enqueued.length = 0
}

function makeQuery(table: string) {
  const ctx: any = {
    table,
    filters: [] as Array<[string, any]>,
    isNullCol: null as string | null,
    pendingUpdate: null as Row | null,
  }
  const applyPending = () => {
    if (!ctx.pendingUpdate) return
    const row = pick(ctx)
    if (!row) return
    if (ctx.isNullCol && row[ctx.isNullCol] != null) return
    Object.assign(row, ctx.pendingUpdate)
    ctx.pendingUpdate = null
  }
  const chain: any = {
    select: () => chain,
    eq: (col: string, val: any) => {
      ctx.filters.push([col, val])
      return chain
    },
    is: (col: string, val: any) => {
      if (val === null) ctx.isNullCol = col
      return chain
    },
    maybeSingle: async () => ({ data: pick(ctx), error: null }),
    update: (patch: Row) => {
      ctx.pendingUpdate = patch
      return chain
    },
    insert: (rows: Row | Row[]) => {
      const arr = Array.isArray(rows) ? rows : [rows]
      if (table === 'email_send_log') state.emailLog.push(...arr)
      return { error: null }
    },
    then: (onFulfilled: any, onRejected?: any) => {
      try {
        applyPending()
        return Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected)
      } catch (e) {
        return Promise.reject(e).then(onFulfilled, onRejected)
      }
    },
  }
  return chain
}

function pick(ctx: any): Row | undefined {
  const f = Object.fromEntries(ctx.filters)
  if (ctx.table === 'sales_order_items' && f.id) return state.items.get(f.id)
  if (ctx.table === 'restaurant_table_sessions' && f.id) return state.sessions.get(f.id)
  if (ctx.table === 'restaurant_table_sessions' && f.sales_order_id) {
    for (const s of state.sessions.values()) if (s.sales_order_id === f.sales_order_id) return s
  }
  if (ctx.table === 'notification_preferences') {
    return state.prefs.find(
      (p) => p.user_id === f.user_id && p.category === f.category && p.channel === f.channel,
    )
  }
  if (ctx.table === 'suppressed_emails') return state.suppressed.find((s) => s.email === f.email)
  return undefined
}

const supabaseAdminMock = {
  from: (table: string) => makeQuery(table),
  rpc: async (_name: string, payload: any) => {
    // capturamos o payload interno (que tem `label`, `to`, etc.)
    state.enqueued.push(payload?.payload ?? payload)
    return { data: null, error: null }
  },
}

vi.mock('@/integrations/supabase/client.server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))
vi.mock('@/lib/whatsapp-notify.server', () => ({ sendWhatsappText: vi.fn(async () => ({ status: 'mocked' })) }))
vi.mock('@/lib/sms-notify.server', () => ({ sendSms: vi.fn(async () => ({ status: 'mocked' })) }))

// ---- helpers ----------------------------------------------------------------

beforeEach(() => {
  resetState()
  vi.resetModules()
})

async function loadModules() {
  const customer = await import('@/lib/restaurant-customer-notify.server')
  const post = await import('@/lib/restaurant-postvisit.server')
  const push = await import('@/lib/restaurant-push.server')
  const notify = await import('@/lib/restaurant-notify.server')
  const registry = await import('@/lib/email-templates/registry')
  return { customer, post, push, notify, registry }
}

// ---- Capítulo 03: garçom conclui entrega -----------------------------------

describe('Cap. 03 — garçom marca item entregue', () => {
  it('notifyItemReady NÃO enfileira e-mail/WhatsApp/SMS ao cliente', async () => {
    state.items.set('item-1', {
      id: 'item-1',
      description: 'Picanha',
      quantity: 1,
      order_id: 'ord-1',
      company_id: 'co-1',
      notified_ready_at: null,
      company: { name: 'Bar do João', trade_name: 'Bar do João' },
    })
    state.sessions.set('sess-1', {
      id: 'sess-1',
      sales_order_id: 'ord-1',
      customer_name: 'Ana',
      customer_email: 'ana@example.com',
      table: { number: 7 },
    })

    const { customer } = await loadModules()
    const r = await customer.notifyItemReady('item-1')

    expect(r.internal).toBe(true)
    expect((r as any).email).toBeUndefined()
    expect((r as any).whatsapp).toBeUndefined()
    expect((r as any).sms).toBeUndefined()
    expect(state.enqueued).toHaveLength(0)
    expect(state.emailLog).toHaveLength(0)
    // Lock idempotente aplicado
    expect(state.items.get('item-1')?.notified_ready_at).toBeTruthy()
  })
})

// ---- Cap. 07: pós-visita respeita janela por nicho -------------------------

describe('Cap. 07 — pós-visita respeita timing por nicho', () => {
  const niches: Array<[string, number]> = [
    ['cafe-confeitaria', 18],
    ['bares-restaurantes', 24],
    ['cervejaria', 36],
    ['eventos-casas-show', 48],
  ]

  for (const [niche, hours] of niches) {
    it(`${niche}: bloqueia antes de ${hours}h e libera depois`, async () => {
      const { post } = await loadModules()
      const justClosed = new Date().toISOString()
      state.sessions.set('s', {
        id: 's',
        customer_email: 'a@b.com',
        customer_name: 'X',
        bill_notified_at: justClosed,
        postvisit_notified_at: null,
        company: { trade_name: 'Casa', slug: 'casa', niche_slug: niche },
      })
      const early = await post.notifyPostVisitThanks({ session_id: 's' })
      expect(early.skipped).toBe('too_early')
      expect(state.enqueued).toHaveLength(0)

      // Avança o relógio para depois da janela do nicho
      const past = new Date(Date.now() - (hours + 1) * 3600 * 1000).toISOString()
      state.sessions.get('s')!.bill_notified_at = past
      const ok = await post.notifyPostVisitThanks({ session_id: 's' })
      expect(ok.skipped).toBeUndefined()
      expect(state.enqueued).toHaveLength(1)
      expect(state.enqueued[0].label).toBe('restaurant-postvisit-thanks')
      // Idempotência marcada
      expect(state.sessions.get('s')!.postvisit_notified_at).toBeTruthy()

      // Segundo disparo: bloqueado por já_notificado
      const dup = await post.notifyPostVisitThanks({ session_id: 's' })
      expect(dup.skipped).toBe('already_notified')
    })
  }
})

// ---- Guard de template interno ---------------------------------------------

describe('Registry — template USO INTERNO não pode ir por canal ao cliente', () => {
  it('lança InternalTemplateLeakError ao tentar enviar restaurant-order-ready ao cliente', async () => {
    const { registry, notify } = await loadModules()
    expect(() =>
      registry.assertTemplateAllowedForCustomerChannel('restaurant-order-ready', 'customer-email'),
    ).toThrow(registry.InternalTemplateLeakError)

    await expect(
      notify.sendRestaurantEmail({
        templateName: 'restaurant-order-ready' as any,
        to: 'ana@example.com',
        templateData: {},
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(registry.InternalTemplateLeakError)
    expect(state.enqueued).toHaveLength(0)
  })

  it('permite templates de cliente (pós-visita) normalmente', async () => {
    const { registry } = await loadModules()
    expect(() =>
      registry.assertTemplateAllowedForCustomerChannel('restaurant-postvisit-thanks', 'customer-email'),
    ).not.toThrow()
  })
})

// ---- Push: whitelist, segmentação por nicho, opt-in ------------------------

describe('Push — opt-in, whitelist e segmentação por nicho', () => {
  it('rejeita evento fora da whitelist', async () => {
    const { push } = await loadModules()
    const r = await push.sendCustomerPush({
      userId: 'u1',
      event: 'kitchen-item-ready',
      payload: { title: 'x', body: 'y' },
    })
    expect((r as any).skipped).toBe('event_not_whitelisted')
  })

  it('rejeita push sem opt-in (default-deny)', async () => {
    const { push } = await loadModules()
    const r = await push.sendCustomerPush({
      userId: 'u1',
      event: 'restaurant-postvisit-thanks',
      niche: 'cervejaria',
      payload: { title: 'Volta logo', body: 'IPA esperando' },
    })
    expect((r as any).skipped).toBe('no_opt_in')
  })

  it('rejeita evento fora do segmento do nicho mesmo com opt-in', async () => {
    state.prefs.push({ user_id: 'u1', category: 'postvisit', channel: 'push', enabled: true })
    const { push } = await loadModules()
    const r = await push.sendCustomerPush({
      userId: 'u1',
      event: 'clube-poll-open',
      niche: 'cafe-confeitaria', // não inclui clube-poll-open
      category: 'postvisit',
      payload: { title: 'x', body: 'y' },
    })
    expect((r as any).skipped).toBe('event_not_in_niche_segment')
  })

  it('envia quando opt-in + whitelist + nicho liberam', async () => {
    state.prefs.push({ user_id: 'u1', category: 'postvisit', channel: 'push', enabled: true })
    const { push } = await loadModules()
    const sent: any[] = []
    push.setPushTransport({
      async send(a) {
        sent.push(a)
        return { ok: true, provider: 'test' }
      },
    })
    const r = await push.sendCustomerPush({
      userId: 'u1',
      event: 'restaurant-postvisit-thanks',
      niche: 'cervejaria',
      category: 'postvisit',
      payload: { title: 'Volta logo', body: 'IPA esperando' },
    })
    expect((r as any).ok).toBe(true)
    expect(sent).toHaveLength(1)
    expect(sent[0].userId).toBe('u1')
  })

  it('nunca envia push para evento interno (template internal:true)', async () => {
    state.prefs.push({ user_id: 'u1', category: 'postvisit', channel: 'push', enabled: true })
    const { push, registry } = await loadModules()
    // Mesmo que adicionássemos por engano à whitelist, o guard do template lança.
    // Aqui validamos a função utilitária diretamente.
    expect(() =>
      registry.assertTemplateAllowedForCustomerChannel('restaurant-order-ready', 'customer-push'),
    ).toThrow(registry.InternalTemplateLeakError)
  })
})
