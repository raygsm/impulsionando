import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./use-current-user";

/**
 * Indica se o Consumidor Final possui uma assinatura ativa do Clube.
 *
 * Usado para decidir qual shell renderizar:
 *  - sem assinatura ativa → CheckoutShell (jornada de contratação, menu enxuto)
 *  - com assinatura ativa → AppShell padrão (Início, Clube, Vitrine etc.)
 */
export function useConsumerHasActiveMembership() {
  const { data: user } = useCurrentUser();
  const userId = user?.user?.id;

  return useQuery({
    queryKey: ["consumer-membership-active", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumer_memberships")
        .select("id,status")
        .eq("user_id", userId!)
        .in("status", ["active", "trialing"])
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn("[useConsumerHasActiveMembership]", error.message);
        return false;
      }
      return !!data;
    },
  });
}
