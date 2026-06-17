/**
 * RBAC server functions for the consolidated diagnostic page.
 * Returns whether the caller is allowed to view integration health.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const checkDiagnosticAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff } = await context.supabase.rpc("is_impulsionando_staff", {
      _user: context.userId,
    });
    if (staff) return { allowed: true, level: "staff" as const };

    const { data: admin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (admin) return { allowed: true, level: "admin" as const };

    return { allowed: false, level: "denied" as const };
  });
