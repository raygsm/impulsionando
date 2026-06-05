import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

const PLAN_MODULES: Record<string, string[]> = {
  essencial_plan: ["crm"],
  integrado_plan: ["crm", "agenda"],
  avancado_plan: ["crm", "agenda", "financeiro", "bi"],
};

async function enqueueTemplate(supabase: any, templateKey: string, userId: string, vars: Record<string, any>) {
  const { data: tpl } = await supabase
    .from("message_templates")
    .select("id, channel")
    .eq("template_key", templateKey)
    .maybeSingle();
  if (!tpl) return;
  await supabase.from("message_outbox").insert({
    template_id: tpl.id,
    channel: tpl.channel,
    user_id: userId,
    payload: vars,
    status: "pending",
  });
}

async function notifyStaff(supabase: any, title: string, body: string, meta: Record<string, any>) {
  const { data: staff } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "staff", "impulsionando_staff"]);
  if (!staff?.length) return;
  await supabase.from("notifications").insert(
    staff.map((s: any) => ({
      user_id: s.user_id,
      title,
      body,
      type: "billing",
      metadata: meta,
    }))
  );
}

async function registerRevenue(supabase: any, amount: number, currency: string, description: string, meta: Record<string, any>) {
  const { data: company } = await supabase.rpc("master_company_id");
  if (!company) return;
  await supabase.from("fin_transactions").insert({
    company_id: company,
    type: "income",
    status: "paid",
    amount,
    currency,
    description,
    paid_at: new Date().toISOString(),
    metadata: meta,
  });
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("[paddle] No userId in customData");
    return;
  }
  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("[paddle] missing importMeta.externalId", { rawPriceId: item.price.id, rawProductId: item.product.id });
    return;
  }

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" }
  );

  // Business logic: convert trial + unlock modules + welcome + notify + revenue
  try {
    const { data: trial } = await supabase
      .from("trial_subscriptions")
      .select("id, company_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (trial) {
      await supabase
        .from("trial_subscriptions")
        .update({ status: "converted", converted_at: new Date().toISOString(), converted_plan: productId })
        .eq("id", trial.id);

      const modules = PLAN_MODULES[productId] ?? [];
      if (trial.company_id && modules.length) {
        const { data: modRows } = await supabase.from("modules").select("id, slug").in("slug", modules);
        if (modRows?.length) {
          await supabase.from("company_modules").upsert(
            modRows.map((m: any) => ({
              company_id: trial.company_id,
              module_id: m.id,
              enabled: true,
              activated_at: new Date().toISOString(),
            })),
            { onConflict: "company_id,module_id" }
          );
        }
      }
    }

    await enqueueTemplate(supabase, "payment_approved_email", userId, { productId, priceId, subscriptionId: id });
    await enqueueTemplate(supabase, "payment_approved_whatsapp", userId, { productId, priceId, subscriptionId: id });

    await notifyStaff(supabase, "Nova assinatura ativada", `Plano ${productId} • ${priceId}`, {
      userId,
      subscriptionId: id,
      productId,
      priceId,
      environment: env,
    });
  } catch (e) {
    console.error("[paddle] post-subscription logic failed", e);
  }
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;

  const update: Record<string, any> = {
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === "cancel",
    updated_at: new Date().toISOString(),
  };
  if (priceId) update.price_id = priceId;
  if (productId) update.product_id = productId;

  await supabase
    .from("subscriptions")
    .update(update)
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  // Upgrade: unlock modules of the new plan immediately
  if (productId) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_subscription_id", id)
      .maybeSingle();
    const userId = (sub as any)?.user_id;
    if (userId) {
      const { data: trial } = await supabase
        .from("trial_subscriptions")
        .select("company_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const companyId = (trial as any)?.company_id;
      const modules = PLAN_MODULES[productId] ?? [];
      if (companyId && modules.length) {
        const { data: modRows } = await supabase.from("modules").select("id, slug").in("slug", modules);
        if (modRows?.length) {
          await supabase.from("company_modules").upsert(
            modRows.map((m: any) => ({
              company_id: companyId,
              module_id: m.id,
              enabled: true,
              activated_at: new Date().toISOString(),
            })),
            { onConflict: "company_id,module_id" }
          );
        }
      }
    }
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  // Immediate revocation per business rule
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      current_period_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id, product_id")
    .eq("paddle_subscription_id", data.id)
    .maybeSingle();
  const userId = (sub as any)?.user_id;
  if (!userId) return;

  const { data: trial } = await supabase
    .from("trial_subscriptions")
    .select("company_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const companyId = (trial as any)?.company_id;
  if (companyId) {
    await supabase.from("company_modules").update({ enabled: false }).eq("company_id", companyId);
  }

  await enqueueTemplate(supabase, "subscription_canceled_email", userId, { subscriptionId: data.id });
  await notifyStaff(supabase, "Assinatura cancelada", `User ${userId} • ${(sub as any)?.product_id ?? ""}`, {
    userId,
    subscriptionId: data.id,
    environment: env,
  });
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const total = data.details?.totals?.total ?? data.payments?.[0]?.amount ?? "0";
  const currency = data.currencyCode ?? "BRL";
  const amount = Number(total) / 100;
  await registerRevenue(supabase, amount, currency, `Paddle txn ${data.id}`, {
    transactionId: data.id,
    subscriptionId: data.subscriptionId,
    customerId: data.customerId,
    environment: env,
  });
}

async function handleTransactionPaymentFailed(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const userId = data.customData?.userId;
  if (userId) {
    await enqueueTemplate(supabase, "payment_failed_email", userId, { transactionId: data.id });
    await enqueueTemplate(supabase, "payment_failed_whatsapp", userId, { transactionId: data.id });
  }
  await notifyStaff(supabase, "Falha de pagamento", `Transação ${data.id}`, {
    transactionId: data.id,
    environment: env,
  });
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event.data, env);
      break;
    case EventName.TransactionPaymentFailed:
      await handleTransactionPaymentFailed(event.data, env);
      break;
    default:
      console.log("[paddle] unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[paddle] webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
