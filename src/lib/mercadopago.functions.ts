/**
 * Mercado Pago — Checkout Transparente (sem redirecionamento externo).
 *
 * Usa REST direta do MP via fetch (compatível com Worker runtime).
 * O ACCESS_TOKEN NUNCA é exposto ao frontend; a PUBLIC_KEY é entregue
 * pela função `getMercadoPagoConfig` apenas para tokenizar cartão no MP.js.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MP_API = "https://api.mercadopago.com";

function mpHeaders() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function isProductionToken() {
  return (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").startsWith("APP_USR-");
}

// ============================================================================
// Catálogo de planos
// ============================================================================

export const listPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await sb
    .from("mp_plans")
    .select("id,slug,name,description,price_cents,currency,interval,features,display_order")
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const getPlanBySlug = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: plan, error } = await sb
      .from("mp_plans")
      .select("id,slug,name,description,price_cents,currency,interval,features")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    return plan;
  });

// ============================================================================
// Configuração pública (status + public key)
// ============================================================================

export const getMercadoPagoConfig = createServerFn({ method: "GET" }).handler(async () => {
  return {
    public_key: process.env.MERCADOPAGO_PUBLIC_KEY ?? null,
    configured:
      !!process.env.MERCADOPAGO_PUBLIC_KEY && !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    environment: isProductionToken() ? "production" : "sandbox",
  };
});

// ============================================================================
// Status para a tela admin
// ============================================================================

export const getMpIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");

    const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY ?? "";
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";

    return {
      public_key_configured: !!publicKey,
      public_key_preview: publicKey ? `${publicKey.slice(0, 8)}…${publicKey.slice(-4)}` : null,
      access_token_configured: !!accessToken,
      environment: isProductionToken() ? "production" : "sandbox",
      webhook_url: "https://sistema.impulsionando.com.br/api/mercadopago/webhook",
      webhook_secret_configured: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
    };
  });

export const testMpIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");
    try {
      const r = await fetch(`${MP_API}/v1/payment_methods`, { headers: mpHeaders() });
      if (!r.ok) {
        const txt = await r.text();
        return { ok: false, status: r.status, message: txt.slice(0, 200) };
      }
      const data = await r.json();
      return { ok: true, methods_count: Array.isArray(data) ? data.length : 0 };
    } catch (e: any) {
      return { ok: false, message: e?.message ?? "Falha na chamada ao Mercado Pago." };
    }
  });

// ============================================================================
// Pagamentos
// ============================================================================

const PixInput = z.object({
  plan_id: z.string().uuid(),
  payer: z.object({
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    identification: z.object({ type: z.string(), number: z.string() }).optional(),
  }),
});

export const createPixPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PixInput.parse(d))
  .handler(async ({ context, data }) => {
    const { captureServerError } = await import('@/lib/runtime-observability.functions');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    return captureServerError(
      { scope: 'mercadopago.createPixPayment', userId: context.userId, supabaseAdmin, context: { plan_id: data.plan_id } },
      async () => {

    const { data: plan, error } = await context.supabase
      .from("mp_plans")
      .select("id,name,price_cents,currency")
      .eq("id", data.plan_id)
      .maybeSingle();
    if (error || !plan) throw new Error("Plano não encontrado.");

    const body = {
      transaction_amount: Number((plan.price_cents / 100).toFixed(2)),
      description: `Impulsionando — ${plan.name}`,
      payment_method_id: "pix",
      payer: data.payer,
      notification_url:
        "https://sistema.impulsionando.com.br/api/mercadopago/webhook",
      metadata: { plan_id: plan.id, user_id: context.userId },
    };

    const r = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: { ...mpHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(body),
    });
    const json: any = await r.json();
    if (!r.ok) {
      console.error("[MP] Pix create failed", r.status, json);
      throw new Error(json?.message ?? "Falha ao criar pagamento Pix.");
    }

    await context.supabase.from("payments").insert({
      user_id: context.userId,
      plan_id: plan.id,
      payment_id: String(json.id),
      payment_method: "pix",
      status: json.status,
      amount_cents: plan.price_cents,
      currency: plan.currency,
      due_date: json.date_of_expiration ?? null,
      raw_response: json,
    });

    return {
      id: json.id,
      status: json.status,
      qr_code: json.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64:
        json.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: json.point_of_interaction?.transaction_data?.ticket_url,
      expires_at: json.date_of_expiration,
    };
  });

const CardInput = z.object({
  plan_id: z.string().uuid(),
  token: z.string(), // gerado pelo MP.js no frontend
  installments: z.number().int().min(1).max(12).default(1),
  payment_method_id: z.string(), // visa, master, elo, ...
  issuer_id: z.string().optional(),
  payer: z.object({
    email: z.string().email(),
    identification: z.object({ type: z.string(), number: z.string() }).optional(),
  }),
});

export const createCardPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CardInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: plan, error } = await context.supabase
      .from("mp_plans")
      .select("id,name,price_cents,currency")
      .eq("id", data.plan_id)
      .maybeSingle();
    if (error || !plan) throw new Error("Plano não encontrado.");

    const body: Record<string, unknown> = {
      transaction_amount: Number((plan.price_cents / 100).toFixed(2)),
      token: data.token,
      description: `Impulsionando — ${plan.name}`,
      installments: data.installments,
      payment_method_id: data.payment_method_id,
      payer: data.payer,
      notification_url:
        "https://sistema.impulsionando.com.br/api/mercadopago/webhook",
      metadata: { plan_id: plan.id, user_id: context.userId },
    };
    if (data.issuer_id) body.issuer_id = data.issuer_id;

    const r = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: { ...mpHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(body),
    });
    const json: any = await r.json();
    if (!r.ok) {
      console.error("[MP] Card create failed", r.status, json);
      throw new Error(json?.message ?? "Pagamento recusado. Verifique os dados.");
    }

    await context.supabase.from("payments").insert({
      user_id: context.userId,
      plan_id: plan.id,
      payment_id: String(json.id),
      payment_method: data.payment_method_id,
      status: json.status,
      amount_cents: plan.price_cents,
      currency: plan.currency,
      paid_at: json.status === "approved" ? new Date().toISOString() : null,
      raw_response: json,
    });

    return {
      id: json.id,
      status: json.status,
      status_detail: json.status_detail,
    };
  });

export const getPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ payment_id: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("payments")
      .select("id,payment_id,status,amount_cents,payment_method,paid_at")
      .eq("payment_id", data.payment_id)
      .maybeSingle();
    return row;
  });

// ============================================================================
// Listagens admin
// ============================================================================

export const listPaymentsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      status: z.string().optional(),
      planId: z.string().uuid().optional(),
      sinceDays: z.number().int().min(1).max(365).default(30),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito.");

    const since = new Date(Date.now() - data.sinceDays * 86400_000).toISOString();
    let q = context.supabase
      .from("payments")
      .select(`
        id,user_id,plan_id,payment_id,payment_method,status,amount_cents,
        currency,due_date,paid_at,created_at,webhook_received_at,
        plan:mp_plans(slug,name)
      `)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status) q = q.eq("status", data.status);
    if (data.planId) q = q.eq("plan_id", data.planId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });
