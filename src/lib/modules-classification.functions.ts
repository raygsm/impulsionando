import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const listModulesClassification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("modules")
      .select("id,slug,name,category,kind,parent_module_id,is_active,sort_order")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

const UpdateSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["module", "resource"]),
  parent_module_id: z.string().uuid().nullable().optional(),
});

export const updateModuleClassification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const patch: Record<string, unknown> = { kind: data.kind };
    patch.parent_module_id = data.kind === "resource" ? data.parent_module_id ?? null : null;
    const { error } = await context.supabase.from("modules").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_logs").insert({
      action: "module.classification.updated",
      target_type: "module",
      target_id: data.id,
      actor_user_id: context.userId,
      payload: { kind: data.kind, parent_module_id: patch.parent_module_id },
    });
    return { ok: true };
  });
