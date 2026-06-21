import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const listFunnelRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("core_funnel_rules" as any)
      .select("*")
      .order("stage")
      .order("niche_slug", { nullsFirst: true })
      .order("event_name");
    if (error) throw new Error(error.message);
    return { rules: (data ?? []) as any[] };
  });

export const updateFunnelRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    active?: boolean;
    delay_minutes?: number;
    workflow_name?: string;
    description?: string | null;
    payload_template?: any;
  }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const patch: any = {};
    if (data.active !== undefined) patch.active = data.active;
    if (data.delay_minutes !== undefined) patch.delay_minutes = data.delay_minutes;
    if (data.workflow_name !== undefined) patch.workflow_name = data.workflow_name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.payload_template !== undefined) patch.payload_template = data.payload_template;
    const { error } = await context.supabase.from("core_funnel_rules" as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const dryRunFunnelRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; sampleContext?: Record<string, any> }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: rule, error } = await context.supabase
      .from("core_funnel_rules" as any)
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !rule) throw new Error(error?.message ?? "Rule not found");
    const r = rule as any;
    const ctx = data.sampleContext ?? {
      lead: { first_name: "Maria", id: "demo-lead-id" },
      property: { title: "Apto 2 dorm — Centro" },
      visit: { scheduled_at: new Date(Date.now() + 86400000).toISOString() },
      ticket: { qr_url: "https://example/qr.png" },
    };
    const renderedPayload = renderTemplate(r.payload_template ?? {}, ctx);
    const scheduledAt = new Date(Date.now() + (r.delay_minutes ?? 0) * 60000).toISOString();
    return {
      rule: { id: r.id, stage: r.stage, event_name: r.event_name, workflow_name: r.workflow_name, active: r.active, niche_slug: r.niche_slug },
      preview: { scheduled_at: scheduledAt, payload: renderedPayload, dry_run: true, note: "Nenhum disparo real enviado ao N8N." },
    };
  });

function renderTemplate(tpl: any, ctx: Record<string, any>): any {
  if (typeof tpl === "string") {
    return tpl.replace(/{{\s*([\w.]+)\s*}}/g, (_, path) => {
      const v = path.split(".").reduce((o: any, k: string) => (o == null ? o : o[k]), ctx);
      return v == null ? "" : String(v);
    });
  }
  if (Array.isArray(tpl)) return tpl.map((x) => renderTemplate(x, ctx));
  if (tpl && typeof tpl === "object") {
    const out: any = {};
    for (const k of Object.keys(tpl)) out[k] = renderTemplate(tpl[k], ctx);
    return out;
  }
  return tpl;
}
