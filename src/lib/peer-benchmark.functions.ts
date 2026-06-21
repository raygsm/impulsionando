import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Peer Benchmark Anônimo — compara KPIs de cada tenant contra o p25/p50/p75
 * dos peers do mesmo nicho. Nenhum SaaS BR mostra benchmark anônimo nativo
 * dentro do produto.
 *
 * KPIs: MRR, módulos ativos, idade (dias) e tickets de suporte abertos.
 */
export const getPeerBenchmark = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const [companies, modules, contracts, tickets] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, niche_code, is_active, created_at").eq("is_active", true).limit(2000),
      supabaseAdmin.from("company_modules").select("company_id, is_enabled"),
      supabaseAdmin.from("billing_contracts").select("company_id, recurring_amount, status"),
      supabaseAdmin.from("support_tickets").select("company_id, status"),
    ]);

    const moduleCount = new Map<string, number>();
    (modules.data ?? []).forEach((m: any) => {
      if (m.is_enabled === false) return;
      moduleCount.set(m.company_id, (moduleCount.get(m.company_id) ?? 0) + 1);
    });

    const mrr = new Map<string, number>();
    (contracts.data ?? []).forEach((c: any) => {
      if (c.status !== "active") return;
      mrr.set(c.company_id, (mrr.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
    });

    const openTickets = new Map<string, number>();
    (tickets.data ?? []).forEach((t: any) => {
      if (!["open", "pending", "in_progress"].includes(String(t.status))) return;
      openTickets.set(t.company_id, (openTickets.get(t.company_id) ?? 0) + 1);
    });

    const now = Date.now();
    type Row = { id: string; name: string; niche: string; mrr: number; modules: number; ageDays: number; tickets: number };
    const rows: Row[] = (companies.data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      niche: c.niche_code ?? "outros",
      mrr: mrr.get(c.id) ?? 0,
      modules: moduleCount.get(c.id) ?? 0,
      ageDays: Math.floor((now - new Date(c.created_at).getTime()) / 86400000),
      tickets: openTickets.get(c.id) ?? 0,
    }));

    const pct = (arr: number[], p: number) => {
      if (!arr.length) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
      return sorted[idx];
    };

    const byNiche = new Map<string, Row[]>();
    rows.forEach((r) => {
      if (!byNiche.has(r.niche)) byNiche.set(r.niche, []);
      byNiche.get(r.niche)!.push(r);
    });

    const benchmarks = [...byNiche.entries()].map(([niche, peers]) => ({
      niche,
      peers: peers.length,
      mrr_p25: pct(peers.map((p) => p.mrr), 25),
      mrr_p50: pct(peers.map((p) => p.mrr), 50),
      mrr_p75: pct(peers.map((p) => p.mrr), 75),
      modules_p50: pct(peers.map((p) => p.modules), 50),
      tickets_p50: pct(peers.map((p) => p.tickets), 50),
    }));

    const tenantInsights = rows.map((r) => {
      const bench = benchmarks.find((b) => b.niche === r.niche);
      if (!bench) return null;
      const mrrQuartile = r.mrr >= bench.mrr_p75 ? "top" : r.mrr >= bench.mrr_p50 ? "above" : r.mrr >= bench.mrr_p25 ? "below" : "bottom";
      const modulesGap = bench.modules_p50 - r.modules;
      return { ...r, mrrQuartile, modulesGap, bench };
    }).filter(Boolean);

    return {
      benchmarks: benchmarks.sort((a, b) => b.peers - a.peers),
      tenants: tenantInsights.sort((a: any, b: any) => b.mrr - a.mrr).slice(0, 200),
      summary: {
        totalTenants: rows.length,
        niches: benchmarks.length,
        avgMrr: rows.length ? rows.reduce((s, r) => s + r.mrr, 0) / rows.length : 0,
      },
    };
  });
