/**
 * Colors — Fase 1: pré-checkout nativo.
 * Grava contact + opportunity no CRM ANTES do redirect para a Maisfy.
 * Retorna o `colors_checkout_id` que a página anexa ao link externo como
 * referência externa (external_id / sub_id / metadata — o que a Maisfy aceitar).
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";
import type { Database } from "@/integrations/supabase/types";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal("").transform(() => undefined)),
  whatsapp: z.string().trim().min(8).max(30),
  cpf: z.string().trim().max(20).optional(),
  cep: z.string().trim().max(10).optional(),
  addressLine1: z.string().trim().max(200).optional(),
  addressNumber: z.string().trim().max(20).optional(),
  addressComplement: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(2).optional(),
  consentLgpd: z.boolean(),
  consentMarketing: z.boolean().optional().default(false),
  productSlug: z.string().trim().min(1).max(80),
  productName: z.string().trim().min(1).max(160),
  kitSize: z.number().int().min(1).max(12).default(1),
  quantity: z.number().int().min(1).max(50).default(1),
  unitPriceCents: z.number().int().nonnegative().optional(),
  totalPriceCents: z.number().int().nonnegative().optional(),
  coupon: z.string().trim().max(40).optional(),
  offerUrl: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(160).optional(),
  utmContent: z.string().trim().max(160).optional(),
  utmTerm: z.string().trim().max(160).optional(),
  origin: z.string().trim().max(120).optional(),
  affiliateCode: z.string().trim().max(60).optional(),
  device: z.string().trim().max(60).optional(),
  browser: z.string().trim().max(120).optional(),
  sessionId: z.string().trim().max(80).optional(),
});

export type StartColorsCheckoutInput = z.input<typeof schema>;

function normEmail(v?: string) {
  return v ? v.trim().toLowerCase() : null;
}
function normPhone(v?: string) {
  return v ? v.replace(/\D/g, "") : null;
}
function hashCpf(v?: string) {
  if (!v) return null;
  const clean = v.replace(/\D/g, "");
  if (clean.length < 11) return null;
  return createHash("sha256").update(`colors:${clean}`).digest("hex");
}

export const startColorsCheckout = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => schema.parse(raw))
  .handler(async ({ data }) => {
    // service_role — pré-checkout é público (visitante anônimo).
    // Precisamos gravar em tabelas com RLS admin-only.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as unknown as ReturnType<typeof createClient<Database>>;

    const emailN = normEmail(data.email);
    const phoneN = normPhone(data.whatsapp);
    const cpfHash = hashCpf(data.cpf);

    // 1) upsert contact — dedup por email quando existir; senão por whatsapp
    let contactId: string | null = null;
    if (emailN) {
      const { data: existing } = await sb
        .from("colors_contacts")
        .select("id")
        .eq("email_normalized", emailN)
        .maybeSingle();
      contactId = existing?.id ?? null;
    }
    if (!contactId && phoneN) {
      const { data: existing } = await sb
        .from("colors_contacts")
        .select("id")
        .eq("whatsapp_normalized", phoneN)
        .maybeSingle();
      contactId = existing?.id ?? null;
    }

    const contactPayload = {
      full_name: data.fullName,
      email: data.email ?? null,
      whatsapp: data.whatsapp,
      cpf_hash: cpfHash,
      cep: data.cep ?? null,
      address_line1: data.addressLine1 ?? null,
      address_number: data.addressNumber ?? null,
      address_complement: data.addressComplement ?? null,
      neighborhood: data.neighborhood ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      consent_lgpd: data.consentLgpd,
      consent_marketing: data.consentMarketing ?? false,
      last_seen_at: new Date().toISOString(),
    };

    if (contactId) {
      await sb.from("colors_contacts").update(contactPayload).eq("id", contactId);
    } else {
      const { data: inserted, error } = await sb
        .from("colors_contacts")
        .insert(contactPayload)
        .select("id")
        .single();
      if (error) throw new Error(`colors_contacts insert failed: ${error.message}`);
      contactId = inserted.id;
    }

    // 2) resolve affiliate (opcional, best-effort)
    let affiliateId: string | null = null;
    if (data.affiliateCode) {
      const { data: aff } = await sb
        .from("colors_affiliates")
        .select("id")
        .eq("code", data.affiliateCode)
        .maybeSingle();
      affiliateId = aff?.id ?? null;
    }

    // 3) cria oportunidade "checkout_iniciado" com colors_checkout_id único
    const colorsCheckoutId = `col_${Date.now().toString(36)}_${randomUUID().slice(0, 8)}`;
    const { data: opp, error: oppErr } = await sb
      .from("colors_opportunities")
      .insert({
        colors_checkout_id: colorsCheckoutId,
        contact_id: contactId,
        affiliate_id: affiliateId,
        product_slug: data.productSlug,
        product_name: data.productName,
        kit_size: data.kitSize,
        quantity: data.quantity,
        unit_price_cents: data.unitPriceCents ?? null,
        total_price_cents: data.totalPriceCents ?? null,
        coupon: data.coupon ?? null,
        offer_url: data.offerUrl ?? null,
        utm_source: data.utmSource ?? null,
        utm_medium: data.utmMedium ?? null,
        utm_campaign: data.utmCampaign ?? null,
        utm_content: data.utmContent ?? null,
        utm_term: data.utmTerm ?? null,
        origin: data.origin ?? null,
        device: data.device ?? null,
        browser: data.browser ?? null,
        session_id: data.sessionId ?? null,
        stage: "checkout_iniciado",
        external_platform: "maisfy",
      })
      .select("id, colors_checkout_id")
      .single();
    if (oppErr) throw new Error(`colors_opportunities insert failed: ${oppErr.message}`);

    return {
      opportunityId: opp.id,
      colorsCheckoutId: opp.colors_checkout_id,
      contactId,
      affiliateId,
    };
  });
