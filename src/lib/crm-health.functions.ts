import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * CRM & Pipeline Cockpit — Fase 55.
 * Leads, oportunidades, funil de vendas, atividades, win rate, motivos de perda.
 */
export const getCrmHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const today = new Date().toISOString();

    const [leadsRes, oppsRes, actRes, pipesRes, stagesRes] = await Promise.all([
      supabaseAdmin.from("crm_leads").select("id, source, score, status, owner_user_id, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("crm_opportunities").select("id, pipeline_id, stage_id, value, status, lost_reason, owner_user_id, expected_close_at, closed_at, created_at").limit(50000),
      supabaseAdmin.from("crm_activities").select("id, activity_type, due_at, done_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("crm_pipelines").select("id, name, is_active, is_default").limit(2000),
      supabaseAdmin.from("crm_stages").select("id, pipeline_id, name, stage_type, win_probability, sort_order").limit(5000),
    ]);

    const err = leadsRes.error || oppsRes.error || actRes.error || pipesRes.error || stagesRes.error;
    if (err) throw new Error(err.message);

    const leads = leadsRes.data ?? [];
    const opps = oppsRes.data ?? [];
    const acts = actRes.data ?? [];
    const pipelines = pipesRes.data ?? [];
    const stages = stagesRes.data ?? [];

    const newLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => l.status === "qualified" || l.status === "qualificado").length;
    const avgScore = leads.length ? leads.reduce((s, l) => s + Number(l.score || 0), 0) / leads.length : 0;

    const sourceMap = new Map<string, number>();
    for (const l of leads) { const k = l.source || "—"; sourceMap.set(k, (sourceMap.get(k) ?? 0) + 1); }
    const topSources = Array.from(sourceMap, ([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const oppsInWindow = opps.filter((o) => o.created_at >= sinceIso);
    const oppsWon = opps.filter((o) => o.status === "won" || o.status === "closed_won");
    const oppsLost = opps.filter((o) => o.status === "lost" || o.status === "closed_lost");
    const oppsOpen = opps.filter((o) => !["won","lost","closed_won","closed_lost"].includes(o.status));
    const pipelineValue = oppsOpen.reduce((s, o) => s + Number(o.value || 0), 0);
    const wonValue = oppsWon.reduce((s, o) => s + Number(o.value || 0), 0);
    const lostValue = oppsLost.reduce((s, o) => s + Number(o.value || 0), 0);
    const winRate = (oppsWon.length + oppsLost.length) > 0 ? (oppsWon.length / (oppsWon.length + oppsLost.length)) * 100 : 0;
    const avgDealSize = oppsWon.length ? wonValue / oppsWon.length : 0;
    const cycleDays = oppsWon.filter((o) => o.closed_at && o.created_at).map((o) => (new Date(o.closed_at as string).getTime() - new Date(o.created_at).getTime()) / 86400000);
    const avgCycle = cycleDays.length ? cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length : 0;

    const stageMap = new Map(stages.map((s) => [s.id, s]));
    const stageAgg = new Map<string, { name: string; count: number; value: number }>();
    for (const o of oppsOpen) {
      const st = o.stage_id ? stageMap.get(o.stage_id) : null;
      const key = o.stage_id || "—";
      const cur = stageAgg.get(key) ?? { name: st?.name || "Sem stage", count: 0, value: 0 };
      cur.count++;
      cur.value += Number(o.value || 0);
      stageAgg.set(key, cur);
    }
    const funnel = Array.from(stageAgg.values()).sort((a, b) => b.value - a.value);

    const lostMap = new Map<string, { count: number; value: number }>();
    for (const o of oppsLost) {
      const k = o.lost_reason || "Sem motivo";
      const cur = lostMap.get(k) ?? { count: 0, value: 0 };
      cur.count++;
      cur.value += Number(o.value || 0);
      lostMap.set(k, cur);
    }
    const lostReasons = Array.from(lostMap, ([reason, v]) => ({ reason, ...v })).sort((a, b) => b.count - a.count).slice(0, 10);

    const actDone = acts.filter((a) => !!a.done_at).length;
    const actOverdue = acts.filter((a) => a.due_at && a.due_at < today && !a.done_at).length;
    const typeMap = new Map<string, number>();
    for (const a of acts) { const k = a.activity_type || "—"; typeMap.set(k, (typeMap.get(k) ?? 0) + 1); }
    const activityTypes = Array.from(typeMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      leads: { total: newLeads, qualified: qualifiedLeads, avgScore, topSources },
      opportunities: {
        total: opps.length, inWindow: oppsInWindow.length,
        won: oppsWon.length, lost: oppsLost.length, open: oppsOpen.length,
        pipelineValue, wonValue, lostValue, winRate, avgDealSize, avgCycleDays: avgCycle,
      },
      funnel,
      lostReasons,
      activities: { total: acts.length, done: actDone, overdue: actOverdue, types: activityTypes },
      pipelines: { total: pipelines.length, active: pipelines.filter((p) => p.is_active).length },
    };
  });
