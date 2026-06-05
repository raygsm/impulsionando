import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRICE_TO_PRODUCT: Record<string, string> = {
  essencial_monthly: "essencial_plan",
  essencial_annual: "essencial_plan",
  integrado_monthly: "integrado_plan",
  integrado_annual: "integrado_plan",
  avancado_monthly: "avancado_plan",
  avancado_annual: "avancado_plan",
};

const PLAN_RANK: Record<string, number> = {
  essencial_plan: 1,
  integrado_plan: 2,
  avancado_plan: 3,
};

function resolveEnvFromRequest(): "sandbox" | "live" {
  // Determina o env a partir do client token shipped no servidor (mesmo valor do bundle).
  // Fallback: sandbox.
  const token = process.env.VITE_PAYMENTS_CLIENT_TOKEN ?? "";
  return token.startsWith("test_") ? "sandbox" : token.startsWith("live_") ? "live" : "sandbox";
}

async function loadMySubscription(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const env = resolveEnvFromRequest();
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Nenhuma assinatura encontrada");
  return data;
}

async function resolvePaddlePriceId(env: "sandbox" | "live", externalId: string) {
  const { gatewayFetch } = await import("@/lib/paddle.server");
  const r = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(externalId)}`);
  const j: any = await r.json();
  const id = j?.data?.[0]?.id;
  if (!id) throw new Error(`Preço não encontrado no Paddle: ${externalId}`);
  return id;
}

// ============================================================================
// GET — assinatura do usuário logado (com info detalhada)
// ============================================================================
export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const env = resolveEnvFromRequest();
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", context.userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { subscription: data ?? null };
  });

// ============================================================================
// POST — trocar de plano (upgrade prorata imediato | downgrade no próximo ciclo)
// ============================================================================
export const changeMyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        newPriceId: z.enum([
          "essencial_monthly",
          "essencial_annual",
          "integrado_monthly",
          "integrado_annual",
          "avancado_monthly",
          "avancado_annual",
        ]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sub = await loadMySubscription(context.userId);
    if (sub.user_id !== context.userId) throw new Error("Acesso negado");
    if (sub.status === "canceled") throw new Error("Assinatura cancelada — assine novamente em /planos");

    const newProductId = PRICE_TO_PRODUCT[data.newPriceId];
    const currentProductId = sub.product_id;
    const isUpgrade = (PLAN_RANK[newProductId] ?? 0) > (PLAN_RANK[currentProductId] ?? 0);

    const env = sub.environment as "sandbox" | "live";
    const paddlePriceId = await resolvePaddlePriceId(env, data.newPriceId);

    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(env);
    try {
      await paddle.subscriptions.update(sub.paddle_subscription_id, {
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        prorationBillingMode: (isUpgrade
          ? "prorated_immediately"
          : "prorated_next_billing_period") as any,
      });
    } catch (e: any) {
      throw new Error("Falha ao trocar de plano: " + (e?.message ?? e));
    }
    return { ok: true, isUpgrade };
  });

// ============================================================================
// POST — cancelar assinatura (fim do período vigente)
// ============================================================================
export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sub = await loadMySubscription(context.userId);
    if (sub.user_id !== context.userId) throw new Error("Acesso negado");
    if (sub.status === "canceled") return { ok: true };

    const env = sub.environment as "sandbox" | "live";
    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(env);
    try {
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
        effectiveFrom: "next_billing_period" as any,
      });
    } catch (e: any) {
      throw new Error("Falha ao cancelar: " + (e?.message ?? e));
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("id", sub.id);

    return { ok: true };
  });

// ============================================================================
// POST — abrir portal Paddle (atualizar cartão, ver faturas)
// ============================================================================
export const openMyPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sub = await loadMySubscription(context.userId);
    if (sub.user_id !== context.userId) throw new Error("Acesso negado");

    const env = sub.environment as "sandbox" | "live";
    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(env);
    const session: any = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      [sub.paddle_subscription_id],
    );
    return {
      overviewUrl: session?.urls?.general?.overview ?? null,
      subscriptionUrls: session?.urls?.subscriptions ?? [],
    };
  });

// ============================================================================
// POST — reativar assinatura (remove cancelamento agendado)
// ============================================================================
export const reactivateMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sub = await loadMySubscription(context.userId);
    if (sub.user_id !== context.userId) throw new Error("Acesso negado");
    if (!sub.cancel_at_period_end) return { ok: true, alreadyActive: true };
    if (sub.status === "canceled") {
      throw new Error("Assinatura já encerrada — assine novamente em /planos");
    }

    const env = sub.environment as "sandbox" | "live";
    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(env);
    try {
      // Remove o scheduledChange (cancelamento agendado)
      await paddle.subscriptions.update(sub.paddle_subscription_id, {
        scheduledChange: null as any,
      });
    } catch (e: any) {
      throw new Error("Falha ao reativar: " + (e?.message ?? e));
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq("id", sub.id);

    return { ok: true };
  });
