// Server functions da integração Hostinger.
// Uso: componentes chamam via useServerFn; nunca chamar a API Hostinger direto do browser.
//
// Autorização:
// - Todas exigem sessão (requireSupabaseAuth).
// - Ações de escrita exigem staff Impulsionando OU role admin/owner na companyId alvo.
// - Leitura de recursos por companyId respeita RLS (o supabase do contexto usa o token do user).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

async function assertCanWrite(context: any, companyId: string) {
  const { supabase, userId } = context;
  const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", {
    _user: userId,
  });
  if (isStaff) return true;
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .in("role", ["owner", "admin"])
    .maybeSingle();
  if (!role) throw new Error("Sem permissão para gerenciar esta empresa.");
  return true;
}

// ------- Domain availability & pricing -----------------------
export const checkDomainAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domain: string }) =>
    z
      .object({ domain: z.string().trim().toLowerCase().refine((v) => DOMAIN_RE.test(v), "Domínio inválido") })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { hostingerFetch } = await import("./hostinger/client.server");
    const res = await hostingerFetch<any>({
      op: "domain.check",
      method: "POST",
      path: "/domains/v1/availability",
      body: { domain: data.domain, with_alternatives: true },
    });
    return { ok: res.ok, error: res.error, data: res.data };
  });

// ------- List domains of a company ---------------------------
export const listCompanyDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) =>
    z.object({ companyId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("hostinger_domains" as any)
      .select("*")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ------- Register / provision a domain -----------------------
export const registerDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      companyId: string;
      domain: string;
      years: number;
      contact?: Record<string, unknown>;
      nameservers?: string[];
    }) =>
      z
        .object({
          companyId: z.string().uuid(),
          domain: z.string().trim().toLowerCase().refine((v) => DOMAIN_RE.test(v)),
          years: z.number().int().min(1).max(10),
          contact: z.record(z.unknown()).optional(),
          nameservers: z.array(z.string()).max(4).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanWrite(context, data.companyId);
    const { hostingerFetch } = await import("./hostinger/client.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) tenta comprar via API
    const res = await hostingerFetch<any>({
      op: "domain.register",
      method: "POST",
      path: "/domains/v1/purchase",
      body: {
        domain: data.domain,
        period: data.years,
        contact: data.contact,
        nameservers: data.nameservers,
      },
    });

    // 2) grava intent + resultado (sempre — pra auditar falhas também)
    const status = res.ok ? "active" : "failed";
    await (supabaseAdmin as any).from("hostinger_orders").insert({
      company_id: data.companyId,
      kind: "domain_register",
      reference: data.domain,
      status: res.ok ? "paid" : "failed",
      hostinger_order_id: (res.data as any)?.order_id ?? null,
      payload: { request: { years: data.years }, response: res.data, error: res.error },
      created_by: context.userId,
    });

    if (res.ok) {
      await (supabaseAdmin as any).from("hostinger_domains").upsert(
        {
          company_id: data.companyId,
          domain: data.domain,
          status,
          registered_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + data.years * 365 * 86400_000).toISOString(),
          nameservers: data.nameservers ?? [],
          hostinger_domain_id: (res.data as any)?.domain_id ?? null,
          hostinger_order_id: (res.data as any)?.order_id ?? null,
          meta: res.data ?? {},
        },
        { onConflict: "domain" },
      );
    }

    return { ok: res.ok, error: res.error, data: res.data };
  });

// ------- Mailboxes -------------------------------------------
export const listCompanyMailboxes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) =>
    z.object({ companyId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("hostinger_mailboxes" as any)
      .select("*")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createMailbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; domain: string; address: string; password: string; quotaMb?: number }) =>
    z
      .object({
        companyId: z.string().uuid(),
        domain: z.string().refine((v) => DOMAIN_RE.test(v)),
        address: z.string().email(),
        password: z.string().min(8).max(128),
        quotaMb: z.number().int().min(256).max(51200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanWrite(context, data.companyId);
    const { hostingerFetch } = await import("./hostinger/client.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const res = await hostingerFetch<any>({
      op: "mailbox.create",
      method: "POST",
      path: "/emails/v1/mailboxes",
      body: {
        domain: data.domain,
        email: data.address,
        password: data.password,
        quota_mb: data.quotaMb ?? 1024,
      },
    });

    if (res.ok) {
      await (supabaseAdmin as any).from("hostinger_mailboxes").upsert(
        {
          company_id: data.companyId,
          domain: data.domain,
          address: data.address,
          quota_mb: data.quotaMb ?? 1024,
          status: "active",
          hostinger_mailbox_id: (res.data as any)?.id ?? null,
          meta: res.data ?? {},
        },
        { onConflict: "address" },
      );
    }
    return { ok: res.ok, error: res.error };
  });

// ------- VPS -------------------------------------------------
export const listCompanyVps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId?: string }) =>
    z.object({ companyId: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("hostinger_vps" as any).select("*").order("hostname");
    if (data.companyId) q = q.eq("company_id", data.companyId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const syncVpsFromHostinger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", {
      _user: context.userId,
    });
    if (!isStaff) throw new Error("Apenas staff Impulsionando pode sincronizar VPS.");

    const { hostingerFetch } = await import("./hostinger/client.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await hostingerFetch<any>({
      op: "vps.list",
      method: "GET",
      path: "/vps/v1/virtual-machines",
    });
    if (!res.ok) return { ok: false, error: res.error, count: 0 };

    const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
    for (const vm of list) {
      await (supabaseAdmin as any).from("hostinger_vps").upsert(
        {
          hostinger_vps_id: String(vm.id ?? vm.uuid ?? vm.name),
          hostname: vm.hostname ?? null,
          plan: vm.plan ?? null,
          region: vm.location ?? vm.region ?? null,
          status: vm.status ?? "unknown",
          ipv4: vm.ipv4 ?? [],
          ipv6: vm.ipv6 ?? [],
          last_synced_at: new Date().toISOString(),
          meta: vm,
        },
        { onConflict: "hostinger_vps_id" },
      );
    }
    return { ok: true, count: list.length };
  });

export const vpsAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { vpsId: string; action: "start" | "stop" | "reboot" }) =>
    z.object({ vpsId: z.string(), action: z.enum(["start", "stop", "reboot"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", {
      _user: context.userId,
    });
    if (!isStaff) throw new Error("Apenas staff Impulsionando pode agir sobre VPS.");
    const { hostingerFetch } = await import("./hostinger/client.server");
    const res = await hostingerFetch<any>({
      op: `vps.${data.action}`,
      method: "POST",
      path: `/vps/v1/virtual-machines/${encodeURIComponent(data.vpsId)}/${data.action}`,
    });
    return { ok: res.ok, error: res.error };
  });
