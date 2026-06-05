import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// Maps Paddle product external_id → list of module slugs to enable.
// Same product is used for monthly+annual; cycle is encoded in the price external_id.
const PLAN_MODULES: Record<string, string[]> = {
  essencial_plan: ["crm"],
  integrado_plan: ["crm", "agenda"],
  avancado_plan: ["crm", "agenda", "financeiro", "bi"],
};

const PUBLIC_BASE_URL = "https://impulsionando.com.br";

async function enqueueTemplate(
  supabase: any,
  eventCode: string,
  channel: "email" | "whatsapp" | "in_app",
  userId: string | null,
  companyId: string | null,
  recipientEmail: string | null,
  recipientPhone: string | null,
  recipientName: string | null,
  payload: Record<string, any>,
  reference?: { type: string; id: string }
) {
  const { data: tpl } = await supabase
    .from("message_templates")
    .select("id, subject, body")
    .eq("event_code", eventCode)
    .eq("channel", channel)
    .eq("is_active", true)
    .maybeSingle();
  if (!tpl) return;

  await supabase.from("message_outbox").insert({
    company_id: companyId,
    event_code: eventCode,
    channel,
    template_id: tpl.id,
    recipient_user_id: userId,
    recipient_email: recipientEmail,
    recipient_phone: recipientPhone,
    recipient_name: recipientName,
    subject: tpl.subject,
    body: tpl.body,
    payload,
    status: channel === "in_app" ? "sent" : "queued",
    sent_at: channel === "in_app" ? new Date().toISOString() : null,
    reference_type: reference?.type ?? null,
    reference_id: reference?.id ?? null,
  });
}

async function notifyStaff(
  supabase: any,
  title: string,
  message: string,
  companyId: string | null
) {
  // Notifica apenas super-admins e staff da empresa master Impulsionando.
  // Filtra por slug do profile + is_master=true na companhia para evitar
  // over-match com clientes que tenham um profile is_master_profile próprio.
  const { data: staff } = await supabase
    .from("user_profiles")
    .select("user_id, profiles!inner(slug, is_master_profile), companies!inner(is_master)")
    .eq("is_active", true)
    .eq("profiles.is_master_profile", true)
    .in("profiles.slug", ["super-admin-impulsionando", "staff-impulsionando"])
    .eq("companies.is_master", true);

  if (!staff?.length) return;

  const seen = new Set<string>();
  const rows = staff
    .filter((s: any) => {
      if (seen.has(s.user_id)) return false;
      seen.add(s.user_id);
      return true;
    })
    .map((s: any) => ({
      user_id: s.user_id,
      company_id: companyId,
      category: "billing",
      severity: "info",
      title,
      message,
    }));
  if (rows.length) await supabase.from("notifications").insert(rows);
}

async function registerRevenue(
  supabase: any,
  amount: number,
  description: string,
  refId: string
) {
  const { data: companyId } = await supabase.rpc("master_company_id");
  if (!companyId) return;
  await supabase.from("fin_transactions").insert({
    company_id: companyId,
    kind: "income",
    status: "paid",
    amount,
    net_amount: amount,
    description,
    paid_at: new Date().toISOString(),
    due_date: new Date().toISOString().slice(0, 10),
    reference_type: "paddle_transaction",
    reference_id: refId,
  });
}

async function fetchPaddleCustomer(env: PaddleEnv, customerId: string) {
  try {
    const r = await gatewayFetch(env, `/customers/${customerId}`);
    const j: any = await r.json();
    return j?.data ?? null;
  } catch (e) {
    console.error("[paddle] failed to fetch customer", e);
    return null;
  }
}

/**
 * Resolves the app userId for a Paddle event.
 * - If customData.userId is present → use it.
 * - Otherwise fetches customer email from Paddle, creates (or finds) a Supabase user,
 *   sends a password-recovery email, and returns the new user_id.
 */
