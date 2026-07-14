/**
 * Onda D2 — Server functions e helpers do Clube Impulsionando.
 * Superfície inicial:
 *   listClubePlans        — planos ativos (público, sem auth)
 *   getMyMembership       — assinatura atual do usuário
 *   getMyBalance          — saldo consolidado do usuário
 *   listMyLedger          — extrato paginado
 *   listPartnerOffers     — vitrine de ofertas ativas (público)
 *   startMembershipTrial  — cria uma assinatura trial free para o usuário
 *   redeemPartnerOffer    — resgata oferta e debita pontos via RPC
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listClubePlans = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data, error } = await (sb as any).from("clube_plans").select("*").eq("is_active", true).order("sort_order");
  if (error) throw new Error(error.message);
  return { plans: data ?? [] };
});

export const listPartnerOffers = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data, error } = await (sb as any)
    .from("clube_partner_offers")
    .select("id,company_id,title,description,discount_type,discount_value,min_points,min_plan_code,starts_at,ends_at,image_url,category,is_active")
    .eq("is_active", true)
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order("starts_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return { offers: data ?? [] };
});

export const getMyMembership = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("clube_memberships")
      .select("*, plan:clube_plans(code,name,points_multiplier,benefits)")
      .eq("user_id", context.userId)
      .in("status", ["trial", "active", "paused"])
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { membership: data ?? null };
  });

export const getMyBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("clube_points_balance")
      .select("balance,lifetime_earned,lifetime_spent,updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { balance: data ?? { balance: 0, lifetime_earned: 0, lifetime_spent: 0, updated_at: null } };
  });

export const listMyLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase as any)
      .from("clube_points_ledger")
      .select("id,company_id,kind,points,reason,ref_type,ref_id,balance_after,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { entries: rows ?? [] };
  });

export const startMembershipTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ plan_code: z.enum(["free", "premium", "black"]).default("free") }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { data: existing } = await sb
      .from("clube_memberships")
      .select("id,status,plan_id")
      .eq("user_id", context.userId)
      .in("status", ["trial", "active", "paused"])
      .maybeSingle();
    if (existing) return { membership_id: existing.id, alreadyActive: true };

    const { data: plan, error: planErr } = await sb
      .from("clube_plans")
      .select("id,code")
      .eq("code", data.plan_code)
      .maybeSingle();
    if (planErr || !plan) throw new Error("Plano não encontrado");

    const now = new Date();
    const end = new Date(now.getTime() + 30 * 86400_000);
    const { data: inserted, error } = await sb
      .from("clube_memberships")
      .insert({
        user_id: context.userId,
        plan_id: plan.id,
        status: "trial",
        billing_cycle: data.plan_code === "free" ? "free" : "monthly",
        source: "self",
        started_at: now.toISOString(),
        current_period_end: end.toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { membership_id: inserted.id, alreadyActive: false };
  });

export const redeemPartnerOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ offer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { data: offer, error: offerErr } = await sb
      .from("clube_partner_offers")
      .select("id,company_id,min_points,min_plan_code,is_active,ends_at,max_uses_per_user")
      .eq("id", data.offer_id)
      .maybeSingle();
    if (offerErr || !offer) throw new Error("Oferta não encontrada");
    if (!offer.is_active || (offer.ends_at && new Date(offer.ends_at) < new Date())) {
      throw new Error("Oferta indisponível");
    }

    const { count: usedCount } = await sb
      .from("clube_offer_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("offer_id", offer.id)
      .eq("user_id", context.userId);
    if ((usedCount ?? 0) >= (offer.max_uses_per_user ?? 1)) {
      throw new Error("Você já resgatou esta oferta");
    }

    const code = `IMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: red, error: redErr } = await sb
      .from("clube_offer_redemptions")
      .insert({
        offer_id: offer.id,
        user_id: context.userId,
        company_id: offer.company_id,
        points_spent: offer.min_points ?? 0,
        status: "pending",
        code,
      })
      .select("id,code")
      .single();
    if (redErr) throw new Error(redErr.message);

    if ((offer.min_points ?? 0) > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: creditErr } = await (supabaseAdmin as any).rpc("clube_credit_points", {
        p_user_id: context.userId,
        p_company_id: offer.company_id,
        p_points: -Math.abs(offer.min_points),
        p_reason: `Resgate oferta ${offer.id}`,
        p_ref_type: "clube_offer_redemption",
        p_ref_id: red.id,
        p_kind: "spend",
        p_metadata: { offer_id: offer.id },
      });
      if (creditErr) {
        await sb.from("clube_offer_redemptions").update({ status: "canceled" }).eq("id", red.id);
        throw new Error(creditErr.message);
      }
    }

    return { redemption_id: red.id, code: red.code };
  });
