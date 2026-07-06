import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./use-current-user";

/**
 * Estado de assinatura do Clube (Consumidor Final).
 *
 * Retorna `isActive` para gates simples e `tier` (derivado de `plan`) para
 * gates finos entre `essencial` / `full` no painel do consumidor.
 */
export type ConsumerMembership = {
  isActive: boolean;
  tier: string | null;
  status: string | null;
  plan: string | null;
};

export function useConsumerMembership() {
  const { data: user } = useCurrentUser();
  const userId = user?.user?.id;

  return useQuery<ConsumerMembership>({
    queryKey: ["consumer-membership", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumer_memberships")
        .select("id,status,plan,created_at")
        .eq("user_id", userId!)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn("[useConsumerMembership]", error.message);
        return { isActive: false, tier: null, status: null, plan: null };
      }
      const plan = (data?.plan ?? null) as string | null;
      return {
        isActive: !!data,
        tier: plan,
        status: (data?.status ?? null) as string | null,
        plan,
      };
    },
  });
}

/**
 * Compat: mantém o shape booleano usado pelo AppShell/CheckoutShell.
 */
export function useConsumerHasActiveMembership() {
  const q = useConsumerMembership();
  return { ...q, data: q.data?.isActive ?? false };
}
