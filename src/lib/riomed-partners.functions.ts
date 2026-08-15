import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function tenantCompanyId(): Promise<string> {
  const sb = await admin();
  const { data, error } = await sb.from("communication_tenants")
    .select("company_id").eq("slug", "rio-med").eq("active", true).is("deleted_at", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id;
}

export const registerSupplier = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    legalName: z.string().trim().min(2).max(180), tradeName: z.string().trim().max(180).optional(), taxId: z.string().trim().max(80).optional(),
    country: z.string().trim().length(2).default("BO"), contactName: z.string().trim().min(2).max(160),
    contactEmail: z.string().trim().email().max(180), contactPhone: z.string().trim().min(7).max(40),
    website: z.string().url().optional().or(z.literal("")), categories: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
    notes: z.string().max(2000).optional(), offers: z.array(z.object({
      productName: z.string().trim().min(2).max(200), category: z.string().trim().max(100).optional(), brand: z.string().trim().max(100).optional(),
      sku: z.string().trim().max(100).optional(), unitPrice: z.number().min(0).optional(), moq: z.number().int().positive().optional(),
      leadTimeDays: z.number().int().min(0).max(3650).optional(), description: z.string().max(2000).optional(),
    })).max(50).default([]),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    const { data: supplier, error } = await sb.from("riomed_suppliers").insert({
      company_id: companyId, legal_name: data.legalName, trade_name: data.tradeName || null, tax_id: data.taxId || null,
      country: data.country.toUpperCase(), contact_name: data.contactName, contact_email: data.contactEmail.toLowerCase(), contact_phone: data.contactPhone,
      website: data.website || null, categories: data.categories, notes: data.notes ?? null, status: "pending",
    }).select("id").single();
    if (error) throw new Error(error.message);
    if (data.offers.length) {
      const rows = data.offers.map((offer) => ({
        company_id: companyId, supplier_id: supplier.id, product_name: offer.productName, category: offer.category ?? null,
        brand: offer.brand ?? null, sku: offer.sku ?? null, unit_price: offer.unitPrice ?? null, moq: offer.moq ?? null,
        lead_time_days: offer.leadTimeDays ?? null, description: offer.description ?? null, status: "pending",
      }));
      const { error: offerError } = await sb.from("riomed_supplier_offers").insert(rows);
      if (offerError) throw new Error(offerError.message);
    }
    return { ok: true, supplierId: supplier.id, status: "pending" };
  });

export const registerTechnician = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    fullName: z.string().trim().min(2).max(160), email: z.string().trim().email().max(180), phone: z.string().trim().min(7).max(40),
    document: z.string().trim().max(80).optional(), specialties: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
    serviceAreas: z.array(z.string().trim().min(1).max(120)).max(30).default([]), experienceYears: z.number().int().min(0).max(80).optional(),
    certifications: z.array(z.string().trim().min(1).max(160)).max(30).default([]), notes: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    const { data: existing } = await sb.from("riomed_technicians").select("id,status")
      .eq("company_id", companyId).eq("email", data.email.toLowerCase()).maybeSingle();
    if (existing) return { ok: true, alreadyExists: true, technicianId: existing.id, status: existing.status };
    const { data: technician, error } = await sb.from("riomed_technicians").insert({
      company_id: companyId, full_name: data.fullName, email: data.email.toLowerCase(), phone: data.phone,
      document: data.document || null, specialties: data.specialties, service_areas: data.serviceAreas,
      experience_years: data.experienceYears ?? null, certifications: data.certifications, notes: data.notes ?? null, status: "pending",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, technicianId: technician.id, status: "pending" };
  });

export const registerCandidate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    fullName: z.string().trim().min(2).max(160), email: z.string().trim().email().max(180), phone: z.string().trim().min(7).max(40),
    positionInterest: z.string().trim().min(2).max(160), city: z.string().trim().max(120).optional(),
    experienceSummary: z.string().max(4000).optional(), resumeUrl: z.string().url().optional().or(z.literal("")),
    linkedinUrl: z.string().url().optional().or(z.literal("")), expectedSalary: z.number().min(0).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    const { data: row, error } = await sb.from("riomed_candidates").insert({
      company_id: companyId, full_name: data.fullName, email: data.email.toLowerCase(), phone: data.phone,
      position_interest: data.positionInterest, city: data.city || null, experience_summary: data.experienceSummary ?? null,
      resume_url: data.resumeUrl || null, linkedin_url: data.linkedinUrl || null, expected_salary: data.expectedSalary ?? null, status: "pending",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, candidateId: row.id, status: "pending" };
  });

