import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PLATFORM_FEE_PCT, gatewayDaysFor } from "./affiliates.constants";

// ---------- helpers ----------

function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) added++;
  }
  return d;
}

function computeReleaseAt(soldAt: Date, gatewayDays: number, internalBusinessDays = 3): string {
  const afterGateway = new Date(soldAt);
  afterGateway.setUTCDate(afterGateway.getUTCDate() + gatewayDays);
  return addBusinessDays(afterGateway, internalBusinessDays).toISOString();
}

type Numeric = number | null | undefined;
const n = (v: Numeric) => (v == null ? 0 : Number(v));

// ---------- registerAffiliateSale ----------

const RegisterSaleInput = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  offer_id: z.string().uuid().optional().nullable(),
  affiliate_id: z.string().uuid().optional().nullable(),
  link_id: z.string().uuid().optional().nullable(),
  gross_amount: z.number().min(0),
  gateway_fee: z.number().min(0).default(0),
  payment_method: z.string().max(60).optional().nullable(),
  customer_name: z.string().max(200).optional().nullable(),
  customer_email: z.string().email().max(200).optional().nullable(),
  customer_doc: z.string().max(40).optional().nullable(),
  campaign: z.string().max(120).optional().nullable(),
  gateway_release_days: z.number().int().min(0).max(180).optional(),
  platform_pct: z.number().min(0).max(100).default(PLATFORM_FEE_PCT),
  status: z.enum([
    "venda_registrada", "pagto_pendente", "aprovado",
    "aguardando_gateway", "aguardando_prazo_interno", "disponivel",
  ]).default("aprovado"),
  sold_at: z.string().datetime().optional(),
  gateway_provider: z.string().max(60).optional().nullable(),
  external_id: z.string().max(200).optional().nullable(),
  installment_interest: z.number().min(0).default(0),
  interest_paid_by: z.enum(["customer", "producer"]).default("customer"),
  coupon_id: z.string().uuid().optional().nullable(),
  parent_sale_id: z.string().uuid().optional().nullable(),
  kind: z.enum(["main", "bump", "upsell", "cross"]).default("main"),
});

