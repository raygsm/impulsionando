import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Dashboards por audiência (Fase 2) + Radar do Nicho + "O que a Impulsionando percebeu".
 *
 * Quatro audiências:
 *  - core         → plataforma inteira (staff Impulsionando)
 *  - white-label  → parceiros WL (staff por ora; flag de empresa virá em Fase futura)
 *  - empresa      → uma empresa específica (companyId)
 *  - consumidor   → usuário final autenticado (consumer_*)
 *
 * Trends comparam a janela atual com a janela imediatamente anterior de mesma duração.
 */

const DEFAULT_DAYS = 30;

function windowFrom(days: number) {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now.getTime() - days * 86400_000).toISOString();
  const prevTo = from;
  const prevFrom = new Date(now.getTime() - 2 * days * 86400_000).toISOString();
  return { from, to, prevFrom, prevTo, days };
}

function delta(curr: number, prev: number): { delta: number; deltaPct: number | null } {
  const d = curr - prev;
  const pct = prev > 0 ? (d / prev) * 100 : prev === 0 && curr > 0 ? 100 : null;
  return { delta: d, deltaPct: pct };
}

// ───────────────────────────── CORE DASHBOARD ─────────────────────────────

const CoreInput = z.object({ days: z.number().int().min(7).max(180).default(DEFAULT_DAYS) });

export const fetchCoreAudienceDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CoreInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, { _user: userId } as never);
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando");

    const w = windowFrom(data.days);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [companies, invoicesCurr, invoicesPrev, leadsCurr, leadsPrev, niches, n8nFail] = await Promise.all([
      supabaseAdmin.from("companies").select("id,is_active,niche_id,created_at"),
      supabaseAdmin.from("billing_invoices").select("amount,status,paid_at,created_at").gte("created_at", w.from).lte("created_at", w.to),
      supabaseAdmin.from("billing_invoices").select("amount,status,paid_at,created_at").gte("created_at", w.prevFrom).lt("created_at", w.prevTo),
      supabaseAdmin.from("marketing_leads").select("id,created_at").gte("created_at", w.from).lte("created_at", w.to),
      supabaseAdmin.from("marketing_leads").select("id,created_at").gte("created_at", w.prevFrom).lt("created_at", w.prevTo),
      supabaseAdmin.from("niches").select("id,name,slug,is_active"),
      supabaseAdmin.from("n8n_workflow_runs").select("id,status,created_at").eq("status", "error").gte("created_at", w.from).lte("created_at", w.to),
    ]);

    const totalCompanies = (companies.data ?? []).filter((c) => c.is_active).length;
    const newCompanies = (companies.data ?? []).filter((c) => c.created_at >= w.from).length;
    const revenueCurr = (invoicesCurr.data ?? []).filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount ?? 0), 0);
    const revenuePrev = (invoicesPrev.data ?? []).filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount ?? 0), 0);
    const leadsCurrN = (leadsCurr.data ?? []).length;
    const leadsPrevN = (leadsPrev.data ?? []).length;
    const failures = (n8nFail.data ?? []).length;

    // Distribuição por nicho
    const byNiche = new Map<string, number>();
    for (const c of companies.data ?? []) {
      if (!c.is_active || !c.niche_id) continue;
      byNiche.set(c.niche_id as string, (byNiche.get(c.niche_id as string) ?? 0) + 1);
    }
    const nichesById = new Map((niches.data ?? []).map((n) => [n.id as string, n]));
    const topNiches = Array.from(byNiche.entries())
      .map(([id, count]) => ({ id, name: (nichesById.get(id) as { name?: string } | undefined)?.name ?? "—", count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      window: w,
      kpis: {
        revenue: { value: revenueCurr, ...delta(revenueCurr, revenuePrev) },
        leads: { value: leadsCurrN, ...delta(leadsCurrN, leadsPrevN) },
        companies: { value: totalCompanies, ...delta(totalCompanies, totalCompanies - newCompanies) },
        n8nFailures: { value: failures, delta: 0, deltaPct: null as number | null },
      },
      topNiches,
    };
  });

// ───────────────────────────── EMPRESA DASHBOARD ─────────────────────────────

