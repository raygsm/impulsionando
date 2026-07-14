/**
 * Colors — Reconciliação de vendas (Fase 2).
 * Server-only. Recebe uma linha de venda (webhook ou importação CSV) e:
 *   1. Localiza/cria contato (por email → whatsapp → cpf_hash).
 *   2. Localiza/cria afiliado (por code / external_id).
 *   3. Localiza oportunidade (por colors_checkout_id → external_sale_id → fuzzy).
 *   4. Atualiza a oportunidade com dados da venda e novo stage.
 *   5. Registra evento no histórico imutável.
 *
 * Dedup de venda: (external_platform, external_sale_id) é UNIQUE — inserts
 * conflitantes são ignorados; updates são idempotentes.
 */
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface ReconcileSaleInput {
  platform: string; // ex.: 'maisfy'
  external_sale_id: string;
  external_order_id?: string;
  colors_checkout_id?: string;
  external_status: string; // ex.: 'approved', 'pending', 'refunded'...

  // Cliente
  customer_name?: string;
  customer_email?: string;
  customer_whatsapp?: string;
  customer_cpf?: string;

  // Produto / venda
  product_slug?: string;
  product_name?: string;
  offer?: string;
  quantity?: number;
  kit_size?: number;
  unit_price_cents?: number;
  total_price_cents?: number;
  coupon?: string;

  // Afiliado
  affiliate_code?: string;
  affiliate_external_id?: string;
  affiliate_name?: string;

  // Metadata
  approved_at?: string;
  raw?: Record<string, unknown>;
  source: "webhook" | "import" | "manual";
}

export interface ReconcileResult {
  opportunity_id: string;
  contact_id: string | null;
  affiliate_id: string | null;
  created_opportunity: boolean;
  matched_by: "colors_checkout_id" | "external_sale_id" | "email" | "whatsapp" | "cpf_hash" | "new";
  new_stage: string;
}

const STATUS_TO_STAGE: Record<string, string> = {
  approved: "compra_aprovada",
  paid: "compra_aprovada",
  pending: "pagamento_pendente",
  in_process: "pagamento_pendente",
  pix_pending: "pix_gerado",
  boleto_pending: "boleto_gerado",
  rejected: "compra_recusada",
  cancelled: "compra_recusada",
  refunded: "reembolso_realizado",
  chargeback: "chargeback",
  shipped: "pedido_despachado",
  delivered: "pedido_entregue",
};

function normEmail(v?: string) {
  return v ? v.trim().toLowerCase() : null;
}
function normPhone(v?: string) {
  const d = v ? v.replace(/\D/g, "") : "";
  return d.length >= 8 ? d : null;
}
function hashCpf(v?: string) {
  if (!v) return null;
  const clean = v.replace(/\D/g, "");
  if (clean.length < 11) return null;
  return createHash("sha256").update(`colors:${clean}`).digest("hex");
}