export const registerAffiliateSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RegisterSaleInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const soldAtDate = data.sold_at ? new Date(data.sold_at) : new Date();
    const soldAt = soldAtDate.toISOString();
    const interestProducer = data.interest_paid_by === "producer" ? data.installment_interest : 0;
    const net = Math.max(0, data.gross_amount - data.gateway_fee - interestProducer);
    const gatewayDays = data.gateway_release_days ?? gatewayDaysFor(data.payment_method);

    // 1) Load product (default commission, producer)
    const { data: product, error: pErr } = await supabase
      .from("aff_products")
      .select("id, company_id, default_commission_pct, producer_user_id")
      .eq("id", data.product_id).single();
    if (pErr || !product) throw new Error("Produto não encontrado");

    // 2) Offer (optional)
    let offerCommissionPct: number | null = null;
    if (data.offer_id) {
      const { data: offer } = await supabase
        .from("aff_offers").select("commission_pct").eq("id", data.offer_id).single();
      offerCommissionPct = offer?.commission_pct ?? null;
    }

    // 3) Affiliate (optional) — get manager + custom commission
    let affiliateManagerId: string | null = null;
    let affiliateCustomPct: number | null = null;
    if (data.affiliate_id) {
      const { data: aff } = await supabase
        .from("aff_affiliates").select("manager_id").eq("id", data.affiliate_id).single();
      affiliateManagerId = aff?.manager_id ?? null;

      const { data: ap } = await supabase
        .from("aff_affiliate_products")
        .select("custom_commission_pct")
        .eq("affiliate_id", data.affiliate_id)
        .eq("product_id", data.product_id)
        .maybeSingle();
      affiliateCustomPct = ap?.custom_commission_pct ?? null;
    }

    // 4) Coproducers active for product/offer
    const { data: copros } = await supabase
      .from("aff_coproducers")
      .select("id, user_id, participation_pct, fixed_amount, applies_to_affiliate_sales, scope, offer_id")
      .eq("product_id", data.product_id)
      .eq("status", "aprovado");

    const releaseAt = computeReleaseAt(soldAtDate, gatewayDays, 3);
    const targetCommissionStatus =
      data.status === "aprovado" || data.status === "aguardando_gateway"
        ? "aguardando_gateway"
        : data.status === "aguardando_prazo_interno"
        ? "aguardando_prazo_interno"
        : data.status === "disponivel"
        ? "disponivel"
        : "pagto_pendente";

    // 5) Insert sale
    const { data: sale, error: sErr } = await supabase
      .from("aff_sales").insert({
        company_id: data.company_id,
        product_id: data.product_id,
        offer_id: data.offer_id ?? null,
        affiliate_id: data.affiliate_id ?? null,
        manager_id: affiliateManagerId,
        link_id: data.link_id ?? null,
        gross_amount: data.gross_amount,
        gateway_fee: data.gateway_fee,
        net_amount: net,
        payment_method: data.payment_method ?? null,
        customer_name: data.customer_name ?? null,
        customer_email: data.customer_email ?? null,
        customer_doc: data.customer_doc ?? null,
        campaign: data.campaign ?? null,
        gateway_provider: data.gateway_provider ?? null,
        external_id: data.external_id ?? null,
        gateway_release_at: new Date(soldAtDate.getTime() + gatewayDays * 86400000).toISOString(),
        internal_release_at: releaseAt,
        available_at: data.status === "disponivel" ? releaseAt : null,
        approved_at: data.status === "aprovado" || data.status === "aguardando_gateway" ? soldAt : null,
        sold_at: soldAt,
        status: data.status,
        kind: data.kind,
        coupon_id: data.coupon_id ?? null,
        parent_sale_id: data.parent_sale_id ?? null,
        installment_interest: data.installment_interest,
        interest_paid_by: data.interest_paid_by,
      }).select("id").single();
    if (sErr || !sale) throw new Error(`Falha ao registrar venda: ${sErr?.message}`);

    // 6) Build commission lines
    type Line = {
      recipient_kind: "produtor" | "coprodutor" | "afiliado" | "gerente" | "plataforma";
      amount: number; pct: number | null;
      recipient_user_id?: string | null; affiliate_id?: string | null;
      coproducer_id?: string | null; manager_id?: string | null;
    };
    const lines: Line[] = [];

    // platform
    const platformAmount = +(net * (data.platform_pct / 100)).toFixed(2);
    if (platformAmount > 0) lines.push({ recipient_kind: "plataforma", amount: platformAmount, pct: data.platform_pct });

    // affiliate
    let affiliateAmount = 0;
    if (data.affiliate_id) {
      const pct = affiliateCustomPct ?? offerCommissionPct ?? product.default_commission_pct ?? 0;
      affiliateAmount = +(net * (n(pct) / 100)).toFixed(2);
      if (affiliateAmount > 0) lines.push({
        recipient_kind: "afiliado", amount: affiliateAmount, pct: n(pct),
        affiliate_id: data.affiliate_id,
      });
    }

    // manager
    let managerAmount = 0;
    if (affiliateManagerId && affiliateAmount > 0) {
      const { data: mgr } = await supabase
        .from("aff_managers").select("commission_pct, commission_fixed, user_id").eq("id", affiliateManagerId).single();
      const mPct = n(mgr?.commission_pct);
      managerAmount = +(affiliateAmount * (mPct / 100) + n(mgr?.commission_fixed)).toFixed(2);
      if (managerAmount > 0) lines.push({
        recipient_kind: "gerente", amount: managerAmount, pct: mPct,
        manager_id: affiliateManagerId, recipient_user_id: mgr?.user_id ?? null,
      });
    }

    // coproducers
    let coproTotal = 0;
    for (const c of copros ?? []) {
      if (data.affiliate_id && !c.applies_to_affiliate_sales) continue;
      if (c.offer_id && data.offer_id && c.offer_id !== data.offer_id) continue;
      const pct = n(c.participation_pct);
      const fixed = n(c.fixed_amount);
      const amount = +(net * (pct / 100) + fixed).toFixed(2);
      if (amount <= 0) continue;
      coproTotal += amount;
      lines.push({
        recipient_kind: "coprodutor", amount, pct,
        coproducer_id: c.id, recipient_user_id: c.user_id ?? null,
      });
    }

    // producer = remainder
    const producerAmount = +(net - platformAmount - affiliateAmount - managerAmount - coproTotal).toFixed(2);
    if (producerAmount > 0) lines.push({
      recipient_kind: "produtor", amount: producerAmount, pct: null,
      recipient_user_id: product.producer_user_id ?? null,
    });

    // 7) Insert commissions
    const payload = lines.map((l) => ({
      company_id: data.company_id,
      sale_id: sale.id,
      recipient_kind: l.recipient_kind,
      recipient_user_id: l.recipient_user_id ?? null,
      affiliate_id: l.affiliate_id ?? null,
      coproducer_id: l.coproducer_id ?? null,
      manager_id: l.manager_id ?? null,
      amount: l.amount,
      pct: l.pct,
      status: targetCommissionStatus,
      release_at: releaseAt,
      released_at: targetCommissionStatus === "disponivel" ? releaseAt : null,
    }));
    if (payload.length) {
      const { error: cErr } = await supabase.from("aff_commissions").insert(payload as never);
      if (cErr) throw new Error(`Falha ao registrar comissões: ${cErr.message}`);
    }

    // 8) Bump link counters
    if (data.link_id) {
      const { data: link } = await supabase.from("aff_links").select("sales, revenue, commission_total").eq("id", data.link_id).single();
      await supabase.from("aff_links").update({
        sales: (link?.sales ?? 0) + 1,
        revenue: n(link?.revenue) + data.gross_amount,
        commission_total: n(link?.commission_total) + affiliateAmount,
      } as never).eq("id", data.link_id);
    }

    return { sale_id: sale.id, lines: payload.length };
  });

