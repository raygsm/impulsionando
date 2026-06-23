// Impulsionando Standard Painel — universal, module-aware tenant dashboard.
// Reads enabled modules for the tenant and aggregates KPIs proportionally to the
// contracted plan. Same primitive serves every tenant (RioMed, CHRISMED, etc.).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getImpulsionandoPainel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;

    // ── tenant ──
    const { data: company } = await sb
      .from("companies")
      .select("id,name,subdomain,created_at,logo_url,primary_color")
      .eq("subdomain", data.slug)
      .maybeSingle();
    if (!company) throw new Error("Tenant não encontrado");
    const companyId = company.id;

    // ── enabled modules ──
    const { data: mods = [] } = await sb
      .from("company_modules")
      .select("is_enabled, modules!inner(slug,name,category,description)")
      .eq("company_id", companyId)
      .eq("is_enabled", true);
    const enabled = new Set<string>((mods ?? []).map((m: any) => m.modules.slug));
    const modules = (mods ?? []).map((m: any) => ({
      slug: m.modules.slug,
      name: m.modules.name,
      category: m.modules.category,
      description: m.modules.description,
    }));

    // ── window: last 30d / 7d / today ──
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
    const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Helper: safe count
    const sbAny = sb as any;
    const count = async (table: string, build: (q: any) => any) => {
      try {
        const q = build(sbAny.from(table).select("*", { count: "exact", head: true }).eq("company_id", companyId));
        const { count: c } = await q;
        return c ?? 0;
      } catch { return 0; }
    };
    const sum = async (table: string, col: string, build: (q: any) => any) => {
      try {
        const q = build(sbAny.from(table).select(col).eq("company_id", companyId));
        const { data } = await q;
        return (data ?? []).reduce((a: number, r: any) => a + Number(r?.[col] ?? 0), 0);
      } catch { return 0; }
    };

    // ── module-grouped KPIs (lazy: only what plan has) ──
    const kpis: Record<string, any> = {};

    // CRM
    if (enabled.has("crm")) {
      const [leads30, leadsToday, oppsOpen, oppsWon30, oppsWonValue] = await Promise.all([
        count("crm_leads", (q) => q.gte("created_at", d30)),
        count("crm_leads", (q) => q.gte("created_at", startToday)),
        count("crm_opportunities", (q) => q.not("status", "in", "(won,lost)")),
        count("crm_opportunities", (q) => q.eq("status", "won").gte("updated_at", d30)),
        sum("crm_opportunities", "value", (q) => q.eq("status", "won").gte("updated_at", d30)),
      ]);
      kpis.crm = { leads30, leadsToday, oppsOpen, oppsWon30, oppsWonValue };
    }

    // SUPPORT
    if (enabled.has("support") || enabled.has("support-pro")) {
      const [open, urgent, solvedWeek] = await Promise.all([
        count("support_tickets", (q) => q.in("status", ["open", "in_progress", "waiting"])),
        count("support_tickets", (q) => q.eq("priority", "urgent").not("status", "eq", "solved")),
        count("support_tickets", (q) => q.eq("status", "solved").gte("solved_at", d7)),
      ]);
      kpis.support = { open, urgent, solvedWeek };
    }

    // AGENDA
    if (enabled.has("agenda")) {
      const [next7, todayCount] = await Promise.all([
        count("agenda_appointments", (q) => q.gte("scheduled_at", new Date().toISOString()).lte("scheduled_at", new Date(Date.now() + 7 * 86400_000).toISOString())),
        count("agenda_appointments", (q) => q.gte("scheduled_at", startToday).lt("scheduled_at", new Date(now.getTime() + 86400_000).toISOString())),
      ]);
      kpis.agenda = { next7, todayCount };
    }

    // FINANCEIRO / BILLING
    if (enabled.has("finance") || enabled.has("financeiro") || enabled.has("commerce")) {
      const [openInvoices, overdue, paid30, paidValue30] = await Promise.all([
        count("billing_invoices", (q) => q.eq("status", "open")),
        count("billing_invoices", (q) => q.eq("status", "open").lt("due_date", new Date().toISOString().slice(0, 10))),
        count("billing_invoices", (q) => q.eq("status", "paid").gte("paid_at", d30)),
        sum("billing_invoices", "amount", (q) => q.eq("status", "paid").gte("paid_at", d30)),
      ]);
      kpis.finance = { openInvoices, overdue, paid30, paidValue30 };
    }

    // ESTOQUE
    if (enabled.has("inventory") || enabled.has("estoque")) {
      try {
        const { data: low } = await sbAny.from("riomed_stock_levels").select("id, quantity, reorder_point").eq("company_id", companyId);
        const lowCount = (low ?? []).filter((r: any) => Number(r.quantity) <= Number(r.reorder_point ?? 0)).length;
        kpis.inventory = { totalSkus: (low ?? []).length, low: lowCount };
      } catch { kpis.inventory = { totalSkus: 0, low: 0 }; }
    }

    // MARKETING
    if (enabled.has("marketing")) {
      const newLeads30 = await count("marketing_leads", (q) => q.gte("created_at", d30));
      const pending = await count("core_funnel_dispatch_queue", (q) => q.eq("status", "pending"));
      kpis.marketing = { newLeads30, pendingDispatches: pending };
    }

    // AUTOMAÇÃO / N8N
    if (enabled.has("n8n") || enabled.has("automation") || enabled.has("automacao")) {
      const [runs7, failed7] = await Promise.all([
        count("n8n_workflow_runs", (q) => q.gte("started_at", d7)),
        count("n8n_workflow_runs", (q) => q.eq("status", "error").gte("started_at", d7)),
      ]);
      kpis.automation = { runs7, failed7 };
    }

    // POS (RioMed específico, ainda assim módulo-aware)
    if (enabled.has("commerce") || enabled.has("pos")) {
      const posSales30 = await sum("riomed_pos_sales", "total", (q) => q.gte("created_at", d30));
      const posCount30 = await count("riomed_pos_sales", (q) => q.gte("created_at", d30));
      kpis.pos = { sales30: posSales30, count30: posCount30 };
    }

    // FISCAL
    if (enabled.has("fiscal")) {
      const [emitted30, errors30] = await Promise.all([
        count("core_fiscal_invoices", (q) => q.eq("status", "emitted").gte("issued_at", d30)),
        count("core_fiscal_invoices", (q) => q.eq("status", "error").gte("created_at", d30)),
      ]);
      kpis.fiscal = { emitted30, errors30 };
    }

    return {
      company,
      modules,
      enabled: Array.from(enabled),
      kpis,
      generatedAt: new Date().toISOString(),
    };
  });
