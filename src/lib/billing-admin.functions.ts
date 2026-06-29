import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

export type BillingOverviewRow = {
  company_id: string;
  company_name: string;
  public_slug: string | null;
  mrr: number;
  contract_status: string | null;
  next_due_date: string | null;
  open_invoices: number;
  overdue_invoices: number;
  paid_30d: number;
  last_paid_at: string | null;
};

export type BillingInvoiceRow = {
  id: string;
  company_id: string;
  company_name: string;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  amount: number;
  status: string;
  paid_at: string | null;
};

export const fetchBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;

    const [companiesRes, contractsRes, invoicesRes] = await Promise.all([
      supa.from("companies")
        .select("id,name,public_slug,is_active,status")
        .eq("is_active", true)
        .neq("status", "archived"),
      supa.from("billing_contracts")
        .select("company_id,recurring_amount,status,next_due_date,last_paid_at"),
      supa.from("billing_invoices")
        .select("id,company_id,amount,status,due_date,paid_at,period_start,period_end")
        .order("due_date", { ascending: false }),
    ]);
    if (companiesRes.error) throw new Error(companiesRes.error.message);
    if (contractsRes.error) throw new Error(contractsRes.error.message);
    if (invoicesRes.error) throw new Error(invoicesRes.error.message);

    const companies = companiesRes.data ?? [];
    const contracts = contractsRes.data ?? [];
    const invoices = invoicesRes.data ?? [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const contractByCo = new Map<string, any>();
    for (const c of contracts) {
      // Pick the first active or latest
      const existing = contractByCo.get(c.company_id);
      if (!existing || (c.status === "active" && existing.status !== "active")) {
        contractByCo.set(c.company_id, c);
      }
    }

    const invByCo = new Map<string, any[]>();
    for (const i of invoices) {
      const list = invByCo.get(i.company_id) ?? [];
      list.push(i);
      invByCo.set(i.company_id, list);
    }

    const overview: BillingOverviewRow[] = companies.map((c: any) => {
      const ct = contractByCo.get(c.id);
      const list = invByCo.get(c.id) ?? [];
      let open = 0, overdue = 0, paid30 = 0;
      for (const i of list) {
        if (i.status === "open" || i.status === "pending") open++;
        if (i.status === "overdue" || (i.status !== "paid" && i.due_date && new Date(i.due_date) < now)) overdue++;
        if (i.status === "paid" && i.paid_at && new Date(i.paid_at) >= thirtyDaysAgo) paid30 += Number(i.amount ?? 0);
      }
      return {
        company_id: c.id,
        company_name: c.name,
        public_slug: c.public_slug,
        mrr: Number(ct?.recurring_amount ?? 0),
        contract_status: ct?.status ?? null,
        next_due_date: ct?.next_due_date ?? null,
        open_invoices: open,
        overdue_invoices: overdue,
        paid_30d: paid30,
        last_paid_at: ct?.last_paid_at ?? null,
      };
    });

    const totalMrr = overview.reduce((s, r) => s + r.mrr, 0);
    const totalOverdue = overview.reduce((s, r) => s + r.overdue_invoices, 0);
    const totalPaid30 = overview.reduce((s, r) => s + r.paid_30d, 0);
    const activeContracts = overview.filter((r) => r.contract_status === "active").length;

    return {
      kpis: {
        mrr: totalMrr,
        active_contracts: activeContracts,
        overdue_invoices: totalOverdue,
        paid_30d: totalPaid30,
      },
      rows: overview.sort((a, b) => b.mrr - a.mrr),
    };
  });

export const listAllInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const [invRes, coRes] = await Promise.all([
      supa.from("billing_invoices")
        .select("id,company_id,amount,status,due_date,paid_at,period_start,period_end")
        .order("due_date", { ascending: false })
        .limit(500),
      supa.from("companies").select("id,name"),
    ]);
    if (invRes.error) throw new Error(invRes.error.message);
    if (coRes.error) throw new Error(coRes.error.message);
    const coMap = new Map<string, string>();
    for (const c of coRes.data ?? []) coMap.set(c.id, c.name);
    const rows: BillingInvoiceRow[] = (invRes.data ?? []).map((i: any) => ({
      id: i.id,
      company_id: i.company_id,
      company_name: coMap.get(i.company_id) ?? "—",
      period_start: i.period_start,
      period_end: i.period_end,
      due_date: i.due_date,
      amount: Number(i.amount ?? 0),
      status: i.status,
      paid_at: i.paid_at,
    }));
    return rows;
  });
