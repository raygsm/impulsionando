/**
 * Cockpit unificado por nicho.
 *
 * Um único server function alimenta a rota `/nichos/$slug` para
 * QUALQUER nicho — atende os pendentes hoje (marketing-tecnologia,
 * servicos, comercio, ecommerce) e todos os futuros sem novo código.
 *
 * KPIs derivam do funil Impulsionando (captar → converter → relacionar
 * → reter → expandir) usando dados reais: `companies`, `marketing_leads`,
 * `crm_opportunities`, `customers`. Filtragem por nicho via
 * `companies.niche_id` → `niches.slug`.
 *
 * Autenticado + gate por RLS na leitura dos dados de tenants; o resumo
 * agregado é seguro para qualquer papel logado (contagens, sem PII).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface NicheCockpit {
  slug: string;
  name: string;
  macroSlug: string | null;
  tenants: number;
  leads30d: number;
  opportunitiesOpen: number;
  opportunitiesWon30d: number;
  gmv30d: number;
  customersActive: number;
  conversionRate: number; // % leads→won
  lastLeadAt: string | null;
  checkedAt: string;
}

const InputSchema = z.object({ slug: z.string().min(1).max(100) });

export const getNicheCockpit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<NicheCockpit> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: nicheRow } = await supabaseAdmin
      .from("niches")
      .select("id, slug, name, macro_slug")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!nicheRow) {
      return {
        slug: data.slug,
        name: data.slug,
        macroSlug: null,
        tenants: 0,
        leads30d: 0,
        opportunitiesOpen: 0,
        opportunitiesWon30d: 0,
        gmv30d: 0,
        customersActive: 0,
        conversionRate: 0,
        lastLeadAt: null,
        checkedAt: new Date().toISOString(),
      };
    }

    const { data: companies } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("niche_id", nicheRow.id);
    const companyIds = (companies ?? []).map((c) => c.id as string);

    // Sem tenants ainda: devolve estrutura zerada para renderizar CTA de onboarding.
    if (companyIds.length === 0) {
      return {
        slug: nicheRow.slug as string,
        name: nicheRow.name as string,
        macroSlug: (nicheRow.macro_slug as string | null) ?? null,
        tenants: 0,
        leads30d: 0,
        opportunitiesOpen: 0,
        opportunitiesWon30d: 0,
        gmv30d: 0,
        customersActive: 0,
        conversionRate: 0,
        lastLeadAt: null,
        checkedAt: new Date().toISOString(),
      };
    }

    const [
      leads30dQ,
      lastLeadQ,
      oppsOpenQ,
      oppsWonQ,
      customersQ,
    ] = await Promise.all([
      supabaseAdmin
        .from("marketing_leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since30d),
      supabaseAdmin
        .from("marketing_leads")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1),
      supabaseAdmin
        .from("crm_opportunities")
        .select("id", { count: "exact", head: true })
        .in("company_id", companyIds)
        .eq("status", "open"),
      supabaseAdmin
        .from("crm_opportunities")
        .select("value, closed_at")
        .in("company_id", companyIds)
        .eq("status", "won")
        .gte("closed_at", since30d)
        .limit(5000),
      supabaseAdmin
        .from("customers")
        .select("id", { count: "exact", head: true })
        .in("company_id", companyIds)
        .eq("is_active", true),
    ]);

    const oppsWon = oppsWonQ.data ?? [];
    const gmv30d = oppsWon.reduce((s, r) => s + Number(r.value ?? 0), 0);
    const leads30d = leads30dQ.count ?? 0;
    const opportunitiesWon30d = oppsWon.length;
    const conversionRate =
      leads30d === 0 ? 0 : Math.round((opportunitiesWon30d / leads30d) * 10000) / 100;

    return {
      slug: nicheRow.slug as string,
      name: nicheRow.name as string,
      macroSlug: (nicheRow.macro_slug as string | null) ?? null,
      tenants: companyIds.length,
      leads30d,
      opportunitiesOpen: oppsOpenQ.count ?? 0,
      opportunitiesWon30d,
      gmv30d,
      customersActive: customersQ.count ?? 0,
      conversionRate,
      lastLeadAt: (lastLeadQ.data?.[0]?.created_at as string | null) ?? null,
      checkedAt: new Date().toISOString(),
    };
  });
