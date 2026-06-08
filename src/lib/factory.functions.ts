import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ Site Templates ============
export const listSiteTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("site_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { templates: data ?? [] };
  });

export const upsertSiteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    name: string;
    slug: string;
    niche?: string | null;
    description?: string | null;
    pages?: unknown;
    sections?: unknown;
    default_colors?: unknown;
    status?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const payload = {
      name: data.name,
      slug: data.slug,
      niche: data.niche ?? null,
      description: data.description ?? null,
      pages: data.pages ?? [],
      sections: data.sections ?? [],
      default_colors: data.default_colors ?? {},
      status: data.status ?? "active",
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("site_templates")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("site_templates")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row!.id };
  });

export const deleteSiteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_templates")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ AI Prompt Library ============
export const listPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_prompt_library")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { prompts: data ?? [] };
  });

export const upsertPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    name: string;
    category?: string | null;
    niche?: string | null;
    purpose?: string | null;
    prompt: string;
    variables?: unknown;
    status?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const payload = {
      name: data.name,
      category: data.category ?? null,
      niche: data.niche ?? null,
      purpose: data.purpose ?? null,
      prompt: data.prompt,
      variables: data.variables ?? {},
      status: data.status ?? "active",
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("ai_prompt_library")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("ai_prompt_library")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row!.id };
  });

export const deletePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_prompt_library")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const incrementPromptUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("ai_prompt_library")
      .select("usage_count")
      .eq("id", data.id)
      .single();
    await context.supabase
      .from("ai_prompt_library")
      .update({ usage_count: (row?.usage_count ?? 0) + 1 })
      .eq("id", data.id);
    return { ok: true };
  });

// ============ Generated Pages ============
export const listGeneratedPagesByCompany = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("generated_pages")
      .select("*")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { pages: rows ?? [] };
  });
