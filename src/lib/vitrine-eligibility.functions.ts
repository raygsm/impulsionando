/**
 * Elegibilidade da Vitrine — servidor.
 *
 * Aplica a regra do item 4 do plano Core Tenants (RASCUNHO — enquanto
 * o schema oficial não recebe `tenant_type`/`vitrine_status`/geo/etc.):
 *
 * Um tenant é elegível quando:
 *  - status = 'active' (ou em ausência, sem status hostil)
 *  - vitrine_enabled = true
 *  - segment não nulo (nicho)
 *  - address_city não nulo
 *  - public_slug não nulo
 *  - (whatsapp OR website) → CTA público
 *
 * A função **não escreve nada**: apenas classifica e devolve, para o
 * Core exibir pendências e para a página `/admin/vitrine-elegibilidade`
 * mostrar por que um tenant NÃO aparece.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EligibilityStatus = "eligible" | "missing_data" | "disabled" | "blocked";

export type TenantEligibility = {
  id: string;
  name: string;
  status: string | null;
  vitrine_enabled: boolean;
  public_slug: string | null;
  segment: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  whatsapp: string | null;
  website: string | null;
  missing: string[];
  eligibility: EligibilityStatus;
  visibleOnPublicView: boolean;
};

export type EligibilitySummary = {
  totals: {
    companies: number;
    eligible: number;
    missing_data: number;
    disabled: number;
    blocked: number;
    visible: number;
  };
  byCity: Array<{ city: string; total: number; eligible: number }>;
  bySegment: Array<{ segment: string; total: number; eligible: number }>;
  tenants: TenantEligibility[];
  generatedAt: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(`Falha ao verificar permissão: ${error.message}`);
  if (!data) throw new Error("Acesso restrito a administradores.");
}

function classify(c: any, missing: string[]): EligibilityStatus {
  const hostile = ["archived", "suspended", "cancelled", "inactive"];
  if (c.status && hostile.includes(c.status)) return "blocked";
  if (!c.vitrine_enabled) return "disabled";
  if (missing.length > 0) return "missing_data";
  return "eligible";
}

function computeMissing(c: any): string[] {
  const m: string[] = [];
  if (!c.public_slug) m.push("public_slug");
  if (!c.segment) m.push("segment (nicho)");
  if (!c.address_city) m.push("address_city");
  if (!c.whatsapp && !c.website) m.push("CTA público (whatsapp ou website)");
  if (!c.logo_url) m.push("logo_url");
  return m;
}

export const getVitrineEligibility = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EligibilitySummary> => {
    await assertAdmin(context.supabase, context.userId);

    const { data: companies, error } = await context.supabase
      .from("companies")
      .select("id,name,status,vitrine_enabled,public_slug,segment,address_city,address_state,logo_url,whatsapp,website")
      .neq("status", "archived")
      .order("name");
    if (error) throw new Error(error.message);

    const { data: visibleRows } = await context.supabase
      .from("companies_vitrine_public")
      .select("id")
      .limit(2000);
    const visibleSet = new Set((visibleRows ?? []).map((r: any) => r.id as string));

    const tenants: TenantEligibility[] = (companies ?? []).map((c: any) => {
      const missing = computeMissing(c);
      const eligibility = classify(c, missing);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        vitrine_enabled: !!c.vitrine_enabled,
        public_slug: c.public_slug,
        segment: c.segment,
        city: c.address_city,
        state: c.address_state,
        logo_url: c.logo_url,
        whatsapp: c.whatsapp,
        website: c.website,
        missing,
        eligibility,
        visibleOnPublicView: visibleSet.has(c.id),
      };
    });

    const totals = {
      companies: tenants.length,
      eligible: tenants.filter((t) => t.eligibility === "eligible").length,
      missing_data: tenants.filter((t) => t.eligibility === "missing_data").length,
      disabled: tenants.filter((t) => t.eligibility === "disabled").length,
      blocked: tenants.filter((t) => t.eligibility === "blocked").length,
      visible: tenants.filter((t) => t.visibleOnPublicView).length,
    };

    const agg = (key: "city" | "segment") => {
      const m = new Map<string, { total: number; eligible: number }>();
      for (const t of tenants) {
        const k = (key === "city" ? t.city : t.segment) ?? "—";
        const cur = m.get(k) ?? { total: 0, eligible: 0 };
        cur.total += 1;
        if (t.eligibility === "eligible") cur.eligible += 1;
        m.set(k, cur);
      }
      return [...m.entries()]
        .map(([k, v]) => ({ [key]: k, ...v } as any))
        .sort((a, b) => b.total - a.total)
        .slice(0, 15);
    };

    return {
      totals,
      byCity: agg("city"),
      bySegment: agg("segment"),
      tenants,
      generatedAt: new Date().toISOString(),
    };
  });
