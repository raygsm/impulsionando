/**
 * Push notifications — restaurante / bar / cervejaria.
 *
 * REGRAS (não mudar sem revisar regra de produto):
 *
 *  1. NUNCA dispare push ao cliente sem opt-in explícito gravado em
 *     `notification_preferences (category='postvisit', channel='push', enabled=true)`.
 *  2. Apenas eventos da whitelist `ALLOWED_PUSH_EVENTS` são permitidos.
 *     Eventos operacionais ("item pronto", "garçom a caminho") NÃO estão
 *     na whitelist — push ao cliente é relacionamento pós-visita, não cozinha.
 *  3. O template/evento é cruzado contra o registry: se for marcado como
 *     `internal: true`, lançamos InternalTemplateLeakError.
 *  4. Segmentação por nicho: cada nicho tem um conjunto de eventos relevantes;
 *     se o evento não pertence ao nicho do destinatário, pulamos.
 *
 * O endpoint físico (FCM/APNs/Web Push) é abstraído via `pushTransport` —
 * permite stub em testes. Em produção, é injetado pelo bootstrap.
 */
import { assertTemplateAllowedForCustomerChannel } from '@/lib/email-templates/registry'

import { pushEventsForNiche } from '@/lib/postvisit-timing-registry'

/** Whitelist absoluta de eventos que podem virar push ao cliente. */
export const ALLOWED_PUSH_EVENTS = [
  'restaurant-postvisit-thanks',
  'restaurant-bill-closed',
  'clube-voucher-issued',
  'clube-poll-open',
] as const
export type AllowedPushEvent = (typeof ALLOWED_PUSH_EVENTS)[number]

export class PushNotAllowedError extends Error {
  constructor(reason: string) {
    super(`push not allowed: ${reason}`)
    this.name = 'PushNotAllowedError'
  }
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export interface PushTransport {
  send(args: { userId: string; payload: PushPayload }): Promise<{ ok: boolean; provider?: string; error?: string }>
}

const noopTransport: PushTransport = {
  async send() {
    return { ok: true, provider: 'noop' }
  },
}

let _transport: PushTransport = noopTransport
export function setPushTransport(t: PushTransport) {
  _transport = t
}
export function getPushTransport(): PushTransport {
  return _transport
}

/**
 * Checa se o destinatário aceitou push para uma categoria específica.
 * Default-deny: se não houver registro, retorna false.
 */
export async function userHasPushOptIn(args: {
  userId: string
  category: 'postvisit' | 'clube' | 'transactional'
}): Promise<boolean> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin
    .from('notification_preferences')
    .select('enabled')
    .eq('user_id', args.userId)
    .eq('category', args.category)
    .eq('channel', 'push')
    .maybeSingle()
  return !!(data && (data as any).enabled === true)
}

/**
 * Disparo seguro de push ao cliente. Aplica TODAS as guardas em ordem:
 *   1) Evento na whitelist?
 *   2) Template não-internal? (assertTemplateAllowedForCustomerChannel)
 *   3) Evento permitido para o nicho?
 *   4) Cliente tem opt-in para a categoria?
 *
 * Retorna `{ skipped: motivo }` quando a regra impede o envio (não lança),
 * para que callers automatizados não quebrem; lança APENAS se um template
 * interno for usado, porque isso é bug de programação, não de configuração.
 */
export async function sendCustomerPush(args: {
  userId: string
  event: string
  niche?: string
  category?: 'postvisit' | 'clube' | 'transactional'
  payload: PushPayload
}): Promise<{ ok: true; provider?: string } | { skipped: string }> {
  // (1) Whitelist
  if (!(ALLOWED_PUSH_EVENTS as readonly string[]).includes(args.event)) {
    return { skipped: 'event_not_whitelisted' }
  }
  // (2) Guard template interno — lança para fail-fast em dev
  assertTemplateAllowedForCustomerChannel(args.event, 'customer-push')

  // (3) Segmentação por nicho
  if (args.niche) {
    const allowed = pushEventsForNiche(args.niche)
    if (allowed && !allowed.includes(args.event)) {
      return { skipped: 'event_not_in_niche_segment' }
    }
  }

  // (4) Opt-in explícito
  const category = args.category ?? 'postvisit'
  const optedIn = await userHasPushOptIn({ userId: args.userId, category })
  if (!optedIn) return { skipped: 'no_opt_in' }

  const res = await _transport.send({ userId: args.userId, payload: args.payload })
  if (!res.ok) return { skipped: `transport_failed:${res.error ?? 'unknown'}` }
  return { ok: true, provider: res.provider }
}