export const registerHospital = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    hospitalName: z.string().trim().min(2).max(180), taxId: z.string().trim().max(80).optional(),
    contactName: z.string().trim().min(2).max(160), contactEmail: z.string().trim().email().max(180), contactPhone: z.string().trim().min(7).max(40),
    city: z.string().trim().max(120).optional(), bedsCount: z.number().int().min(0).max(100000).optional(),
    segment: z.enum(["public","private","mixed","clinic","laboratory"]).optional(), notes: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    const { data: row, error } = await sb.from("riomed_hospital_accounts").insert({
      company_id: companyId, hospital_name: data.hospitalName, tax_id: data.taxId || null,
      contact_name: data.contactName, contact_email: data.contactEmail.toLowerCase(), contact_phone: data.contactPhone,
      city: data.city || null, beds_count: data.bedsCount ?? null, segment: data.segment ?? null, notes: data.notes ?? null, status: "pending",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, hospitalId: row.id, status: "pending" };
  });

export const submitHospitalRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    hospitalId: z.string().uuid().optional(), contactName: z.string().trim().min(2).max(160), contactEmail: z.string().trim().email().max(180),
    contactPhone: z.string().trim().min(7).max(40), hospitalName: z.string().trim().min(2).max(180),
    requestKind: z.enum(["purchase","rental","consignment","loan","emergency","quote"]), title: z.string().trim().min(3).max(200),
    description: z.string().max(4000).optional(), priority: z.enum(["low","normal","high","urgent","critical"]).default("normal"),
    neededBy: z.string().optional(), estimatedValue: z.number().min(0).optional(),
    items: z.array(z.object({ name: z.string().trim().min(1).max(200), qty: z.number().positive() })).max(100).default([]),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const companyId = await tenantCompanyId();
    let hospitalId = data.hospitalId ?? null;
    if (hospitalId) {
      const { data: hospital } = await sb.from("riomed_hospital_accounts").select("id")
        .eq("id", hospitalId).eq("company_id", companyId).maybeSingle();
      if (!hospital) throw new Error("Hospital não encontrado");
    } else {
      const { data: created, error: createError } = await sb.from("riomed_hospital_accounts").insert({
        company_id: companyId, hospital_name: data.hospitalName, contact_name: data.contactName,
        contact_email: data.contactEmail.toLowerCase(), contact_phone: data.contactPhone, status: "pending",
      }).select("id").single();
      if (createError) throw new Error(createError.message);
      hospitalId = created.id;
    }
    const { data: request, error } = await sb.from("riomed_hospital_requests").insert({
      company_id: companyId, hospital_id: hospitalId, request_kind: data.requestKind, title: data.title,
      description: data.description ?? null, priority: data.priority, needed_by: data.neededBy ?? null,
      estimated_value: data.estimatedValue ?? null, items: data.items, status: "pending",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, requestId: request.id, hospitalId };
  });

export const listPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const companyId = await tenantCompanyId();
    const [suppliers, offers, technicians, candidates, hospitals, requests] = await Promise.all([
      sb.from("riomed_suppliers").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_supplier_offers").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_technicians").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_candidates").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_hospital_accounts").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      sb.from("riomed_hospital_requests").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
    ]);
    for (const result of [suppliers, offers, technicians, candidates, hospitals, requests]) if (result.error) throw new Error(result.error.message);
    return { suppliers: suppliers.data ?? [], offers: offers.data ?? [], technicians: technicians.data ?? [], candidates: candidates.data ?? [], hospitals: hospitals.data ?? [], requests: requests.data ?? [] };
  });

export const updatePartnerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    table: z.enum(["riomed_suppliers","riomed_supplier_offers","riomed_technicians","riomed_candidates","riomed_hospital_accounts","riomed_hospital_requests"]),
    id: z.string().uuid(), status: z.string().trim().min(1).max(40),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const companyId = await tenantCompanyId();
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "approved" || data.status === "active") patch.approved_at = new Date().toISOString();
    const { error } = await sb.from(data.table).update(patch).eq("id", data.id).eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
