import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText } from "ai";

/**
 * Executive Briefing — narrativa diária gerada por IA para a operação
 * Impulsionando. Lê os KPIs das últimas 24h e 7d e devolve um resumo
 * estruturado em PT-BR (destaques, riscos, ações sugeridas).
 *
 * Nenhum SaaS BR oferece executive summary diário gerado por IA nativo.
 */
export const getExecutiveBriefing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const day = 86400000;
    const since24 = new Date(Date.now() - day).toISOString();
    const since7 = new Date(Date.now() - 7 * day).toISOString();
    const since14 = new Date(Date.now() - 14 * day).toISOString();

    const [leads24, leads7, leads14, demos7, quotes7, contracts, suspensions, tickets, runs] = await Promise.all([
      supabaseAdmin.from("marketing_leads").select("*", { count: "exact", head: true }).gte("created_at", since24),
      supabaseAdmin.from("marketing_leads").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("marketing_leads").select("*", { count: "exact", head: true }).gte("created_at", since14),
      supabaseAdmin.from("demo_leads").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("quotes").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("billing_contracts").select("recurring_amount, status, company_id"),
      supabaseAdmin.from("billing_suspensions").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("support_tickets").select("status, priority").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("n8n_workflow_runs").select("status").gte("finished_at", since7).limit(1000),
    ]);

    const mrr = (contracts.data ?? []).filter((c: any) => c.status === "active").reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);
    const activeTenants = new Set((contracts.data ?? []).filter((c: any) => c.status === "active").map((c: any) => c.company_id)).size;
    const leads7v = leads7.count ?? 0;
    const leadsPrev = (leads14.count ?? 0) - leads7v;
    const leadsDelta = leadsPrev === 0 ? 0 : Math.round(((leads7v - leadsPrev) / leadsPrev) * 100);
    const openTickets = (tickets.data ?? []).filter((t: any) => !["closed", "resolved", "cancelled"].includes(String(t.status)));
    const urgent = openTickets.filter((t: any) => ["urgent", "high"].includes(String(t.priority))).length;
    const runsTotal = runs.data?.length ?? 0;
    const runsFailed = (runs.data ?? []).filter((r: any) => r.status === "error" || r.status === "failed").length;

    const snapshot = {
      mrr_brl: mrr,
      tenants_ativos: activeTenants,
      leads_24h: leads24.count ?? 0,
      leads_7d: leads7v,
      leads_delta_pct_vs_7d_anteriores: leadsDelta,
      demos_7d: demos7.count ?? 0,
      orcamentos_7d: quotes7.count ?? 0,
      tickets_abertos: openTickets.length,
      tickets_urgentes: urgent,
      suspensoes_7d: suspensions.count ?? 0,
      automacoes_total_7d: runsTotal,
      automacoes_falharam_7d: runsFailed,
    };

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { snapshot, briefing: null, error: "LOVABLE_API_KEY ausente" };

    try {
      const gateway = createLovableAiGatewayProvider(key);
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: "Você é o analista-chefe de operações da plataforma SaaS Impulsionando. Escreva em PT-BR, tom executivo, direto, sem clichês. Sempre cite números do snapshot.",
        prompt: `Analise o snapshot operacional abaixo e produza um briefing executivo em 3 blocos curtos (markdown):

## 🔥 Destaques
2-3 bullets com o que está indo bem.

## ⚠️ Riscos
2-3 bullets com o que merece atenção imediata.

## 🎯 Ações sugeridas
3 bullets, cada um começando com verbo no infinitivo, priorizando o que tem maior impacto em MRR.

Snapshot JSON:
${JSON.stringify(snapshot, null, 2)}`,
      });
      return { snapshot, briefing: text, error: null };
    } catch (e: any) {
      return { snapshot, briefing: null, error: String(e?.message ?? e) };
    }
  });
