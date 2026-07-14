import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export type ClienteListItem = {
  id: string;
  name: string;
  trade_name: string | null;
  status: string;
  is_active: boolean;
  environment: string;
  segment: string | null;
  logo_url: string | null;
  created_at: string;
  users_count: number;
  health_score: number;
};

export const listCommandClientes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; status?: string; environment?: string }) => d ?? {})
  .handler(async ({ data, context }): Promise<ClienteListItem[]> => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("companies" as any)
      .select("id,name,trade_name,status,is_active,environment,segment,logo_url,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.environment && data.environment !== "all") q = q.eq("environment", data.environment);
    const { data: rows, error } = await q;
    if (error) throw error;

    const ids = (rows ?? []).map((r: any) => r.id);
    let counts: Record<string, number> = {};
    if (ids.length) {
      const { data: users } = await context.supabase
        .from("user_profiles" as any)
        .select("company_id")
        .in("company_id", ids);
      counts = (users ?? []).reduce((acc: Record<string, number>, u: any) => {
        acc[u.company_id] = (acc[u.company_id] ?? 0) + 1;
        return acc;
      }, {});
    }

    return (rows ?? []).map((r: any) => ({
      ...r,
      users_count: counts[r.id] ?? 0,
      health_score: r.is_active && r.status === "active" ? 90 : r.status === "suspended" ? 30 : 60,
    }));
  });
