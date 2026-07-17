/**
 * Detecção de subdomínio de tenant (client-side).
 *
 * Regra: qualquer host `<slug>.impulsionando.com.br` (exceto reservados)
 * é considerado um subdomínio de tenant e deve ser roteado para
 * `/vitrine/<slug>` na app principal.
 *
 * Requer DNS wildcard `*.impulsionando.com.br` → mesma app Impulsionando
 * (mesmo IP/CNAME do apex). Enquanto o wildcard não estiver publicado,
 * subdomínios retornam 404 no edge — este helper só age quando o host
 * chega até a app.
 */

const ROOT_DOMAINS = ["impulsionando.com.br", "impulsionando.lovable.app"];

/** Dedicated landings that replace the tenant's generic storefront. */
export const TENANT_LANDING_BY_SUBDOMAIN: Record<string, string> = {
  marocas: "/marocas",
  marcoas: "/marocas",
  colors: "/colors",
  chrismed: "/chrismed",
  riomed: "/riomed",
  wmp: "/wmp",
  garrido: "/garrido",
  impulsity: "/vitrine/impulsity",
  dqa: "/vitrine/dqa-panini",
  "plataforma-saude": "/vitrine/patricia-lenine",
  relacionamento: "/vitrine/relacionamento",
  "impulsionando-brasil": "/vitrine/impulsionando-brasil",
};

/** Legacy custom hosts that still resolve to a Core tenant landing. */
export const CUSTOM_HOST_LANDING: Record<string, string> = {
  "agenda.chrismed.com.br": "/chrismed",
  "www.agenda.chrismed.com.br": "/chrismed",
  "colors.impulsionando.lovable.app": "/colors",
  "colorsaude.lovable.app": "/colors",
  "colorssaude.lovable.app": "/colors",
};

/** Canonical host redirects for tenant landings that must not live on the apex. */
export function canonicalTenantHostRedirect(loc: {
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  protocol: string;
}): string | null {
  const host = loc.hostname.toLowerCase().split(":")[0];
  const path = loc.pathname || "/";
  const isChrismedPath = path === "/chrismed" || path.startsWith("/chrismed/");
  const isApex = host === "impulsionando.com.br" || host === "www.impulsionando.com.br";
  const isLegacyChrismedHost =
    host === "agenda.chrismed.com.br" || host === "www.agenda.chrismed.com.br";

  if (!isChrismedPath && !isLegacyChrismedHost) return null;
  if (!isApex && !isLegacyChrismedHost) return null;

  const proto = loc.protocol === "http:" ? "http:" : "https:";
  return `${proto}//chrismed.impulsionando.com.br${path}${loc.search}${loc.hash}`;
}

/** Subdomínios que NÃO devem ser tratados como tenant. */
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "cdn",
  "static",
  "assets",
  "mail",
  "smtp",
  "docs",
  "status",
  "id-preview",
  "preview",
  "dev",
  "staging",
  "project",
]);

/**
 * Subdomínios legados que foram descontinuados. Quando alguém acessa
 * o host antigo, redirecionamos para o subdomínio oficial em vigor
 * (mesma app, preservando path/query/hash).
 *
 * Colors Saúde: `colorssaude.impulsionando.com.br` foi substituído por
 * `colors.impulsionando.com.br`. O host antigo não deve mais servir
 * conteúdo — só redireciona.
 */
export const DEPRECATED_SUBDOMAIN_ALIAS: Record<string, string> = {
  colorssaude: "colors",
  "colors-saude": "colors",
};

export type TenantSubdomainMatch = {
  slug: string;
  host: string;
  rootDomain: string;
};

/** Extrai slug do tenant do hostname, se aplicável. */
export function getTenantSubdomain(host: string | null | undefined): TenantSubdomainMatch | null {
  if (!host) return null;
  const cleanHost = host.toLowerCase().split(":")[0];

  for (const root of ROOT_DOMAINS) {
    if (cleanHost === root) return null; // apex, não é tenant
    if (!cleanHost.endsWith("." + root)) continue;

    const prefix = cleanHost.slice(0, -("." + root).length);
    // Pega apenas o primeiro segmento (ex: dqa em "dqa.impulsionando.com.br")
    // Para "imobiliaria.garrido.impulsionando.com.br" pega "imobiliaria".
    const firstSeg = prefix.split(".")[0];
    if (!firstSeg) return null;
    if (RESERVED_SUBDOMAINS.has(firstSeg)) return null;
    if (firstSeg.startsWith("id-preview")) return null;

    return { slug: firstSeg, host: cleanHost, rootDomain: root };
  }
  return null;
}

/** Rota destino para um tenant detectado por subdomínio. */
export function tenantSubdomainTarget(slug: string): string {
  return TENANT_LANDING_BY_SUBDOMAIN[slug] ?? `/vitrine/${slug}`;
}

/** Resolves a public tenant host to its dedicated or generic landing. */
export function tenantLandingTargetForHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const cleanHost = host.toLowerCase().split(":")[0];
  const customTarget = CUSTOM_HOST_LANDING[cleanHost];
  if (customTarget) return customTarget;

  const match = getTenantSubdomain(cleanHost);
  return match ? tenantSubdomainTarget(match.slug) : null;
}

/**
 * Se o host atual for um subdomínio descontinuado, devolve a URL absoluta
 * do subdomínio oficial (preservando path/search/hash). Retorna null quando
 * o host já está correto.
 */
export function deprecatedSubdomainRedirect(loc: {
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  protocol: string;
}): string | null {
  const h = loc.hostname.toLowerCase().split(":")[0];
  for (const root of ROOT_DOMAINS) {
    if (!h.endsWith("." + root)) continue;
    const prefix = h.slice(0, -("." + root).length);
    const firstSeg = prefix.split(".")[0];
    const canonical = DEPRECATED_SUBDOMAIN_ALIAS[firstSeg];
    if (!canonical) return null;
    const proto = loc.protocol === "http:" ? "http:" : "https:";
    return `${proto}//${canonical}.${root}${loc.pathname}${loc.search}${loc.hash}`;
  }
  return null;
}
