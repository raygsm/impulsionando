import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    company_id?: string;
    white_label_id?: string;
    user_email?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("audit_logs")
      .select("id, company_id, user_id, user_email, action, entity, entity_id, before, after, metadata, created_at, companies:company_id(name)")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 500, 2000));
    if (data.company_id) q = q.eq("company_id", data.company_id);
    if (data.user_email) q = q.ilike("user_email", `%${data.user_email}%`);
    if (data.action) q = q.ilike("action", `%${data.action}%`);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const auditFilterOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [actions, entities, companies] = await Promise.all([
      context.supabase.from("audit_logs").select("action").limit(2000),
      context.supabase.from("audit_logs").select("entity").limit(2000),
      context.supabase.from("companies").select("id, name").order("name").limit(500),
    ]);
    const uniq = (arr: { action?: string; entity?: string }[] | null, k: "action" | "entity") =>
      Array.from(new Set((arr ?? []).map((r) => r[k]).filter(Boolean) as string[])).sort();
    return {
      actions: uniq(actions.data, "action"),
      entities: uniq(entities.data, "entity"),
      companies: companies.data ?? [],
    };
  });