const EmpresaInput = z.object({
  companyId: z.string().uuid(),
  days: z.number().int().min(7).max(180).default(DEFAULT_DAYS),
});

export const fetchEmpresaDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmpresaInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const w = windowFrom(data.days);

    const [orders, ordersPrev, customers, leads, leadsPrev, agenda, invoices] = await Promise.all([
      supabase.from("sales_orders").select("id,total_amount,status,created_at").eq("company_id", data.companyId).gte("created_at", w.from).lte("created_at", w.to),
      supabase.from("sales_orders").select("id,total_amount,status,created_at").eq("company_id", data.companyId).gte("created_at", w.prevFrom).lt("created_at", w.prevTo),
      supabase.from("customers").select("id,created_at").eq("company_id", data.companyId),
      supabase.from("crm_leads").select("id,created_at").eq("company_id", data.companyId).gte("created_at", w.from).lte("created_at", w.to),
      supabase.from("crm_leads").select("id,created_at").eq("company_id", data.companyId).gte("created_at", w.prevFrom).lt("created_at", w.prevTo),
      supabase.from("agenda_appointments").select("id,status,starts_at").eq("company_id", data.companyId).gte("starts_at", w.from).lte("starts_at", w.to),
      supabase.from("billing_invoices").select("amount,status,due_date,paid_at").eq("company_id", data.companyId).gte("created_at", w.from).lte("created_at", w.to),
    ]);

    const revCurr = (orders.data ?? []).reduce((a, o) => a + Number(o.total_amount ?? 0), 0);
    const revPrev = (ordersPrev.data ?? []).reduce((a, o) => a + Number(o.total_amount ?? 0), 0);
    const newCustomers = (customers.data ?? []).filter((c) => c.created_at >= w.from).length;
    const totalCustomers = (customers.data ?? []).length;
    const leadsN = (leads.data ?? []).length;
    const leadsPN = (leadsPrev.data ?? []).length;
    const appts = (agenda.data ?? []).length;
    const apptsDone = (agenda.data ?? []).filter((a) => a.status === "done" || a.status === "completed").length;
    const apptsNoShow = (agenda.data ?? []).filter((a) => a.status === "no_show").length;
    const pendingInvoices = (invoices.data ?? []).filter((i) => i.status !== "paid").length;
    const overdue = (invoices.data ?? []).filter((i) => i.status !== "paid" && i.due_date && i.due_date < new Date().toISOString().slice(0, 10)).length;

    return {
      window: w,
      kpis: {
        revenue: { value: revCurr, ...delta(revCurr, revPrev) },
        leads: { value: leadsN, ...delta(leadsN, leadsPN) },
        newCustomers: { value: newCustomers, delta: 0, deltaPct: null as number | null },
        totalCustomers: { value: totalCustomers, delta: 0, deltaPct: null as number | null },
        appointments: { value: appts, delta: 0, deltaPct: null as number | null },
        appointmentsDone: { value: apptsDone, delta: 0, deltaPct: null as number | null },
        noShow: { value: apptsNoShow, delta: 0, deltaPct: null as number | null },
        pendingInvoices: { value: pendingInvoices, delta: 0, deltaPct: null as number | null },
        overdueInvoices: { value: overdue, delta: 0, deltaPct: null as number | null },
      },
    };
  });

// ───────────────────────────── WHITE LABEL DASHBOARD ─────────────────────────────

const WlInput = z.object({ days: z.number().int().min(7).max(180).default(DEFAULT_DAYS) });

