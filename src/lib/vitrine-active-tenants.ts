import { TENANT_LANDING_BY_SUBDOMAIN, isImpulsionandoPlatformHost } from "@/lib/subdomain";

export type VitrineTeaser = {
  id: string;
  name: string;
  trade_name: string | null;
  segment: string | null;
  tagline: string | null;
  description: string | null;
  public_slug: string | null;
  logo_url: string | null;
  address_city: string | null;
  address_state: string | null;
  primary_color: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  subdomain: string | null;
  domain: string | null;
  website: string | null;
  route: string | null;
};

export type RegistryTenant = {
  id: string;
  slug: string;
  display_name: string | null;
  company_id: string | null;
  active: boolean | null;
  kind?: string | null;
  deleted_at?: string | null;
  settings?: Record<string, unknown> | null;
};

export type CompanyRecord = {
  id: string;
  name: string;
  trade_name?: string | null;
  is_active?: boolean | null;
  is_demo?: boolean | null;
  status?: string | null;
  segment?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  description?: string | null;
  address_city?: string | null;
  address_state?: string | null;
};

export type IdentityRecord = {
  company_id: string;
  subdomain: string;
  custom_domain?: string | null;
  dns_status?: string | null;
  root_domain?: string | null;
  published_at?: string | null;
};

export type ShowcaseRecord = {
  company_id: string;
  opted_out_at?: string | null;
  public_name?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  short_description?: string | null;
  website_url?: string | null;
  public_data?: Record<string, string | null> | null;
  public_contact?: Record<string, string | null> | null;
};

const HOSTILE_STATUS = new Set(["archived", "suspended", "cancelled", "inactive"]);

const SEGMENT_BY_SLUG: Record<string, string> = {
  chrismed: "saude",
  colorssaude: "saude",
  "colors-saude": "saude",
  riomed: "medico-hospitalar",
  "rio-med": "medico-hospitalar",
  plataformasaude: "saude",
  marocas: "hospedagem",
  imobiliariagarrido: "imobiliaria",
  garrido: "imobiliaria",
  lopesenjoy: "imobiliaria",
  wmp: "eventos",
  fepersonal: "fitness",
  peroladavila: "beleza",
  ontap: "bar",
  raoni: "bar",
  riobeer: "bar",
  haunted: "bar",
  spartacus: "bar",
  sulatlantica: "b2b",
  csi: "financeiro",
  anamadu: "varejo",
  "impulsionando-tour": "turismo",
  revela: "midia",
  grupoevr: "b2b",
  "grupo-evr": "b2b",
};

export function isVitrineExcludedSlug(slug: string | null | undefined): boolean {
  if (!slug) return true;
  const clean = slug.toLowerCase().trim();
  if (!clean) return true;
  if (clean === "universidade" || clean === "global") return true;
  if (clean.startsWith("e2e-") || clean.startsWith("rls-") || clean.startsWith("id-preview")) return true;
  return isImpulsionandoPlatformHost(`${clean}.impulsionando.com.br`);
}

export function segmentForTenantSlug(slug: string, fallback?: string | null): string {
  return SEGMENT_BY_SLUG[slug] ?? fallback ?? "servicos";
}

export function publicSiteForTenant(input: {
  subdomain?: string | null;
  customDomain?: string | null;
  rootDomain?: string | null;
  websiteUrl?: string | null;
}): string | null {
  if (input.websiteUrl) return input.websiteUrl;
  if (input.customDomain) {
    return input.customDomain.startsWith("http") ? input.customDomain : `https://${input.customDomain}`;
  }
  if (input.subdomain) {
    const root = input.rootDomain || "impulsionando.com.br";
    return `https://${input.subdomain}.${root}`;
  }
  return null;
}

function landingRoute(slug: string): string | null {
  return TENANT_LANDING_BY_SUBDOMAIN[slug] ?? `/vitrine/${slug}`;
}

