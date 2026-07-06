import type { QueryClient } from "@tanstack/react-query";
import type { NavigateFn } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sign-out seguro (Etapa 3 — Auth & RBAC).
 *
 * Segue a ordem obrigatória do guia `tanstack-auth-guards`:
 *   1. cancelQueries — evita flash de 401 de queries em voo
 *   2. clear         — impede Back reidratar shell com dados protegidos
 *   3. signOut       — encerra sessão no Supabase
 *   4. navigate replace:true — /auth fora do back stack
 *
 * Todas as chamadas de logout do app devem passar por aqui.
 */
export async function signOutSafely(opts: {
  queryClient: QueryClient;
  navigate: NavigateFn;
  to?: string;
}) {
  const { queryClient, navigate, to = "/auth" } = opts;
  try {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  } catch (err) {
    // Não bloqueia o redirect — se a sessão local já foi invalidada,
    // o próximo acesso protegido levará ao /auth de qualquer forma.
    console.error("[signOutSafely] erro ao encerrar sessão", err);
  } finally {
    navigate({ to, replace: true } as any);
  }
}
