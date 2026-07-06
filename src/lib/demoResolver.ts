/**
 * Resolver central de destino de demonstração por nicho.
 *
 * Fonte única para:
 *   - lista de demos suportadas
 *   - aliases (variações escritas por usuário / SEO / catálogos)
 *   - fallback controlado (sempre "servicos")
 *   - telemetria quando cair em fallback
 *
 * Todo CTA de funil (Home, Showroom, Recomendações, Hub) deve chamar
 * `getDemoNichoLink()` e passar `{ to, params }` para `<Link>` — nunca
 * concatenar strings em `href`.
 */

import { RICH_NICHES } from "@/lib/demoNichoExtras";

// Demos com página dedicada renderizada em /demo/nicho/$slug
export const SUPPORTED_DEMOS: readonly string[] = ["eventos", ...RICH_NICHES] as const;

/**
 * Alias -> slug oficial. Mantém o hub 100% navegável mesmo enquanto demos
 * dedicadas não existem. Chaves devem estar minúsculas, sem acento.
 */
export const NICHO_ALIASES: Record<string, string> = {
  // saúde
  saude: "saude",
  "clinicas-medicas": "saude",
  clinica: "saude",
  clinicas: "saude",
  "clinica-medica": "saude",
  consultorio: "saude",
  consultorios: "saude",
  fitness: "saude",
  academia: "saude",
  academias: "saude",
  psicologia: "saude",
  psicologos: "saude",
  psicologo: "saude",
  // bar / restaurante
  bar: "bar",
  bares: "bar",
  restaurante: "bar",
  restaurantes: "bar",
  "bares-restaurantes": "bar",
  // cervejarias
  cervejaria: "microcervejarias",
  cervejarias: "microcervejarias",
  microcervejarias: "microcervejarias",
  // comércio / e-commerce / auto
  comercio: "comercio",
  fornecedores: "comercio",
  ecommerce: "comercio",
  "e-commerce": "comercio",
  ecomerce: "comercio",
  "loja-virtual": "comercio",
  veiculos: "comercio",
  auto: "comercio",
  automotivo: "comercio",
  // imobiliária
  imobiliaria: "imobiliaria",
  imoveis: "imobiliaria",
  imobiliarias: "imobiliaria",
  // serviços / white label / contabilidade / jurídico
  servicos: "servicos",
  juridico: "servicos",
  advocacia: "servicos",
  "escritorio-advocacia": "servicos",
  contabilidade: "servicos",
  contador: "servicos",
  contadores: "servicos",
  "white-label": "servicos",
  // comunidade / educação
  comunidade: "comunidade",
  escola: "comunidade",
  escolas: "comunidade",
  educacao: "comunidade",
  // eventos
  eventos: "eventos",
  evento: "eventos",
};

const DEFAULT_FALLBACK = "servicos";

export type ResolveResult = {
  requested: string;
  slug: string;
  /** true se o slug pedido difere do resolvido */
  isAlias: boolean;
  /** true se caiu no fallback padrão porque nada casou */
  isFallback: boolean;
};

function normalize(raw: string | undefined | null): string {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveDemoNicho(input: string | undefined | null): ResolveResult {
  const requested = normalize(input);
  if (!requested) {
    logDemoFallback({ requested: String(input ?? ""), slug: DEFAULT_FALLBACK, reason: "empty" });
    return { requested: "", slug: DEFAULT_FALLBACK, isAlias: false, isFallback: true };
  }
  if (SUPPORTED_DEMOS.includes(requested)) {
    return { requested, slug: requested, isAlias: false, isFallback: false };
  }
  const aliased = NICHO_ALIASES[requested];
  if (aliased && SUPPORTED_DEMOS.includes(aliased)) {
    return { requested, slug: aliased, isAlias: aliased !== requested, isFallback: false };
  }
  logDemoFallback({ requested, slug: DEFAULT_FALLBACK, reason: "unknown-slug" });
  return { requested, slug: DEFAULT_FALLBACK, isAlias: false, isFallback: true };
}

/**
 * Retorna a tupla tipada pronta para `<Link to=... params=...>`.
 */
export function getDemoNichoLink(input: string | undefined | null) {
  const r = resolveDemoNicho(input);
  return {
    to: "/demo/nicho/$slug" as const,
    params: { slug: r.slug },
    ...r,
  };
}

// ================= Telemetria =================

export type DemoFallbackEvent = {
  requested: string;
  slug: string;
  reason: "empty" | "unknown-slug";
  at?: string;
  where?: "client" | "server";
  path?: string;
};

const LS_KEY = "impulsionando:demo-fallback-log";
const MAX_ENTRIES = 30;

/**
 * Log estruturado + rolling buffer em localStorage (client) para inspeção
 * rápida sem depender de tabela. Emite console.warn com prefixo padronizado
 * para grep em logs de servidor/Worker.
 */
export function logDemoFallback(evt: Omit<DemoFallbackEvent, "at" | "where" | "path">) {
  const isBrowser = typeof window !== "undefined";
  const full: DemoFallbackEvent = {
    ...evt,
    at: new Date().toISOString(),
    where: isBrowser ? "client" : "server",
    path: isBrowser ? window.location?.pathname : undefined,
  };
  // Prefixo estável para observabilidade
  // eslint-disable-next-line no-console
  console.warn("[demo-fallback]", full);

  if (!isBrowser) return;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const arr: DemoFallbackEvent[] = raw ? JSON.parse(raw) : [];
    arr.unshift(full);
    window.localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(0, MAX_ENTRIES)));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function readDemoFallbackLog(): DemoFallbackEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as DemoFallbackEvent[]) : [];
  } catch {
    return [];
  }
}
