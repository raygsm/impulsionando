/**
 * REGISTRY VERSIONADO — timing da régua pós-visita por nicho.
 *
 * Fonte única de verdade. Quem precisar do "delay mínimo" depois do
 * fechamento de uma conta DEVE importar daqui. Não duplique a constante.
 *
 * Mudanças devem incrementar `REGISTRY_VERSION` (semver patch) e atualizar
 * `tests/postvisit-timing-registry.test.ts`. A idempotência via
 * `postvisit_notified_at` é preservada mesmo trocando o timing, porque
 * `notifyPostVisitThanks` consulta o registry no momento do envio.
 */

export const REGISTRY_VERSION = '1.1.0'
export const DEFAULT_POSTVISIT_DELAY_HOURS = 24

export interface NichePostvisitConfig {
  /** Janela mínima após bill_notified_at antes de poder enviar. */
  delayHours: number
  /** Copy de voucher pessoal opcional. */
  voucherLabel?: string
  /** Eventos de push permitidos para este nicho (whitelist). */
  pushEvents?: string[]
}

export const NICHE_POSTVISIT_REGISTRY: Record<string, NichePostvisitConfig> = {
  'bares-restaurantes': {
    delayHours: 24,
    voucherLabel: '10% off no próximo couvert',
    pushEvents: ['restaurant-postvisit-thanks', 'restaurant-bill-closed', 'clube-voucher-issued'],
  },
  'cervejaria': {
    delayHours: 36,
    voucherLabel: '15% off na próxima IPA',
    pushEvents: [
      'restaurant-postvisit-thanks',
      'restaurant-bill-closed',
      'clube-voucher-issued',
      'clube-poll-open',
    ],
  },
  'cafe-confeitaria': {
    delayHours: 18,
    voucherLabel: 'Café duplo no próximo combo',
    pushEvents: ['restaurant-postvisit-thanks', 'restaurant-bill-closed', 'clube-voucher-issued'],
  },
  'eventos-casas-show': {
    delayHours: 48,
    pushEvents: ['restaurant-postvisit-thanks', 'clube-voucher-issued'],
  },
}

export function getNicheConfig(niche?: string | null): NichePostvisitConfig {
  if (!niche) return { delayHours: DEFAULT_POSTVISIT_DELAY_HOURS }
  return (
    NICHE_POSTVISIT_REGISTRY[niche] ?? { delayHours: DEFAULT_POSTVISIT_DELAY_HOURS }
  )
}

export function postVisitDelayHours(niche?: string | null): number {
  return getNicheConfig(niche).delayHours
}

export function voucherLabelForNiche(niche?: string | null): string | undefined {
  return getNicheConfig(niche).voucherLabel
}

export function pushEventsForNiche(niche?: string | null): string[] | undefined {
  return getNicheConfig(niche).pushEvents
}

/**
 * Calcula o instante mais cedo em que a pós-visita pode ser enviada,
 * dado o fechamento da conta e o nicho.
 */
export function earliestPostvisitMoment(
  billClosedAtISO: string,
  niche?: string | null,
): Date {
  const closedAt = new Date(billClosedAtISO).getTime()
  const hours = postVisitDelayHours(niche)
  return new Date(closedAt + hours * 3600 * 1000)
}

export function listNicheRegistry(): Array<{ niche: string } & NichePostvisitConfig> {
  return Object.entries(NICHE_POSTVISIT_REGISTRY).map(([niche, cfg]) => ({ niche, ...cfg }))
}
