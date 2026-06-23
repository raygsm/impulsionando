import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RIOMED_NAME = "RioMed";

async function getRiomedCompanyId(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", RIOMED_NAME)
    .limit(1)
    .maybeSingle();
  if (!data?.id) throw new Error("Empresa RioMed não localizada");
  return data.id;
}

async function requireMaster(ctx: any) {
  const sb = ctx.supabase;
  const { data: isAdmin } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Apenas administradores master podem acessar este painel");
}

// ---------------- 1) Visão Master agregada ----------------
export const getRiomedMasterOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireMaster(context as any);
    const sb = (context as any).supabase;
    const cid = await getRiomedCompanyId(sb);

    const [
      sellersR, teamR, techR, scopesR,
      leadsR, quotesR, ordersR, ticketsR,
      arR, posSalesR, productsR, stockR,
      n8nWfR, n8nExecR, eventsR, alertsR,
    ] = await Promise.all([
      sb.from("riomed_sellers").select("id, full_name, email, seller_code, status, user_id, monthly_goal, commission_rate", { count: "exact" }).eq("company_id", cid),
      sb.from("riomed_team").select("id, full_name, email, member_role, active", { count: "exact" }),
      sb.from("riomed_technicians").select("id, full_name, email, status, available", { count: "exact" }).eq("company_id", cid),
      sb.from("riomed_user_scopes").select("user_id, scope").eq("company_id", cid),
      sb.from("riomed_seller_leads").select("id, status, seller_id, created_at", { count: "exact" }).eq("company_id", cid),
      sb.from("riomed_quotes").select("id, status, total, seller_id, created_at", { count: "exact" }).eq("company_id", cid),
      sb.from("sales_orders").select("id, status, total, created_at", { count: "exact" }).eq("company_id", cid),
      sb.from("riomed_support_tickets").select("id, status, priority, assigned_to, created_at", { count: "exact" }).eq("company_id", cid),
      sb.from("riomed_ar_invoices").select("id, status, amount, due_date, created_at", { count: "exact" }).eq("company_id", cid),
      sb.from("riomed_pos_sales").select("id, total, payment_method, created_at, status", { count: "exact" }).eq("company_id", cid),
      sb.from("riomed_products").select("id, active", { count: "exact" }).eq("company_id", cid),
      sb.from("riomed_stock_levels").select("product_id, quantity, min_quantity").eq("company_id", cid),
      sb.from("riomed_n8n_workflows").select("id, name, webhook_url, is_active, trigger_event").eq("company_id", cid),
      sb.from("riomed_n8n_executions").select("id, status, duration_ms, created_at").eq("company_id", cid).order("created_at", { ascending: false }).limit(20),
      sb.from("riomed_operational_events").select("id, source, event_code, level, created_at").eq("company_id", cid).order("created_at", { ascending: false }).limit(15),
      sb.from("riomed_seller_notifications").select("id, kind, created_at, read_at").eq("company_id", cid).order("created_at", { ascending: false }).limit(20),
    ]);

    const sellers = sellersR.data ?? [];
    const sum = (arr: any[], k: string) => arr.reduce((a, r) => a + Number(r[k] ?? 0), 0);

    const quotes = quotesR.data ?? [];
    const orders = ordersR.data ?? [];
    const ar = arR.data ?? [];
    const posSales = posSalesR.data ?? [];
    const stock = stockR.data ?? [];

    const arOpen = ar.filter((a: any) => a.status !== "paid");
    const arOverdue = arOpen.filter((a: any) => a.due_date && new Date(a.due_date) < new Date());
    const stockBelowMin = stock.filter((s: any) => Number(s.quantity) <= Number(s.min_quantity ?? 0));
    const leadsAll = (leadsR.data ?? []) as any[];

    // por vendedor
    const bySeller = (sellers as any[]).map((s: any) => {
      const sQuotes = quotes.filter((q: any) => q.seller_id === s.id);
      const sLeads = leadsAll.filter((l: any) => l.seller_id === s.id);
      return {
        id: s.id, user_id: s.user_id, full_name: s.full_name, email: s.email,
        seller_code: s.seller_code, status: s.status,
        monthly_goal: Number(s.monthly_goal ?? 0),
        leads: sLeads.length,
        leads_won: sLeads.filter((l: any) => l.status === "won").length,
        quotes: sQuotes.length,
        quotes_won: sQuotes.filter((q: any) => q.status === "won").length,
        revenue: sum(sQuotes.filter((q: any) => q.status === "won"), "total"),
      };
    }).sort((a: any, b: any) => b.revenue - a.revenue);

    return {
      kpis: {
        sellers: (sellers as any[]).length,
        team: teamR.count ?? 0,
        technicians: techR.count ?? 0,
        scopes: (scopesR.data ?? []).length,
        leads_total: leadsR.count ?? 0,
        quotes_total: quotesR.count ?? 0,
        quotes_revenue: sum(quotes.filter((q: any) => q.status === "won"), "total"),
        orders_total: ordersR.count ?? 0,
        orders_revenue: sum(orders.filter((o: any) => o.status === "paid" || o.status === "completed"), "total"),
        tickets_open: ((ticketsR.data ?? []) as any[]).filter((t: any) => t.status !== "closed").length,
        tickets_total: ticketsR.count ?? 0,
        ar_open_count: arOpen.length,
        ar_open_value: sum(arOpen, "amount"),
        ar_overdue_count: arOverdue.length,
        ar_overdue_value: sum(arOverdue, "amount"),
        pos_sales_count: posSalesR.count ?? 0,
        pos_sales_value: sum(posSales.filter((p: any) => p.status === "completed"), "total"),
        products_active: ((productsR.data ?? []) as any[]).filter((p: any) => p.active).length,
        stock_low: stockBelowMin.length,
      },
      bySeller,
      sellers, team: teamR.data ?? [], technicians: techR.data ?? [],
      scopes: scopesR.data ?? [],
      n8n: {
        workflows: n8nWfR.data ?? [],
        recent_executions: n8nExecR.data ?? [],
        configured: (n8nWfR.data ?? []).filter((w: any) => w.webhook_url).length,
      },
      events: eventsR.data ?? [],
      notifications: alertsR.data ?? [],
    };
  });

