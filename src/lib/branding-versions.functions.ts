import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CompanyIdSchema = z.object({ companyId: z.string().uuid() });

/** Lista versões (rascunho/publicada/arquivada) de branding da empresa. */
export const listBrandingVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CompanyIdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("core_branding_versions")
      .select("id, version_number, status, trade_name, logo_url, primary_color, secondary_color, notes, created_at, published_at, created_by")
      .eq("company_id", data.companyId)
      .order("version_number", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const { data: live } = await context.supabase
      .from("companies")
      .select("trade_name, name, logo_url, primary_color, secondary_color")
      .eq("id", data.companyId)
      .maybeSingle();

    return { versions: rows ?? [], live };
  });

/** Cria um snapshot rascunho com o estado ATUAL da empresa. */
export const saveBrandingDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    CompanyIdSchema.extend({ notes: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: live, error: liveErr } = await context.supabase
      .from("companies")
      .select("trade_name, name, logo_url, primary_color, secondary_color")
      .eq("id", data.companyId)
      .maybeSingle();
    if (liveErr || !live) throw new Error(liveErr?.message || "Empresa não encontrada");

    const { data: max } = await context.supabase
      .from("core_branding_versions")
      .select("version_number")
      .eq("company_id", data.companyId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const next = (max?.version_number ?? 0) + 1;

    const { data: row, error } = await context.supabase
      .from("core_branding_versions")
      .insert({
        company_id: data.companyId,
        version_number: next,
        status: "draft",
        trade_name: live.trade_name ?? live.name,
        logo_url: live.logo_url,
        primary_color: live.primary_color,
        secondary_color: live.secondary_color,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { version: row };
  });

/** Publica uma versão: arquiva a anterior publicada e marca esta como publicada. */
export const publishBrandingVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ companyId: z.string().uuid(), versionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("core_branding_versions")
      .update({ status: "archived" })
      .eq("company_id", data.companyId)
      .eq("status", "published");

    const { data: row, error } = await context.supabase
      .from("core_branding_versions")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", data.versionId)
      .eq("company_id", data.companyId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { version: row };
  });

/** Restaura uma versão: copia seus valores de volta para companies (vira o "live"). */
export const restoreBrandingVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ companyId: z.string().uuid(), versionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: v, error: vErr } = await context.supabase
      .from("core_branding_versions")
      .select("trade_name, logo_url, primary_color, secondary_color")
      .eq("id", data.versionId)
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (vErr || !v) throw new Error(vErr?.message || "Versão não encontrada");

    const { error } = await context.supabase
      .from("companies")
      .update({
        trade_name: v.trade_name,
        logo_url: v.logo_url,
        primary_color: v.primary_color,
        secondary_color: v.secondary_color,
      })
      .eq("id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBrandingVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ companyId: z.string().uuid(), versionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("core_branding_versions")
      .delete()
      .eq("id", data.versionId)
      .eq("company_id", data.companyId)
      .neq("status", "published");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
