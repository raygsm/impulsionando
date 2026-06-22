import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function pub() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function tenantCompanyId(subdomain = "riomed"): Promise<string> {
  const { data } = await pub().from("core_tenant_identity").select("company_id").eq("subdomain", subdomain).maybeSingle();
  if (!data?.company_id) throw new Error("Tenant não encontrado");
  return data.company_id as string;
}

// =============== Cadastros públicos ===============
export const registerSupplier = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    legalName: z.string().min(2), tradeName: z.string().optional(), taxId: z.string().optional(),
    country: z.string().default("BO"),
    contactName: z.string().min(2), contactEmail: z.string().email(), contactPhone: z.string().min(7),
    website: z.string().url().optional().or(z.literal("")),
    categories: z.array(z.string()).default([]), notes: z.string().max(2000).optional(),
    offers: z.array(z.object({
      productName: z.string().min(2), category: z.string().optional(), brand: z.string().optional(),
      sku: z.string().optional(), unitPrice: z.number().optional(), moq: z.number().int().optional(),
      leadTimeDays: z.number().int().optional(), description: z.string().optional(),
    })).default([]),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    const { data: sup, error } = await (sb.from("riomed_suppliers") as any).insert({
      company_id: companyId, legal_name: data.legalName, trade_name: data.tradeName ?? null,
      tax_id: data.taxId ?? null, country: data.country,
      contact_name: data.contactName, contact_email: data.contactEmail, contact_phone: data.contactPhone,
      website: data.website || null, categories: data.categories, notes: data.notes ?? null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    if (data.offers.length && sup) {
      const rows = data.offers.map((o) => ({
        company_id: companyId, supplier_id: sup.id,
        product_name: o.productName, category: o.category ?? null, brand: o.brand ?? null,
        sku: o.sku ?? null, unit_price: o.unitPrice ?? null,
        moq: o.moq ?? null, lead_time_days: o.leadTimeDays ?? null, description: o.description ?? null,
      }));
      await (sb.from("riomed_supplier_offers") as any).insert(rows);
    }
    return { ok: true, supplierId: sup?.id };
  });

export const registerTechnician = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    fullName: z.string().min(2), email: z.string().email(), phone: z.string().min(7),
    document: z.string().optional(),
    specialties: z.array(z.string()).default([]), serviceAreas: z.array(z.string()).default([]),
    experienceYears: z.number().int().optional(), certifications: z.array(z.string()).default([]),
    notes: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    const { error } = await (sb.from("riomed_technicians") as any).insert({
      company_id: companyId, full_name: data.fullName, email: data.email, phone: data.phone,
      document: data.document ?? null, specialties: data.specialties, service_areas: data.serviceAreas,
      experience_years: data.experienceYears ?? null, certifications: data.certifications,
      notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const registerCandidate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    fullName: z.string().min(2), email: z.string().email(), phone: z.string().min(7),
    positionInterest: z.string().min(2), city: z.string().optional(),
    experienceSummary: z.string().max(4000).optional(),
    resumeUrl: z.string().url().optional().or(z.literal("")),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    expectedSalary: z.number().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    const { error } = await (sb.from("riomed_candidates") as any).insert({
      company_id: companyId, full_name: data.fullName, email: data.email, phone: data.phone,
      position_interest: data.positionInterest, city: data.city ?? null,
      experience_summary: data.experienceSummary ?? null,
      resume_url: data.resumeUrl || null, linkedin_url: data.linkedinUrl || null,
      expected_salary: data.expectedSalary ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const registerHospital = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    hospitalName: z.string().min(2), taxId: z.string().optional(),
    contactName: z.string().min(2), contactEmail: z.string().email(), contactPhone: z.string().min(7),
    city: z.string().optional(), bedsCount: z.number().int().optional(),
    segment: z.enum(["public","private","mixed","clinic","laboratory"]).optional(),
    notes: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    const { data: row, error } = await (sb.from("riomed_hospital_accounts") as any).insert({
      company_id: companyId, hospital_name: data.hospitalName, tax_id: data.taxId ?? null,
      contact_name: data.contactName, contact_email: data.contactEmail, contact_phone: data.contactPhone,
      city: data.city ?? null, beds_count: data.bedsCount ?? null,
      segment: data.segment ?? null, notes: data.notes ?? null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, hospitalId: row?.id };
  });

export const submitHospitalRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    hospitalId: z.string().uuid().optional(),
    contactName: z.string().min(2), contactEmail: z.string().email(), contactPhone: z.string().min(7),
    hospitalName: z.string().min(2),
    requestKind: z.enum(["purchase","rental","consignment","loan","emergency","quote"]),
    title: z.string().min(3), description: z.string().max(4000).optional(),
    priority: z.enum(["low","normal","high","urgent","critical"]).default("normal"),
    neededBy: z.string().optional(),
    estimatedValue: z.number().optional(),
    items: z.array(z.object({ name: z.string(), qty: z.number().positive() })).default([]),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    let hospitalId = data.hospitalId ?? null;
    if (!hospitalId) {
      const { data: created } = await (sb.from("riomed_hospital_accounts") as any).insert({
        company_id: companyId, hospital_name: data.hospitalName,
        contact_name: data.contactName, contact_email: data.contactEmail, contact_phone: data.contactPhone,
      }).select("id").single();
      hospitalId = created?.id ?? null;
    }
    const { error } = await (sb.from("riomed_hospital_requests") as any).insert({
      company_id: companyId, hospital_id: hospitalId, request_kind: data.requestKind,
      title: data.title, description: data.description ?? null, priority: data.priority,
      needed_by: data.neededBy ?? null, estimated_value: data.estimatedValue ?? null,
      items: data.items,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Admin: listagem + aprovação ===============
export const listPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const [suppliers, offers, technicians, candidates, hospitals, requests] = await Promise.all([
      sb.from("riomed_suppliers").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_supplier_offers").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_technicians").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_candidates").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_hospital_accounts").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_hospital_requests").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    return {
      suppliers: suppliers.data ?? [], offers: offers.data ?? [],
      technicians: technicians.data ?? [], candidates: candidates.data ?? [],
      hospitals: hospitals.data ?? [], requests: requests.data ?? [],
    };
  });

export const updatePartnerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    table: z.enum(["riomed_suppliers","riomed_supplier_offers","riomed_technicians","riomed_candidates","riomed_hospital_accounts","riomed_hospital_requests"]),
    id: z.string().uuid(),
    status: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const patch: any = { status: data.status };
    if (data.status === "approved" || data.status === "active") patch.approved_at = new Date().toISOString();
    const { error } = await sb.from(data.table).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
