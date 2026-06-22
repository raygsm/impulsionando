// Utilitários de localização por tenant — Onda U (Bolivia/es-BO).
// Não há framework de i18n no projeto; este módulo concentra formatadores,
// catálogo de países suportados e helpers de moeda/data/telefone para que
// qualquer componente trate um tenant boliviano sem ramificar lógica.

export type CountryCode = "BR" | "BO";
export type Locale = "pt-BR" | "es-BO";

export interface TenantLocaleProfile {
  countryCode: CountryCode;
  locale: Locale;
  currencyCode: string; // ISO 4217
  phoneCountryCode: string; // E.164 dial code
  timezone: string; // IANA
  countryName: string; // exibição em PT
}

export const TENANT_LOCALE_PROFILES: Record<CountryCode, TenantLocaleProfile> = {
  BR: {
    countryCode: "BR",
    locale: "pt-BR",
    currencyCode: "BRL",
    phoneCountryCode: "+55",
    timezone: "America/Sao_Paulo",
    countryName: "Brasil",
  },
  BO: {
    countryCode: "BO",
    locale: "es-BO",
    currencyCode: "BOB",
    phoneCountryCode: "+591",
    timezone: "America/La_Paz",
    countryName: "Bolívia",
  },
};

export const DEFAULT_LOCALE_PROFILE = TENANT_LOCALE_PROFILES.BR;

export function getLocaleProfile(input: {
  country_code?: string | null;
  locale?: string | null;
  currency_code?: string | null;
  phone_country_code?: string | null;
  timezone?: string | null;
} | null | undefined): TenantLocaleProfile {
  if (!input) return DEFAULT_LOCALE_PROFILE;
  const base =
    (input.country_code && TENANT_LOCALE_PROFILES[input.country_code as CountryCode]) ||
    DEFAULT_LOCALE_PROFILE;
  return {
    ...base,
    locale: (input.locale as Locale) ?? base.locale,
    currencyCode: input.currency_code ?? base.currencyCode,
    phoneCountryCode: input.phone_country_code ?? base.phoneCountryCode,
    timezone: input.timezone ?? base.timezone,
  };
}

export function formatMoney(
  amount: number | null | undefined,
  profile: TenantLocaleProfile = DEFAULT_LOCALE_PROFILE,
): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat(profile.locale, {
    style: "currency",
    currency: profile.currencyCode,
  }).format(amount);
}

export function formatDate(
  value: string | number | Date | null | undefined,
  profile: TenantLocaleProfile = DEFAULT_LOCALE_PROFILE,
  options: Intl.DateTimeFormatOptions = { dateStyle: "short" },
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(profile.locale, {
    timeZone: profile.timezone,
    ...options,
  }).format(d);
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  profile: TenantLocaleProfile = DEFAULT_LOCALE_PROFILE,
): string {
  return formatDate(value, profile, { dateStyle: "short", timeStyle: "short" });
}

export function formatPhone(
  raw: string | null | undefined,
  profile: TenantLocaleProfile = DEFAULT_LOCALE_PROFILE,
): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return raw;
  const dial = profile.phoneCountryCode.replace("+", "");
  const local = digits.startsWith(dial) ? digits.slice(dial.length) : digits;
  if (profile.countryCode === "BO") {
    // BO: celular 8 dígitos. Ex: +591 7 1234567
    if (local.length === 8) return `${profile.phoneCountryCode} ${local.slice(0, 1)} ${local.slice(1)}`;
    return `${profile.phoneCountryCode} ${local}`;
  }
  // BR: 10/11 dígitos (DDD + número)
  if (local.length === 11) return `${profile.phoneCountryCode} (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `${profile.phoneCountryCode} (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return `${profile.phoneCountryCode} ${local}`;
}

// Mini dicionário pt-BR ↔ es-BO para rótulos críticos que aparecem em telas
// públicas/transacionais (CTA de checkout, status, recibos). Strings que
// continuam só em PT seguem renderizando o fallback.
const MESSAGES: Record<Locale, Record<string, string>> = {
  "pt-BR": {
    welcome: "Bem-vindo",
    checkout: "Finalizar pedido",
    pay: "Pagar",
    total: "Total",
    subtotal: "Subtotal",
    invoice: "Fatura",
    receipt: "Recibo",
    customer: "Cliente",
    address: "Endereço",
    phone: "Telefone",
    email: "E-mail",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Salvar",
    loading: "Carregando…",
    paid: "Pago",
    pending: "Pendente",
    overdue: "Em atraso",
    success: "Sucesso",
    error: "Erro",
  },
  "es-BO": {
    welcome: "Bienvenido",
    checkout: "Finalizar pedido",
    pay: "Pagar",
    total: "Total",
    subtotal: "Subtotal",
    invoice: "Factura",
    receipt: "Recibo",
    customer: "Cliente",
    address: "Dirección",
    phone: "Teléfono",
    email: "Correo",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    loading: "Cargando…",
    paid: "Pagado",
    pending: "Pendiente",
    overdue: "Vencido",
    success: "Éxito",
    error: "Error",
  },
};

export function t(
  key: keyof (typeof MESSAGES)["pt-BR"],
  profile: TenantLocaleProfile = DEFAULT_LOCALE_PROFILE,
): string {
  return MESSAGES[profile.locale]?.[key] ?? MESSAGES["pt-BR"][key] ?? String(key);
}
