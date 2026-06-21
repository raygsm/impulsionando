import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Expansion Radar — recomendação de upsell/cross-sell por tenant.
 *
 * Para cada tenant ativo, computa módulos "esperados" para o nicho (filtragem
 * colaborativa simples: módulo é esperado quando ≥40% dos tenants do mesmo
 * nicho o tem ativo) e identifica gaps: módulos esperados que o tenant NÃO tem.
 *
 * Score de oportunidade (0-100):
 *   - 60 pts — gap de adoção (peer_rate * 60)
 *   - 25 pts — MRR atual do tenant (saturação)
 *   - 15 pts — Health saudável (sem overdue, ativo recente)
 *
 * Nenhum SaaS BR oferece recomendação automática de módulos cruzando
 * comportamento de peers do mesmo nicho.
 */
export const getExpansionOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const [companies, modulesActive, modulesCat, contracts, overdueInv] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, niche_code, is_active").eq("is_active", true).limit(1000),
      supabaseAdmin.from("company_modules").select("company_id, module_code, is_enabled").eq("is_enabled", true),
      supabaseAdmin.from("core_module_catalog").select("module_code, name, niche_code").limit(500),
      supabaseAdmin.from("billing_contracts").select("id, company_id, recurring_amount, last_paid_at, status"),
      supabaseAdmin.from("billing_invoices").select("contract_id, status").in("status", ["overdue", "open"]),
    ]);

    // Index: company → set(module_code)
    const byCompany = new Map<string, Set<string>>();
    for (const m of (modulesActive.data as any[]) ?? []) {
      if (!byCompany.has(m.company_id)) byCompany.set(m.company_id, new Set());
      byCompany.get(m.company_id)!.add(m.module_code);
    }

    // Index: niche → company list
    const companiesByNiche = new Map<string, any[]>();
    for (const co of (companies.data as any[]) ?? []) {
      const k = co.niche_code ?? "_unknown";
      if (!companiesByNiche.has(k)) companiesByNiche.set(k, []);
      companiesByNiche.get(k)!.push(co);
    }

    // Para cada (niche, module) → taxa de adoção entre peers
    const peerRate = new Map<string, Map<string, number>>(); // niche → module → rate
    for (const [niche, list] of companiesByNiche) {
      const counts = new Map<string, number>();
      for (const co of list) {
        const mods = byCompany.get(co.id) ?? new Set();
        for (const code of mods) counts.set(code, (counts.get(code) ?? 0) + 1);
      }
      const rates = new Map<string, number>();
      const total = list.length || 1;
      for (const [code, count] of counts) rates.set(code, count / total);
      peerRate.set(niche, rates);
    }

    // Module catalog name lookup
    const modNames = new Map<string, string>();
    for (const m of (modulesCat.data as any[]) ?? []) modNames.set(m.module_code, m.name);

    // Contracts → MRR e overdue por company
    const overdueContracts = new Set<string>((overdueInv.data as any[] ?? []).map((o) => o.contract_id));
    const mrrByCompany = new Map<string, number>();
    const overdueByCompany = new Set<string>();
    const lastPaidByCompany = new Map<string, string | null>();
    for (const c of (contracts.data as any[]) ?? []) {
      mrrByCompany.set(c.company_id, (mrrByCompany.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
      if (overdueContracts.has(c.id)) overdueByCompany.add(c.company_id);
      const prev = lastPaidByCompany.get(c.company_id);
      if (c.last_paid_at && (!prev || c.last_paid_at > prev)) lastPaidByCompany.set(c.company_id, c.last_paid_at);
    }

    const today = Date.now();
    const opportunities: any[] = [];
    for (const co of (companies.data as any[]) ?? []) {
      const niche = co.niche_code ?? "_unknown";
      const rates = peerRate.get(niche);
      if (!rates) continue;
      const owned = byCompany.get(co.id) ?? new Set();
      const mrr = mrrByCompany.get(co.id) ?? 0;
      const hasOverdue = overdueByCompany.has(co.id);
      const lp = lastPaidByCompany.get(co.id);
      const lastPaidDays = lp ? (today - Date.parse(lp)) / 86400000 : 999;
      const healthy = !hasOverdue && lastPaidDays <= 35;

      for (const [code, rate] of rates) {
        if (owned.has(code)) continue;
        if (rate < 0.4) continue; // só módulos adotados por ≥40% dos peers

        const gapPts = Math.round(rate * 60);
        const mrrPts = Math.min(25, Math.round(Math.log10(mrr + 1) * 8));
        const healthPts = healthy ? 15 : 0;
        const score = gapPts + mrrPts + healthPts;

        opportunities.push({
          company_id: co.id,
          company_name: co.name,
          niche_code: niche,
          module_code: code,
          module_name: modNames.get(code) ?? code,
          peer_adoption_rate: Math.round(rate * 100),
          current_mrr: mrr,
          score,
          healthy,
        });
      }
    }

    opportunities.sort((a, b) => b.score - a.score);

    const summary = {
      total: opportunities.length,
      tenants_with_gaps: new Set(opportunities.map((o) => o.company_id)).size,
      top_modules: [...opportunities.reduce((m, o) => m.set(o.module_code, (m.get(o.module_code) ?? 0) + 1), new Map<string, number>())]
        .map(([code, count]) => ({ module_code: code, module_name: opportunities.find((o) => o.module_code === code)?.module_name ?? code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      potential_uplift_mrr: opportunities.slice(0, 100).reduce((s, o) => s + o.current_mrr * 0.15, 0),
    };

    return { summary, opportunities: opportunities.slice(0, 300) };
  });