// ---------- advanceCommissionStatus (idempotent) ----------

export const advanceCommissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const now = new Date().toISOString();

    // aguardando_gateway -> aguardando_prazo_interno when gateway_release_at passed (on the sale)
    const { data: salesGw } = await supabase
      .from("aff_sales").select("id, internal_release_at")
      .eq("status", "aguardando_gateway")
      .lte("gateway_release_at", now);
    let movedGw = 0;
    for (const s of salesGw ?? []) {
      await supabase.from("aff_sales").update({ status: "aguardando_prazo_interno" } as never).eq("id", s.id);
      await supabase.from("aff_commissions").update({ status: "aguardando_prazo_interno" } as never)
        .eq("sale_id", s.id).eq("status", "aguardando_gateway");
      movedGw++;
    }

    // aguardando_prazo_interno -> disponivel when internal_release_at passed
    const { data: salesInt } = await supabase
      .from("aff_sales").select("id, internal_release_at")
      .eq("status", "aguardando_prazo_interno").lte("internal_release_at", now);
    let movedInt = 0;
    for (const s of salesInt ?? []) {
      await supabase.from("aff_sales").update({ status: "disponivel", available_at: s.internal_release_at } as never).eq("id", s.id);
      await supabase.from("aff_commissions").update({ status: "disponivel", released_at: s.internal_release_at } as never)
        .eq("sale_id", s.id).eq("status", "aguardando_prazo_interno");
      movedInt++;
    }

    return { promoted_to_internal: movedGw, promoted_to_available: movedInt };
  });

// ---------- requestPayout ----------

