// Server fn — marca o tenant como "publicado agora" registrando
// `published_at` = now() e `published_commit` = BUILD_INFO atual.
// Usado pelo painel /admin/clientes/{slug}/dominio quando o operador
// confirma que o último build foi promovido ao tenant.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const markTenantPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        slug: z.string().min(1),
        commit: z.string().min(7).max(64),
        builtAt: z.string().datetime().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: company, error: cErr } = await supabase
      .from("companies")
      .select("id")
      .eq("subdomain", data.slug)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!company) throw new Error("Tenant não encontrado");

    const { data: prev } = await supabase
      .from("core_tenant_identity")
      .select("published_at,published_commit")
      .eq("company_id", company.id)
      .maybeSingle();

    const publishedAt = data.builtAt ?? new Date().toISOString();
    const { error } = await supabase
      .from("core_tenant_identity")
      .update({
        published_at: publishedAt,
        published_commit: data.commit,
      })
      .eq("company_id", company.id);
    if (error) throw error;

    await supabase.from("audit_logs").insert({
      company_id: company.id,
      user_id: userId,
      action: "tenant.deploy.marked",
      entity: "core_tenant_identity",
      entity_id: company.id,
      before: prev ?? null,
      after: { published_at: publishedAt, published_commit: data.commit },
      metadata: { slug: data.slug, source: "admin_panel" },
    });

    return { ok: true, publishedAt, commit: data.commit };
  });

// Lista os últimos eventos de deploy do tenant a partir do audit_logs.
// Usado pelo painel de domínio para mostrar histórico de promoções.
export const listTenantDeployHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        slug: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("subdomain", data.slug)
      .maybeSingle();
    if (!company) return { rows: [] };

    const { data: rows, error } = await supabase
      .from("audit_logs")
      .select("id,created_at,action,user_email,before,after,metadata")
      .eq("company_id", company.id)
      .eq("action", "tenant.deploy.marked")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 10);
    if (error) throw error;
    return { rows: rows ?? [] };
  });
