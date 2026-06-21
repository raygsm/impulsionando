/**
 * Server-side guard: libera acesso a módulos pagos APENAS quando existe um
 * pagamento aprovado no Mercado Pago (`mpago_payments.status='approved'`,
 * `environment='production'`) para o usuário atual com os critérios pedidos.
 *
 * Substitui o antigo guard InfinitePay. Single source of truth para destrancar
 * módulos contratados — nunca confia em parâmetros de URL, cookie ou estado
 * do cliente.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const RequirePaidInput = z.object({
  modulo_id: z.string().max(80).optional().nullable(),
  plano_id: z.string().max(80).optional().nullable(),
  empresa_id: z.string().uuid().optional().nullable(),
});
export type RequirePaidInputType = z.infer<typeof RequirePaidInput>;

export async function requireMpagoPaidCore(
  userId: string,
  criteria: RequirePaidInputType,
): Promise<{ paid: boolean; payment: any | null }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let q = (supabaseAdmin as any)
    .from("mpago_payments")
    .select("*")
    .eq("user_id", userId)
    .eq("environment", "production")
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(1);

  if (criteria.modulo_id) q = q.eq("modulo_id", criteria.modulo_id);
  if (criteria.plano_id) q = q.eq("plano_id", criteria.plano_id);
  if (criteria.empresa_id) q = q.eq("empresa_id", criteria.empresa_id);

  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  return { paid: !!data, payment: data ?? null };
}

export const requireMpagoPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RequirePaidInput.parse(data))
  .handler(async ({ data, context }) => {
    return requireMpagoPaidCore(context.userId, data);
  });
