/**
 * Detecção de subdomínio de tenant (client-side/server-side helpers).
 * Colors Saúde possui UM ÚNICO host oficial: colorssaude.impulsionando.com.br.
 * Enquanto DNS/SSL estiverem em reconciliação, o front também pode ser acompanhado
 * pelo caminho interno estável no domínio principal.
 */

const ROOT_DOMAINS = ["impulsionando.com.br"];
export const COLORS_CANONICAL_HOST = "colorssaude.impulsionando.com.br";
export const WMP_CANONICAL_HOST = "wmp.impulsionando.com.br";

export const TENANT_LANDING_BY_SUBDOMAIN: Record<string, string> = {
  marocas: "/marocas",
  marcoas: "/marocas",
  chrismed: "/chrismed",
  riomed: "/riomed",
  wmp: "/wmp",
  csi: "/csi",
  anamadu: "/anamadu",
  grupoevr: "/grupo-evr",
  garrido: "/garrido",
  colorssaude: "/colors",
  it: "/tour",
  ip: "/tour",
  tour: "/tour",
  "impulsionando-tour": "/tour",
  impulsity: "/vitrine/impulsity",
  dqa: "/vitrine/dqa-panini",
  "plataforma-saude": "/vitrine/patricia-lenine",
  relacionamento: "/vitrine/relacionamento",
  "impulsionando-brasil": "/vitrine/impulsionando-brasil",
};

export const CUSTOM_HOST_LANDING: Record<string, string> = {
  "agenda.chrismed.com.br": "/chrismed",
  "www.agenda.chrismed.com.br": "/chrismed",
  [COLORS_CANONICAL_HOST]: "/colors",
};

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

  if (host === WMP_CANONICAL_HOST || host === COLORS_CANONICAL_HOST) return null;

  // Não redirecionar /colors no apex. Ele é o fallback operacional de preview
  // quando colorssaude.impulsionando.com.br ainda estiver em reconciliação.

  const isChrismedPath = path === "/chrismed" || path.startsWith("/chrismed/");
  const isApex = host === "impulsionando.com.br" || host === "www.impulsionando.com.br";
  const isOfficialChrismedHost = host === "chrismed.impulsionando.com.br";
  const isLegacyChrismedHost = host === "agenda.chrismed.com.br" || host === "www.agenda.chrismed.com.br";
  const isInternalChrismedPathOnOfficialHost = isOfficialChrismedHost && isChrismedPath;

  if (!isChrismedPath && !isLegacyChrismedHost) return null;
  if (!isApex && !isLegacyChrismedHost && !isInternalChrismedPathOnOfficialHost) return null;

  const publicPath = isChrismedPath ? path.slice("/chrismed".length) || "/" : path;
  return `${proto}//chrismed.impulsionando.com.br${publicPath}${loc.search}${loc.hash}`;
}

const RESERVED_SUBDOMAINS = new Set([
  "www","app","admin","api","cdn","static","assets","mail","smtp","docs","status",
  "id-preview","preview","dev","staging","project",
]);

export type TenantSubdomainMatch = { slug: string; host: string; rootDomain: string };

export function getTenantSubdomain(host: string | null | undefined): TenantSubdomainMatch | null {
  if (!host) return null;
  const cleanHost = host.toLowerCase().split(":")[0];
  for (const root of ROOT_DOMAINS) {
    if (cleanHost === root) return null;
    if (!cleanHost.endsWith("." + root)) continue;
    const prefix = cleanHost.slice(0, -("." + root).length);
    const firstSeg = prefix.split(".")[0];
    if (!firstSeg || RESERVED_SUBDOMAINS.has(firstSeg) || firstSeg.startsWith("id-preview")) return null;
    return { slug: firstSeg, host: cleanHost, rootDomain: root };
  }
  return null;
}

export function tenantSubdomainTarget(slug: string): string {
  return TENANT_LANDING_BY_SUBDOMAIN[slug] ?? `/vitrine/${slug}`;
}

export function tenantLandingTargetForHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const cleanHost = host.toLowerCase().split(":")[0];
  const customTarget = CUSTOM_HOST_LANDING[cleanHost];
  if (customTarget) return customTarget;
  const match = getTenantSubdomain(cleanHost);
  return match ? tenantSubdomainTarget(match.slug) : null;
}

const CLEAN_PATH_EXCLUDED_PREFIXES = ["/api/","/assets/","/.well-known/","/favicon","/robots","/sitemap","/manifest"];
const WMP_GLOBAL_CORE_ROUTES = new Set(["/auth","/dashboard","/seguranca/senha","/reset-password","/reset-password-sent"]);

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

export function toColorsInternalPathname(host: string | null | undefined, pathname: string): string {
  if (!host) return pathname;
  const cleanHost = host.toLowerCase().split(":")[0];
  if (cleanHost !== COLORS_CANONICAL_HOST) return pathname;
  const path = pathname || "/";
  if (path === "/colors" || path.startsWith("/colors/")) return path;
  if (CLEAN_PATH_EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return path;
  return path === "/" ? "/colors" : `/colors${path.startsWith("/") ? path : `/${path}`}`;
}

export function toWmpInternalPathname(host: string | null | undefined, pathname: string): string {
  const locked = wmpHostLockTarget(host, pathname);
  return locked ?? pathname;
}