export function assembleVitrineTeasers(input: {
  tenants: RegistryTenant[];
  companies: CompanyRecord[];
  identities: IdentityRecord[];
  showcases: ShowcaseRecord[];
}): VitrineTeaser[] {
  const companies = new Map(input.companies.map((c) => [c.id, c]));
  const showcases = new Map(input.showcases.map((s) => [s.company_id, s]));
  const identitiesByCompany = new Map<string, IdentityRecord>();
  for (const identity of input.identities) {
    if (!identity.company_id || isVitrineExcludedSlug(identity.subdomain)) continue;
    const existing = identitiesByCompany.get(identity.company_id);
    if (!existing || identity.dns_status === "active" || identity.published_at) {
      identitiesByCompany.set(identity.company_id, identity);
    }
  }

  const seen = new Set<string>();
  const teasers: VitrineTeaser[] = [];

  const pushTeaser = (slug: string, companyId: string | null, displayName: string | null) => {
    if (isVitrineExcludedSlug(slug)) return;
    const company = companyId ? companies.get(companyId) : undefined;
    if (company) {
      if (company.is_demo) return;
      if (company.is_active === false) return;
      if (company.status && HOSTILE_STATUS.has(company.status)) return;
    }
    const showcase = companyId ? showcases.get(companyId) : undefined;
    if (showcase?.opted_out_at) return;

    const identity = companyId ? identitiesByCompany.get(companyId) : undefined;
    const canonicalSlug = identity?.subdomain || slug;
    const key = companyId || `slug:${canonicalSlug}`;
    if (seen.has(key) || seen.has(`slug:${canonicalSlug}`) || seen.has(`slug:${slug}`)) return;
    seen.add(key);
    seen.add(`slug:${canonicalSlug}`);
    seen.add(`slug:${slug}`);

    const name = (showcase?.public_name || displayName || company?.trade_name || company?.name || canonicalSlug).trim();
    const website = publicSiteForTenant({
      subdomain: identity?.subdomain ?? canonicalSlug,
      customDomain: identity?.custom_domain,
      rootDomain: identity?.root_domain,
      websiteUrl: showcase?.website_url,
    });

    teasers.push({
      id: companyId || key,
      name,
      trade_name: showcase?.public_name || company?.trade_name || displayName || name,
      segment: segmentForTenantSlug(canonicalSlug, company?.segment),
      tagline: showcase?.tagline || company?.tagline || `Cliente do ecossistema Impulsionando`,
      description:
        showcase?.short_description ||
        company?.description ||
        `Operação conectada ao Core Impulsionando — ${name}`,
      public_slug: canonicalSlug,
      logo_url: showcase?.logo_url || company?.logo_url || null,
      address_city: showcase?.public_data?.address_city || company?.address_city || null,
      address_state: showcase?.public_data?.address_state || company?.address_state || null,
      primary_color: showcase?.public_data?.primary_color || null,
      rating_avg: null,
      rating_count: null,
      subdomain: identity?.subdomain || slug,
      domain: identity?.custom_domain || null,
      website,
      route: landingRoute(canonicalSlug),
    });
  };

  for (const tenant of input.tenants) {
    if (tenant.active === false) continue;
    if (tenant.deleted_at) continue;
    if ((tenant.kind || "").toUpperCase() === "GLOBAL") continue;
    if (!tenant.slug) continue;
    pushTeaser(tenant.slug, tenant.company_id, tenant.display_name);
  }

  for (const identity of input.identities) {
    if (isVitrineExcludedSlug(identity.subdomain)) continue;
    const live = identity.dns_status === "active" || Boolean(identity.published_at);
    if (!live) continue;
    const company = companies.get(identity.company_id);
    if (!company) continue;
    pushTeaser(identity.subdomain, identity.company_id, company.trade_name || company.name);
  }

  return teasers.sort((a, b) => (a.trade_name || a.name).localeCompare(b.trade_name || b.name, "pt-BR"));
}

export function filterVitrineTeasers(
  teasers: VitrineTeaser[],
  opts: { segment?: string; q?: string; limit: number },
): VitrineTeaser[] {
  const q = opts.q?.trim().toLocaleLowerCase("pt-BR");
  return teasers
    .filter((row) => !opts.segment || row.segment === opts.segment)
    .filter((row) => {
      if (!q) return true;
      return `${row.name} ${row.trade_name ?? ""} ${row.segment ?? ""} ${row.tagline ?? ""}`.toLocaleLowerCase("pt-BR").includes(q);
    })
    .slice(0, opts.limit);
}
