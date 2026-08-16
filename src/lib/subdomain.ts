/**
 * Detecção de subdomínio de tenant (client-side/server-side helpers).
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
  const isOfficialChrismedHost = host === "chrismed.impulsionando.com.br";
  const isLegacyChrismedHost =
    host === "agenda.chrismed.com.br" || host === "www.agenda.chrismed.com.br";
  const isInternalChrismedPathOnOfficialHost = isOfficialChrismedHost && isChrismedPath;

  if (!isChrismedPath && !isLegacyChrismedHost) return null;
  if (!isApex && !isLegacyChrismedHost && !isInternalChrismedPathOnOfficialHost) return null;

  const proto = loc.protocol === "http:" ? "http:" : "https:";
  const publicPath = isChrismedPath
    ? path.slice("/chrismed".length) || "/"
    : path;
  return `${proto}//chrismed.impulsionando.com.br${publicPath}${loc.search}${loc.hash}`;
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
    if (cleanHost === root) return null;
    if (!cleanHost.endsWith("." + root)) continue;

    const prefix = cleanHost.slice(0, -("." + root).length);
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

const CLEAN_PATH_EXCLUDED_PREFIXES = [
  "/api/",
  "/assets/",
  "/.well-known/",
  "/favicon",
  "/robots",
  "/sitemap",
  "/manifest",
];

/**
 * Colors uses clean public URLs on colors.impulsionando.com.br while its
 * TanStack route tree is namespaced under /colors. Map document requests such
 * as /agenda or /eventos to /colors/agenda and /colors/eventos without touching
 * APIs or static assets. Internal /colors paths remain idempotent.
 */
export function toColorsInternalPathname(host: string | null | undefined, pathname: string): string {
  if (!host) return pathname;
  const cleanHost = host.toLowerCase().split(":")[0];
  if (cleanHost !== "colors.impulsionando.com.br") return pathname;

  const path = pathname || "/";
  if (path === "/colors" || path.startsWith("/colors/")) return path;
  if (CLEAN_PATH_EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return path;

  return path === "/" ? "/colors" : `/colors${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * WMP uses clean public URLs on its canonical host while its TanStack route tree
 * is intentionally namespaced under /wmp. This maps document requests such as
 * /djs or /empresas to the internal route without touching APIs, static files,
 * or global Core authentication/recovery/dashboard/security routes.
 */
export function toWmpInternalPathname(host: string | null | undefined, pathname: string): string {
  if (!host) return pathname;
  const cleanHost = host.toLowerCase().split(":")[0];
  if (cleanHost !== "wmp.impulsionando.com.br") return pathname;

  const path = pathname || "/";
  if (path === "/wmp" || path.startsWith("/wmp/")) return path;

  const globalCoreRoutes = new Set([
    "/auth",
    "/dashboard",
    "/seguranca/senha",
    "/reset-password",
    "/reset-password-sent",
  ]);
  if (globalCoreRoutes.has(path)) return path;
  if (CLEAN_PATH_EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return path;

  return path === "/" ? "/wmp" : `/wmp${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Se o host atual for um subdomínio descontinuado, devolve a URL absoluta
 * do subdomínio oficial preservando path/search/hash.
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
