import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getRiomedCompanyId(supabase: any): Promise<string> {
  const { data, error } = await supabase
    .from("communication_tenants")
    .select("company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id as string;
}

export const listRiomedSellers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data, error } = await supabase.from("riomed_sellers").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { sellers: data ?? [] };
  });

export const upsertRiomedSeller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid().optional(),
    full_name: z.string().min(2).max(120),
    email: z.string().email().max(180),
    phone: z.string().max(40).optional().nullable(),
    seller_code: z.string().min(2).max(40),
    commission_rate: z.coerce.number().min(0).max(100).default(5),
    monthly_goal: z.coerce.number().min(0).default(0),
    territory: z.string().max(120).optional().nullable(),
    status: z.enum(["active", "paused", "inactive"]).default("active"),
    notes: z.string().max(2000).optional().nullable(),
    user_id: z.string().uuid().optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const payload = { ...data, company_id: companyId };
    if (data.id) {
      const { data: row, error } = await supabase.from("riomed_sellers").update(payload).eq("id", data.id).eq("company_id", companyId).select().single();
      if (error) throw new Error(error.message);
      return { seller: row };
    }
    const { data: row, error } = await supabase.from("riomed_sellers").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return { seller: row };
  });

export const deleteRiomedSeller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { error } = await supabase.from("riomed_sellers").delete().eq("id", data.id).eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDistributionConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data, error } = await supabase.from("riomed_distribution_config").select("*").eq("company_id", companyId).maybeSingle();
    if (error) throw new Error(error.message);
    return { config: data, companyId };
  });

export const saveDistributionConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    mode: z.enum(["round_robin", "random", "manual", "territory"]),
    active: z.boolean(),
    business_hours_start: z.string().optional().nullable(),
    business_hours_end: z.string().optional().nullable(),
    weekend_enabled: z.boolean().default(false),
    fallback_seller_id: z.string().uuid().optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data: row, error } = await supabase
      .from("riomed_distribution_config")
      .upsert({ ...data, company_id: companyId }, { onConflict: "company_id" })
      .select().single();
    if (error) throw new Error(error.message);
    return { config: row };
  });

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ seller_id: z.string().uuid().optional(), status: z.string().optional(), limit: z.coerce.number().min(1).max(200).default(100) }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    let q = supabase.from("riomed_seller_assignments")
      .select("*, riomed_sellers(full_name,seller_code), contact:communication_contacts(display_name,attributes), opportunity:crm_opportunities(title,value_cents,source,product_interest)")
      .eq("company_id", companyId).order("created_at", { ascending: false }).limit(data.limit);
    if (data.seller_id) q = q.eq("seller_id", data.seller_id);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { assignments: rows ?? [] };
  });

export const updateAssignmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "won", "lost"]), lost_reason: z.string().max(500).optional().nullable(), notes: z.string().max(2000).optional().nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const patch: any = { status: data.status, notes: data.notes ?? undefined };
    if (data.status === "contacted") patch.first_contact_at = new Date().toISOString();
    if (data.status === "won") patch.won_at = new Date().toISOString();
    if (data.status === "lost") { patch.lost_at = new Date().toISOString(); patch.lost_reason = data.lost_reason ?? null; }
    const { data: row, error } = await supabase.from("riomed_seller_assignments").update(patch).eq("id", data.id).eq("company_id", companyId).select().single();
    if (error) throw new Error(error.message);
    return { assignment: row };
  });

export const assignContactManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ contact_id: z.string().uuid(), seller_id: z.string().uuid(), opportunity_id: z.string().uuid().optional().nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data: row, error } = await supabase.from("riomed_seller_assignments").insert({
      company_id: companyId, seller_id: data.seller_id, contact_id: data.contact_id, opportunity_id: data.opportunity_id ?? null, assigned_via: "manual",
    }).select().single();
    if (error) throw new Error(error.message);
    await supabase.from("riomed_seller_notifications").insert({ company_id: companyId, seller_id: data.seller_id, assignment_id: row.id, title: "Nuevo contacto asignado", body: "Tienes un nuevo contacto comercial asignado." });
    return { assignment: row };
  });

