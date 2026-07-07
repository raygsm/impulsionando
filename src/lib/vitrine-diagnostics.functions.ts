/**
 * Diagnóstico da Vitrine — server functions usadas na página admin
 * `/admin/vitrine-diagnostico` para descobrir por que uma empresa não
 * aparece na vitrine pública.
 *
 * Verifica: habilitação por tenant (vitrine_enabled, status),
 * presença de public_slug/segment/cidade, se o usuário tem permissão
 * (via `has_role` admin) e se a view pública `companies_vitrine_public`
 * está retornando linhas para `anon`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VitrineTenantDiagnosis = {
  id: string;
  name: string;
  public_slug: string | null;
  segment: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  vitrine_enabled: boolean;
  logo_url: string | null;
  reasons: string[];
  visibleOnPublicView: boolean;
};

export type VitrineDiagnosticsResult = {
  totals: {
    companies: number;
    enabled: number;
    disabled: number;
    withoutSlug: number;
    withoutSegment: number;
    visibleAnon: number;
  };
  publicView: {
    reachable: boolean;
    rowsAnon: number;
    error: string | null;
  };
  tenants: VitrineTenantDiagnosis[];
  generatedAt: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(`Falha ao verificar permissão: ${error.message}`);
  if (!data) throw new Error("Acesso restrito a administradores.");
}

async function checkPublicView() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    return { reachable: false, rowsAnon: 0, error: "SUPABASE_URL/PUBLISHABLE_KEY ausentes no runtime" };
  }
  try {
    const res = await fetch(`${url}/rest/v1/companies_vitrine_public?select=id&limit=1000`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { reachable: false, rowsAnon: 0, error: `${res.status} ${res.statusText} ${t.slice(0, 120)}` };
    }
    const rows = (await res.json()) as unknown[];
    return { reachable: true, rowsAnon: Array.isArray(rows) ? rows.length : 0, error: null };
  } catch (e: any) {
    return { reachable: false, rowsAnon: 0, error: String(e?.message ?? e) };
  }
}

export const getVitrineDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ search: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ context, data }): Promise<VitrineDiagnosticsResult> => {
    await assertAdmin(context.supabase, context.userId);

    const { data: companies, error } = await context.supabase
      .from("companies")
      .select("id,name,public_slug,segment,address_city,address_state,status,vitrine_enabled,logo_url")
      .neq("status", "archived")
      .order("name");
    if (error) throw new Error(error.message);

    const view = await checkPublicView();

    const { data: visibleRows } = await context.supabase
      .from("companies_vitrine_public")
      .select("id")
      .limit(2000);
    const visibleSet = new Set((visibleRows ?? []).map((r: any) => r.id as string));

    const search = data.search?.trim().toLowerCase();
    const list = (companies ?? []).filter((c: any) => {
      if (!search) return true;
      return [c.name, c.public_slug, c.segment, c.address_city]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(search));
    });

    const tenants: VitrineTenantDiagnosis[] = list.map((c: any) => {
      const reasons: string[] = [];
      if (!c.vitrine_enabled) reasons.push("vitrine_enabled = false");
      if (!c.public_slug) reasons.push("public_slug ausente");
      if (!c.segment) reasons.push("segment ausente");
      if (c.status && c.status !== "active") reasons.push(`status = ${c.status}`);
      if (!c.logo_url) reasons.push("logo_url ausente (recomendado)");
      const visible = visibleSet.has(c.id);
      if (!visible && reasons.length === 0) reasons.push("view não retornou (RLS/GRANT)");
      return {
        id: c.id,
        name: c.name,
        public_slug: c.public_slug,
        segment: c.segment,
        city: c.address_city,
        state: c.address_state,
        status: c.status,
        vitrine_enabled: !!c.vitrine_enabled,
        logo_url: c.logo_url,
        reasons,
        visibleOnPublicView: visible,
      };
    });

    const totals = {
      companies: tenants.length,
      enabled: tenants.filter((t) => t.vitrine_enabled).length,
      disabled: tenants.filter((t) => !t.vitrine_enabled).length,
      withoutSlug: tenants.filter((t) => !t.public_slug).length,
      withoutSegment: tenants.filter((t) => !t.segment).length,
      visibleAnon: tenants.filter((t) => t.visibleOnPublicView).length,
    };

    return {
      totals,
      publicView: view,
      tenants,
      generatedAt: new Date().toISOString(),
    };
  });
