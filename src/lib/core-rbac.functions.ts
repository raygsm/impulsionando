/**
 * RBAC compartilhado para todas as rotas /core/* de saúde/diagnóstico.
 * Permite acesso apenas a:
 *  - staff Impulsionando (super-admin/suporte)
 *  - role "admin" da empresa ativa
 *
 * Use em loaders/beforeLoad e dentro de mutations sensíveis.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CoreAccessLevel = "staff" | "admin" | "denied";
export interface CoreAccess { allowed: boolean; level: CoreAccessLevel; userId: string }

export const checkCoreHealthAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CoreAccess> => {
    const { data: staff } = await context.supabase.rpc("is_impulsionando_staff", { _user: context.userId });
    if (staff) return { allowed: true, level: "staff", userId: context.userId };
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (isAdmin) return { allowed: true, level: "admin", userId: context.userId };
    return { allowed: false, level: "denied", userId: context.userId };
  });

/** Helper para usar dentro de outras serverFns: lança se o caller não puder. */
export async function assertCoreHealthAccess(ctx: { supabase: any; userId: string }): Promise<CoreAccessLevel> {
  const { data: staff } = await ctx.supabase.rpc("is_impulsionando_staff", { _user: ctx.userId });
  if (staff) return "staff";
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (isAdmin) return "admin";
  throw new Response("Forbidden: requires Impulsionando staff or admin role", { status: 403 });
}
