import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const API_BASE = "https://api.checkout.infinitepay.io";

function getEnv() {
  const handle = process.env.INFINITEPAY_HANDLE;
  const redirect_url = process.env.INFINITEPAY_REDIRECT_URL;
  const webhook_url = process.env.INFINITEPAY_WEBHOOK_URL;
  if (!handle || !redirect_url || !webhook_url) {
    throw new Error(
      "InfinitePay não configurado: defina INFINITEPAY_HANDLE, INFINITEPAY_REDIRECT_URL e INFINITEPAY_WEBHOOK_URL.",
    );
  }
  return { handle: handle.replace(/^\$/, ""), redirect_url, webhook_url };
}

function makeOrderNsu() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `IMP-${t}-${r}`;
}

export const CreateInfinitePayInput = z.object({
  environment: z.enum(["production", "demo"]).default("production"),
  customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(200),
    phone_number: z.string().min(5).max(40),
  }),
  items: z
    .array(
      z.object({
        quantity: z.number().int().min(1).max(99),
        price: z.number().int().min(1), // centavos
        description: z.string().min(1).max(300),
      }),
    )
    .min(1)
    .max(20),
  modulo_id: z.string().max(80).optional().nullable(),
  plano_id: z.string().max(80).optional().nullable(),
  empresa_id: z.string().uuid().optional().nullable(),
  cliente_id: z.string().uuid().optional().nullable(),
});
export type CreateInfinitePayInputType = z.infer<typeof CreateInfinitePayInput>;

export const CheckInfinitePayInput = z.object({
  order_nsu: z.string().min(1).max(120),
  transaction_nsu: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
});
export type CheckInfinitePayInputType = z.infer<typeof CheckInfinitePayInput>;

// ====================== Core (used by both serverFns and HTTP routes) ======================

export async function createInfinitePayCheckoutCore(
  userId: string,
  data: CreateInfinitePayInputType,
) {
  // Proteção DEMO: nunca chama API real
  if (data.environment === "demo") {
    const order_nsu = makeOrderNsu();
    const total = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const { data: row, error } = await supabaseAdmin
      .from("infinitepay_payments")
      .insert({
        environment: "demo",
        order_nsu,
        user_id: userId,
        empresa_id: data.empresa_id ?? null,
        cliente_id: data.cliente_id ?? null,
        modulo_id: data.modulo_id ?? null,
        plano_id: data.plano_id ?? null,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone_number,
        description: data.items.map((i) => i.description).join(" + "),
        amount: total,
        status: "paid",
        paid_amount: total,
        capture_method: "demo",
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, demo: true, order_nsu, checkout_url: null, payment: row };
  }

  const env = getEnv();
  const order_nsu = makeOrderNsu();
  const amount = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const description = data.items.map((i) => i.description).join(" + ");

  const payload = {
    handle: env.handle,
    redirect_url: env.redirect_url,
    webhook_url: env.webhook_url,
    order_nsu,
    customer: data.customer,
    items: data.items,
  };

  // Cria registro local antes (status checkout_created)
  const { error: insertErr } = await supabaseAdmin
    .from("infinitepay_payments")
    .insert({
      environment: "production",
      order_nsu,
      user_id: userId,
      empresa_id: data.empresa_id ?? null,
      cliente_id: data.cliente_id ?? null,
      modulo_id: data.modulo_id ?? null,
      plano_id: data.plano_id ?? null,
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone_number,
      description,
      amount,
      status: "checkout_created",
      raw_request: payload,
    });
  if (insertErr) throw new Error(insertErr.message);

  // Chama InfinitePay
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/invoices/public/checkout/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    await supabaseAdmin
      .from("infinitepay_payments")
      .update({ status: "failed", raw_response: { error: String(e) } })
      .eq("order_nsu", order_nsu);
    throw new Error("Não foi possível conectar à InfinitePay. Tente novamente.");
  }

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok || !json?.url) {
    await supabaseAdmin
      .from("infinitepay_payments")
      .update({ status: "failed", raw_response: json })
      .eq("order_nsu", order_nsu);
    throw new Error(json?.message || "InfinitePay rejeitou a criação do checkout.");
  }

  await supabaseAdmin
    .from("infinitepay_payments")
    .update({
      status: "waiting_payment",
      checkout_url: json.url,
      raw_response: json,
    })
    .eq("order_nsu", order_nsu);

  return {
    ok: true as const,
    demo: false,
    order_nsu,
    checkout_url: json.url as string,
  };
}

export async function checkInfinitePayStatusCore(
  userId: string,
  data: CheckInfinitePayInputType,
) {
  const { data: row, error } = await supabaseAdmin
    .from("infinitepay_payments")
    .select("*")
    .eq("order_nsu", data.order_nsu)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Pedido não encontrado");
  if (row.user_id && row.user_id !== userId) throw new Error("Acesso negado");

  // DEMO ou já pago: não chama InfinitePay
  if (row.environment === "demo" || row.status === "paid") {
    return { ok: true as const, status: row.status, payment: row };
  }

  const env = getEnv();
  const body = {
    handle: env.handle,
    order_nsu: row.order_nsu,
    transaction_nsu: data.transaction_nsu ?? row.transaction_nsu ?? "",
    slug: data.slug ?? row.invoice_slug ?? "",
  };

  const res = await fetch(`${API_BASE}/invoices/public/checkout/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => ({}));

  // Só marca como paid quando InfinitePay retornar paid=true.
  if (json?.paid === true) {
    await supabaseAdmin
      .from("infinitepay_payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_amount: json.paid_amount ?? row.amount,
        installments: json.installments ?? row.installments,
        capture_method: json.capture_method ?? row.capture_method,
        transaction_nsu: body.transaction_nsu || row.transaction_nsu,
        invoice_slug: body.slug || row.invoice_slug,
        receipt_url: json.receipt_url ?? row.receipt_url,
        webhook_payload: {
          ...((row.webhook_payload as Record<string, unknown>) ?? {}),
          manual_check: json,
        },
      })
      .eq("order_nsu", row.order_nsu);
    return {
      ok: true as const,
      status: "paid",
      payment: { ...row, status: "paid" as const },
    };
  }

  // Nunca libera módulo só com retorno do redirect: apenas registra a verificação.
  await supabaseAdmin
    .from("infinitepay_payments")
    .update({
      status: row.status === "paid" ? "paid" : "manual_checked",
      webhook_payload: {
        ...((row.webhook_payload as Record<string, unknown>) ?? {}),
        manual_check: json,
      },
    })
    .eq("order_nsu", row.order_nsu);

  return { ok: true as const, status: row.status, payment: row };
}

// ====================== Server functions (RPC) ======================

export const createInfinitePayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateInfinitePayInput.parse(data))
  .handler(async ({ data, context }) => {
    return createInfinitePayCheckoutCore(context.userId, data);
  });

export const checkInfinitePayStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CheckInfinitePayInput.parse(data))
  .handler(async ({ data, context }) => {
    return checkInfinitePayStatusCore(context.userId, data);
  });

export const getInfinitePayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ order_nsu: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("infinitepay_payments")
      .select("*")
      .eq("order_nsu", data.order_nsu)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { ok: false as const, payment: null };
    if (row.user_id && row.user_id !== context.userId) return { ok: false as const, payment: null };
    return { ok: true as const, payment: row };
  });