export const fetchWhiteLabelDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => WlInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, { _user: userId } as never);
    if (!isStaff) throw new Error("Acesso restrito (WL: gate de carteira em Fase futura)");

    const w = windowFrom(data.days);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [companies, invoices, prev, suspensions] = await Promise.all([
      supabaseAdmin.from("companies").select("id,is_active,created_at"),
      supabaseAdmin.from("billing_invoices").select("amount,status,paid_at,created_at").gte("created_at", w.from).lte("created_at", w.to),
      supabaseAdmin.from("billing_invoices").select("amount,status,paid_at,created_at").gte("created_at", w.prevFrom).lt("created_at", w.prevTo),
      supabaseAdmin.from("billing_suspensions").select("id,created_at").gte("created_at", w.from).lte("created_at", w.to),
    ]);

    const activeCarteira = (companies.data ?? []).filter((c) => c.is_active).length;
    const grossRev = (invoices.data ?? []).filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount ?? 0), 0);
    const prevRev = (prev.data ?? []).filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount ?? 0), 0);
    const suspended = (suspensions.data ?? []).length;
    // Estimativa de share do parceiro (placeholder): 20% até existir flag de WL real.
    const partnerShare = grossRev * 0.2;

    return {
      window: w,
      kpis: {
        carteira: { value: activeCarteira, delta: 0, deltaPct: null as number | null },
        grossRevenue: { value: grossRev, ...delta(grossRev, prevRev) },
        partnerShare: { value: partnerShare, ...delta(partnerShare, prevRev * 0.2) },
        suspensions: { value: suspended, delta: 0, deltaPct: null as number | null },
      },
    };
  });

// ───────────────────────────── CONSUMIDOR DASHBOARD ─────────────────────────────

const ConsumerInput = z.object({ days: z.number().int().min(7).max(180).default(DEFAULT_DAYS) });

export const fetchConsumidorDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ConsumerInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const w = windowFrom(data.days);

    const [profile, memberships, invoices, visits, favorites] = await Promise.all([
      supabase.from("consumer_profiles").select("id,display_name,email,created_at").eq("user_id", userId).maybeSingle(),
      supabase.from("consumer_memberships").select("id,plan,status,amount_cents,current_period_end").eq("user_id", userId),
      supabase.from("consumer_membership_invoices").select("amount_cents,status,due_date,paid_at").eq("user_id", userId).gte("created_at", w.from).lte("created_at", w.to),
      supabase.from("clube_visits").select("id,created_at").eq("user_id", userId).gte("created_at", w.from).lte("created_at", w.to),
      supabase.from("consumer_favorites").select("id").eq("user_id", userId),
    ]);

    const activeMemberships = (memberships.data ?? []).filter((m) => m.status === "active").length;
    const totalSpent = (invoices.data ?? []).filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount_cents ?? 0), 0) / 100;
    const visitsN = (visits.data ?? []).length;
    const nextDue = (memberships.data ?? []).map((m) => m.current_period_end).filter(Boolean).sort()[0] ?? null;

    return {
      window: w,
      profile: profile.data ?? null,
      kpis: {
        activeMemberships: { value: activeMemberships, delta: 0, deltaPct: null as number | null },
        totalSpent: { value: totalSpent, delta: 0, deltaPct: null as number | null },
        visits: { value: visitsN, delta: 0, deltaPct: null as number | null },
        favorites: { value: (favorites.data ?? []).length, delta: 0, deltaPct: null as number | null },
      },
      nextDue,
    };
  });

// ───────────────────────────── RADAR DO NICHO ─────────────────────────────

const RadarInput = z.object({
  nicheSlug: z.string().min(1).optional(),
  days: z.number().int().min(7).max(180).default(DEFAULT_DAYS),
});

