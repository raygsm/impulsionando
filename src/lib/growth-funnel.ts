/**
 * Growth Funnel — gancho central do Core Impulsionando.
 *
 * Implementa o princípio nº 1 de `docs/CORE_GROWTH_GOVERNANCE.md`:
 * toda criação de tenant alimenta o funil corporativo da Impulsionando
 * (marketing_leads + catalog_events), independentemente do nicho.
 *
 * Helper "best-effort": nunca lança — falhas são logadas e ignoradas para
 * não bloquear a operação de criação do tenant.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface TenantSignupLeadInput {
  companyId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  niche?: string | null;
  origin?: string | null;
  /** "clone" | "import_csv" | "self_signup" | "manual" | "wl_provisioning" | ... */
  channel: string;
  utm_source?: string | null;
  utm_campaign?: string | null;
  notes?: string | null;
}

/**
 * Registra um novo tenant como lead/conta do funil Impulsionando.
 * Cria linha em `marketing_leads` (source=tenant_signup) e evento de
 * analytics em `catalog_events`. Idempotente best-effort por companyId.
 */
export async function recordTenantSignupLead(
  supabase: SupabaseClient,
  input: TenantSignupLeadInput,
): Promise<void> {
  const noteParts = [
    `Tenant: ${input.name}`,
    `company_id=${input.companyId}`,
    `channel=${input.channel}`,
    input.notes,
  ].filter(Boolean);

  try {
    await supabase.from("marketing_leads").insert({
      source: "tenant_signup",
      status: "new",
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.name,
      niche: input.niche ?? null,
      origin: input.origin ?? input.channel,
      utm_source: input.utm_source ?? "impulsionando-core",
      utm_campaign: input.utm_campaign ?? `tenant-${input.channel}`,
      notes: noteParts.join(" · "),
    } as never);
  } catch (e) {
    console.warn("[growth-funnel] marketing_leads insert falhou", e);
  }

  try {
    await supabase.from("catalog_events").insert({
      event_name: "tenant_signup",
      metadata: {
        company_id: input.companyId,
        name: input.name,
        niche: input.niche ?? null,
        channel: input.channel,
        has_email: Boolean(input.email),
        has_phone: Boolean(input.phone),
      },
    } as never);
  } catch (e) {
    console.warn("[growth-funnel] catalog_events insert falhou", e);
  }
}
