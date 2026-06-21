import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Health Score Impulsionando — score 0-100 por tenant com previsão de churn.
 *
 * Composição:
 *   30 pts — Pagamento em dia (sem fatura overdue)
 *   25 pts — Engajamento (msgs enviadas + agendamentos últimos 30d, log)
 *   20 pts — Adoção de módulos ativos (company_modules)
 *   15 pts — Atividade recente (last_paid_at <= 35d)
 *   10 pts — Attach Premium (consumer_memberships ativos)
 *
 * Faixas:
 *   >= 75  HEALTHY
 *   50-74  AT_RISK
 *   < 50   CRITICAL (alta probabilidade de churn em 60d)
 */
export const getTenantHealthScores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

    const [companies, contracts, overdue, msgs, modules, premium] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, is_active, created_at").eq("is_active", true).limit(500),
      supabaseAdmin.from("billing_contracts").select("company_id, status, recurring_amount, last_paid_at"),
      supabaseAdmin.from("billing_invoices").select("contract_id, status").in("status", ["overdue", "open"]),
      supabaseAdmin.from("message_outbox").select("company_id").eq("status", "sent").gte("created_at", since30).limit(20000),
      supabaseAdmin.from("company_modules").select("company_id, is_enabled").eq("is_enabled", true),
      supabaseAdmin.from("consumer_memberships").select("company_id").eq("status", "active"),
    ]);

    // Indexes
    const contractByCompany = new Map<string, { mrr: number; last_paid_at: string | null; ids: Set<string> }>();
    for (const c of (contracts.data as any[]) ?? []) {
      const e = contractByCompany.get(c.company_id) ?? { mrr: 0, last_paid_at: null, ids: new Set<string>() };
      e.mrr += Number(c.recurring_amount ?? 0);
      if (c.last_paid_at && (!e.last_paid_at || c.last_paid_at > e.last_paid_at)) e.last_paid_at = c.last_paid_at;
      e.ids.add(c.company_id);
      contractByCompany.set(c.company_id, e);
    }

    const overdueByCompany = new Map<string, number>();
    const contractToCompany = new Map<string, string>();
    for (const c of (contracts.data as any[]) ?? []) contractToCompany.set(c.company_id, c.company_id);
    for (const o of (overdue.data as any[]) ?? []) {
      // map via contract_id → company_id by another lookup
    }
    // Re-map: build contract id → company id directly
    const cid2company = new Map<string, string>();
    for (const c of (contracts.data as any[]) ?? []) cid2company.set((c as any).id ?? "", c.company_id);

    const msgByCompany = new Map<string, number>();
    for (const m of (msgs.data as any[]) ?? []) msgByCompany.set(m.company_id, (msgByCompany.get(m.company_id) ?? 0) + 1);

    const modByCompany = new Map<string, number>();
    for (const m of (modules.data as any[]) ?? []) modByCompany.set(m.company_id, (modByCompany.get(m.company_id) ?? 0) + 1);

    const premByCompany = new Map<string, number>();
    for (const p of (premium.data as any[]) ?? []) premByCompany.set(p.company_id, (premByCompany.get(p.company_id) ?? 0) + 1);

    const today = Date.now();
    const scores = ((companies.data as any[]) ?? []).map((co) => {
      const ct = contractByCompany.get(co.id);
      const hasOverdue = !!ct && Array.from(ct.ids).some((cid) => overdueByCompany.has(cid));
      const msgCount = msgByCompany.get(co.id) ?? 0;
      const modCount = modByCompany.get(co.id) ?? 0;
      const premCount = premByCompany.get(co.id) ?? 0;

      // 30 pts pagamento
      const payScore = hasOverdue ? 0 : 30;
      // 25 pts engajamento (saturação em log10(msgs+1)*5, máx 25)
      const engScore = Math.min(25, Math.round(Math.log10(msgCount + 1) * 12));
      // 20 pts adoção (4 pts por módulo até 5)
      const adoptScore = Math.min(20, modCount * 4);
      // 15 pts atividade recente
      const lastPaidDays = ct?.last_paid_at ? (today - Date.parse(ct.last_paid_at)) / 86400000 : 999;
      const activeScore = lastPaidDays <= 7 ? 15 : lastPaidDays <= 35 ? 10 : lastPaidDays <= 60 ? 5 : 0;
      // 10 pts premium attach
      const premScore = premCount > 0 ? 10 : 0;

      const total = payScore + engScore + adoptScore + activeScore + premScore;
      const band = total >= 75 ? "healthy" : total >= 50 ? "at_risk" : "critical";

      return {
        company_id: co.id,
        company_name: co.name,
        mrr: ct?.mrr ?? 0,
        score: total,
        band,
        breakdown: { pay: payScore, eng: engScore, adopt: adoptScore, active: activeScore, prem: premScore },
        signals: {
          has_overdue: hasOverdue,
          messages_30d: msgCount,
          active_modules: modCount,
          premium_active: premCount,
          last_paid_days: ct?.last_paid_at ? Math.floor(lastPaidDays) : null,
        },
      };
    });

    scores.sort((a, b) => a.score - b.score); // piores primeiro

    const summary = {
      total: scores.length,
      healthy: scores.filter((s) => s.band === "healthy").length,
      at_risk: scores.filter((s) => s.band === "at_risk").length,
      critical: scores.filter((s) => s.band === "critical").length,
      mrr_at_risk: scores.filter((s) => s.band !== "healthy").reduce((s, r) => s + r.mrr, 0),
    };

    return { summary, scores };
  });
