/**
 * Detecção de subdomínio de tenant (client-side/server-side helpers).
 */

const ROOT_DOMAINS = ["impulsionando.com.br", "impulsionando.lovable.app"];
const COLORS_CANONICAL_HOST = "colorssaude.com.br";
export const WMP_CANONICAL_HOST = "wmp.impulsionando.com.br";
const COLORS_LEGACY_HOSTS = new Set([
  "colors.impulsionando.com.br",
  "colorssaude.impulsionando.com.br",
  "colors-saude.impulsionando.com.br",
  "colors.impulsionando.lovable.app",
  "colorsaude.lovable.app",
]);

/** Dedicated landings that replace the tenant's generic storefront. */
export const TENANT_LANDING_BY_SUBDOMAIN: Record<string, string> = {
  marocas: "/marocas",
  marcoas: "/marocas",
  chrismed: "/chrismed",
  riomed: "/riomed",
  wmp: "/wmp",
  anamadu: "/anamadu",
  garrido: "/garrido",
  ip: "/tour",
  tour: "/tour",
  "impulsionando-tour": "/tour",
  impulsity: "/vitrine/impulsity",
  dqa: "/vitrine/dqa-panini",
  "plataforma-saude": "/vitrine/patricia-lenine",
  relacionamento: "/vitrine/relacionamento",
  "impulsionando-brasil": "/vitrine/impulsionando-brasil",
};

/** Custom hosts that resolve directly to a Core tenant landing. */
export const CUSTOM_HOST_LANDING: Record<string, string> = {
  "agenda.chrismed.com.br": "/chrismed",
  "www.agenda.chrismed.com.br": "/chrismed",
  [COLORS_CANONICAL_HOST]: "/colors",
};

/** Canonical host redirects for tenant landings that must not live on the apex or aliases. */
export function canonicalTenantHostRedirect(loc: {
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  protocol: string;
}): string | null {
  const host = loc.hostname.toLowerCase().split(":")[0];
  const path = loc.pathname || "/";
  const proto = loc.protocol === "http:" ? "http:" : "https:";

  // Absolute tenant isolation: WMP is never canonicalized to the Impulsionando apex
  // or to another tenant by this universal helper.
  if (host === WMP_CANONICAL_HOST) return null;

  if (host === "www.colorssaude.com.br" || COLORS_LEGACY_HOSTS.has(host)) {
    const publicPath = path === "/colors" || path.startsWith("/colors/")
      ? path.slice("/colors".length) || "/"
      : path;
    return `${proto}//${COLORS_CANONICAL_HOST}${publicPath}${loc.search}${loc.hash}`;
  }

  const isColorsInternalPath = path === "/colors" || path.startsWith("/colors/");
  const isImpulsionandoApex = host === "impulsionando.com.br" || host === "www.impulsionando.com.br";
  if (isImpulsionandoApex && isColorsInternalPath) {
    const publicPath = path.slice("/colors".length) || "/";
    return `${proto}//${COLORS_CANONICAL_HOST}${publicPath}${loc.search}${loc.hash}`;
  }

  const isChrismedPath = path === "/chrismed" || path.startsWith("/chrismed/");
  const isApex = host === "impulsionando.com.br" || host === "www.impulsionando.com.br";
  const isOfficialChrismedHost = host === "chrismed.impulsionando.com.br";
  const isLegacyChrismedHost =
    host === "agenda.chrismed.com.br" || host === "www.agenda.chrismed.com.br";
  const isInternalChrismedPathOnOfficialHost = isOfficialChrismedHost && isChrismedPath;

  if (!isChrismedPath && !isLegacyChrismedHost) return null;
  if (!isApex && !isLegacyChrismedHost && !isInternalChrismedPathOnOfficialHost) return null;

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

const WMP_GLOBAL_CORE_ROUTES = new Set([
  "/auth",
  "/dashboard",
  "/seguranca/senha",
  "/reset-password",
  "/reset-password-sent",
]);

/**
 * Returns a same-host WMP path when the browser is on the WMP canonical host but
 * the visible path would otherwise hydrate as a universal/Core route. Never
 * returns an absolute URL and therefore can never send WMP to another domain.
 */
export function wmpHostLockTarget(host: string | null | undefined, pathname: string): string | null {
  if (!host) return null;
  const cleanHost = host.toLowerCase().split(":")[0];
  if (cleanHost !== WMP_CANONICAL_HOST) return null;

  const path = pathname || "/";
  if (path === "/wmp" || path.startsWith("/wmp/")) return null;
  if (WMP_GLOBAL_CORE_ROUTES.has(path)) return null;
  if (CLEAN_PATH_EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return null;

  return path === "/" ? "/wmp/" : `/wmp${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Colors uses clean public URLs only on colorssaude.com.br while its TanStack
 * route tree is namespaced under /colors. Map document requests such as /agenda
 * or /eventos to /colors/agenda and /colors/eventos without touching APIs or
 * static assets. Internal /colors paths remain idempotent.
 */
export function toColorsInternalPathname(host: string | null | undefined, pathname: string): string {
  if (!host) return pathname;
  const cleanHost = host.toLowerCase().split(":")[0];
  if (cleanHost !== COLORS_CANONICAL_HOST) return pathname;

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
  const locked = wmpHostLockTarget(host, pathname);
  return locked ?? pathname;
}

/**
 * Compatibility wrapper retained for callers/tests. Legacy Colors aliases now
 * always redirect to the sole canonical domain colorssaude.com.br.
 */
export function deprecatedSubdomainRedirect(loc: {
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  protocol: string;
}): string | null {
  const host = loc.hostname.toLowerCase().split(":")[0];
  if (!COLORS_LEGACY_HOSTS.has(host)) return null;
  const proto = loc.protocol === "http:" ? "http:" : "https:";
  let publicPath = loc.pathname || "/";
  if (publicPath === "/colors" || publicPath.startsWith("/colors/")) {
    publicPath = publicPath.slice("/colors".length) || "/";
  }
  return `${proto}//${COLORS_CANONICAL_HOST}${publicPath}${loc.search}${loc.hash}`;
}

export { COLORS_CANONICAL_HOST };
