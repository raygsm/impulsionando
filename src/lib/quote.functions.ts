import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATALOG_MODULES } from "@/data/moduleCatalog";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().min(8).max(40),
  email: z.string().trim().email().max(200).optional().or(z.literal("")).transform((v) => v || null),
  role: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v || null),
  city: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v || null),
  state: z.string().trim().max(2).optional().or(z.literal("")).transform((v) => v || null),
});
const companySchema = z.object({
  companyName: z.string().trim().max(200).optional().or(z.literal("")).transform((v) => v || null),
  companyTaxId: z.string().trim().max(20).optional().or(z.literal("")).transform((v) => v || null),
  companyLegalName: z.string().trim().max(200).optional().or(z.literal("")).transform((v) => v || null),
});
const utmSchema = z.object({
  utm_source: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => v || null),
  utm_medium: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => v || null),
  utm_campaign: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => v || null),
  utm_content: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => v || null),
  utm_term: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => v || null),
  origin: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => v || null),
}).partial();
const moduleListSchema = z.array(z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/)).max(30);
const createQuoteSchema = z.object({ lead: leadSchema, company: companySchema.optional(), category: z.string().trim().max(60).optional().or(z.literal("")).transform((v) => v || null), segment: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v || null), modules: moduleListSchema, tracking: utmSchema.optional() });
const updateQuoteSchema = z.object({ id: z.string().uuid(), publicToken: z.string().uuid(), modules: moduleListSchema.optional(), company: companySchema.optional(), category: z.string().trim().max(60).optional().or(z.literal("")).transform((v) => v || null).optional(), segment: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v || null).optional(), status: z.enum(["draft", "reviewed"]).optional() });
const acceptQuoteSchema = z.object({ id: z.string().uuid(), publicToken: z.string().uuid(), userAgent: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => v || null), terms: z.object({ terms: z.literal(true), modules: z.literal(true), deadlines: z.literal(true), integrations: z.literal(true), refund: z.literal(true) }) });
const requestPaymentSchema = z.object({ id: z.string().uuid(), publicToken: z.string().uuid() });

async function getAdmin() { const { supabaseAdmin } = await import("@/integrations/supabase/client.server"); return supabaseAdmin; }

function catalogMotherSlugs(catalogSlugs: string[]) {
  const bySlug = new Map(CATALOG_MODULES.map((m) => [m.slug, m]));
  const unknown = catalogSlugs.filter((slug) => !bySlug.has(slug));
  if (unknown.length) throw new Error(`Módulos desconhecidos: ${unknown.join(", ")}`);
  return Array.from(new Set(catalogSlugs.map((slug) => bySlug.get(slug)!.motherSlug)));
}

async function assertModulesAvailable(catalogSlugs: string[]): Promise<void> {
  if (!catalogSlugs.length) return;
  const motherSlugs = catalogMotherSlugs(catalogSlugs);
  const supabase = await getAdmin();
  const { data, error } = await supabase.from("modules").select("slug,status_comercial,is_active,show_in_plans,readiness_status").in("slug", motherSlugs);
  if (error) throw new Error(`Falha ao validar disponibilidade comercial: ${error.message}`);
  const available = new Set((data ?? []).filter((r: any) => r.is_active && r.show_in_plans && r.status_comercial === "disponivel_contratacao" && ["certificado","publicado"].includes(String(r.readiness_status))).map((r: any) => String(r.slug)));
  const unavailableMother = motherSlugs.filter((slug) => !available.has(slug));
  if (unavailableMother.length) throw new Error(`Há módulos ainda não certificados para contratação: ${unavailableMother.join(", ")}.`);
}

type CanonicalPricing = { plan_code: string | null; plan_name: string | null; recurring_cents: number; setup_cents: number; included_module_count: number; legal_text: string | null };
async function canonicalPricing(catalogSlugs: string[]): Promise<CanonicalPricing> {
  if (!catalogSlugs.length) return { plan_code: null, plan_name: null, recurring_cents: 0, setup_cents: 0, included_module_count: 0, legal_text: null };
  const count = catalogMotherSlugs(catalogSlugs).length;
  const code = count <= 3 ? "ESSENCIAL" : count <= 6 ? "PRO" : "ENTERPRISE";
  const supabase = await getAdmin();
  const { data: plan, error } = await supabase.from("billing_plans").select("code,name,recurring_amount,setup_fee,included_module_count,legal_text,is_active,status_comercial,route_to_quote").eq("code", code).eq("is_active", true).single();
  if (error || !plan) throw new Error(`Plano canônico ${code} indisponível.`);
  if (plan.status_comercial !== "disponivel_contratacao" || !plan.route_to_quote) throw new Error(`Plano ${plan.name} não está liberado para proposta.`);
  return { plan_code: plan.code, plan_name: plan.name, recurring_cents: Math.round(Number(plan.recurring_amount) * 100), setup_cents: Math.round(Number(plan.setup_fee) * 100), included_module_count: Number(plan.included_module_count ?? 0), legal_text: plan.legal_text ?? null };
}

