import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getRiomedCompanyId(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", "%riomed%")
    .limit(1)
    .maybeSingle();
  if (data?.id) return data.id;
  const { data: any2 } = await supabase.from("companies").select("id").limit(1).maybeSingle();
  if (!any2?.id) throw new Error("RioMed company not found");
  return any2.id;
}

export const listRiomedSellers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data } = await supabase
      .from("riomed_sellers")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    return { sellers: data ?? [] };
  });

export const upsertRiomedSeller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
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
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const payload = { ...data, company_id: companyId };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("riomed_sellers")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { seller: row };
    }
    const { data: row, error } = await supabase
      .from("riomed_sellers")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { seller: row };
  });

export const deleteRiomedSeller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("riomed_sellers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDistributionConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data } = await supabase
      .from("riomed_distribution_config")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();
    return { config: data, companyId };
  });

export const saveDistributionConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      mode: z.enum(["round_robin", "random", "manual", "territory"]),
      active: z.boolean(),
      business_hours_start: z.string().optional().nullable(),
      business_hours_end: z.string().optional().nullable(),
      weekend_enabled: z.boolean().default(false),
      fallback_seller_id: z.string().uuid().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data: existing } = await supabase
      .from("riomed_distribution_config")
      .select("id")
      .eq("company_id", companyId)
      .maybeSingle();
    if (existing) {
      const { data: row, error } = await supabase
        .from("riomed_distribution_config")
        .update(data)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { config: row };
    }
    const { data: row, error } = await supabase
      .from("riomed_distribution_config")
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { config: row };
  });

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      seller_id: z.string().uuid().optional(),
      status: z.string().optional(),
      limit: z.coerce.number().min(1).max(200).default(100),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    let q = supabase
      .from("riomed_seller_assignments")
      .select("*, riomed_sellers(full_name, seller_code), crm_leads(name, email, phone, source)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.seller_id) q = q.eq("seller_id", data.seller_id);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows } = await q;
    return { assignments: rows ?? [] };
  });

export const updateAssignmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "won", "lost"]),
      lost_reason: z.string().max(500).optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const patch: any = { status: data.status };
    if (data.status === "contacted") patch.first_contact_at = new Date().toISOString();
    if (data.status === "won") patch.won_at = new Date().toISOString();
    if (data.status === "lost") {
      patch.lost_at = new Date().toISOString();
      patch.lost_reason = data.lost_reason ?? null;
    }
    if (data.notes) patch.notes = data.notes;
    const { data: row, error } = await supabase
      .from("riomed_seller_assignments")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { assignment: row };
  });

export const assignLeadManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      lead_id: z.string().uuid(),
      seller_id: z.string().uuid(),
      opportunity_id: z.string().uuid().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data: row, error } = await supabase
      .from("riomed_seller_assignments")
      .insert({
        company_id: companyId,
        seller_id: data.seller_id,
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id ?? null,
        assigned_via: "manual",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("riomed_seller_notifications").insert({
      company_id: companyId,
      seller_id: data.seller_id,
      assignment_id: row.id,
      title: "Nuevo lead asignado",
      body: "Tienes un nuevo lead asignado manualmente.",
    });
    return { assignment: row };
  });

export const autoAssignLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      lead_id: z.string().uuid(),
      opportunity_id: z.string().uuid().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const { data: assignmentId, error } = await supabase.rpc("assign_riomed_lead", {
      _company_id: companyId,
      _lead_id: data.lead_id,
      _opportunity_id: data.opportunity_id ?? null,
    });
    if (error) throw new Error(error.message);
    return { assignmentId };
  });

export const getSellersOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await getRiomedCompanyId(supabase);
    const [sellersRes, assignmentsRes, notifRes] = await Promise.all([
      supabase.from("riomed_sellers").select("id,status").eq("company_id", companyId),
      supabase
        .from("riomed_seller_assignments")
        .select("status, seller_id, created_at")
        .eq("company_id", companyId)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase
        .from("riomed_seller_notifications")
        .select("id, read_at")
        .eq("company_id", companyId)
        .is("read_at", null),
    ]);
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
    const { data: seller } = await supabase
      .from("riomed_sellers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!seller) return { seller: null, assignments: [], notifications: [] };
    const [aRes, nRes] = await Promise.all([
      supabase
        .from("riomed_seller_assignments")
        .select("*, crm_leads(name, email, phone, source)")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("riomed_seller_notifications")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    return { seller, assignments: aRes.data ?? [], notifications: nRes.data ?? [] };
  });
