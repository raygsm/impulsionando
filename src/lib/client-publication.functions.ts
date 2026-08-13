import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveClientCompanyBySlug } from "@/lib/client-registry";
import { z } from "zod";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

export const getClientPublication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const resolved = await resolveClientCompanyBySlug(context.supabase as any, data.slug);
    if (!resolved) return null;
    const { data: row, error } = await (context.supabase as any)
      .from("communication_tenants")
      .select("id,slug,display_name,company_id,active,settings,updated_at")
      .eq("id", resolved.registry.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      registry: row,
      company: resolved.company,
      publication: row?.settings?.publication ?? null,
    };
  });

export const markClientPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ slug: z.string().min(1), commit: z.string().min(7).max(64), builtAt: z.string().datetime().optional() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const resolved = await resolveClientCompanyBySlug(context.supabase as any, data.slug);
    if (!resolved) throw new Error("Cliente não encontrado no registry");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current, error: readError } = await (supabaseAdmin as any)
      .from("communication_tenants")
      .select("id,company_id,settings")
      .eq("id", resolved.registry.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("Registry do cliente não encontrado");

    const publishedAt = data.builtAt ?? new Date().toISOString();
    const before = current.settings?.publication ?? null;
    const after = { published_at: publishedAt, published_commit: data.commit, source: "admin_panel" };
    const settings = { ...(current.settings ?? {}), publication: after };

    const { error: updateError } = await (supabaseAdmin as any)
      .from("communication_tenants")
      .update({ settings, updated_at: new Date().toISOString() })
      .eq("id", current.id);
    if (updateError) throw new Error(updateError.message);

    const { error: auditError } = await (supabaseAdmin as any).from("audit_logs").insert({
      company_id: current.company_id ?? null,
      user_id: context.userId,
      action: "client.deploy.marked",
      entity: "communication_tenants",
      entity_type: "client_registry",
      entity_id: current.id,
      before,
      after,
      metadata: { slug: data.slug, source: "admin_panel" },
    });
    if (auditError) throw new Error(auditError.message);
    return { ok: true, publishedAt, commit: data.commit };
  });

export const listClientDeployHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ slug: z.string().min(1), limit: z.number().int().min(1).max(50).optional() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const resolved = await resolveClientCompanyBySlug(context.supabase as any, data.slug);
    if (!resolved) return { rows: [] };
    const { data: rows, error } = await (context.supabase as any)
      .from("audit_logs")
      .select("id,created_at,action,user_email,before,after,metadata")
      .eq("entity", "communication_tenants")
      .eq("entity_id", resolved.registry.id)
      .eq("action", "client.deploy.marked")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 10);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });
