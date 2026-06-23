// W28 — Branding Completeness: agrega identidade, e-mails e domínio em um % único.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Check = { key: string; label: string; done: boolean; hint?: string; href?: string };

export const getBrandingCompleteness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) =>
    z.object({ companyId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const [coRes, idRes, alRes] = await Promise.all([
      supabase
        .from("companies")
        .select("name, trade_name, logo_url, primary_color, secondary_color, phone, whatsapp, email")
        .eq("id", data.companyId)
        .maybeSingle(),
      supabase
        .from("core_tenant_identity")
        .select("subdomain, custom_domain, dns_status, ssl_status, provisioned_at")
        .eq("company_id", data.companyId)
        .maybeSingle(),
      supabase
        .from("core_tenant_email_aliases")
        .select("id, is_active, is_default, purpose")
        .eq("company_id", data.companyId),
    ]);

    if (coRes.error) throw new Error(coRes.error.message);
    const co = coRes.data;
    const id = idRes.data;
    const aliases = alRes.data ?? [];

    const checks: Check[] = [
      {
        key: "name",
        label: "Nome / razão social",
        done: !!(co?.trade_name || co?.name),
        href: "/admin/branding",
      },
      {
        key: "logo",
        label: "Logo enviado",
        done: !!co?.logo_url,
        href: "/admin/branding",
      },
      {
        key: "colors",
        label: "Paleta primária + secundária",
        done: !!(co?.primary_color && co?.secondary_color),
        href: "/admin/branding",
      },
      {
        key: "contact",
        label: "Contato (e-mail e telefone/WhatsApp)",
        done: !!(co?.email && (co?.phone || co?.whatsapp)),
        href: "/admin/branding",
      },
      {
        key: "subdomain",
        label: "Subdomínio Impulsionando provisionado",
        done: !!id?.subdomain && !!id?.provisioned_at,
        href: "/admin/branding",
      },
      {
        key: "custom_domain",
        label: "Domínio próprio configurado",
        done: !!id?.custom_domain,
        hint: id?.custom_domain
          ? `DNS: ${id.dns_status} · SSL: ${id.ssl_status}`
          : "Opcional — fortalece marca",
        href: "/admin/branding",
      },
      {
        key: "dns_active",
        label: "DNS verificado (domínio próprio)",
        done: !!id?.custom_domain && ["active", "verified", "ok"].includes((id?.dns_status ?? "").toLowerCase()),
        href: "/admin/branding",
      },
      {
        key: "aliases",
        label: "E-mails do time (≥1 ativo)",
        done: aliases.some((a) => a.is_active),
        href: "/admin/branding",
      },
      {
        key: "alias_default",
        label: "E-mail padrão definido",
        done: aliases.some((a) => a.is_default && a.is_active),
        href: "/admin/branding",
      },
    ];

    const total = checks.length;
    const done = checks.filter((c) => c.done).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    return {
      generatedAt: new Date().toISOString(),
      total,
      done,
      percent,
      checks,
    };
  });
