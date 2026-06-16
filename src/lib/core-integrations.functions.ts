import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("core_integrations")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getIntegration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("core_integrations").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      slug: z.string().min(1),
      environment: z.enum(["sandbox", "production"]).optional(),
      config: z.record(z.string(), z.any()).optional(),
      status: z.enum(["not_configured", "connected", "error", "disabled"]).optional(),
      is_active: z.boolean().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const patch: Record<string, unknown> = {};
    if (data.environment !== undefined) patch.environment = data.environment;
    if (data.config !== undefined) patch.config = data.config;
    if (data.status !== undefined) patch.status = data.status;
    if (data.is_active !== undefined) patch.is_active = data.is_active;
    const { error } = await context.supabase
      .from("core_integrations").update(patch as any).eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listIntegrationLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1), limit: z.number().int().min(1).max(200).default(50) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("core_integration_logs")
      .select("*")
      .eq("integration_slug", data.slug)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      slug: z.string().min(1),
      event: z.string().min(1).default("ping"),
      payload: z.record(z.string(), z.any()).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: integ } = await supabaseAdmin
      .from("core_integrations").select("*").eq("slug", data.slug).maybeSingle();
    if (!integ) throw new Error("Integração não encontrada");

    const started = Date.now();
    let status: "success" | "error" = "success";
    let response: any = null;
    let errorMsg: string | null = null;

    try {
      if (data.slug === "n8n") {
        const url: string | undefined =
          (integ.config?.webhooks?.[data.event] as string | undefined) ||
          (integ.config?.base_url as string | undefined);
        if (!url) throw new Error("URL do webhook não configurada");
        const r = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ event: data.event, source: "impulsionando-core", payload: data.payload ?? {} }),
        });
        response = { status: r.status, ok: r.ok, body: await r.text().then((t) => t.slice(0, 2000)) };
        if (!r.ok) { status = "error"; errorMsg = `HTTP ${r.status}`; }
      } else if (data.slug === "mercadopago") {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado nas secrets");
        const r = await fetch("https://api.mercadopago.com/users/me", {
          headers: { authorization: `Bearer ${token}` },
        });
        const body = await r.json().catch(() => ({}));
        response = { status: r.status, ok: r.ok, body };
        if (!r.ok) { status = "error"; errorMsg = (body as any)?.message ?? `HTTP ${r.status}`; }
      } else {
        throw new Error(`Slug desconhecido: ${data.slug}`);
      }
    } catch (e) {
      status = "error";
      errorMsg = e instanceof Error ? e.message : String(e);
    }

    const duration = Date.now() - started;
    await supabaseAdmin.from("core_integration_logs").insert({
      integration_slug: data.slug,
      event_type: data.event,
      status,
      request: { event: data.event, payload: data.payload ?? {} },
      response,
      error: errorMsg,
      duration_ms: duration,
    });
    await supabaseAdmin.from("core_integrations").update({
      last_test_at: new Date().toISOString(),
      last_error: errorMsg,
      status: status === "success" ? "connected" : "error",
    }).eq("slug", data.slug);

    return { status, duration_ms: duration, error: errorMsg, response };
  });

// ============= BRIEFINGS (Sob Medida) =============

const BriefingSchema = z.object({
  contact_name: z.string().trim().min(2).max(120),
  contact_email: z.string().trim().email().max(200),
  contact_whatsapp: z.string().trim().min(8).max(40),
  company_name: z.string().trim().min(2).max(160),
  niche: z.string().trim().max(80).optional(),
  team_size: z.string().trim().max(40).optional(),
  budget_range: z.string().trim().max(80).optional(),
  urgency: z.string().trim().max(80).optional(),
  current_tools: z.string().trim().max(2000).optional(),
  goals: z.string().trim().max(2000).optional(),
  required_modules: z.array(z.string()).max(50).optional(),
  integrations_needed: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(4000).optional(),
  answers: z.record(z.string(), z.any()).optional(),
  source: z.string().trim().max(80).optional(),
});

export const submitBriefing = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => BriefingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("core_briefings")
      .insert({ ...data, status: "new" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Best-effort: notify n8n if configured
    try {
      const { data: integ } = await supabaseAdmin
        .from("core_integrations").select("config,is_active").eq("slug", "n8n").maybeSingle();
      const url = integ?.is_active ? (integ.config as any)?.webhooks?.briefing_received : null;
      if (url) {
        await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ event: "briefing_received", briefing_id: row.id, ...data }),
        });
      }
    } catch (e) {
      console.warn("[submitBriefing] n8n notify failed:", e instanceof Error ? e.message : e);
    }

    return { id: row.id };
  });

export const listBriefings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ status: z.string().optional() }).optional().parse(data) ?? {},
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    let q = context.supabase.from("core_briefings").select("*").order("created_at", { ascending: false }).limit(200);
    if (data?.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const updateBriefingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "reviewing", "quoted", "won", "lost", "archived"]),
      notes: z.string().max(4000).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const patch: Record<string, unknown> = { status: data.status, reviewed_at: new Date().toISOString() };
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await context.supabase.from("core_briefings").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
