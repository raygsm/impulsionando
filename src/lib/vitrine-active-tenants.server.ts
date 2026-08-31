import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  assembleVitrineTeasers,
  type CompanyRecord,
  type IdentityRecord,
  type RegistryTenant,
  type ShowcaseRecord,
  type VitrineTeaser,
} from "@/lib/vitrine-active-tenants";

async function selectAll<T>(table: string, columns: string): Promise<T[]> {
  const { data, error } = await (supabaseAdmin as any).from(table).select(columns).limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function loadActiveVitrineTeasers(): Promise<VitrineTeaser[]> {
  const [tenants, companies, identities, showcases] = await Promise.all([
    selectAll<RegistryTenant>(
      "communication_tenants",
      "id,slug,display_name,company_id,active,kind,deleted_at,settings",
    ).catch(async () =>
      selectAll<RegistryTenant>("communication_tenants", "id,slug,display_name,company_id,active"),
    ),
    selectAll<CompanyRecord>(
      "companies",
      "id,name,trade_name,is_active,is_demo,status,segment,logo_url,tagline,description,address_city,address_state",
    ).catch(async () =>
      selectAll<CompanyRecord>("companies", "id,name,is_active,is_demo,status,logo_url"),
    ),
    selectAll<IdentityRecord>(
      "core_tenant_identity",
      "company_id,subdomain,custom_domain,dns_status,root_domain,published_at",
    ).catch(async () =>
      selectAll<IdentityRecord>("core_tenant_identity", "company_id,subdomain,custom_domain,dns_status,root_domain"),
    ),
    selectAll<ShowcaseRecord>(
      "core_client_showcase_profiles",
      "company_id,opted_out_at,public_name,logo_url,tagline,short_description,website_url,public_data,public_contact",
    ).catch(() => [] as ShowcaseRecord[]),
  ]);

  return assembleVitrineTeasers({ tenants, companies, identities, showcases });
}
