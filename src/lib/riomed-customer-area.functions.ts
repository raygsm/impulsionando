import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getRioMedTenant(supabase: any) {
  const { data, error } = await supabase
    .from("communication_tenants")
    .select("id,company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return { tenantId: data.id as string, companyId: data.company_id as string };
}

async function resolveContactByEmail(admin: any, tenantId: string, email: string) {
  if (!email) return null;
  const { data, error } = await admin
    .from("communication_contact_identities")
    .select("contact_id")
    .eq("tenant_id", tenantId)
    .ilike("normalized_address", email)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.contact_id) return null;
  const { data: contact, error: contactError } = await admin
    .from("communication_contacts")
    .select("id,display_name,attributes")
    .eq("id", data.contact_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (contactError) throw contactError;
  return contact ?? null;
}

export const getRiomedCustomerArea = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context as any;
    const email = String(claims?.email ?? "").trim().toLowerCase();
    if (!email) throw new Error("Conta autenticada sem e-mail verificável");
    const { tenantId, companyId } = await getRioMedTenant(supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const contact = await resolveContactByEmail(supabaseAdmin, tenantId, email);
    const contactId = contact?.id ?? null;

    const [hospitalRes, supplierRes, sellerRes] = await Promise.all([
      supabaseAdmin.from("riomed_hospital_accounts").select("*").eq("company_id", companyId).ilike("contact_email", email).maybeSingle(),
      supabaseAdmin.from("riomed_suppliers").select("*").eq("company_id", companyId).ilike("contact_email", email).maybeSingle(),
      supabaseAdmin.from("riomed_sellers").select("*").eq("company_id", companyId).or(`user_id.eq.${userId},email.ilike.${email}`).limit(1).maybeSingle(),
    ]);
    if (hospitalRes.error) throw hospitalRes.error;
    if (supplierRes.error) throw supplierRes.error;
    if (sellerRes.error) throw sellerRes.error;

    const hospital = hospitalRes.data ?? null;
    const supplier = supplierRes.data ?? null;
    const seller = sellerRes.data ?? null;
    const profiles: string[] = [];
    if (contact) profiles.push("cliente");
    if (hospital) profiles.push("hospital");
    if (supplier) profiles.push("fornecedor");
    if (seller) profiles.push("vendedor");
    if (!profiles.length) profiles.push("visitante");

    let quotes: any[] = [];
    let orders: any[] = [];
    let tickets: any[] = [];
    if (contactId) {
      const [qRes, oRes, tRes] = await Promise.all([
        supabaseAdmin.from("riomed_quotes").select("id,code,status,total,currency,created_at,approved_at").eq("company_id", companyId).eq("contact_id", contactId).order("created_at", { ascending: false }).limit(20),
        supabaseAdmin.from("sales_orders").select("id,order_number,status,total,created_at,customer_name").eq("company_id", companyId).eq("contact_id", contactId).order("created_at", { ascending: false }).limit(20),
        supabaseAdmin.from("support_tickets").select("id,ticket_code,subject,status,priority,created_at").eq("company_id", companyId).eq("contact_id", contactId).order("created_at", { ascending: false }).limit(10),
      ]);
      if (qRes.error) throw qRes.error;
      if (oRes.error) throw oRes.error;
      if (tRes.error) throw tRes.error;
      quotes = qRes.data ?? [];
      orders = oRes.data ?? [];
      tickets = tRes.data ?? [];
    }

    return { email, profiles, contact, hospital, supplier, seller, quotes, orders, tickets };
  });

export const getRiomedManagementDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { tenantId, companyId } = await getRioMedTenant(supabase);
    const [{ data: belongs }, { data: staff }] = await Promise.all([
      supabase.rpc("user_belongs_to_company", { _user: userId, _company: companyId }),
      supabase.rpc("is_impulsionando_staff", { _user: userId }),
    ]);
    if (!belongs && !staff) throw new Error("Acesso restrito à gestão Rio Med");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

    const [contactsRes, quotesRes, ordersRes, commRes, sellersRes, prodRes, hospRes, assignRes, ticketsRes, whatsappRes] = await Promise.all([
      supabaseAdmin.from("communication_contacts").select("id,created_at").eq("tenant_id", tenantId).gte("created_at", since30),
      supabaseAdmin.from("riomed_quotes").select("id,status,total,created_at").eq("company_id", companyId).gte("created_at", since30),
      supabaseAdmin.from("sales_orders").select("id,status,total,created_at").eq("company_id", companyId).gte("created_at", since30),
      supabaseAdmin.from("riomed_commissions").select("amount,status,period").eq("company_id", companyId),
      supabaseAdmin.from("riomed_sellers").select("id,status,full_name,monthly_goal").eq("company_id", companyId),
      supabaseAdmin.from("riomed_products").select("id,is_active").eq("company_id", companyId),
      supabaseAdmin.from("riomed_hospital_accounts").select("id").eq("company_id", companyId),
      supabaseAdmin.from("riomed_seller_assignments").select("seller_id,status,created_at").eq("company_id", companyId).gte("created_at", since30),
      supabaseAdmin.from("support_tickets").select("status,created_at").eq("company_id", companyId).gte("created_at", since30),
      supabaseAdmin.from("riomed_whatsapp_clicks").select("id,created_at").eq("company_id", companyId).gte("created_at", since7),
    ]);
    const errors = [contactsRes,quotesRes,ordersRes,commRes,sellersRes,prodRes,hospRes,assignRes,ticketsRes,whatsappRes].map((r:any)=>r.error).filter(Boolean);
    if (errors.length) throw errors[0];

    const contacts = contactsRes.data ?? [];
    const quotes = quotesRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const comm = commRes.data ?? [];
    const sellers = sellersRes.data ?? [];
    const assigns = assignRes.data ?? [];
    const period = new Date().toISOString().slice(0, 7);

    const revenue = orders.reduce((s:number,o:any)=>s+Number(o.total??0),0);
    const quoted = quotes.reduce((s:number,q:any)=>s+Number(q.total??0),0);
    const commissionPending = comm.filter((c:any)=>c.status==="pending").reduce((s:number,c:any)=>s+Number(c.amount??0),0);
    const commissionPaidMonth = comm.filter((c:any)=>c.status==="paid"&&c.period===period).reduce((s:number,c:any)=>s+Number(c.amount??0),0);
    const sellerRanking = sellers.map((seller:any)=>{
      const scoped=assigns.filter((a:any)=>a.seller_id===seller.id);
      return { id:seller.id,name:seller.full_name,total:scoped.length,won:scoped.filter((a:any)=>a.status==="won").length,goal:seller.monthly_goal };
    }).sort((a:any,b:any)=>b.won-a.won).slice(0,10);

    return {
      kpis: {
        contactsLast30: contacts.length,
        quotesLast30: quotes.length,
        ordersLast30: orders.length,
        revenueLast30: revenue,
        quotedLast30: quoted,
        commissionPending,
        commissionPaidMonth,
        activeSellers: sellers.filter((s:any)=>s.status==="active").length,
        activeProducts: (prodRes.data??[]).filter((p:any)=>p.is_active).length,
        hospitals: (hospRes.data??[]).length,
        ticketsOpen: (ticketsRes.data??[]).filter((t:any)=>!["closed","resolved"].includes(t.status)).length,
        whatsapp7d: (whatsappRes.data??[]).length,
      },
      funnel: { captar: contacts.length, converter: quotes.length, ganhos: orders.filter((o:any)=>["confirmed","fulfilled"].includes(o.status)).length },
      sellerRanking,
    };
  });
