/**
 * Server fns para o editor de tenants em /admin/tenants-editor.
 * Somente admins do core podem listar/atualizar.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminOrAudit } from "@/lib/security-audit.server";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type TenantRow = {
  id: string;
  name: string;
  trade_name: string | null;
  public_slug: string | null;
  subdomain: string | null;
  domain: string | null;
  segment: string | null;
  address_city: string | null;
  address_state: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  tagline: string | null;
  vitrine_enabled: boolean;
  status: string;
  environment: string;
};

export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      target_kind: "companies",
      metadata: { source: "tenants-editor" },
    });
    const { data, error } = await context.supabase
      .from("companies")
      .select(
        "id,name,trade_name,public_slug,subdomain,domain,segment,address_city,address_state,whatsapp,phone,email,website,logo_url,tagline,vitrine_enabled,status,environment",
      )
      .neq("status", "archived")
      .order("name");
    if (error) throw new Error(error.message);
    return { tenants: (data ?? []) as TenantRow[] };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  public_slug: z.string().trim().min(2).max(60).regex(SLUG_RE, "Slug: use apenas a-z, 0-9 e hífen").nullable().optional(),
  name: z.string().trim().min(1).max(200).optional(),
  trade_name: z.string().trim().max(200).nullable().optional(),
  segment: z.string().trim().max(80).nullable().optional(),
  address_city: z.string().trim().max(120).nullable().optional(),
  address_state: z.string().trim().max(2).nullable().optional(),
  whatsapp: z.string().trim().max(30).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email("E-mail inválido").max(160).nullable().optional().or(z.literal("")),
  website: z.string().trim().url("URL inválida").max(400).nullable().optional().or(z.literal("")),
  logo_url: z.string().trim().url("URL inválida").max(600).nullable().optional().or(z.literal("")),
  tagline: z.string().trim().max(240).nullable().optional(),
  domain: z.string().trim().max(200).nullable().optional(),
  vitrine_enabled: z.boolean().optional(),
});

export const updateTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => updateSchema.parse(data))
  .handler(async ({ context, data }) => {
    await requireAdminOrAudit(context.supabase, context.userId, {
      target_kind: "companies",
      target_id: data.id,
      metadata: { source: "tenants-editor", op: "update" },
    });

    const { id, ...rawPatch } = data;
    // Normaliza strings vazias em null (para campos opcionais)
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawPatch)) {
      if (v === undefined) continue;
      patch[k] = v === "" ? null : v;
    }

    const { data: updated, error } = await context.supabase
      .from("companies")
      .update(patch)
      .eq("id", id)
      .select("id,public_slug,domain,vitrine_enabled,logo_url,whatsapp,email,website")
      .single();
    if (error) throw new Error(error.message);
    return { tenant: updated };
  });
