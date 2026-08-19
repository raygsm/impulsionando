import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({ companyId: z.string().uuid() });

/**
 * Tenant Insights (IA) — análise individual de um cliente.
 * Cruza contrato, módulos, tickets, atividade e idade da conta, e usa
 * OpenAI para gerar 3 blocos: o que está funcionando, o que está em
 * risco e as 3 próximas ações priorizadas para Customer Success.
 */
export const getTenantInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const companyId = data.companyId;

    const [company, modules, contracts, tickets, crm, runtime] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, niche_id, created_at, is_active").eq("id", companyId).maybeSingle(),
      supabaseAdmin.from("company_modules").select("module_id, is_enabled, created_at").eq("company_id", companyId),
      supabaseAdmin.from("billing_contracts").select("recurring_amount, status, created_at").eq("company_id", companyId),
      supabaseAdmin.from("support_tickets").select("status, priority, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("crm_activities").select("type, occurred_at").eq("company_id", companyId).order("occurred_at", { ascending: false }).limit(50),
      supabaseAdmin.from("runtime_events").select("event_type, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(100),
    ]);

    if (!company.data) throw new Error("Cliente não encontrado.");

    const activeMrr = (contracts.data ?? []).filter((c: any) => c.status === "active").reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);
    const enabledModules = (modules.data ?? []).filter((m: any) => m.is_enabled !== false).map((m: any) => m.module_id);
    const openTickets = (tickets.data ?? []).filter((t: any) => !["closed", "resolved", "cancelled"].includes(String(t.status))).length;
    const urgentTickets = (tickets.data ?? []).filter((t: any) => ["urgent", "high"].includes(String(t.priority))).length;
    const ageDays = Math.floor((Date.now() - new Date(company.data.created_at).getTime()) / 86400000);
    const last30 = Date.now() - 30 * 86400000;
    const crmLast30 = (crm.data ?? []).filter((a: any) => new Date(a.occurred_at).getTime() >= last30).length;
    const runtimeLast30 = (runtime.data ?? []).filter((e: any) => new Date(e.created_at).getTime() >= last30).length;

    const snapshot = {
      empresa: company.data.name,
      idade_dias: ageDays,
      mrr_ativo: activeMrr,
      modulos_ativos: enabledModules.length,
      modulos: enabledModules.slice(0, 30),
      tickets_abertos: openTickets,
      tickets_urgentes: urgentTickets,
      atividade_crm_30d: crmLast30,
      eventos_runtime_30d: runtimeLast30,
    };

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return { snapshot, insights: null, error: "OPENAI_API_KEY ausente" };

    try {
      const { model } = resolveProvider({
        llm: { provider: "openai", model: "gpt-4o-mini" },
        allowFallback: false,
        openaiApiKey: key,
      });
      const { text } = await generateText({
        model,
        system: "Você é o Customer Success Manager da plataforma SaaS Impulsionando. Escreva em PT-BR, tom executivo e prático. Sempre cite números do snapshot.",
        prompt: `Analise este cliente e responda em markdown com 3 blocos curtos:\n\n## ✅ O que está funcionando\n2-3 bullets.\n\n## ⚠️ Riscos / sinais de churn\n2-3 bullets. Use idade, tickets, atividade.\n\n## 🎯 Próximas 3 ações\nCada bullet começa com verbo no infinitivo. Priorize impacto em retenção e expansão.\n\nSnapshot:\n${JSON.stringify(snapshot, null, 2)}`,
      });
      return { snapshot, insights: text, error: null };
    } catch (e: any) {
      return { snapshot, insights: null, error: String(e?.message ?? e) };
    }
  });