async function resolveOrCreateUser(
  supabase: any,
  env: PaddleEnv,
  customData: any,
  customerId: string
): Promise<{ userId: string | null; isNew: boolean; email: string | null; name: string | null }> {
  const explicit = customData?.userId;
  if (explicit) return { userId: explicit, isNew: false, email: null, name: null };

  const cust = await fetchPaddleCustomer(env, customerId);
  const email = cust?.email?.toLowerCase() ?? null;
  const name = cust?.name ?? null;
  if (!email) return { userId: null, isNew: false, email: null, name: null };

  // Try to find existing user by email — paginate to handle >1000 users.
  let found: any = null;
  for (let page = 1; page <= 20; page++) {
    const { data: list } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    const users = list?.users ?? [];
    found = users.find((u: any) => u.email?.toLowerCase() === email);
    if (found) break;
    if (users.length < 1000) break; // last page
  }
  if (found) return { userId: found.id, isNew: false, email, name };

  // Create user; email confirmed automatically since the purchase verifies ownership.
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: name, source: "post_checkout" },
  });
  if (createErr) {
    console.error("[paddle] createUser failed", createErr);
    return { userId: null, isNew: false, email, name };
  }
  return { userId: created?.user?.id ?? null, isNew: true, email, name };
}

async function getCompanyForUser(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return (data as any)?.company_id ?? null;
}

async function enableModules(
  supabase: any,
  companyId: string,
  moduleSlugs: string[]
) {
  if (!moduleSlugs.length) return;
  const { data: modRows } = await supabase
    .from("modules")
    .select("id, slug")
    .in("slug", moduleSlugs);
  if (!modRows?.length) return;
  await supabase.from("company_modules").upsert(
    modRows.map((m: any) => ({
      company_id: companyId,
      module_id: m.id,
      is_enabled: true,
      enabled_at: new Date().toISOString(),
    })),
    { onConflict: "company_id,module_id" }
  );
}

