/**
 * Server functions do wizard "Monte seu Orçamento".
 *
 * Usa supabaseAdmin (service role) carregado dentro do handler para
 * permitir inserção/atualização pública mesmo sem autenticação,
 * respeitando os validators Zod a cada chamada.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeQuote } from "@/lib/pricing";

/* ----------------------------- Schemas ----------------------------- */

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

const createQuoteSchema = z.object({
  lead: leadSchema,
  company: companySchema.optional(),
  category: z.string().trim().max(60).optional().or(z.literal("")).transform((v) => v || null),
  segment: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v || null),
  modules: z.array(z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/)).max(30),
  tracking: utmSchema.optional(),
});

const updateQuoteSchema = z.object({
  id: z.string().uuid(),
  publicToken: z.string().uuid(),
  modules: z.array(z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/)).max(30).optional(),
  company: companySchema.optional(),
  category: z.string().trim().max(60).optional().or(z.literal("")).transform((v) => v || null).optional(),
  segment: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v || null).optional(),
  status: z.enum(["draft", "reviewed"]).optional(),
});

const acceptQuoteSchema = z.object({
  id: z.string().uuid(),
  publicToken: z.string().uuid(),
  userAgent: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => v || null),
  terms: z.object({
    terms: z.literal(true),
    modules: z.literal(true),
    deadlines: z.literal(true),
    integrations: z.literal(true),
    refund: z.literal(true),
  }),
});

const requestPaymentSchema = z.object({
  id: z.string().uuid(),
  publicToken: z.string().uuid(),
});

/* ----------------------------- Helpers ----------------------------- */

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function clientIp(req: Request): string | null {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

/* --------------------------- Server fns --------------------------- */

/** Cria orçamento (etapa 1 do wizard, após preencher lead). */
export const createQuote = createServerFn({ method: "POST" })
  .inputValidator((data) => createQuoteSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = await getAdmin();
    const totals = computeQuote(data.modules);

    const insertRow = {
      lead_name: data.lead.name,
      lead_whatsapp: data.lead.whatsapp,
      lead_email: data.lead.email,
      lead_role: data.lead.role,
      lead_city: data.lead.city,
      lead_state: data.lead.state,
      company_name: data.company?.companyName ?? null,
      company_tax_id: data.company?.companyTaxId ?? null,
      company_legal_name: data.company?.companyLegalName ?? null,
      category: data.category,
      segment: data.segment,
      modules: data.modules,
      subtotal_cents: totals.subtotalCents,
      discount_pct: totals.discountPct,
      discount_cents: totals.discountCents,
      setup_cents: totals.setupCents,
      total_cents: totals.totalCents,
      utm_source: data.tracking?.utm_source ?? null,
      utm_medium: data.tracking?.utm_medium ?? null,
      utm_campaign: data.tracking?.utm_campaign ?? null,
      utm_content: data.tracking?.utm_content ?? null,
      utm_term: data.tracking?.utm_term ?? null,
      origin: data.tracking?.origin ?? null,
      status: "draft",
      // quote_number gerado automaticamente pelo trigger tg_quotes_set_number
    } as never;

    const { data: row, error } = await supabase
      .from("quotes")
      .insert(insertRow)
      .select("id, quote_number, public_token")
      .single();

    if (error) throw new Error(`Não foi possível salvar o orçamento: ${error.message}`);
    return { id: row.id, quoteNumber: row.quote_number, publicToken: (row as { public_token: string }).public_token };
  });

/** Atualiza módulos/empresa/segmento do orçamento durante o wizard. */
export const updateQuote = createServerFn({ method: "POST" })
  .inputValidator((data) => updateQuoteSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = await getAdmin();
    const update: Record<string, unknown> = {};

    if (data.modules) {
      const totals = computeQuote(data.modules);
      update.modules = data.modules;
      update.subtotal_cents = totals.subtotalCents;
      update.discount_pct = totals.discountPct;
      update.discount_cents = totals.discountCents;
      update.setup_cents = totals.setupCents;
      update.total_cents = totals.totalCents;
    }
    if (data.company) {
      update.company_name = data.company.companyName ?? null;
      update.company_tax_id = data.company.companyTaxId ?? null;
      update.company_legal_name = data.company.companyLegalName ?? null;
    }
    if (data.category !== undefined) update.category = data.category;
    if (data.segment !== undefined) update.segment = data.segment;
    if (data.status) update.status = data.status;

    const { data: updated, error } = await supabase
      .from("quotes")
      .update(update as never)
      .eq("id", data.id)
      .eq("public_token", data.publicToken)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(`Não foi possível atualizar o orçamento: ${error.message}`);
    if (!updated) throw new Error("Token inválido ou orçamento não encontrado.");
    return { ok: true };
  });

/** Registra o aceite eletrônico do contrato (etapa 11). */
export const acceptQuote = createServerFn({ method: "POST" })
  .inputValidator((data) => acceptQuoteSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = await getAdmin();

    const { data: updated, error } = await supabase
      .from("quotes")
      .update({
        accepted_at: new Date().toISOString(),
        accepted_user_agent: data.userAgent,
        accepted_terms: data.terms,
        status: "accepted",
      } as never)
      .eq("id", data.id)
      .eq("public_token", data.publicToken)
      .is("accepted_at", null)
      .select("id, accepted_at")
      .maybeSingle();

    if (error) throw new Error(`Não foi possível registrar o aceite: ${error.message}`);
    if (!updated) throw new Error("Token inválido, orçamento já aceito ou inexistente.");
    return { ok: true, acceptedAt: (updated as { accepted_at: string }).accepted_at };
  });

/** Marca como "pagamento solicitado" — usado quando o lead clica em pagar. */
export const requestPayment = createServerFn({ method: "POST" })
  .inputValidator((data) => requestPaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = await getAdmin();
    const { data: updated, error } = await supabase
      .from("quotes")
      .update({ status: "payment_requested" })
      .eq("id", data.id)
      .eq("public_token", data.publicToken)
      .eq("status", "accepted")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Token inválido ou aceite ainda não registrado.");
    return { ok: true };
  });
