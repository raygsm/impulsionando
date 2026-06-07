import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useCurrentUser } from "@/hooks/use-current-user";

const PRICE_TO_PLAN: Record<string, { plan: string; cycle: "mensal" | "anual" }> = {
  essencial_monthly: { plan: "Essencial", cycle: "mensal" },
  essencial_annual: { plan: "Essencial", cycle: "anual" },
  integrado_monthly: { plan: "Integrado", cycle: "mensal" },
  integrado_annual: { plan: "Integrado", cycle: "anual" },
  avancado_monthly: { plan: "Avançado", cycle: "mensal" },
  avancado_annual: { plan: "Avançado", cycle: "anual" },
};

export interface SubscriptionRow {
  id: string;
  user_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  past_due_since: string | null;
  environment: string;
}

export function useSubscription() {
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.user?.id;
  const isStaff = !!currentUser?.isImpulsionandoStaff;
  const env = getPaddleEnvironment();

  const query = useQuery({
    queryKey: ["my-subscription", userId, env],
    enabled: !!userId && !isStaff,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId!)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as SubscriptionRow | null) ?? null;
    },
  });

  // Realtime: refetch when this user's subscription row changes
  useEffect(() => {
    if (!userId || isStaff) return;
    const channelName = `subscription-${userId}-${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => query.refetch()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, isStaff, query.refetch]);

  const sub = query.data ?? null;
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  const periodEndsInFuture = periodEnd ? periodEnd > Date.now() : false;

  const isActive =
    !!sub &&
    ((["active", "trialing", "past_due"].includes(sub.status) &&
      (sub.current_period_end == null || periodEndsInFuture)) ||
      (sub.status === "canceled" && periodEndsInFuture));

  const isPastDue = sub?.status === "past_due";
  const isSuspended = sub?.status === "suspended";
  const willCancel = !!sub?.cancel_at_period_end;

  // Dias até suspensão (past_due → 3 dias após past_due_since)
  let daysUntilSuspension: number | null = null;
  if (isPastDue && sub?.past_due_since) {
    const suspendsAt = new Date(sub.past_due_since).getTime() + 3 * 86_400_000;
    daysUntilSuspension = Math.max(0, Math.ceil((suspendsAt - Date.now()) / 86_400_000));
  }

  const planInfo = sub ? PRICE_TO_PLAN[sub.price_id] : null;

  return {
    ...query,
    subscription: sub,
    isActive,
    isPastDue,
    isSuspended,
    willCancel,
    daysUntilSuspension,
    planName: planInfo?.plan ?? null,
    cycle: planInfo?.cycle ?? null,
    nextBillingAt: sub?.current_period_end ?? null,
  };
}