export async function reconcileColorsSale(
  sb: SupabaseClient<Database>,
  input: ReconcileSaleInput,
): Promise<ReconcileResult> {
  const emailN = normEmail(input.customer_email);
  const phoneN = normPhone(input.customer_whatsapp);
  const cpfHash = hashCpf(input.customer_cpf);
  const newStage = STATUS_TO_STAGE[input.external_status.toLowerCase()] ?? "atendimento_humano";

  // 1) contato
  let contactId: string | null = null;
  if (emailN) {
    const { data } = await sb.from("colors_contacts").select("id").eq("email_normalized", emailN).maybeSingle();
    contactId = data?.id ?? null;
  }
  if (!contactId && phoneN) {
    const { data } = await sb.from("colors_contacts").select("id").eq("whatsapp_normalized", phoneN).maybeSingle();
    contactId = data?.id ?? null;
  }
  if (!contactId && cpfHash) {
    const { data } = await sb.from("colors_contacts").select("id").eq("cpf_hash", cpfHash).maybeSingle();
    contactId = data?.id ?? null;
  }
  if (!contactId && (input.customer_name || emailN || phoneN)) {
    const { data, error } = await sb
      .from("colors_contacts")
      .insert({
        full_name: input.customer_name ?? "(sem nome)",
        email: input.customer_email ?? null,
        whatsapp: input.customer_whatsapp ?? "",
        cpf_hash: cpfHash,
        consent_lgpd: false,
        consent_marketing: false,
      })
      .select("id")
      .single();
    if (!error && data) contactId = data.id;
  }

  // 2) afiliado
  let affiliateId: string | null = null;
  if (input.affiliate_external_id) {
    const { data } = await sb
      .from("colors_affiliates")
      .select("id")
      .eq("external_platform", input.platform)
      .eq("external_id", input.affiliate_external_id)
      .maybeSingle();
    affiliateId = data?.id ?? null;
  }
  if (!affiliateId && input.affiliate_code) {
    const { data } = await sb.from("colors_affiliates").select("id").eq("code", input.affiliate_code).maybeSingle();
    affiliateId = data?.id ?? null;
  }
  if (!affiliateId && (input.affiliate_code || input.affiliate_external_id)) {
    const code = input.affiliate_code ?? `ext_${input.platform}_${input.affiliate_external_id}`;
    const { data, error } = await sb
      .from("colors_affiliates")
      .insert({
        code,
        full_name: input.affiliate_name ?? code,
        external_platform: input.platform,
        external_id: input.affiliate_external_id ?? null,
        status: "importado",
      })
      .select("id")
      .single();
    if (!error && data) affiliateId = data.id;
  }

  // 3) oportunidade
  let oppId: string | null = null;
  let matched: ReconcileResult["matched_by"] = "new";

  if (input.colors_checkout_id) {
    const { data } = await sb
      .from("colors_opportunities")
      .select("id")
      .eq("colors_checkout_id", input.colors_checkout_id)
      .maybeSingle();
    if (data) { oppId = data.id; matched = "colors_checkout_id"; }
  }
  if (!oppId) {
    const { data } = await sb
      .from("colors_opportunities")
      .select("id")
      .eq("external_platform", input.platform)
      .eq("external_sale_id", input.external_sale_id)
      .maybeSingle();
    if (data) { oppId = data.id; matched = "external_sale_id"; }
  }
  if (!oppId && contactId) {
    // Última oportunidade não reconciliada do mesmo contato
    const { data } = await sb
      .from("colors_opportunities")
      .select("id")
      .eq("contact_id", contactId)
      .is("external_sale_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      oppId = data.id;
      matched = emailN ? "email" : phoneN ? "whatsapp" : "cpf_hash";
    }
  }

  const oppPatch = {
    contact_id: contactId,
    affiliate_id: affiliateId,
    product_slug: input.product_slug,
    product_name: input.product_name,
    kit_size: input.kit_size,
    quantity: input.quantity,
    unit_price_cents: input.unit_price_cents,
    total_price_cents: input.total_price_cents,
    coupon: input.coupon,
    stage: newStage,
    external_platform: input.platform,
    external_sale_id: input.external_sale_id,
    external_order_id: input.external_order_id ?? null,
    external_status: input.external_status,
    reconciled_at: new Date().toISOString(),
  };

  let created = false;
  if (oppId) {
    await sb.from("colors_opportunities").update(oppPatch).eq("id", oppId);
  } else {
    const insertRow = {
      colors_checkout_id: input.colors_checkout_id ?? `rec_${input.platform}_${input.external_sale_id}`,
      contact_id: contactId,
      affiliate_id: affiliateId,
      product_slug: input.product_slug ?? "desconhecido",
      product_name: input.product_name ?? "(importado)",
      kit_size: input.kit_size ?? 1,
      quantity: input.quantity ?? 1,
      unit_price_cents: input.unit_price_cents,
      total_price_cents: input.total_price_cents,
      coupon: input.coupon,
      stage: newStage,
      external_platform: input.platform,
      external_sale_id: input.external_sale_id,
      external_order_id: input.external_order_id ?? null,
      external_status: input.external_status,
      reconciled_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from("colors_opportunities")
      .insert(insertRow)
      .select("id")
      .single();
    if (error) throw new Error(`colors_opportunities insert failed: ${error.message}`);
    oppId = data.id;
    created = true;
  }

  // 4) evento de reconciliação (além do stage_change automático do trigger)
  await sb.from("colors_opportunity_events").insert({
    opportunity_id: oppId!,
    event_type: input.source, // 'webhook' | 'import' | 'manual'
    to_stage: newStage,
    payload: {
      matched_by: matched,
      external_sale_id: input.external_sale_id,
      external_order_id: input.external_order_id ?? null,
      external_status: input.external_status,
      raw: (input.raw ?? null) as unknown as never,
    } as unknown as never,
    actor: input.source,
  });

  return {
    opportunity_id: oppId!,
    contact_id: contactId,
    affiliate_id: affiliateId,
    created_opportunity: created,
    matched_by: matched,
    new_stage: newStage,
  };
}