const RequestPayoutInput = z.object({
  company_id: z.string().uuid(),
  recipient_kind: z.enum(["afiliado", "coprodutor", "gerente"]),
  affiliate_id: z.string().uuid().optional().nullable(),
  coproducer_id: z.string().uuid().optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  pix_key: z.string().min(3).max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RequestPayoutInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let query = supabase.from("aff_commissions")
      .select("id, amount, recipient_user_id")
      .eq("company_id", data.company_id)
      .eq("status", "disponivel")
      .eq("recipient_kind", data.recipient_kind);
    if (data.affiliate_id) query = query.eq("affiliate_id", data.affiliate_id);
    if (data.coproducer_id) query = query.eq("coproducer_id", data.coproducer_id);
    if (data.manager_id) query = query.eq("manager_id", data.manager_id);

    const { data: avail, error } = await query;
    if (error) throw new Error(error.message);
    const total = (avail ?? []).reduce((s, r) => s + Number(r.amount), 0);
    if (total <= 0) throw new Error("Nenhuma comissão disponível para saque");

    const { data: payout, error: pErr } = await supabase.from("aff_payouts").insert({
      company_id: data.company_id,
      recipient_kind: data.recipient_kind,
      recipient_user_id: userId,
      affiliate_id: data.affiliate_id ?? null,
      coproducer_id: data.coproducer_id ?? null,
      manager_id: data.manager_id ?? null,
      amount: +total.toFixed(2),
      pix_key: data.pix_key ?? null,
      notes: data.notes ?? null,
      status: "solicitado",
    }).select("id").single();
    if (pErr || !payout) throw new Error(pErr?.message ?? "Falha ao solicitar saque");

    const ids = (avail ?? []).map((r) => r.id);
    if (ids.length) {
      await supabase.from("aff_commissions")
        .update({ status: "saque_solicitado", payout_id: payout.id } as never).in("id", ids);
    }

    return { payout_id: payout.id, amount: +total.toFixed(2), commissions: ids.length };
  });

// ---------- mark payout paid (admin) ----------

export const markPayoutPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    payout_id: z.string().uuid(),
    external_payment_id: z.string().max(200).optional().nullable(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const nowIso = new Date().toISOString();
    const { error: upErr } = await supabase.from("aff_payouts").update({
      status: "pago", paid_at: nowIso, paid_by: userId,
      external_payment_id: data.external_payment_id ?? null,
    } as never).eq("id", data.payout_id);
    if (upErr) throw new Error(upErr.message);
    await supabase.from("aff_commissions").update({ status: "pago", paid_at: nowIso } as never)
      .eq("payout_id", data.payout_id);
    return { ok: true };
  });

// ---------- applyCoupon ----------

export const applyCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    company_id: z.string().uuid(),
    code: z.string().min(1).max(60),
    gross_amount: z.number().min(0),
    product_id: z.string().uuid().optional().nullable(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: coupon, error } = await supabase
      .from("aff_coupons")
      .select("id, discount_type, discount_value, valid_from, valid_until, max_uses, used_count, status, product_id, keep_commission")
      .eq("company_id", data.company_id)
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!coupon) throw new Error("Cupom não encontrado");
    if (coupon.status !== "ativo") throw new Error(`Cupom ${coupon.status}`);
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) throw new Error("Cupom ainda não está válido");
    if (coupon.valid_until && new Date(coupon.valid_until) < now) throw new Error("Cupom expirado");
    if (coupon.max_uses && (coupon.used_count ?? 0) >= coupon.max_uses) throw new Error("Cupom esgotado");
    if (coupon.product_id && data.product_id && coupon.product_id !== data.product_id) {
      throw new Error("Cupom não se aplica a este produto");
    }
    const discount = coupon.discount_type === "percent"
      ? +(data.gross_amount * (Number(coupon.discount_value) / 100)).toFixed(2)
      : +Number(coupon.discount_value).toFixed(2);
    return {
      coupon_id: coupon.id,
      discount: Math.min(discount, data.gross_amount),
      final_amount: +Math.max(0, data.gross_amount - discount).toFixed(2),
      keep_commission: coupon.keep_commission,
    };
  });

// ---------- enqueueCrmFlow ----------