export const fetchNicheRadar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RadarInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, { _user: userId } as never);
    if (!isStaff) throw new Error("Radar do Nicho é restrito ao Core enquanto a anonimização N≥10 não é aplicada por audiência.");

    const w = windowFrom(data.days);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const niches = await supabaseAdmin.from("niches").select("id,name,slug,is_active");
    const companies = await supabaseAdmin.from("companies").select("id,niche_id,is_active");
    const invoices = await supabaseAdmin.from("billing_invoices").select("amount,status,company_id,created_at").gte("created_at", w.from).lte("created_at", w.to);
    const leads = await supabaseAdmin.from("marketing_leads").select("id,niche,created_at").gte("created_at", w.from).lte("created_at", w.to);

    const nichesArr = (niches.data ?? []).filter((n) => n.is_active);
    const companiesByNiche = new Map<string, string[]>();
    for (const c of companies.data ?? []) {
      if (!c.is_active || !c.niche_id) continue;
      const arr = companiesByNiche.get(c.niche_id as string) ?? [];
      arr.push(c.id as string);
      companiesByNiche.set(c.niche_id as string, arr);
    }

    type Row = {
      id: string; name: string; slug: string;
      activeCompanies: number;
      revenue: number;
      avgRevenuePerCompany: number;
      leads: number;
      anonymized: boolean;
      recommendations: string[];
    };

    const N_MIN = 10;
    const rows: Row[] = nichesArr
      .filter((n) => !data.nicheSlug || n.slug === data.nicheSlug)
      .map((n) => {
        const ids = companiesByNiche.get(n.id as string) ?? [];
        const idSet = new Set(ids);
        const rev = (invoices.data ?? [])
          .filter((i) => i.status === "paid" && idSet.has(i.company_id as string))
          .reduce((a, i) => a + Number(i.amount ?? 0), 0);
        const ld = (leads.data ?? []).filter((l) => (l.niche ?? "") === n.slug).length;
        const anonymized = ids.length < N_MIN;
        const avg = ids.length > 0 ? rev / ids.length : 0;

        // Recomendações simples baseadas em sinais
        const recs: string[] = [];
        if (ld === 0) recs.push("Sem leads no período — ativar captação por landing pages do nicho.");
        if (ids.length > 0 && rev === 0) recs.push("Carteira sem receita — revisar onboarding pago e cobrança.");
        if (avg > 0 && avg < 100) recs.push("Ticket médio baixo — sugerir upgrade de plano ou bundle.");
        if (ids.length >= N_MIN && ld > ids.length * 5) recs.push("Alta demanda — considerar campanha dedicada para este nicho.");
        if (recs.length === 0) recs.push("Operação saudável no período — manter ritmo e medir NPS.");

        return {
          id: n.id as string,
          name: n.name as string,
          slug: n.slug as string,
          activeCompanies: ids.length,
          revenue: anonymized ? 0 : rev,
          avgRevenuePerCompany: anonymized ? 0 : avg,
          leads: ld,
          anonymized,
          recommendations: recs,
        };
      })
      .sort((a, b) => b.activeCompanies - a.activeCompanies);

    return { window: w, rows, nMin: N_MIN };
  });

// ───────────────────────── "O QUE A IMPULSIONANDO PERCEBEU" ─────────────────────────

const PercebidoInput = z.object({
  audience: z.enum(["core", "white-label", "empresa", "consumidor"]),
  companyId: z.string().uuid().optional(),
  days: z.number().int().min(7).max(180).default(DEFAULT_DAYS),
});

export type PercebidoInsight = {
  id: string;
  severity: "info" | "warning" | "critical" | "success";
  title: string;
  detail: string;
  cta?: { label: string; to: string };
};