export const autoAssignContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ contact_id: z.string().uuid(), opportunity_id: z.string().uuid().optional().nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data: config, error: configError } = await supabase.from("riomed_distribution_config").select("*").eq("company_id", companyId).maybeSingle();
    if (configError) throw new Error(configError.message);
    if (config && !config.active) throw new Error("Distribuição automática desativada");

    const { data: sellers, error: sellerError } = await supabase.from("riomed_sellers").select("id,territory,created_at").eq("company_id", companyId).eq("status", "active").order("created_at");
    if (sellerError) throw new Error(sellerError.message);
    if (!sellers?.length) throw new Error("Nenhum vendedor ativo disponível");

    let selected = sellers[0];
    const mode = config?.mode ?? "round_robin";
    if (mode === "random") selected = sellers[Math.floor(Math.random() * sellers.length)];
    if (mode === "round_robin") {
      const cursor = Number(config?.rr_cursor ?? 0);
      selected = sellers[cursor % sellers.length];
      await supabase.from("riomed_distribution_config").upsert({ company_id: companyId, mode, active: true, rr_cursor: cursor + 1 }, { onConflict: "company_id" });
    }
    if (mode === "manual") {
      const fallback = config?.fallback_seller_id && sellers.find((s: any) => s.id === config.fallback_seller_id);
      if (!fallback) throw new Error("Distribuição manual exige vendedor padrão");
      selected = fallback;
    }

    const { data: row, error } = await supabase.from("riomed_seller_assignments").insert({
      company_id: companyId, seller_id: selected.id, contact_id: data.contact_id, opportunity_id: data.opportunity_id ?? null, assigned_via: mode === "territory" ? "system" : mode,
    }).select().single();
    if (error) throw new Error(error.message);
    await supabase.from("riomed_seller_notifications").insert({ company_id: companyId, seller_id: selected.id, assignment_id: row.id, title: "Nuevo contacto asignado", body: "Tienes un nuevo contacto comercial asignado automáticamente." });
    return { assignmentId: row.id, sellerId: selected.id };
  });

export const getSellersOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [sellersRes, assignmentsRes, notifRes] = await Promise.all([
      supabase.from("riomed_sellers").select("id,status").eq("company_id", companyId),
      supabase.from("riomed_seller_assignments").select("status,seller_id,created_at").eq("company_id", companyId).gte("created_at", since),
      supabase.from("riomed_seller_notifications").select("id,read_at").eq("company_id", companyId).is("read_at", null),
    ]);
    if (sellersRes.error) throw new Error(sellersRes.error.message);
    if (assignmentsRes.error) throw new Error(assignmentsRes.error.message);
    if (notifRes.error) throw new Error(notifRes.error.message);
    const sellers = sellersRes.data ?? [];
    const assignments = assignmentsRes.data ?? [];
    return {
      totalSellers: sellers.length,
      activeSellers: sellers.filter((s: any) => s.status === "active").length,
      assignmentsLast30: assignments.length,
      won: assignments.filter((a: any) => a.status === "won").length,
      lost: assignments.filter((a: any) => a.status === "lost").length,
      open: assignments.filter((a: any) => ["new", "contacted"].includes(a.status)).length,
      unreadNotifications: notifRes.data?.length ?? 0,
    };
  });

export const getMySellerAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data: seller, error: sellerError } = await supabase.from("riomed_sellers").select("*").eq("company_id", companyId).eq("user_id", userId).maybeSingle();
    if (sellerError) throw new Error(sellerError.message);
    if (!seller) return { seller: null, assignments: [], notifications: [] };
    const [aRes, nRes] = await Promise.all([
      supabase.from("riomed_seller_assignments").select("*, contact:communication_contacts(display_name,attributes), opportunity:crm_opportunities(title,value_cents,source,product_interest)").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("riomed_seller_notifications").select("*").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (aRes.error) throw new Error(aRes.error.message);
    if (nRes.error) throw new Error(nRes.error.message);
    return { seller, assignments: aRes.data ?? [], notifications: nRes.data ?? [] };
  });