export const enqueueCrmFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    company_id: z.string().uuid(),
    flow_kind: z.enum(["cart_recovery","pix_pending","boleto_pending","card_declined","repurchase","post_purchase"]),
    product_id: z.string().uuid().optional().nullable(),
    sale_id: z.string().uuid().optional().nullable(),
    customer_email: z.string().email().max(200).optional().nullable(),
    customer_phone: z.string().max(40).optional().nullable(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("aff_crm_flows")
      .select("id, steps")
      .eq("company_id", data.company_id)
      .eq("kind", data.flow_kind)
      .eq("is_active", true);
    if (data.product_id) q = q.or(`product_id.eq.${data.product_id},product_id.is.null`);
    const { data: flows, error } = await q;
    if (error) throw new Error(error.message);
    if (!flows?.length) return { events: 0 };

    let count = 0;
    for (const flow of flows) {
      const steps = (flow.steps as Array<{ delay_days?: number; channel?: string; template?: string }>) ?? [];
      const rows = steps.map((s, idx) => ({
        company_id: data.company_id,
        flow_id: flow.id,
        sale_id: data.sale_id ?? null,
        customer_email: data.customer_email ?? null,
        customer_phone: data.customer_phone ?? null,
        step_index: idx,
        scheduled_at: new Date(Date.now() + (s.delay_days ?? 0) * 86400000).toISOString(),
        channel: s.channel ?? "email",
        payload: { template: s.template ?? "" },
        status: "pending" as const,
      }));
      if (rows.length) {
        const { error: insErr } = await supabase.from("aff_crm_events").insert(rows as never);
        if (!insErr) count += rows.length;
      }
    }
    return { events: count };
  });

// ---------- seedDemoEmagrecedor ----------

export const seedDemoEmagrecedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ company_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1) Product
    const { data: prod, error: prodErr } = await supabase.from("aff_products").insert({
      company_id: data.company_id,
      name: "Super Emagrecedor Premium",
      description: "Suplemento natural para emagrecimento — demo",
      sku: `DEMO-EMAG-${Date.now()}`,
      default_commission_pct: 40,
      producer_user_id: userId,
      is_recurring_consumption: true,
      allow_installments: true,
      max_installments: 12,
      interest_paid_by: "customer",
      is_active: true,
    } as never).select("id").single();
    if (prodErr || !prod) throw new Error(`Erro ao criar produto demo: ${prodErr?.message}`);

    // 2) Plans
    const plans = [
      { name: "1 Pote — Tratamento Inicial", quantity: 1, consumption_days: 30, price_cents: 19700, sort_order: 1 },
      { name: "2 Potes — Tratamento Completo", quantity: 2, consumption_days: 60, price_cents: 34700, sort_order: 2 },
      { name: "3 Potes — Melhor Resultado", quantity: 3, consumption_days: 90, price_cents: 49700, sort_order: 3 },
    ];
    await supabase.from("aff_product_plans").insert(
      plans.map((p) => ({ ...p, company_id: data.company_id, product_id: prod.id })) as never
    );

    // 3) Order bump
    await supabase.from("aff_bumps").insert({
      company_id: data.company_id,
      product_id: prod.id,
      name: "Guia Digital de Alimentação Inteligente",
      description: "Adicione um guia prático para potencializar seu tratamento por apenas R$ 29,90.",
      price_cents: 2990,
      is_active: true,
    } as never);

    // 4) Upsell
    await supabase.from("aff_upsells").insert({
      company_id: data.company_id,
      product_id: prod.id,
      name: "Upgrade para 3 Potes com Desconto Especial",
      description: "Você acabou de comprar 1 pote. Garanta o tratamento completo de 90 dias.",
      price_cents: 39700,
      trigger: "after_approved",
      is_active: true,
    } as never);

    // 5) CRM repurchase flow
    await supabase.from("aff_crm_flows").insert({
      company_id: data.company_id,
      product_id: prod.id,
      name: "Recompra — Emagrecedor",
      kind: "repurchase",
      is_active: true,
      steps: [
        { delay_days: 23, channel: "whatsapp", template: "Seu tratamento está chegando à reta final..." },
        { delay_days: 29, channel: "whatsapp", template: "Seu produto deve estar acabando. Renovar agora?" },
        { delay_days: 33, channel: "email", template: "Percebemos que seu ciclo terminou. Link de recompra:" },
      ],
    } as never);

    return { product_id: prod.id, ok: true };
  });

