import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Conversion Funnel — Fase 30.
 * Funil de conversão MARKETING → REVENUE com 5 etapas e taxa entre elas:
 *  1) Visitas demo (demo_sessions)
 *  2) Leads (marketing_leads + demo_leads dedup)
 *  3) Trials iniciados (trial_subscriptions)
 *  4) Trials convertidos (trial_subscriptions.converted_at OR billing_contracts ativos)
 *  5) Paid retidos 30d+ (contratos ativos com idade ≥ 30d)
 *
 * Métricas:
 *  - Volume e taxa entre cada par (V→L, L→T, T→C, C→R)
 *  - Time-to-convert médio (lead→trial, trial→paid) em dias
 *  - Breakdown por utm_source e por nicho
 *  - Detecção do gargalo (menor taxa abaixo do benchmark)
 *  - Comparativo período atual vs anterior
 */
export const getConversionFunnel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const days = data.days;
    const now = Date.now();
    const startIso = new Date(now - days * 86400000).toISOString();
    const prevStartIso = new Date(now - 2 * days * 86400000).toISOString();
    const aging30 = new Date(now - 30 * 86400000).toISOString();

    const [sessRes, leadsRes, demoLeadsRes, trialsRes, contractsRes,
           prevSessRes, prevLeadsRes, prevTrialsRes, prevContractsRes] = await Promise.all([
      supabaseAdmin.from("demo_sessions").select("id, created_at, niche_slug").gte("created_at", startIso).limit(20000),
      supabaseAdmin.from("marketing_leads").select("id, created_at, utm_source, source").gte("created_at", startIso).limit(20000),
      supabaseAdmin.from("demo_leads").select("id, created_at, niche, marketing_lead_id").gte("created_at", startIso).limit(20000),
      supabaseAdmin
        .from("trial_subscriptions")
        .select("id, lead_id, created_at, converted_at, status, regularized_at")
        .gte("created_at", startIso)
        .limit(20000),
      supabaseAdmin
        .from("billing_contracts")
        .select("id, company_id, status, created_at")
        .gte("created_at", startIso)
        .limit(20000),
      // Período anterior (apenas counts)
      supabaseAdmin.from("demo_sessions").select("id", { count: "exact", head: true }).gte("created_at", prevStartIso).lt("created_at", startIso),
      supabaseAdmin.from("marketing_leads").select("id", { count: "exact", head: true }).gte("created_at", prevStartIso).lt("created_at", startIso),
      supabaseAdmin.from("trial_subscriptions").select("id", { count: "exact", head: true }).gte("created_at", prevStartIso).lt("created_at", startIso),
      supabaseAdmin.from("billing_contracts").select("id", { count: "exact", head: true }).eq("status", "active").gte("created_at", prevStartIso).lt("created_at", startIso),
    ]);

    const sessions = sessRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const demoLeads = demoLeadsRes.data ?? [];
    const trials = trialsRes.data ?? [];
    const contracts = contractsRes.data ?? [];

    // Etapas
    const visitas = sessions.length;
    // Leads únicos = marketing_leads + demo_leads sem marketing_lead_id (dedup)
    const dedupedDemo = demoLeads.filter((d: any) => !d.marketing_lead_id).length;
    const totalLeads = leads.length + dedupedDemo;
    const trialsStarted = trials.length;
    const trialsConverted = trials.filter((t: any) => t.converted_at || t.status === "converted").length;
    const activeContracts = contracts.filter((c: any) => c.status === "active");
    const retained = activeContracts.filter((c: any) => c.created_at <= aging30).length;

    const rate = (n: number, d: number) => (d > 0 ? Number(((n / d) * 100).toFixed(1)) : 0);

    const stages = [
      { key: "visitas", label: "Visitas demo", value: visitas, rateFromPrev: null as number | null },
      { key: "leads", label: "Leads", value: totalLeads, rateFromPrev: rate(totalLeads, visitas) },
      { key: "trials", label: "Trials iniciados", value: trialsStarted, rateFromPrev: rate(trialsStarted, totalLeads) },
      { key: "converted", label: "Trials convertidos", value: trialsConverted, rateFromPrev: rate(trialsConverted, trialsStarted) },
      { key: "retained", label: "Pagos retidos 30d+", value: retained, rateFromPrev: rate(retained, trialsConverted) },
    ];

    // Time-to-convert
    const leadToTrial: number[] = [];
    const leadMap = new Map(leads.map((l: any) => [l.id, new Date(l.created_at).getTime()]));
    for (const t of trials) {
      if (t.lead_id && leadMap.has(t.lead_id)) {
        const dt = (new Date(t.created_at).getTime() - (leadMap.get(t.lead_id) as number)) / 86400000;
        if (dt >= 0 && dt < 180) leadToTrial.push(dt);
      }
    }
    const trialToPaid: number[] = [];
    for (const t of trials) {
      if (t.converted_at) {
        const dt = (new Date(t.converted_at).getTime() - new Date(t.created_at).getTime()) / 86400000;
        if (dt >= 0 && dt < 365) trialToPaid.push(dt);
      }
    }
    const avg = (arr: number[]) => (arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : null);

    // Benchmarks padrão (SaaS B2B)
    const benchmarks: Record<string, number> = { leads: 5, trials: 15, converted: 20, retained: 70 };
    let bottleneck: { stage: string; rate: number; benchmark: number; gap: number } | null = null;
    for (const s of stages) {
      if (s.rateFromPrev === null) continue;
      const bench = benchmarks[s.key];
      if (!bench) continue;
      const gap = bench - s.rateFromPrev;
      if (gap > 0 && (!bottleneck || gap > bottleneck.gap)) {
        bottleneck = { stage: s.label, rate: s.rateFromPrev, benchmark: bench, gap: Number(gap.toFixed(1)) };
      }
    }

    // Breakdown por UTM source
    const utmMap = new Map<string, { source: string; leads: number; trials: number; converted: number }>();
    for (const l of leads) {
      const k = l.utm_source || l.source || "direct";
      const row = utmMap.get(k) ?? { source: k, leads: 0, trials: 0, converted: 0 };
      row.leads += 1;
      utmMap.set(k, row);
    }
    // Atribui trials → utm via lead_id
    const utmByLead = new Map(leads.map((l: any) => [l.id, l.utm_source || l.source || "direct"]));
    for (const t of trials) {
      const k = (t.lead_id && utmByLead.get(t.lead_id)) || "direct";
      const row = utmMap.get(k) ?? { source: k, leads: 0, trials: 0, converted: 0 };
      row.trials += 1;
      if (t.converted_at) row.converted += 1;
      utmMap.set(k, row);
    }
    const byUtm = [...utmMap.values()]
      .map((r) => ({ ...r, conversion: rate(r.converted, r.leads) }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10);

    // Breakdown por nicho (a partir das visitas demo)
    const nichoMap = new Map<string, { niche: string; visitas: number; leads: number }>();
    for (const s of sessions) {
      const k = s.niche_slug || "—";
      const row = nichoMap.get(k) ?? { niche: k, visitas: 0, leads: 0 };
      row.visitas += 1;
      nichoMap.set(k, row);
    }
    for (const d of demoLeads) {
      const k = d.niche || "—";
      const row = nichoMap.get(k) ?? { niche: k, visitas: 0, leads: 0 };
      row.leads += 1;
      nichoMap.set(k, row);
    }
    const byNiche = [...nichoMap.values()]
      .map((r) => ({ ...r, conversion: rate(r.leads, r.visitas) }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 10);

    // Trend vs período anterior
    const prevVisitas = prevSessRes.count ?? 0;
    const prevLeads = prevLeadsRes.count ?? 0;
    const prevTrials = prevTrialsRes.count ?? 0;
    const prevContracts = prevContractsRes.count ?? 0;
    const trend = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null);

    return {
      days,
      stages,
      kpis: {
        avgLeadToTrialDays: avg(leadToTrial),
        avgTrialToPaidDays: avg(trialToPaid),
        overallConversion: rate(retained, visitas),
        bottleneck,
      },
      trend: {
        visitas: trend(visitas, prevVisitas),
        leads: trend(totalLeads, prevLeads),
        trials: trend(trialsStarted, prevTrials),
        contracts: trend(activeContracts.length, prevContracts),
      },
      byUtm,
      byNiche,
      generatedAt: new Date().toISOString(),
    };
  });
