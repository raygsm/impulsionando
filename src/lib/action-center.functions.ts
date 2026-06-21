import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Action Center — fila priorizada de ações da operação Impulsionando.
 * Consolida sinais críticos vindos de Health Score, Tickets, Billing,
 * Expansion Radar e Inbox numa única lista ordenada por urgência.
 *
 * Cada item: { id, priority(0-100), category, title, subtitle, tenantId?, link }.
 * Diferencial: substitui a "caixa de entrada caótica" por uma fila única
 * que diz à equipe o que fazer agora, em qual ordem.
 */
export const getActionCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

    const [companies, contracts, tickets, invoices, leads, suspensions] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, is_active, created_at").eq("is_active", true).limit(2000),
      supabaseAdmin.from("billing_contracts").select("company_id, recurring_amount, status"),
      supabaseAdmin.from("support_tickets").select("id, company_id, subject, status, priority, created_at").in("status", ["open", "pending", "in_progress"]).order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("billing_invoices").select("id, company_id, amount, status, due_at").in("status", ["overdue", "pending"]).limit(200),
      supabaseAdmin.from("marketing_leads").select("id, email, origin, created_at").gte("created_at", since7).is("contacted_at" as any, null).limit(200),
      supabaseAdmin.from("billing_suspensions").select("company_id, reason, created_at").limit(100),
    ]);

    const mrrByCompany = new Map<string, number>();
    (contracts.data ?? []).forEach((c: any) => {
      if (c.status !== "active") return;
      mrrByCompany.set(c.company_id, (mrrByCompany.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
    });
    const companyName = new Map<string, string>();
    (companies.data ?? []).forEach((c: any) => companyName.set(c.id, c.name));

    type Action = { id: string; priority: number; category: string; title: string; subtitle: string; tenantId?: string; link: string };
    const actions: Action[] = [];

    // Tickets urgentes (priority high ou abertos >48h)
    (tickets.data ?? []).forEach((t: any) => {
      const ageH = (Date.now() - new Date(t.created_at).getTime()) / 3600000;
      const isHigh = ["urgent", "high"].includes(String(t.priority));
      if (!isHigh && ageH < 48) return;
      const mrr = mrrByCompany.get(t.company_id) ?? 0;
      const score = (isHigh ? 70 : 40) + Math.min(20, Math.floor(ageH / 24) * 5) + Math.min(10, mrr / 100);
      actions.push({
        id: `ticket:${t.id}`,
        priority: Math.round(score),
        category: "Suporte",
        title: t.subject ?? "(sem assunto)",
        subtitle: `${companyName.get(t.company_id) ?? "—"} · ${Math.floor(ageH)}h aberto · ${t.priority ?? "normal"}`,
        tenantId: t.company_id,
        link: `/admin/tenant-360?companyId=${t.company_id}`,
      });
    });

    // Faturas vencidas
    (invoices.data ?? []).forEach((i: any) => {
      const overdueDays = i.due_at ? Math.max(0, (Date.now() - new Date(i.due_at).getTime()) / 86400000) : 0;
      if (i.status !== "overdue" && overdueDays < 1) return;
      const score = 60 + Math.min(30, overdueDays * 2) + Math.min(10, Number(i.amount ?? 0) / 100);
      actions.push({
        id: `invoice:${i.id}`,
        priority: Math.round(score),
        category: "Cobrança",
        title: `Fatura vencida ${Number(i.amount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        subtitle: `${companyName.get(i.company_id) ?? "—"} · ${Math.floor(overdueDays)}d em atraso`,
        tenantId: i.company_id,
        link: `/admin/cobrancas`,
      });
    });

    // Suspensões
    (suspensions.data ?? []).forEach((s: any) => {
      actions.push({
        id: `suspension:${s.company_id}:${s.created_at}`,
        priority: 90,
        category: "Suspensão",
        title: `Conta suspensa: ${companyName.get(s.company_id) ?? "—"}`,
        subtitle: s.reason ?? "Sem motivo registrado",
        tenantId: s.company_id,
        link: `/admin/tenant-360?companyId=${s.company_id}`,
      });
    });

    // Leads novos sem contato
    (leads.data ?? []).forEach((l: any) => {
      const ageH = (Date.now() - new Date(l.created_at).getTime()) / 3600000;
      if (ageH < 2) return; // dar tempo para automação tocar
      const score = 30 + Math.min(40, Math.floor(ageH));
      actions.push({
        id: `lead:${l.id}`,
        priority: Math.round(score),
        category: "Lead",
        title: `Lead sem follow-up: ${l.email}`,
        subtitle: `${l.origin ?? "origem desconhecida"} · ${Math.floor(ageH)}h sem contato`,
        link: `/admin/inbox-unificada`,
      });
    });

    actions.sort((a, b) => b.priority - a.priority);

    const summary = {
      total: actions.length,
      byCategory: actions.reduce<Record<string, number>>((acc, a) => {
        acc[a.category] = (acc[a.category] ?? 0) + 1;
        return acc;
      }, {}),
      critical: actions.filter((a) => a.priority >= 80).length,
    };

    return { actions: actions.slice(0, 200), summary };
  });
