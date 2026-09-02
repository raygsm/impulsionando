/**
 * Hostname → tenant internal path (Phase 4B strangler).
 * Subset of legacy src/lib/subdomain.ts — shared by tenant-web runtime.
 */

const ROOT_DOMAINS = ["impulsionando.com.br"];

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
  revela: "/revela",
  ontap: "/ontap",
  raoni: "/raoni",
  riobeer: "/riobeer",
};

export const CUSTOM_HOST_LANDING: Record<string, string> = {
  "agenda.chrismed.com.br": "/chrismed",
  "www.agenda.chrismed.com.br": "/chrismed",
  "colorssaude.impulsionando.com.br": "/colors",
  "wmp.impulsionando.com.br": "/wmp",
};

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "cdn",
  "static",
  "assets",
  "mail",
  "staging",
  "dev",
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
    if (!firstSeg || RESERVED_SUBDOMAINS.has(firstSeg)) return null;
    return { slug: firstSeg, host: cleanHost, rootDomain: root };
  }
  return null;
}

export function tenantSubdomainTarget(slug: string): string {
  return TENANT_LANDING_BY_SUBDOMAIN[slug] ?? `/vitrine/${slug}`;
}

/** Resolve hostname to internal tenant route prefix (e.g. garrido.impulsionando.com.br → /garrido). */
export function resolveTenantPathFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const cleanHost = host.toLowerCase().split(":")[0];
  const customTarget = CUSTOM_HOST_LANDING[cleanHost];
  if (customTarget) return customTarget;
  const match = getTenantSubdomain(cleanHost);
  return match ? tenantSubdomainTarget(match.slug) : null;
}
