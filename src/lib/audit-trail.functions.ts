import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const fetchAuditTrail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    days?: number;
    entity?: string;
    entityId?: string;
    action?: string;
    userEmail?: string;
    companyId?: string;
    limit?: number;
  } = {}) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const days = Math.min(Math.max(data.days ?? 30, 1), 365);
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const limit = Math.min(data.limit ?? 200, 1000);

    let q = context.supabase
      .from("audit_logs" as any)
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.entityId) q = q.eq("entity_id", data.entityId);
    if (data.action) q = q.ilike("action", `%${data.action}%`);
    if (data.userEmail) q = q.ilike("user_email", `%${data.userEmail}%`);
    if (data.companyId) q = q.eq("company_id", data.companyId);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Aggregations
    const byEntity: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    for (const r of (rows ?? []) as any[]) {
      byEntity[r.entity] = (byEntity[r.entity] ?? 0) + 1;
      byAction[r.action] = (byAction[r.action] ?? 0) + 1;
      if (r.user_email) byUser[r.user_email] = (byUser[r.user_email] ?? 0) + 1;
    }

    // Compute diff stats per row (top-level keys changed)
    const events = (rows ?? []).map((r: any) => {
      const diff = computeDiff(r.before, r.after);
      return { ...r, changedKeys: diff.changedKeys, addedKeys: diff.addedKeys, removedKeys: diff.removedKeys };
    });

    return {
      events,
      stats: {
        total: events.length,
        topEntities: topN(byEntity, 5),
        topActions: topN(byAction, 5),
        topUsers: topN(byUser, 5),
      },
      since,
    };
  });

function computeDiff(before: any, after: any) {
  const b = before && typeof before === "object" ? before : {};
  const a = after && typeof after === "object" ? after : {};
  const changedKeys: string[] = [];
  const addedKeys: string[] = [];
  const removedKeys: string[] = [];
  for (const k of Object.keys(a)) {
    if (!(k in b)) addedKeys.push(k);
    else if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) changedKeys.push(k);
  }
  for (const k of Object.keys(b)) if (!(k in a)) removedKeys.push(k);
  return { changedKeys, addedKeys, removedKeys };
}

function topN(obj: Record<string, number>, n: number) {
  return Object.entries(obj).sort((x, y) => y[1] - x[1]).slice(0, n).map(([k, v]) => ({ key: k, count: v }));
}