export const fetchPercebidoInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PercebidoInput.parse(d))
  .handler(async ({ data, context }): Promise<{ insights: PercebidoInsight[]; generatedAt: string }> => {
    const { supabase, userId } = context;
    const w = windowFrom(data.days);
    const insights: PercebidoInsight[] = [];

    if (data.audience === "core" || data.audience === "white-label") {
      const { data: isStaff } = await supabase.rpc("is_impulsionando_staff" as never, { _user: userId } as never);
      if (!isStaff) throw new Error("Insights cross-conta são restritos à equipe Impulsionando");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [{ data: companies }, { data: invs }, { data: fails }] = await Promise.all([
        supabaseAdmin.from("companies").select("id,is_active,created_at"),
        supabaseAdmin.from("billing_invoices").select("amount,status,paid_at,due_date").gte("created_at", w.from),
        supabaseAdmin.from("n8n_workflow_runs").select("id,status,workflow_name").eq("status", "error").gte("created_at", w.from),
      ]);
      const newC = (companies ?? []).filter((c) => c.created_at >= w.from).length;
      const overdue = (invs ?? []).filter((i) => i.status !== "paid" && i.due_date && i.due_date < new Date().toISOString().slice(0, 10)).length;
      const failByWf = new Map<string, number>();
      for (const f of fails ?? []) {
        const k = (f.workflow_name as string) ?? "—";
        failByWf.set(k, (failByWf.get(k) ?? 0) + 1);
      }
      const topFail = Array.from(failByWf.entries()).sort((a, b) => b[1] - a[1])[0];

      if (newC > 0) insights.push({ id: "core.new", severity: "success", title: `${newC} novas contas no período`, detail: "Onboarding rodando — vale revisar conversão pós-trial." });
      if (overdue > 5) insights.push({ id: "core.overdue", severity: "warning", title: `${overdue} faturas em atraso`, detail: "Régua de cobrança pode estar perdendo eficiência.", cta: { label: "Abrir Régua", to: "/admin/billing-policy" } });
      if (topFail) insights.push({ id: "core.n8n", severity: "critical", title: `Workflow "${topFail[0]}" com ${topFail[1]} falhas`, detail: "Maior fonte de erro no período — abrir log e investigar.", cta: { label: "Ver Webhook Log", to: "/finance/webhook-log" } });
    }

    if (data.audience === "empresa" && data.companyId) {
      const [{ data: leads }, { data: agenda }, { data: invs }] = await Promise.all([
        supabase.from("crm_leads").select("id,status,created_at").eq("company_id", data.companyId).gte("created_at", w.from),
        supabase.from("agenda_appointments").select("id,status,starts_at").eq("company_id", data.companyId).gte("starts_at", w.from),
        supabase.from("billing_invoices").select("amount,status,due_date").eq("company_id", data.companyId),
      ]);
      const noShow = (agenda ?? []).filter((a) => a.status === "no_show").length;
      const newLeads = (leads ?? []).length;
      const overdue = (invs ?? []).filter((i) => i.status !== "paid" && i.due_date && i.due_date < new Date().toISOString().slice(0, 10)).length;

      if (newLeads === 0) insights.push({ id: "emp.noleads", severity: "warning", title: "Sem leads novos no período", detail: "Captação está parada — vale revisar landing e canais.", cta: { label: "Ir para CRM", to: "/crm/leads" } });
      else insights.push({ id: "emp.leads", severity: "info", title: `${newLeads} leads novos`, detail: "Acompanhar tempo de primeira resposta para não perder a janela." });
      if (noShow > 0) insights.push({ id: "emp.noshow", severity: "warning", title: `${noShow} no-shows na agenda`, detail: "Considerar confirmação por WhatsApp 24h antes." });
      if (overdue > 0) insights.push({ id: "emp.overdue", severity: "critical", title: `${overdue} faturas em atraso`, detail: "Abrir cobrança proativa.", cta: { label: "Ir para Financeiro", to: "/finance" } });
    }

    if (data.audience === "consumidor") {
      const [{ data: ms }, { data: invs }] = await Promise.all([
        supabase.from("consumer_memberships").select("id,status,current_period_end").eq("user_id", userId),
        supabase.from("consumer_membership_invoices").select("id,status,due_date").eq("user_id", userId),
      ]);
      const expiringSoon = (ms ?? []).filter((m) => {
        if (m.status !== "active" || !m.current_period_end) return false;
        const days = (new Date(m.current_period_end as string).getTime() - Date.now()) / 86400_000;
        return days > 0 && days < 7;
      }).length;
      const overdue = (invs ?? []).filter((i) => i.status !== "paid" && i.due_date && i.due_date < new Date().toISOString().slice(0, 10)).length;
      if (expiringSoon > 0) insights.push({ id: "cons.exp", severity: "warning", title: `${expiringSoon} plano(s) vencendo em até 7 dias`, detail: "Renove para não perder benefícios.", cta: { label: "Ver assinatura", to: "/clube" } });
      if (overdue > 0) insights.push({ id: "cons.overdue", severity: "critical", title: `${overdue} fatura(s) em atraso`, detail: "Regularize para manter o acesso.", cta: { label: "Ver assinatura", to: "/clube" } });
      if (insights.length === 0) insights.push({ id: "cons.ok", severity: "success", title: "Tudo em dia", detail: "Seu acesso e cobranças estão sem pendências no período." });
    }

    if (insights.length === 0) insights.push({ id: "none", severity: "info", title: "Sem alertas no período", detail: "Continuaremos monitorando e avisaremos quando algo mudar." });

    return { insights, generatedAt: new Date().toISOString() };
  });