async function disableModules(
  supabase: any,
  companyId: string,
  moduleSlugs: string[]
) {
  if (!moduleSlugs.length) return;
  const { data: modRows } = await supabase
    .from("modules")
    .select("id")
    .in("slug", moduleSlugs);
  if (!modRows?.length) return;
  await supabase
    .from("company_modules")
    .update({ is_enabled: false, updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .in("module_id", modRows.map((m: any) => m.id));
}

// ============================================================================
// Handlers
// ============================================================================

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("[paddle] missing importMeta.externalId — skipping", {
      rawPriceId: item?.price?.id,
      rawProductId: item?.product?.id,
      subscriptionId: id,
    });
    await notifyStaff(
      getSupabase(),
      "Assinatura ignorada — externalId faltando",
      `Sub ${id} (${env}) — price=${item?.price?.id} product=${item?.product?.id}. Recrie no Paddle com create_product/create_price.`,
      null
    );
    return;
  }

  // Resolve user (may create a new account for anonymous checkout)
  const resolved = await resolveOrCreateUser(supabase, env, customData, customerId);
  if (!resolved.userId) {
    console.error("[paddle] could not resolve or create user — subscription not linked", { id });
    return;
  }
  const userId = resolved.userId;

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
      past_due_since: null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" }
  );

  try {
    // Convert linked trial (use Portuguese enum value!)
    const { data: trial } = await supabase
      .from("trial_subscriptions")
      .select("id, company_id, contact_email, contact_name, contact_whatsapp")
      .or(
        `user_id.eq.${userId}${resolved.email ? `,contact_email.eq.${resolved.email}` : ""}`
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (trial) {
      await supabase
        .from("trial_subscriptions")
        .update({
          status: "convertido",
          converted_at: new Date().toISOString(),
          paddle_subscription_id: id,
          user_id: userId,
        })
        .eq("id", trial.id);
    }

    const companyId =
      (trial as any)?.company_id ?? (await getCompanyForUser(supabase, userId));

    if (companyId) {
      const modules = PLAN_MODULES[productId] ?? [];
      await enableModules(supabase, companyId, modules);
    }

    // Welcome message — new user gets password recovery link
    if (resolved.isNew && resolved.email) {
      let resetLink = `${PUBLIC_BASE_URL}/auth`;
      try {
        const { data: link } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: resolved.email,
          options: { redirectTo: `${PUBLIC_BASE_URL}/reset-password` },
        });
        if (link?.properties?.action_link) resetLink = link.properties.action_link;
      } catch (e) {
        console.warn("[paddle] generateLink failed, using fallback", e);
      }
      await enqueueTemplate(
        supabase,
        "welcome_post_checkout",
        "email",
        userId,
        companyId,
        resolved.email,
        null,
        resolved.name,
        { recipient_name: resolved.name ?? "cliente", reset_link: resetLink },
        { type: "subscription", id }
      );
      await enqueueTemplate(
        supabase,
        "welcome_post_checkout",
        "in_app",
        userId,
        companyId,
        null,
        null,
        resolved.name,
        { recipient_name: resolved.name ?? "cliente" },
        { type: "subscription", id }
      );
    }

    // Confirmação de pagamento aprovado
    const recipientEmail =
      resolved.email ??
      (
        await supabase
          .from("user_profiles")
          .select("email, display_name")
          .eq("user_id", userId)
          .maybeSingle()
      ).data?.email ??
      null;

    await enqueueTemplate(
      supabase,
      "payment_approved",
      "email",
      userId,
      companyId,
      recipientEmail,
      null,
      resolved.name,
      { productId, priceId, subscriptionId: id, recipient_name: resolved.name ?? "cliente" },
      { type: "subscription", id }
    );
    await enqueueTemplate(
      supabase,
      "payment_approved",
      "in_app",
      userId,
      companyId,
      null,
      null,
      resolved.name,
      { recipient_name: resolved.name ?? "cliente" }
    );

    await notifyStaff(
      supabase,
      "Nova assinatura ativada",
      `Plano ${productId} • ${priceId} • user ${userId}`,
      companyId
    );
  } catch (e) {
    console.error("[paddle] post-subscription logic failed", e);
  }
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const item = items?.[0];
  const newPriceId = item?.price?.importMeta?.externalId;
  const newProductId = item?.product?.importMeta?.externalId;

  // Read existing row first (before update) to detect plan changes, past_due transitions and re-activation
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("user_id, product_id, price_id, status, past_due_since, cancel_at_period_end")
    .eq("paddle_subscription_id", id)
    .eq("environment", env)
    .maybeSingle();

  const prevProductId = (existing as any)?.product_id;
  const prevStatus = (existing as any)?.status;
  const userId = (existing as any)?.user_id;

  const update: Record<string, any> = {
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === "cancel",
    updated_at: new Date().toISOString(),
  };
  if (newPriceId) update.price_id = newPriceId;
  if (newProductId) update.product_id = newProductId;

  // Track past_due transitions
  if (status === "past_due" && prevStatus !== "past_due") {
    update.past_due_since = new Date().toISOString();
  } else if (status !== "past_due" && prevStatus === "past_due") {
    update.past_due_since = null;
  }

  await supabase
    .from("subscriptions")
    .update(update)
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  if (!userId) return;
  const companyId = await getCompanyForUser(supabase, userId);
  if (!companyId) return;

  // Plan change (upgrade or downgrade)
  if (newProductId && prevProductId && newProductId !== prevProductId) {
    const prevModules = new Set(PLAN_MODULES[prevProductId] ?? []);
    const newModules = new Set(PLAN_MODULES[newProductId] ?? []);
    const toEnable = [...newModules].filter((m) => !prevModules.has(m));
    const toDisable = [...prevModules].filter((m) => !newModules.has(m));
    await enableModules(supabase, companyId, toEnable);
    await disableModules(supabase, companyId, toDisable);
  } else if (newProductId && !prevProductId) {
    // Defensive: first time we see productId
    await enableModules(supabase, companyId, PLAN_MODULES[newProductId] ?? []);
  }

  // Past-due dunning notification (first time)
  if (status === "past_due" && prevStatus !== "past_due") {
    const portalUrl = `${PUBLIC_BASE_URL}/minha-assinatura`;
    const prof = (
      await supabase
        .from("user_profiles")
        .select("email, display_name")
        .eq("user_id", userId)
        .maybeSingle()
    ).data;
    await enqueueTemplate(
      supabase,
      "payment_failed_dunning",
      "email",
      userId,
      companyId,
      prof?.email ?? null,
      null,
      prof?.display_name ?? null,
      { recipient_name: prof?.display_name ?? "cliente", portal_url: portalUrl }
    );
    await enqueueTemplate(
      supabase,
      "payment_failed_dunning",
      "in_app",
      userId,
      companyId,
      null,
      null,
      prof?.display_name ?? null,
      { recipient_name: prof?.display_name ?? "cliente", portal_url: portalUrl }
    );
    await notifyStaff(
      supabase,
      "Assinatura em past_due",
      `User ${userId} • ${id}`,
      companyId
    );
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const supabase = getSupabase();

  // Read first — captures user_id and product_id BEFORE the update overwrites anything
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("user_id, product_id")
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env)
    .maybeSingle();

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      current_period_end: new Date().toISOString(),
      past_due_since: null,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);

  const userId = (existing as any)?.user_id;
  const canceledProductId = (existing as any)?.product_id;
  if (!userId) return;

  const companyId = await getCompanyForUser(supabase, userId);
  if (companyId && canceledProductId) {
    // Desabilita apenas os módulos do plano cancelado.
    // Módulos manualmente habilitados (ou de planos add-on) permanecem ativos.
    const modulesToDisable = PLAN_MODULES[canceledProductId] ?? [];
    await disableModules(supabase, companyId, modulesToDisable);
  }

  const prof = (
    await supabase
      .from("user_profiles")
      .select("email, display_name, phone:email")
      .eq("user_id", userId)
      .maybeSingle()
  ).data;

  await enqueueTemplate(
    supabase,
    "subscription_canceled",
    "email",
    userId,
    companyId,
    prof?.email ?? null,
    null,
    prof?.display_name ?? null,
    { recipient_name: prof?.display_name ?? "cliente", subscription_id: data.id }
  );
  await enqueueTemplate(
    supabase,
    "subscription_canceled",
    "in_app",
    userId,
    companyId,
    null,
    null,
    prof?.display_name ?? null,
    { recipient_name: prof?.display_name ?? "cliente" }
  );

  await notifyStaff(
    supabase,
    "Assinatura cancelada",
    `User ${userId} • ${(existing as any)?.product_id ?? ""}`,
    companyId
  );
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const total = data.details?.totals?.total ?? data.payments?.[0]?.amount ?? "0";
  const amount = Number(total) / 100;
  if (amount > 0) {
    await registerRevenue(supabase, amount, `Paddle txn ${data.id} (${env})`, data.id);
  }
}

async function handleTransactionPaymentFailed(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const userId = data.customData?.userId;
  if (!userId) {
    await notifyStaff(supabase, "Falha de pagamento (sem userId)", `Txn ${data.id} (${env})`, null);
    return;
  }
  const companyId = await getCompanyForUser(supabase, userId);
  const prof = (
    await supabase
      .from("user_profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .maybeSingle()
  ).data;
  await enqueueTemplate(
    supabase,
    "payment_failed",
    "email",
    userId,
    companyId,
    prof?.email ?? null,
    null,
    prof?.display_name ?? null,
    { recipient_name: prof?.display_name ?? "cliente", transactionId: data.id }
  );
  await notifyStaff(supabase, "Falha de pagamento", `Txn ${data.id} (${env})`, companyId);
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
