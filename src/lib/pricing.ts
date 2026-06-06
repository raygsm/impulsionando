/**
 * Cálculo do orçamento da jornada "Monte seu Orçamento".
 *
 * Regras de desconto progressivo:
 *  - 1 módulo:        0%
 *  - 2 módulos:       5%
 *  - 3 módulos:      10%
 *  - 4+ módulos:     15%
 *
 * Valores são manipulados em centavos para evitar erros de ponto flutuante.
 */

import { CATALOG_MODULES, MODULE_PRICE_CENTS, type CatalogModule } from "@/data/moduleCatalog";

export interface QuoteLineItem {
  slug: string;
  name: string;
  priceCents: number;
}

export interface QuoteTotals {
  selectedCount: number;
  lineItems: QuoteLineItem[];
  subtotalCents: number;
  discountPct: number;
  discountCents: number;
  setupCents: number;
  totalCents: number;
}

export function discountPctFor(count: number): number {
  if (count >= 4) return 15;
  if (count === 3) return 10;
  if (count === 2) return 5;
  return 0;
}

/** Calcula totals a partir de uma lista de slugs selecionados. */
export function computeQuote(selectedSlugs: string[]): QuoteTotals {
  const unique = Array.from(new Set(selectedSlugs));
  const lineItems: QuoteLineItem[] = unique
    .map((slug) => CATALOG_MODULES.find((m) => m.slug === slug))
    .filter((m): m is CatalogModule => Boolean(m))
    .map((m) => ({ slug: m.slug, name: m.name, priceCents: m.priceCents }));

  const subtotalCents = lineItems.reduce((sum, it) => sum + it.priceCents, 0);
  const discountPct = discountPctFor(lineItems.length);
  // Math.round para arredondar centavos de forma estável (.5 → up)
  const discountCents = Math.round((subtotalCents * discountPct) / 100);
  const setupCents = 0; // Sem setup nesta versão; campo reservado para futuro.
  const totalCents = subtotalCents - discountCents + setupCents;

  return {
    selectedCount: lineItems.length,
    lineItems,
    subtotalCents,
    discountPct,
    discountCents,
    setupCents,
    totalCents,
  };
}

/** Formata centavos como moeda BR. */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/** Preço unitário (para tooltip / cards). */
export const UNIT_PRICE_CENTS = MODULE_PRICE_CENTS;
export const UNIT_PRICE_BRL = formatBRL(MODULE_PRICE_CENTS);
