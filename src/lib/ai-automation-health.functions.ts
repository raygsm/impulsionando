import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * AI & Automation Cockpit — Fase 59.
 * Demandas de agentes, gerações de projeto, biblioteca de prompts, N8N e webhooks.
 */
export const getAiAutomationHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [demRes, outRes, agLogRes, genRes, libRes, n8nRes, whRes, whEvRes] = await Promise.all([
      supabaseAdmin.from("agent_demands").select("id, tipo_entrega, status, agentes_selecionados, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("agent_outputs").select("id, demand_id, agent_id, output_type, is_final, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("agent_logs").select("id, event, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("ai_project_generations").select("id, status, ai_model, approved_at, provisioned_at, error_message, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("ai_prompt_library").select("id, category, niche, status, usage_count").limit(10000),
      supabaseAdmin.from("n8n_workflow_runs").select("id, workflow_name, regua, status, channel, http_status, latency_ms, started_at, finished_at, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("webhook_runs").select("id, status, response_status, started_at, finished_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("webhook_event_log").select("id, source, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = demRes.error || outRes.error || agLogRes.error || genRes.error || libRes.error || n8nRes.error || whRes.error || whEvRes.error;
    if (err) throw new Error(err.message);

    const demands = demRes.data ?? [];
    const outputs = outRes.data ?? [];
    const agLogs = agLogRes.data ?? [];
    const gens = genRes.data ?? [];
    const lib = libRes.data ?? [];
    const n8n = n8nRes.data ?? [];
    const webhooks = whRes.data ?? [];
    const whEvents = whEvRes.data ?? [];

    const demandsDone = demands.filter((d) => d.status === "done" || d.status === "completed").length;
    const demandsInProgress = demands.filter((d) => d.status === "in_progress" || d.status === "processing").length;
    const outputsFinal = outputs.filter((o) => o.is_final).length;

    const gensApproved = gens.filter((g) => !!g.approved_at).length;
    const gensProvisioned = gens.filter((g) => !!g.provisioned_at).length;
    const gensFailed = gens.filter((g) => g.status === "failed" || !!g.error_message).length;
    const modelMap = new Map<string, number>();
    for (const g of gens) { const k = g.ai_model || "—"; modelMap.set(k, (modelMap.get(k) ?? 0) + 1); }
    const models = Array.from(modelMap, ([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count);

    const libActive = lib.filter((p) => p.status === "active" || p.status === "published").length;
    const libUsage = lib.reduce((s, p) => s + Number(p.usage_count || 0), 0);

    // N8N
    const n8nSuccess = n8n.filter((r) => r.status === "success" || (r.http_status && r.http_status >= 200 && r.http_status < 300)).length;
    const n8nFailed = n8n.filter((r) => r.status === "failed" || r.status === "error" || (r.http_status && r.http_status >= 400)).length;
    const n8nLatencies = n8n.filter((r) => r.latency_ms).map((r) => Number(r.latency_ms));
    const n8nAvgLatency = n8nLatencies.length ? n8nLatencies.reduce((a, b) => a + b, 0) / n8nLatencies.length : 0;
    const n8nSuccessRate = n8n.length ? (n8nSuccess / n8n.length) * 100 : 0;

    const wfMap = new Map<string, { total: number; success: number; failed: number }>();
    for (const r of n8n) {
      const k = r.workflow_name || "—";
      const cur = wfMap.get(k) ?? { total: 0, success: 0, failed: 0 };
      cur.total++;
      if (r.status === "success") cur.success++;
      else if (r.status === "failed" || r.status === "error") cur.failed++;
      wfMap.set(k, cur);
    }
    const topWorkflows = Array.from(wfMap, ([wf, v]) => ({ workflow: wf, ...v, successRate: v.total ? (v.success / v.total) * 100 : 0 })).sort((a, b) => b.total - a.total).slice(0, 15);

    const reguaMap = new Map<string, number>();
    for (const r of n8n) { if (r.regua) reguaMap.set(r.regua, (reguaMap.get(r.regua) ?? 0) + 1); }
    const topReguas = Array.from(reguaMap, ([regua, count]) => ({ regua, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    // Webhooks
    const whSuccess = webhooks.filter((w) => w.status === "success" || (w.http_status && w.http_status < 300)).length;
    const whFailed = webhooks.filter((w) => w.status === "failed" || (w.http_status && w.http_status >= 400)).length;
    const whSuccessRate = webhooks.length ? (whSuccess / webhooks.length) * 100 : 0;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      agents: { demands: demands.length, done: demandsDone, inProgress: demandsInProgress, outputs: outputs.length, finalOutputs: outputsFinal, logs: agLogs.length },
      generations: { total: gens.length, approved: gensApproved, provisioned: gensProvisioned, failed: gensFailed, models },
      library: { total: lib.length, active: libActive, usageCount: libUsage },
      n8n: { runs: n8n.length, success: n8nSuccess, failed: n8nFailed, successRate: n8nSuccessRate, avgLatencyMs: n8nAvgLatency, topWorkflows, topReguas },
      webhooks: { runs: webhooks.length, success: whSuccess, failed: whFailed, successRate: whSuccessRate, events: whEvents.length },
    };
  });
