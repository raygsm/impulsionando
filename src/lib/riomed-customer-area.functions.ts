import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getRiomedCompanyId(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("companies").select("id").ilike("name", "%riomed%").limit(1).maybeSingle();
  if (data?.id) return data.id;
  const { data: any2 } = await supabase.from("companies").select("id").limit(1).maybeSingle();
  if (!any2?.id) throw new Error("RioMed company not found");
  return any2.id;
}

export const getRiomedCustomerArea = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context as any;
    const email = (claims?.email ?? "").toLowerCase();
    const cid = await getRiomedCompanyId(supabase);

    const [leadRes, custRes, hospRes, supRes, sellerRes] = await Promise.all([
      email ? supabase.from("crm_leads").select("id,name,email,phone,source,status").eq("company_id", cid).ilike("email", email).maybeSingle() : Promise.resolve({ data: null }),
      email ? supabase.from("customers").select("id,name,email,phone").eq("company_id", cid).ilike("email", email).maybeSingle() : Promise.resolve({ data: null }),
      email ? supabase.from("riomed_hospital_accounts").select("*").eq("company_id", cid).ilike("contact_email", email).maybeSingle() : Promise.resolve({ data: null }),
      email ? supabase.from("riomed_suppliers").select("*").eq("company_id", cid).ilike("email", email).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("riomed_sellers").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    const lead = leadRes.data;
    const customer = custRes.data;
    const hospital = hospRes.data;
    const supplier = supRes.data;
    const seller = sellerRes.data;

    const profiles: string[] = [];
    if (lead) profiles.push("paciente");
    if (customer) profiles.push("cliente");
    if (hospital) profiles.push("hospital");
    if (supplier) profiles.push("fornecedor");
    if (seller) profiles.push("vendedor");
    if (profiles.length === 0) profiles.push("visitante");

    // Quotes/Orders for this user (by lead or customer)
    let quotes: any[] = [];
    let orders: any[] = [];
    let tickets: any[] = [];
    if (lead || customer) {
      const qRes = await supabase
        .from("riomed_quotes")
        .select("id,code,status,total,currency,created_at,approved_at")
        .eq("company_id", cid)
        .or(`lead_id.eq.${lead?.id ?? "00000000-0000-0000-0000-000000000000"},customer_id.eq.${customer?.id ?? "00000000-0000-0000-0000-000000000000"}`)
        .order("created_at", { ascending: false }).limit(20);
      quotes = qRes.data ?? [];

      const oRes = await supabase
        .from("sales_orders")
        .select("id,number,status,total,created_at,customer_name")
        .eq("company_id", cid)
        .or(`customer_lead_id.eq.${lead?.id ?? "00000000-0000-0000-0000-000000000000"},customer_id.eq.${customer?.id ?? "00000000-0000-0000-0000-000000000000"}`)
        .order("created_at", { ascending: false }).limit(20);
      orders = oRes.data ?? [];

      const tRes = await supabase
        .from("support_tickets")
        .select("id,subject,status,priority,created_at")
        .eq("company_id", cid)
        .ilike("requester_email", email)
        .order("created_at", { ascending: false }).limit(10);
      tickets = tRes.data ?? [];
    }

    return { email, profiles, lead, customer, hospital, supplier, seller, quotes, orders, tickets };
  });

export const getRiomedManagementDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

    const [leadsRes, quotesRes, ordersRes, commRes, sellersRes, prodRes, hospRes, assignRes, ticketsRes, whatsappRes] = await Promise.all([
      supabase.from("crm_leads").select("id,status,created_at,source").eq("company_id", cid).gte("created_at", since30),
      supabase.from("riomed_quotes").select("id,status,total,created_at").eq("company_id", cid).gte("created_at", since30),
      supabase.from("sales_orders").select("id,status,total,created_at").eq("company_id", cid).gte("created_at", since30),
      supabase.from("riomed_commissions").select("amount,status,period").eq("company_id", cid),
      supabase.from("riomed_sellers").select("id,status,full_name,monthly_goal").eq("company_id", cid),
      supabase.from("riomed_products").select("id,is_active").eq("company_id", cid),
      supabase.from("riomed_hospital_accounts").select("id").eq("company_id", cid),
      supabase.from("riomed_seller_assignments").select("seller_id,status,created_at").eq("company_id", cid).gte("created_at", since30),
      supabase.from("support_tickets").select("status,created_at").eq("company_id", cid).gte("created_at", since30),
      supabase.from("riomed_whatsapp_clicks").select("id,created_at").eq("company_id", cid).gte("created_at", since7),
    ]);

    const leads = leadsRes.data ?? [];
    const quotes = quotesRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const comm = commRes.data ?? [];
    const sellers = sellersRes.data ?? [];
    const assigns = assignRes.data ?? [];
    const period = new Date().toISOString().slice(0, 7);

    const ordersTotal = orders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const quotesTotal = quotes.reduce((s: number, q: any) => s + Number(q.total ?? 0), 0);
    const commPending = comm.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0);
    const commPaidPeriod = comm.filter((c: any) => c.status === "paid" && c.period === period).reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0);

    // Per-seller ranking
    const sellerStats = sellers.map((s: any) => {
      const won = assigns.filter((a: any) => a.seller_id === s.id && a.status === "won").length;
      const total = assigns.filter((a: any) => a.seller_id === s.id).length;
      return { id: s.id, name: s.full_name, total, won, goal: s.monthly_goal };
    }).sort((a: any, b: any) => b.won - a.won);

    // Funnel
    const funnel = {
      captar: leads.length,
      converter: quotes.length,
      ganhos: orders.filter((o: any) => o.status === "confirmed" || o.status === "completed").length,
    };

    // Lead sources
    const sources: Record<string, number> = {};
    for (const l of leads) sources[l.source ?? "unknown"] = (sources[l.source ?? "unknown"] ?? 0) + 1;

    return {
      kpis: {
        leadsLast30: leads.length,
        quotesLast30: quotes.length,
        ordersLast30: orders.length,
        revenueLast30: ordersTotal,
        quotedLast30: quotesTotal,
        commissionPending: commPending,
        commissionPaidMonth: commPaidPeriod,
        activeSellers: sellers.filter((s: any) => s.status === "active").length,
        activeProducts: (prodRes.data ?? []).filter((p: any) => p.is_active).length,
        hospitals: (hospRes.data ?? []).length,
        ticketsOpen: (ticketsRes.data ?? []).filter((t: any) => !["closed", "resolved"].includes(t.status)).length,
        whatsapp7d: (whatsappRes.data ?? []).length,
      },
      funnel,
      sources,
      sellerRanking: sellerStats.slice(0, 10),
    };
  });
