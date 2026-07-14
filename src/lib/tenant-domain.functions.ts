// Server fns para gestão do domínio próprio do tenant (W27).
// Lê/atualiza core_tenant_identity respeitando RLS (member lê; admin/staff escreve).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export const INDEPENDENT_DNS = {
  aRecordValue: process.env.PUBLIC_DNS_A_TARGET ?? "<IP_DA_INFRA_INDEPENDENTE>",
  cnameValue: process.env.PUBLIC_DNS_CNAME_TARGET ?? new URL(process.env.PUBLIC_APP_URL ?? "https://impulsionando.com.br").hostname,
  txtName: "_site_verification",
  txtValuePrefix: "impulsionando_verify=",
};

export const getMyTenantDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) =>
    z.object({ companyId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: identity, error } = await supabase
      .from("core_tenant_identity")
      .select(
        "id, company_id, subdomain, root_domain, full_domain, custom_domain, dns_status, dns_error, dns_last_checked_at, ssl_status, ssl_issued_at, ssl_expires_at, provisioned_at, published_at, updated_at",
      )
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { identity, lovable: INDEPENDENT_DNS };
  });

export const requestCustomDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; customDomain: string | null }) =>
    z
      .object({
        companyId: z.string().uuid(),
        customDomain: z
          .string()
          .trim()
          .toLowerCase()
          .nullable()
          .refine((v) => v === null || v === "" || DOMAIN_RE.test(v), "Domínio inválido"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const value = data.customDomain && data.customDomain !== "" ? data.customDomain : null;

    const { data: prev } = await supabase
      .from("core_tenant_identity")
      .select("custom_domain, dns_status, ssl_status")
      .eq("company_id", data.companyId)
      .maybeSingle();

    const { data: updated, error } = await supabase
      .from("core_tenant_identity")
      .update({
        custom_domain: value,
        dns_status: value ? "pending" : "not_configured",
        ssl_status: value ? "pending" : "not_configured",
        dns_error: null,
        dns_last_checked_at: null,
        provisioned_at: null,
      })
      .eq("company_id", data.companyId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      company_id: data.companyId,
      user_id: userId,
      action: "tenant.domain.requested",
      entity: "core_tenant_identity",
      entity_id: updated?.id ?? null,
      before: prev ?? null,
      after: { custom_domain: value },
      metadata: { source: "admin/branding" },
    });

    if (value) {
      await supabase
        .from("onboarding_checklist")
        .upsert(
          { company_id: data.companyId, item_key: "domain_requested", status: "done", completed_at: new Date().toISOString() },
          { onConflict: "company_id,item_key" },
        );
    }

    return { ok: true, identity: updated };
  });

export const recheckTenantDns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) =>
    z.object({ companyId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("core_tenant_identity")
      .update({ dns_last_checked_at: new Date().toISOString() })
      .eq("company_id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true, checkedAt: new Date().toISOString() };
  });
