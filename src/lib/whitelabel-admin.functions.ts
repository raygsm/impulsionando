/**
 * White-Label Admin — CRUD funcional (M8).
 * Apenas staff Impulsionando.
 *
 * Tabelas geridas:
 *  - wl_plans              (catálogo de planos WL)
 *  - wl_subscriptions      (assinatura do WL Owner em um plano)
 *  - wl_company_links      (vínculo de uma empresa-cliente ao WL Owner)
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ok, error } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!ok) throw new Error("Apenas equipe Impulsionando.");
  return supabaseAdmin;
}

export const listWhitelabelAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await ensureStaff(context.userId);
    const [plans, subs, links, owners] = await Promise.all([
      sb.from("wl_plans").select("*").order("ordem", { ascending: true }),
      sb.from("wl_subscriptions").select("*").order("created_at", { ascending: false }).limit(500),
      sb.from("wl_company_links").select("*").order("created_at", { ascending: false }).limit(2000),
      sb.from("companies").select("id, name").order("name").limit(2000),
    ]);
    const err = plans.error || subs.error || links.error || owners.error;
    if (err) throw new Error(err.message);
    const companies = owners.data ?? [];
    const linksDecor = (links.data ?? []).map((l) => ({
      ...l,
      company_name: companies.find((c) => c.id === l.company_id)?.name ?? l.company_id,
      owner_name: companies.find((c) => c.id === l.wl_owner_id)?.name ?? l.wl_owner_id,
    }));
    const subsDecor = (subs.data ?? []).map((s) => ({
      ...s,
      owner_name: companies.find((c) => c.id === s.owner_id)?.name ?? s.owner_id,
    }));
    return {
      plans: plans.data ?? [],
      subscriptions: subsDecor,
      links: linksDecor,
      companies,
    };
  });

const planSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(64),
  nome: z.string().min(1).max(200),
  ordem: z.number().int().min(0).default(0),
  mensalidade_sm: z.number().nonnegative(),
  pontos_capacidade: z.number().int().min(0),
  pontos_adicionais: z.number().int().min(0),
});

export const upsertWhitelabelPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => planSchema.parse(d))
  .handler(async ({ context, data }) => {
    const sb = await ensureStaff(context.userId);
    const { error } = await sb.from("wl_plans").upsert(data, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    await sb.from("audit_logs").insert({
      action: "wl_plan.upsert",
      entity: "wl_plans",
      entity_id: data.id ?? null,
      metadata: { slug: data.slug, nome: data.nome },
      user_id: context.userId,
    });
    return { ok: true };
  });

export const deleteWhitelabelPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const sb = await ensureStaff(context.userId);
    const { error } = await sb.from("wl_plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("audit_logs").insert({
      action: "wl_plan.delete",
      entity: "wl_plans",
      entity_id: data.id,
      user_id: context.userId,
    });
    return { ok: true };
  });

const subSchema = z.object({
  id: z.string().uuid().optional(),
  owner_id: z.string().uuid(),
  plan_slug: z.string().min(1),
  status: z.enum(["active", "suspended", "canceled", "trial"]).default("active"),
  capacidade_pontos: z.number().int().min(0),
  auto_upgrade: z.boolean().default(false),
  auto_downgrade: z.boolean().default(false),
});

export const upsertWhitelabelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => subSchema.parse(d))
  .handler(async ({ context, data }) => {
    const sb = await ensureStaff(context.userId);
    const { error } = await sb.from("wl_subscriptions").upsert(data);
    if (error) throw new Error(error.message);
    await sb.from("audit_logs").insert({
      action: "wl_subscription.upsert",
      entity: "wl_subscriptions",
      entity_id: data.id ?? null,
      metadata: { owner_id: data.owner_id, plan_slug: data.plan_slug, status: data.status },
      user_id: context.userId,
    });
    return { ok: true };
  });

export const setWhitelabelSubscriptionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["active", "suspended", "canceled", "trial"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sb = await ensureStaff(context.userId);
    const { error } = await sb.from("wl_subscriptions")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("audit_logs").insert({
      action: "wl_subscription.status_change",
      entity: "wl_subscriptions",
      entity_id: data.id,
      metadata: { status: data.status },
      user_id: context.userId,
    });
    return { ok: true };
  });

const linkSchema = z.object({
  id: z.string().uuid().optional(),
  wl_owner_id: z.string().uuid(),
  company_id: z.string().uuid(),
  plan_slug: z.string().min(1),
  status: z.enum(["active", "ativo", "suspended", "canceled"]).default("active"),
  pontos_consumidos: z.number().int().min(0).default(0),
});

export const upsertWhitelabelCompanyLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => linkSchema.parse(d))
  .handler(async ({ context, data }) => {
    const sb = await ensureStaff(context.userId);
    const { error } = await sb.from("wl_company_links").upsert(data);
    if (error) throw new Error(error.message);
    await sb.from("audit_logs").insert({
      action: "wl_company_link.upsert",
      entity: "wl_company_links",
      entity_id: data.id ?? null,
      metadata: {
        wl_owner_id: data.wl_owner_id,
        company_id: data.company_id,
        plan_slug: data.plan_slug,
      },
      user_id: context.userId,
    });
    return { ok: true };
  });

export const deleteWhitelabelCompanyLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const sb = await ensureStaff(context.userId);
    const { error } = await sb.from("wl_company_links").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("audit_logs").insert({
      action: "wl_company_link.delete",
      entity: "wl_company_links",
      entity_id: data.id,
      user_id: context.userId,
    });
    return { ok: true };
  });
