import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Niche Performance Matrix — compara desempenho de cada nicho dentro do
 * core Impulsionando: tenants ativos, MRR consolidado, ticket médio,
 * adoção de módulos, leads no funil, taxa de conversão lead→tenant,
 * volume de suporte e velocidade de runtime. Permite identificar quais
 * verticais escalar, congelar ou repensar oferta.
 */
export const getNichePerformanceMatrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

    const [niches, companies, contracts, modules, leads, tickets, runtime] = await Promise.all([
      supabaseAdmin.from("niches").select("id, name, slug").limit(200),
      supabaseAdmin.from("companies").select("id, niche_id, is_active, created_at"),
      supabaseAdmin.from("billing_contracts").select("company_id, recurring_amount, status"),
      supabaseAdmin.from("company_modules").select("company_id, module_id, is_active"),
      supabaseAdmin.from("marketing_leads").select("niche, created_at").gte("created_at", since30),
      supabaseAdmin.from("support_tickets").select("company_id, status, priority, created_at").gte("created_at", since30),
      supabaseAdmin.from("runtime_events").select("company_id, created_at").gte("created_at", since30).limit(10000),
    ]);

    const nicheById = new Map<string, { id: string; name: string; slug: string }>();
    (niches.data ?? []).forEach((n: any) => nicheById.set(n.id, n));

    // Mapa company -> niche
    const companyToNiche = new Map<string, string | null>();
    const activeByNiche = new Map<string, number>();
    const totalByNiche = new Map<string, number>();
    (companies.data ?? []).forEach((c: any) => {
      companyToNiche.set(c.id, c.niche_id ?? null);
      const key = c.niche_id ?? "__sem_nicho__";
      totalByNiche.set(key, (totalByNiche.get(key) ?? 0) + 1);
      if (c.is_active) activeByNiche.set(key, (activeByNiche.get(key) ?? 0) + 1);
    });

    // MRR
    const mrrByNiche = new Map<string, number>();
    const contractsByNiche = new Map<string, number>();
    (contracts.data ?? []).forEach((c: any) => {
      if (c.status !== "active") return;
      const nid = companyToNiche.get(c.company_id) ?? "__sem_nicho__";
      mrrByNiche.set(nid, (mrrByNiche.get(nid) ?? 0) + Number(c.recurring_amount ?? 0));
      contractsByNiche.set(nid, (contractsByNiche.get(nid) ?? 0) + 1);
    });

    // Módulos
    const modulesByNiche = new Map<string, number>();
    (modules.data ?? []).forEach((m: any) => {
      if (!m.is_active) return;
      const nid = companyToNiche.get(m.company_id) ?? "__sem_nicho__";
      modulesByNiche.set(nid, (modulesByNiche.get(nid) ?? 0) + 1);
    });

    // Leads por nicho (texto livre — mapeia por slug/nome)
    const leadsByNiche = new Map<string, number>();
    const nicheLookup = new Map<string, string>();
    (niches.data ?? []).forEach((n: any) => {
      nicheLookup.set(String(n.slug ?? "").toLowerCase(), n.id);
      nicheLookup.set(String(n.name ?? "").toLowerCase(), n.id);
    });
    (leads.data ?? []).forEach((l: any) => {
      const key = String(l.niche ?? "").toLowerCase();
      const nid = nicheLookup.get(key) ?? "__sem_nicho__";
      leadsByNiche.set(nid, (leadsByNiche.get(nid) ?? 0) + 1);
    });

    // Tickets
    const ticketsByNiche = new Map<string, number>();
    const urgentByNiche = new Map<string, number>();
    (tickets.data ?? []).forEach((t: any) => {
      const nid = companyToNiche.get(t.company_id) ?? "__sem_nicho__";
      if (!["closed", "resolved", "cancelled"].includes(String(t.status))) {
        ticketsByNiche.set(nid, (ticketsByNiche.get(nid) ?? 0) + 1);
      }
      if (["urgent", "high"].includes(String(t.priority))) {
        urgentByNiche.set(nid, (urgentByNiche.get(nid) ?? 0) + 1);
      }
    });

    // Runtime
    const runtimeByNiche = new Map<string, number>();
    (runtime.data ?? []).forEach((r: any) => {
      const nid = companyToNiche.get(r.company_id) ?? "__sem_nicho__";
      runtimeByNiche.set(nid, (runtimeByNiche.get(nid) ?? 0) + 1);
    });

    const allNicheIds = new Set<string>([
      ...nicheById.keys(),
      ...totalByNiche.keys(),
      ...mrrByNiche.keys(),
      ...leadsByNiche.keys(),
    ]);

    const matrix = [...allNicheIds].map((nid) => {
      const n = nicheById.get(nid);
      const active = activeByNiche.get(nid) ?? 0;
      const total = totalByNiche.get(nid) ?? 0;
      const mrr = mrrByNiche.get(nid) ?? 0;
      const contractsCount = contractsByNiche.get(nid) ?? 0;
      const leadsCount = leadsByNiche.get(nid) ?? 0;
      const modulesActive = modulesByNiche.get(nid) ?? 0;
      const ticketsOpen = ticketsByNiche.get(nid) ?? 0;
      const ticketsUrgent = urgentByNiche.get(nid) ?? 0;
      const runtimeEvents = runtimeByNiche.get(nid) ?? 0;
      const avgTicket = contractsCount > 0 ? mrr / contractsCount : 0;
      const conversionPct = leadsCount > 0 ? (active / leadsCount) * 100 : 0;
      const modulesPerTenant = active > 0 ? modulesActive / active : 0;
      const ticketsPerTenant = active > 0 ? ticketsOpen / active : 0;
      const eventsPerTenant = active > 0 ? runtimeEvents / active : 0;

      // Score de saúde 0-100: equilíbrio receita / engajamento / suporte
      let health = 50;
      if (mrr > 0) health += Math.min(20, Math.log10(mrr) * 5);
      if (eventsPerTenant > 50) health += 10;
      else if (eventsPerTenant > 10) health += 5;
      else if (eventsPerTenant < 2 && active > 0) health -= 15;
      if (ticketsPerTenant > 2) health -= 10;
      if (ticketsUrgent > 3) health -= 10;
      if (conversionPct > 10) health += 8;
      else if (conversionPct < 1 && leadsCount > 10) health -= 8;
      health = Math.max(0, Math.min(100, Math.round(health)));

      return {
        nicheId: nid,
        name: n?.name ?? (nid === "__sem_nicho__" ? "Sem nicho" : nid.slice(0, 8)),
        slug: n?.slug ?? null,
        activeTenants: active,
        totalTenants: total,
        mrr: Math.round(mrr),
        avgTicket: Math.round(avgTicket),
        leads30d: leadsCount,
        conversionPct: Number(conversionPct.toFixed(1)),
        modulesActive,
        modulesPerTenant: Number(modulesPerTenant.toFixed(1)),
        ticketsOpen,
        ticketsUrgent,
        eventsPerTenant: Math.round(eventsPerTenant),
        health,
      };
    }).sort((a, b) => b.mrr - a.mrr || b.activeTenants - a.activeTenants);

    const totals = matrix.reduce(
      (acc, r) => ({
        tenants: acc.tenants + r.activeTenants,
        mrr: acc.mrr + r.mrr,
        leads: acc.leads + r.leads30d,
        tickets: acc.tickets + r.ticketsOpen,
      }),
      { tenants: 0, mrr: 0, leads: 0, tickets: 0 },
    );

    return {
      matrix,
      totals,
      nichesCovered: matrix.filter((m) => m.activeTenants > 0).length,
      generatedAt: new Date().toISOString(),
    };
  });
