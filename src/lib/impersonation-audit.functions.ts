import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const logSchema = z.object({
  targetCompanyId: z.string().uuid(),
  targetCompanyName: z.string().optional().nullable(),
  action: z.enum(["start", "stop"]),
  reason: z.string().max(500).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
});

export const logImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => logSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const { error } = await (supabase as any).from("core_impersonation_audit").insert({
      actor_user_id: userId,
      actor_email: (claims as any)?.email ?? null,
      target_company_id: data.targetCompanyId,
      target_company_name: data.targetCompanyName ?? null,
      action: data.action,
      reason: data.reason ?? null,
      user_agent: data.userAgent ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


const listSchema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  targetCompanyId: z.string().uuid().optional(),
  actorUserId: z.string().uuid().optional(),
});

export const listImpersonationAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    let q = supabase
      .from("core_impersonation_audit")
      .select("id, actor_user_id, actor_email, target_company_id, target_company_name, action, reason, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.targetCompanyId) q = q.eq("target_company_id", data.targetCompanyId);
    if (data.actorUserId) q = q.eq("actor_user_id", data.actorUserId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Array<Record<string, any>> };
  });

