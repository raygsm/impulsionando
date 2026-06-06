/**
 * Taxa operacional fixa da Impulsionando sobre toda transação.
 * 5% sobre o valor bruto, aplicada em Pix, boleto, cartão, parcelado,
 * order bump, upsell, cross-sell, produtos físicos/digitais, assinaturas etc.
 */
export const PLATFORM_FEE_PCT = 5;

/** Prazo interno padrão (dias úteis) após a liquidação do gateway. */
export const INTERNAL_RELEASE_BUSINESS_DAYS = 3;

/** Prazo médio de liquidação por método (dias corridos). */
export const GATEWAY_RELEASE_DAYS: Record<string, number> = {
  pix: 1,
  boleto: 2,
  debit_card: 1,
  credit_card: 30,
  link: 30,
  manual: 0,
};

export function gatewayDaysFor(method?: string | null): number {
  if (!method) return 30;
  return GATEWAY_RELEASE_DAYS[method] ?? 30;
}
