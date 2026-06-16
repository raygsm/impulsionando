import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Site público da Impulsionando Brasil (/marketing):
 * - Leitura pública das páginas publicadas (anon).
 * - Captação de lead (anon, vai para marketing_leads).
 * Admin staff (/core/marketing-pages, /core/marketing-leads):
 * - CRUD de versões (drafts/publish) em generated_page_versions.
 * - Listagem e filtros dos marketing_leads originados pelo site.
 */

const IMPULSIONANDO_BRASIL_SUBDOMAIN = "impulsionando-brasil";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const fetchImpulsionandoBrasilPages = createServerFn({ method: "GET" }).handler(
  async () => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("generated_pages")
      .select("slug,name,content,status")
      .eq("status", "published");
    if (error) throw new Error(error.message);
    return { pages: (data ?? []) as Array<{ slug: string; name: string; content: any; status: string }> };
  },
);

const LeadInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  serviceSlug: z.string().min(1).max(60),
  serviceTag: z.string().min(1).max(60),
  pageUrl: z.string().max(500).optional(),
});

export const submitImpulsionandoBrasilLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LeadInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { error } = await sb.from("marketing_leads").insert({
      source: "contato",
      status: "new",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      company: data.company ?? null,
      message: data.message ?? null,
      page_url: data.pageUrl ?? null,
      notes: `[Impulsionando Brasil] ${data.serviceTag} · serviço: ${data.serviceSlug}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// Staff-only: leads dashboard
// ============================================================

const StaffLeadsInput = z.object({
  serviceSlug: z.string().optional(),
  status: z.string().optional(),
  daysBack: z.number().int().min(1).max(365).optional(),
});

export const fetchImpulsionandoLeadsForStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StaffLeadsInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", { _user: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    let q = context.supabase
      .from("marketing_leads")
      .select("id,name,email,phone,company,source,status,notes,page_url,created_at")
      .ilike("notes", "[Impulsionando Brasil]%")
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.status) q = q.eq("status", data.status);
    if (data.daysBack) {
      const since = new Date(Date.now() - data.daysBack * 86_400_000).toISOString();
      q = q.gte("created_at", since);
    }
    if (data.serviceSlug) q = q.ilike("notes", `%serviço: ${data.serviceSlug}%`);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Agrega por serviço (extrai do notes)
    const byService: Record<string, { total: number; conv: number }> = {};
    let totalConv = 0;
    for (const r of rows ?? []) {
      const m = (r.notes ?? "").match(/serviço:\s*([\w-]+)/);
      const k = m?.[1] ?? "geral";
      byService[k] ??= { total: 0, conv: 0 };
      byService[k].total += 1;
      if (r.status === "won" || r.status === "converted") {
        byService[k].conv += 1;
        totalConv += 1;
      }
    }

    return { leads: rows ?? [], byService, totalConv };
  });

// ============================================================
// Staff-only: CMS para /marketing (generated_pages + versions)
// ============================================================

export const fetchMarketingPagesAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", { _user: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    const { data: company, error: cErr } = await context.supabase
      .from("companies").select("id").eq("subdomain", IMPULSIONANDO_BRASIL_SUBDOMAIN).maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!company) return { pages: [] };

    const { data, error } = await context.supabase
      .from("generated_pages")
      .select("id,slug,name,content,status,updated_at")
      .eq("company_id", company.id)
      .order("name");
    if (error) throw new Error(error.message);
    return { pages: data ?? [] };
  });

const SaveDraftInput = z.object({
  pageId: z.string().uuid(),
  content: z.unknown(),
  note: z.string().max(500).optional(),
});

export const saveMarketingPageDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveDraftInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", { _user: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    const { data: row, error } = await context.supabase
      .from("generated_page_versions")
      .insert({
        page_id: data.pageId,
        content: data.content as any,
        status: "draft",
        note: data.note ?? null,
        created_by: context.userId,
      })
      .select("id,created_at")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, versionId: row.id, createdAt: row.created_at };
  });

const PublishInput = z.object({
  pageId: z.string().uuid(),
  content: z.unknown(),
  note: z.string().max(500).optional(),
});

export const publishMarketingPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PublishInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", { _user: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    // 1) snapshot publicado em versions
    const { error: vErr } = await context.supabase.from("generated_page_versions").insert({
      page_id: data.pageId,
      content: data.content as any,
      status: "published",
      note: data.note ?? null,
      created_by: context.userId,
    });
    if (vErr) throw new Error(vErr.message);

    // 2) aplica em generated_pages (o que o site lê)
    const { error: pErr } = await context.supabase
      .from("generated_pages")
      .update({ content: data.content as any, status: "published" })
      .eq("id", data.pageId);
    if (pErr) throw new Error(pErr.message);

    return { ok: true };
  });

export const fetchMarketingPageVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ pageId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", { _user: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    const { data: rows, error } = await context.supabase
      .from("generated_page_versions")
      .select("id,status,note,created_at,created_by")
      .eq("page_id", data.pageId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { versions: rows ?? [] };
  });
