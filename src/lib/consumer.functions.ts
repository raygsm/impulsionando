/**
 * Consumer Final + Premium R$9,99 — server functions.
 *
 * Inclui:
 *  - getPublicVitrine: lista pública (anon) de empresas com vitrine ativa.
 *  - getMyConsumerArea: dados do consumidor logado (profile + membership + invoices + favorites).
 *  - upsertConsumerProfile: cria/atualiza profile do consumidor.
 *  - upgradeToPremium: aciona RPC consumer_upgrade_to_premium (gera fatura R$9,99).
 *  - cancelPremium: marca cancel_at_period_end.
 *  - toggleFavorite: adiciona/remove favorito.
 *  - getConsumerPremiumOverview: KPIs do master.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getPublicVitrine = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      segment: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      q: z.string().optional(),
      sort: z.enum(["rating", "recent", "name"]).default("rating"),
      limit: z.number().int().min(1).max(200).default(120),
    }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb
      .from("companies_vitrine_public")
      .select(
        "id, name, trade_name, segment, logo_url, cover_image_url, tagline, description, public_slug, address_city, address_state, address_neighborhood, primary_color, website, instagram, whatsapp, rating_avg, rating_count, updated_at",
      )
      .limit(data.limit);
    if (data.segment) query = query.eq("segment", data.segment);
    if (data.city) query = query.ilike("address_city", `%${data.city}%`);
    if (data.state) query = query.ilike("address_state", `%${data.state}%`);
    if (data.q) {
      const term = `%${data.q}%`;
      query = query.or(
        `name.ilike.${term},trade_name.ilike.${term},tagline.ilike.${term},description.ilike.${term},address_city.ilike.${term}`,
      );
    }
    if (data.sort === "rating") {
      query = query.order("rating_avg", { ascending: false, nullsFirst: false }).order("rating_count", { ascending: false });
    } else if (data.sort === "recent") {
      query = query.order("updated_at", { ascending: false });
    } else {
      query = query.order("name", { ascending: true });
    }
    const { data: rows, error } = await query;
    if (error) return { companies: [], error: error.message };
    return { companies: rows ?? [] };
  });

export const getPublicCompanyBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("companies")
      .select("id, name, trade_name, segment, logo_url, public_slug, address_city, address_state, address_line, instagram, facebook, website, whatsapp, primary_color, rating_avg, rating_count")
      .eq("public_slug", data.slug)
      .eq("vitrine_enabled", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Empresa não encontrada");
    const { data: reviews } = await sb
      .from("ecosystem_reviews")
      .select("id, stars, comment, created_at")
      .eq("company_id", row.id)
      .order("created_at", { ascending: false })
      .limit(20);
    return { company: row, reviews: reviews ?? [] };
  });

export const submitCompanyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      company_id: z.string().uuid(),
      stars: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ecosystem_reviews")
      .upsert(
        { company_id: data.company_id, user_id: context.userId, stars: data.stars, comment: data.comment ?? null },
        { onConflict: "company_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyReviewForCompany = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ company_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("ecosystem_reviews")
      .select("id, stars, comment, created_at, updated_at")
      .eq("company_id", data.company_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    return { review: row ?? null };
  });

export const deleteCompanyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ company_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ecosystem_reviews")
      .delete()
      .eq("company_id", data.company_id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyConsumerArea = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const [profile, membership, invoices, favorites] = await Promise.all([
      sb.from("consumer_profiles").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("consumer_memberships").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("consumer_membership_invoices").select("*").eq("user_id", uid).order("due_date", { ascending: false }).limit(12),
      sb.from("consumer_favorites").select("company_id, companies(id, name, trade_name, logo_url, segment, public_slug)").eq("user_id", uid),
    ]);
    return {
      profile: profile.data ?? null,
      membership: membership.data ?? null,
      invoices: invoices.data ?? [],
      favorites: (favorites.data ?? []).map((r: any) => r.companies).filter(Boolean),
    };
  });

export const upsertConsumerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      full_name: z.string().min(2).max(120),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      birthdate: z.string().optional(),
      marketing_optin: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("consumer_profiles")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upgradeToPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("consumer_upgrade_to_premium");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return { membership_id: row?.membership_id, invoice_id: row?.invoice_id, amount_cents: row?.amount_cents ?? 999 };
  });

export const cancelPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("consumer_memberships")
      .update({ cancel_at_period_end: true })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ company_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const existing = await sb.from("consumer_favorites").select("id").eq("user_id", context.userId).eq("company_id", data.company_id).maybeSingle();
    if (existing.data) {
      await sb.from("consumer_favorites").delete().eq("id", existing.data.id);
      return { favored: false };
    }
    await sb.from("consumer_favorites").insert({ user_id: context.userId, company_id: data.company_id });
    return { favored: true };
  });

export const getConsumerPremiumOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("consumer_premium_overview");
    if (error) throw new Error(error.message);
    return (data ?? {}) as Record<string, number>;
  });
