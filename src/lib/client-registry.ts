type SupabaseLike = {
  from: (table: string) => any;
};

export type ResolvedClientCompany = {
  registry: {
    id: string;
    slug: string;
    display_name: string;
    company_id: string | null;
    active: boolean;
  };
  company: {
    id: string;
    name: string;
    legal_name: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
    logo_url: string | null;
    is_active: boolean;
    is_demo: boolean;
    status: string;
  } | null;
};

/**
 * Canonical client lookup for the current Core.
 * Public/application slugs live in communication_tenants; companies is the
 * central business record and is linked through company_id.
 */
export async function resolveClientCompanyBySlug(
  supabase: SupabaseLike,
  slug: string,
): Promise<ResolvedClientCompany | null> {
  const { data: registry, error: registryError } = await supabase
    .from("communication_tenants")
    .select("id,slug,display_name,company_id,active")
    .eq("slug", slug)
    .maybeSingle();

  if (registryError) throw new Error(registryError.message);
  if (!registry) return null;

  if (!registry.company_id) {
    return { registry, company: null } as ResolvedClientCompany;
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id,name,legal_name,document,email,phone,logo_url,is_active,is_demo,status")
    .eq("id", registry.company_id)
    .maybeSingle();

  if (companyError) throw new Error(companyError.message);
  return { registry, company: company ?? null } as ResolvedClientCompany;
}

export function canonicalClientHost(slug: string) {
  return `${slug}.impulsionando.com.br`;
}
