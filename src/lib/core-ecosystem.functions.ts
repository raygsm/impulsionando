/**
 * Métricas agregadas do Ecossistema Impulsionando para o painel CORE.
 * Lê a view pública `companies_vitrine_public` (somente colunas seguras) e
 * cruza com `companies` para identificar empresas premium/white-label.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCoreHealthAccess } from "./core-rbac.functions";

export interface EcosystemMetrics {
  totalCompanies: number;
  bySegment: Array<{ segment: string; count: number }>;
  byCity: Array<{ city: string; count: number }>;
  byState: Array<{ state: string; count: number }>;
  recent: Array<{ id: string; name: string; segment: string | null; city: string | null; slug: string }>;
}

export const fetchEcosystemMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EcosystemMetrics> => {
    await assertCoreHealthAccess(context);
    const { data, error } = await context.supabase
      .from("companies_vitrine_public")
      .select("id,name,trade_name,public_slug,segment,address_city,address_state,updated_at")
      .order("updated_at", { ascending: false })
      .limit(2000);
    if (error) throw new Response(error.message, { status: 500 });

    const rows = data ?? [];
    const seg = new Map<string, number>();
    const city = new Map<string, number>();
    const state = new Map<string, number>();
    for (const r of rows) {
      const s = (r.segment ?? "—").toString();
      const c = (r.address_city ?? "—").toString();
      const st = (r.address_state ?? "—").toString();
      seg.set(s, (seg.get(s) ?? 0) + 1);
      city.set(c, (city.get(c) ?? 0) + 1);
      state.set(st, (state.get(st) ?? 0) + 1);
    }
    const toArr = <K extends string>(m: Map<string, number>, key: K) =>
      Array.from(m, ([k, count]) => ({ [key]: k, count } as Record<K, string> & { count: number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

    return {
      totalCompanies: rows.length,
      bySegment: toArr(seg, "segment"),
      byCity: toArr(city, "city"),
      byState: toArr(state, "state"),
      recent: rows.slice(0, 10).map((r: any) => ({
        id: r.id,
        name: r.trade_name || r.name,
        segment: r.segment ?? null,
        city: r.address_city ?? null,
        slug: r.public_slug,
      })),
    };
  });
