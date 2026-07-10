/**
 * Formatadores canônicos do Core Impulsionando.
 *
 * Use estes helpers ao invés de reimplementar `brl`, `fmtBRL`, `fmtDate`,
 * `formatPct`, etc. em cada rota. Consolidação promovida na Fase P1
 * (Homologação Premium do Core).
 */

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const INT_FORMATTER = new Intl.NumberFormat("pt-BR");

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formata valor em BRL. Aceita reais (number) ou centavos (quando `fromCents=true`). */
export function formatBRL(value: number | null | undefined, opts?: { fromCents?: boolean }): string {
  if (value == null || Number.isNaN(value)) return "—";
  const reais = opts?.fromCents ? value / 100 : value;
  return BRL_FORMATTER.format(reais);
}

/** Formata número inteiro com separador pt-BR. */
export function formatInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return INT_FORMATTER.format(value);
}

/** Formata percentual. Aceita 0–1 (padrão) ou 0–100 (quando `basis100=true`). */
export function formatPct(value: number | null | undefined, opts?: { basis100?: boolean; digits?: number }): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = opts?.basis100 ? value : value * 100;
  return `${pct.toFixed(opts?.digits ?? 1)}%`;
}

/** Formata data (dd/mm/aaaa). Aceita ISO string, Date ou timestamp. */
export function formatDate(value: string | Date | number | null | undefined): string {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FORMATTER.format(d);
}

/** Formata data + hora (dd/mm/aaaa hh:mm). */
export function formatDateTime(value: string | Date | number | null | undefined): string {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATETIME_FORMATTER.format(d);
}