export const createQuote = createServerFn({ method: "POST" }).inputValidator((data) => createQuoteSchema.parse(data)).handler(async ({ data }) => {
  await assertModulesAvailable(data.modules);
  const supabase = await getAdmin();
  const pricing = await canonicalPricing(data.modules);
  const insertRow = {
    lead_name: data.lead.name, lead_whatsapp: data.lead.whatsapp, lead_email: data.lead.email, lead_role: data.lead.role, lead_city: data.lead.city, lead_state: data.lead.state,
    company_name: data.company?.companyName ?? null, company_tax_id: data.company?.companyTaxId ?? null, company_legal_name: data.company?.companyLegalName ?? null,
    category: data.category, segment: data.segment, modules: data.modules, plan_code: pricing.plan_code, plan_name: pricing.plan_name,
    subtotal_cents: pricing.recurring_cents, discount_pct: 0, discount_cents: 0, setup_cents: pricing.setup_cents, total_cents: pricing.recurring_cents,
    utm_source: data.tracking?.utm_source ?? null, utm_medium: data.tracking?.utm_medium ?? null, utm_campaign: data.tracking?.utm_campaign ?? null, utm_content: data.tracking?.utm_content ?? null, utm_term: data.tracking?.utm_term ?? null, origin: data.tracking?.origin ?? null,
    status: "draft", metadata: { pricing_source: "billing_plans", direct_checkout: false, route: "quote", included_module_count: pricing.included_module_count, legal_text: pricing.legal_text },
  } as never;
  const { data: row, error } = await supabase.from("quotes").insert(insertRow).select("id,quote_number,public_token,plan_code,plan_name,total_cents,setup_cents").single();
  if (error) throw new Error(`Não foi possível salvar o orçamento: ${error.message}`);
  return { id: row.id, quoteNumber: row.quote_number, publicToken: (row as any).public_token, planCode: (row as any).plan_code, planName: (row as any).plan_name, recurringCents: Number((row as any).total_cents ?? 0), setupCents: Number((row as any).setup_cents ?? 0) };
});

export const updateQuote = createServerFn({ method: "POST" }).inputValidator((data) => updateQuoteSchema.parse(data)).handler(async ({ data }) => {
  const supabase = await getAdmin();
  const update: Record<string, unknown> = {};
  if (data.modules) {
    await assertModulesAvailable(data.modules);
    const pricing = await canonicalPricing(data.modules);
    Object.assign(update, { modules: data.modules, plan_code: pricing.plan_code, plan_name: pricing.plan_name, subtotal_cents: pricing.recurring_cents, discount_pct: 0, discount_cents: 0, setup_cents: pricing.setup_cents, total_cents: pricing.recurring_cents, metadata: { pricing_source: "billing_plans", direct_checkout: false, route: "quote", included_module_count: pricing.included_module_count, legal_text: pricing.legal_text } });
  }
  if (data.company) Object.assign(update, { company_name: data.company.companyName ?? null, company_tax_id: data.company.companyTaxId ?? null, company_legal_name: data.company.companyLegalName ?? null });
  if (data.category !== undefined) update.category = data.category;
  if (data.segment !== undefined) update.segment = data.segment;
  if (data.status) update.status = data.status;
  const { data: updated, error } = await supabase.from("quotes").update(update as never).eq("id", data.id).eq("public_token", data.publicToken).select("id,plan_code,plan_name,total_cents,setup_cents").maybeSingle();
  if (error) throw new Error(`Não foi possível atualizar o orçamento: ${error.message}`);
  if (!updated) throw new Error("Token inválido ou orçamento não encontrado.");
  return { ok: true, planCode: (updated as any).plan_code, planName: (updated as any).plan_name, recurringCents: Number((updated as any).total_cents ?? 0), setupCents: Number((updated as any).setup_cents ?? 0) };
});

export const acceptQuote = createServerFn({ method: "POST" }).inputValidator((data) => acceptQuoteSchema.parse(data)).handler(async ({ data }) => {
  const supabase = await getAdmin();
  const { data: current } = await supabase.from("quotes").select("id,modules,plan_code,total_cents").eq("id", data.id).eq("public_token", data.publicToken).maybeSingle();
  if (!current) throw new Error("Token inválido ou orçamento inexistente.");
  await assertModulesAvailable((current as any).modules ?? []);
  if (!(current as any).plan_code || Number((current as any).total_cents ?? 0) <= 0) throw new Error("Selecione módulos certificados para gerar uma proposta válida.");
  const { data: updated, error } = await supabase.from("quotes").update({ accepted_at: new Date().toISOString(), accepted_user_agent: data.userAgent, accepted_terms: data.terms, status: "accepted" } as never).eq("id", data.id).eq("public_token", data.publicToken).is("accepted_at", null).select("id,accepted_at").maybeSingle();
  if (error) throw new Error(`Não foi possível registrar o aceite: ${error.message}`);
  if (!updated) throw new Error("Orçamento já aceito ou inexistente.");
  return { ok: true, acceptedAt: (updated as any).accepted_at };
});

export const requestPayment = createServerFn({ method: "POST" }).inputValidator((data) => requestPaymentSchema.parse(data)).handler(async ({ data }) => {
  const supabase = await getAdmin();
  const { data: updated, error } = await supabase.from("quotes").update({ status: "payment_requested", payment_requested_at: new Date().toISOString(), metadata: { next_step: "commercial_contact", direct_checkout: false, pricing_source: "billing_plans" } } as never).eq("id", data.id).eq("public_token", data.publicToken).eq("status", "accepted").select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!updated) throw new Error("Token inválido ou aceite ainda não registrado.");
  return { ok: true, directCheckout: false, nextStep: "commercial_contact" as const };
});
