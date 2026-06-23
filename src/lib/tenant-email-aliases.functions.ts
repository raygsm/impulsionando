import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PURPOSES = ["contato", "financeiro", "suporte", "comercial", "no-reply", "custom"] as const;

export const listEmailAliases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: identity } = await context.supabase
      .from("core_tenant_identity")
      .select("id, subdomain, root_domain, full_domain, custom_domain, dns_status, ssl_status")
      .eq("company_id", data.companyId)
      .maybeSingle();
    const { data: aliases, error } = await context.supabase
      .from("core_tenant_email_aliases")
      .select("id, alias, purpose, full_address, forward_to, is_active, is_default, dns_status, updated_at")
      .eq("company_id", data.companyId)
      .order("purpose", { ascending: true });
    if (error) throw new Error(error.message);
    return { identity, aliases: aliases ?? [] };
  });

const UpsertSchema = z.object({
  companyId: z.string().uuid(),
  id: z.string().uuid().optional(),
  alias: z.string().min(1).max(64).regex(/^[a-z0-9._-]+$/, "use minúsculas, números, . _ -"),
  purpose: z.enum(PURPOSES),
  forward_to: z.string().email().nullable().optional(),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

export const upsertEmailAlias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: identity } = await context.supabase
      .from("core_tenant_identity")
      .select("id, custom_domain, full_domain")
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (!identity) throw new Error("Tenant identity ausente — provisione o subdomínio primeiro.");
    const domain = identity.custom_domain || identity.full_domain;
    if (!domain) throw new Error("Domínio do tenant não resolvido.");
    const full_address = `${data.alias}@${domain}`;

    if (data.is_default) {
      await context.supabase
        .from("core_tenant_email_aliases")
        .update({ is_default: false })
        .eq("company_id", data.companyId);
    }

    const payload = {
      company_id: data.companyId,
      identity_id: identity.id,
      alias: data.alias,
      purpose: data.purpose,
      full_address,
      forward_to: data.forward_to ?? null,
      is_active: data.is_active,
      is_default: data.is_default,
    };

    const q = data.id
      ? context.supabase.from("core_tenant_email_aliases").update(payload).eq("id", data.id).select().single()
      : context.supabase.from("core_tenant_email_aliases").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return { alias: row };
  });

export const deleteEmailAlias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("core_tenant_email_aliases").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