// ---------------- 2) Persona view ----------------
export const getRiomedPersonaView = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      persona: z.enum(["vendedor", "gerente", "tecnico", "financeiro"]),
      targetUserId: z.string().uuid().optional(),
      sellerId: z.string().uuid().optional(),
      technicianId: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireMaster(context as any);
    const sb = (context as any).supabase;
    const cid = await getRiomedCompanyId(sb);

    if (data.persona === "vendedor") {
      if (!data.sellerId) throw new Error("sellerId obrigatório para vendedor");
      const [seller, leads, quotes, notifs] = await Promise.all([
        sb.from("riomed_sellers").select("*").eq("id", data.sellerId).maybeSingle(),
        sb.from("riomed_seller_leads").select("*").eq("seller_id", data.sellerId).order("created_at", { ascending: false }).limit(50),
        sb.from("riomed_quotes").select("*").eq("seller_id", data.sellerId).order("created_at", { ascending: false }).limit(50),
        sb.from("riomed_seller_notifications").select("*").eq("seller_id", data.sellerId).order("created_at", { ascending: false }).limit(30),
      ]);
      const qs = quotes.data ?? [];
      return {
        persona: "vendedor",
        target: seller.data,
        scope_label: `Vendo a tela como ${seller.data?.full_name ?? "vendedor"}`,
        kpis: {
          leads: (leads.data ?? []).length,
          quotes: qs.length,
          quotes_won: qs.filter((q: any) => q.status === "won").length,
          revenue: qs.filter((q: any) => q.status === "won").reduce((a: number, q: any) => a + Number(q.total ?? 0), 0),
          goal: Number(seller.data?.monthly_goal ?? 0),
        },
        leads: leads.data ?? [],
        quotes: qs,
        notifications: notifs.data ?? [],
      };
    }

    if (data.persona === "tecnico") {
      if (!data.technicianId) throw new Error("technicianId obrigatório para técnico");
      const [tech, assignments, tickets] = await Promise.all([
        sb.from("riomed_technicians").select("*").eq("id", data.technicianId).maybeSingle(),
        sb.from("riomed_technician_assignments").select("*").eq("technician_id", data.technicianId).order("created_at", { ascending: false }).limit(50),
        sb.from("riomed_support_tickets").select("*").eq("assigned_to", data.technicianId).order("created_at", { ascending: false }).limit(50),
      ]);
      return {
        persona: "tecnico",
        target: tech.data,
        scope_label: `Vendo a tela como ${tech.data?.full_name ?? "técnico"}`,
        kpis: {
          assignments: (assignments.data ?? []).length,
          tickets_open: (tickets.data ?? []).filter((t: any) => t.status !== "closed").length,
        },
        assignments: assignments.data ?? [],
        tickets: tickets.data ?? [],
      };
    }

    if (data.persona === "gerente") {
      // gerente vê todos os vendedores e equipe
      const [sellers, quotes, tickets] = await Promise.all([
        sb.from("riomed_sellers").select("id, full_name, email, seller_code, status, monthly_goal").eq("company_id", cid),
        sb.from("riomed_quotes").select("id, status, total, seller_id").eq("company_id", cid),
        sb.from("riomed_support_tickets").select("id, status, priority").eq("company_id", cid),
      ]);
      const byS = (sellers.data ?? []).map((s: any) => {
        const sQ = (quotes.data ?? []).filter((q: any) => q.seller_id === s.id);
        return {
          ...s,
          quotes: sQ.length,
          won: sQ.filter((q: any) => q.status === "won").length,
          revenue: sQ.filter((q: any) => q.status === "won").reduce((a: number, q: any) => a + Number(q.total ?? 0), 0),
        };
      }).sort((a: any, b: any) => b.revenue - a.revenue);
      return {
        persona: "gerente",
        target: null,
        scope_label: "Visão de Gerente — equipe completa",
        kpis: {
          team_size: (sellers.data ?? []).length,
          total_quotes: (quotes.data ?? []).length,
          tickets_open: (tickets.data ?? []).filter((t: any) => t.status !== "closed").length,
        },
        sellers: byS,
      };
    }

    // financeiro
    const [ar, ap, pos] = await Promise.all([
      sb.from("riomed_ar_invoices").select("*").eq("company_id", cid).order("created_at", { ascending: false }).limit(100),
      sb.from("riomed_ap_invoices").select("*").eq("company_id", cid).order("created_at", { ascending: false }).limit(100),
      sb.from("riomed_pos_sales").select("*").eq("company_id", cid).eq("status", "completed").order("created_at", { ascending: false }).limit(100),
    ]);
    return {
      persona: "financeiro",
      target: null,
      scope_label: "Visão Financeiro — contas, caixa e POS",
      kpis: {
        ar_open: (ar.data ?? []).filter((r: any) => r.status !== "paid").length,
        ar_value: (ar.data ?? []).filter((r: any) => r.status !== "paid").reduce((a: number, r: any) => a + Number(r.amount ?? 0), 0),
        ap_open: (ap.data ?? []).filter((r: any) => r.status !== "paid").length,
        pos_today: (pos.data ?? []).filter((p: any) => new Date(p.created_at).toDateString() === new Date().toDateString()).length,
      },
      ar: ar.data ?? [],
      ap: ap.data ?? [],
      pos: pos.data ?? [],
    };
  });

