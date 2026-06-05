import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

const PRICE_TO_PLAN: Record<string, { plan: string; cycle: string }> = {
  essencial_monthly: { plan: "Essencial", cycle: "mensal" },
  essencial_annual: { plan: "Essencial", cycle: "anual" },
  integrado_monthly: { plan: "Integrado", cycle: "mensal" },
  integrado_annual: { plan: "Integrado", cycle: "anual" },
  avancado_monthly: { plan: "Avançado", cycle: "mensal" },
  avancado_annual: { plan: "Avançado", cycle: "anual" },
};

export const listSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string; environment?: string } | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status) q = q.eq("status", data.status);
    if (data.environment) q = q.eq("environment", data.environment);
    const { data: subs, error } = await q;
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((subs ?? []).map((s: any) => s.user_id)));
    const usersMap: Record<string, { email?: string; name?: string }> = {};
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("user_profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds);
      (profs ?? []).forEach((p: any) => {
        if (!usersMap[p.user_id]) usersMap[p.user_id] = { email: p.email, name: p.display_name };
      });
    }

    const items = (subs ?? []).map((s: any) => ({
      ...s,
      planLabel: PRICE_TO_PLAN[s.price_id]?.plan ?? s.product_id,
      cycleLabel: PRICE_TO_PLAN[s.price_id]?.cycle ?? "—",
      user_email: usersMap[s.user_id]?.email ?? null,
      user_name: usersMap[s.user_id]?.name ?? null,
    }));

    const counts: Record<string, number> = {};
    items.forEach((s) => { counts[s.status] = (counts[s.status] ?? 0) + 1; });

    return { items, counts, total: items.length };
  });

export const cancelSubscriptionAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      subscriptionId: z.string().uuid(),
      effectiveFrom: z.enum(["immediately", "next_billing_period"]).default("immediately"),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub) throw new Error("Assinatura não encontrada");

    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(sub.environment as "sandbox" | "live");
    try {
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
        effectiveFrom: data.effectiveFrom,
      });
    } catch (e: any) {
      throw new Error("Falha ao cancelar no Paddle: " + (e?.message ?? e));
    }

    // Reflete localmente; o webhook irá consolidar.
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: data.effectiveFrom === "immediately" ? "canceled" : sub.status,
        cancel_at_period_end: data.effectiveFrom === "next_billing_period",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    return { ok: true };
  });

export const openCustomerPortalAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ subscriptionId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub) throw new Error("Assinatura não encontrada");

    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(sub.environment as "sandbox" | "live");
    const session: any = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      [sub.paddle_subscription_id],
    );
    return {
      overviewUrl: session?.urls?.general?.overview ?? null,
      subscriptionUrls: session?.urls?.subscriptions ?? [],
    };
  });

export const getBillingStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("status, environment, price_id");
    if (error) throw new Error(error.message);
    const all = data ?? [];
    const live = all.filter((s: any) => s.environment === "live");
    const active = live.filter((s: any) => ["active", "trialing"].includes(s.status)).length;
    const pastDue = live.filter((s: any) => s.status === "past_due").length;
    const canceled = live.filter((s: any) => s.status === "canceled").length;
    return { total: all.length, liveTotal: live.length, active, pastDue, canceled };
  });