// ---------------- 3) N8N — teste de conectividade ----------------
export const pingRiomedN8n = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workflowId: z.string().uuid().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await requireMaster(context as any);
    const sb = (context as any).supabase;
    const cid = await getRiomedCompanyId(sb);
    const { data: wfs } = await sb
      .from("riomed_n8n_workflows")
      .select("id, name, webhook_url, is_active")
      .eq("company_id", cid)
      .eq(...(data.workflowId ? (["id", data.workflowId] as const) : (["is_active", true] as const)));

    const list = (wfs ?? []).filter((w: any) => w.webhook_url);
    if (list.length === 0) {
      return { integrated: false, message: "Nenhum workflow N8N com webhook_url configurado para a RioMed.", results: [] };
    }
    const results: any[] = [];
    for (const wf of list) {
      const t0 = Date.now();
      try {
        const res = await fetch(wf.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "ping", source: "impulsionando_master", at: new Date().toISOString() }),
          signal: AbortSignal.timeout(8000),
        });
        results.push({ id: wf.id, name: wf.name, url: wf.webhook_url, ok: res.ok, status: res.status, ms: Date.now() - t0 });
      } catch (e: any) {
        results.push({ id: wf.id, name: wf.name, url: wf.webhook_url, ok: false, error: String(e?.message ?? e), ms: Date.now() - t0 });
      }
    }
    const okCount = results.filter(r => r.ok).length;
    return {
      integrated: okCount > 0,
      message: `${okCount}/${results.length} webhooks responderam com sucesso.`,
      results,
    };
  });

// ---------------- 4) Setores / cargos ----------------
export const upsertRiomedRoleTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      code: z.string().min(1),
      label: z.string().min(1),
      sector: z.string().min(1),
      description: z.string().optional(),
      scopes: z.array(z.string()).default([]),
      display_order: z.number().int().default(0),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireMaster(context as any);
    const sb = (context as any).supabase;
    const cid = await getRiomedCompanyId(sb);
    const { error } = await sb.from("riomed_role_templates").upsert({
      ...data, company_id: cid, is_system: false,
    }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listRiomedRoleTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireMaster(context as any);
    const sb = (context as any).supabase;
    const cid = await getRiomedCompanyId(sb);
    const { data } = await sb
      .from("riomed_role_templates")
      .select("*")
      .eq("company_id", cid)
      .order("sector").order("display_order");
    return data ?? [];
  });
