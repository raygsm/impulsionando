/**
 * Clube Impulsionando — server functions (Fase 1)
 *
 * Cobre:
 *  - Overview do membro (perfil estendido, nível, pontos, estatísticas)
 *  - Alertas inteligentes (CRUD)
 *  - Visitas / check-ins (gamificação)
 *  - Histórico de consumo (Premium)
 *  - Indicações (Indique e ganhe)
 *  - Enquetes ativas + votação
 *  - Sincronização de geolocalização do perfil
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type LevelDef = { code: string; label: string; min: number; next: number | null };
const LEVELS: LevelDef[] = [
  { code: "explorador",    label: "Explorador",      min: 0,   next: 5   },
  { code: "frequentador",  label: "Frequentador",    min: 5,   next: 20  },
  { code: "entusiasta",    label: "Entusiasta",      min: 20,  next: 50  },
  { code: "embaixador",    label: "Embaixador",      min: 50,  next: 100 },
  { code: "lenda",         label: "Lenda do Clube",  min: 100, next: null },
];

function levelFromVisits(total: number): LevelDef {
  let current: LevelDef = LEVELS[0];
  for (const l of LEVELS) if (total >= l.min) current = l;
  return current;
}


// -----------------------------------------------------------------
// Overview unificado do membro
// -----------------------------------------------------------------
export const getMyClubeOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const uid = context.userId;

    const [profile, membership, visitsAgg, pointsAgg, alertsCount, referralsCount, recentVisits, polls] = await Promise.all([
      sb.from("consumer_profiles").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("consumer_memberships").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("clube_visits").select("id", { count: "exact", head: true }).eq("user_id", uid),
      sb.from("clube_rewards_ledger").select("delta, kind").eq("user_id", uid),
      sb.from("clube_alerts").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("active", true),
      sb.from("clube_referrals").select("id", { count: "exact", head: true }).eq("referrer_user_id", uid),
      sb.from("clube_visits").select("id, company_id, created_at, rating, source, companies(trade_name, name, logo_url, public_slug)").eq("user_id", uid).order("created_at", { ascending: false }).limit(8),
      sb.from("clube_polls").select("id, question, options, kind, closes_at").eq("active", true).order("created_at", { ascending: false }).limit(3),
    ]);

    const totalVisits = visitsAgg.count ?? profile.data?.total_visits ?? 0;
    const level = levelFromVisits(totalVisits);
    const visitsToNext = level.next ? Math.max(0, level.next - totalVisits) : 0;

    let pointsBalance = 0;
    let cashbackCents = 0;
    for (const row of (pointsAgg.data ?? []) as Array<{ delta: number; kind: string }>) {
      if (row.kind === "points") pointsBalance += row.delta;
      if (row.kind === "cashback") cashbackCents += row.delta;
    }

    const isPremium = membership.data?.plan === "premium" && membership.data?.status === "active";

    return {
      profile: profile.data ?? null,
      membership: membership.data ?? null,
      isPremium,
      stats: {
        totalVisits,
        pointsBalance,
        cashbackCents,
        savingsCents: profile.data?.total_savings_cents ?? 0,
        alertsActive: alertsCount.count ?? 0,
        referrals: referralsCount.count ?? 0,
      },
      gamification: {
        level: level.code,
        levelLabel: level.label,
        nextLevelAt: level.next,
        visitsToNext,
        progressPct: level.next ? Math.min(100, Math.round((totalVisits / level.next) * 100)) : 100,
      },
      recentVisits: (recentVisits.data ?? []).map((v: any) => ({
        id: v.id,
        when: v.created_at,
        rating: v.rating,
        source: v.source,
        company: v.companies ? {
          name: v.companies.trade_name || v.companies.name,
          logo: v.companies.logo_url,
          slug: v.companies.public_slug,
        } : null,
      })),
      polls: polls.data ?? [],
    };
  });

// -----------------------------------------------------------------
// Perfil estendido (geo, interesses)
// -----------------------------------------------------------------
export const updateClubeLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      cep: z.string().max(12).optional(),
      neighborhood: z.string().max(120).optional(),
      city: z.string().max(120).optional(),
      state: z.string().max(2).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
      default_radius_km: z.number().int().min(1).max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("consumer_profiles")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateClubeInterests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ interests_tags: z.array(z.string().min(1).max(60)).max(60) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("consumer_profiles")
      .upsert({ user_id: context.userId, interests_tags: data.interests_tags }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -----------------------------------------------------------------
// Alertas inteligentes
// -----------------------------------------------------------------
export const listMyClubeAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clube_alerts")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertClubeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      kind: z.enum(["food", "drink", "event", "ambience", "music", "promo"]),
      tag: z.string().min(1).max(80),
      channels: z.array(z.enum(["email", "whatsapp", "push"])).default(["email"]),
      city: z.string().max(120).optional(),
      radius_km: z.number().int().min(1).max(200).default(25),
      active: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clube_alerts")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id,kind,tag" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteClubeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clube_alerts").delete()
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -----------------------------------------------------------------
// Check-in / visita
// -----------------------------------------------------------------
export const createClubeVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      company_id: z.string().uuid().optional(),
      event_id: z.string().uuid().optional(),
      source: z.enum(["self_checkin", "partner_scan", "order", "reservation"]).default("self_checkin"),
      rating: z.number().int().min(1).max(5).optional(),
      notes: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clube_visits")
      .insert({ user_id: context.userId, ...data });
    if (error) throw new Error(error.message);
    // bônus de pontos: 10 por visita
    await context.supabase.from("clube_rewards_ledger").insert({
      user_id: context.userId,
      kind: "points",
      delta: 10,
      reason: "Check-in registrado",
      reference_type: "visit",
    });
    return { ok: true, pointsAwarded: 10 };
  });

// -----------------------------------------------------------------
// Histórico de consumo (Premium)
// -----------------------------------------------------------------
export const listMyClubeConsumption = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clube_consumption")
      .select("*, companies(trade_name, name, logo_url)")
      .eq("user_id", context.userId)
      .order("consumed_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// -----------------------------------------------------------------
// Indicações
// -----------------------------------------------------------------
export const getMyReferralInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const [{ data: prof }, refs] = await Promise.all([
      sb.from("consumer_profiles").select("referral_code").eq("user_id", uid).maybeSingle(),
      sb.from("clube_referrals").select("*").eq("referrer_user_id", uid).order("created_at", { ascending: false }).limit(50),
    ]);
    return { code: prof?.referral_code ?? null, referrals: refs.data ?? [] };
  });

export const inviteReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email().optional(), source: z.string().max(60).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clube_referrals").insert({
      referrer_user_id: context.userId,
      referred_email: data.email ?? null,
      source: data.source ?? "manual",
      reward_points: 50,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -----------------------------------------------------------------
// Enquetes
// -----------------------------------------------------------------
export const votePoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ poll_id: z.string().uuid(), option_id: z.string().min(1).max(80) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clube_poll_votes")
      .upsert({ poll_id: data.poll_id, user_id: context.userId, option_id: data.option_id }, { onConflict: "poll_id,user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -----------------------------------------------------------------
// Descobrir parceiros (públicos) com filtros simples
// -----------------------------------------------------------------
export const listClubePartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      city: z.string().optional(),
      segment: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().int().min(1).max(120).default(60),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("companies")
      .select("id, name, trade_name, segment, logo_url, public_slug, address_city, address_state")
      .eq("vitrine_enabled", true)
      .limit(data.limit);
    if (data.city) q = q.ilike("address_city", `%${data.city}%`);
    if (data.segment) q = q.eq("segment", data.segment);
    if (data.search) q = q.or(`name.ilike.%${data.search}%,trade_name.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// -----------------------------------------------------------------
// Registrar consumo (Premium)
// -----------------------------------------------------------------
export const recordClubeConsumption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      company_id: z.string().uuid().optional(),
      consumed_at: z.string().optional(),
      total_cents: z.number().int().min(0),
      payment_method: z.string().max(40).optional(),
      receipt_url: z.string().url().optional(),
      items: z.array(z.object({
        name: z.string().min(1).max(120),
        qty: z.number().int().min(1).default(1),
        unit_cents: z.number().int().min(0).default(0),
      })).default([]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clube_consumption").insert({
      user_id: context.userId,
      ...data,
      items: data.items as any,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -----------------------------------------------------------------
// Admin: overview do Clube
// -----------------------------------------------------------------
export const getAdminClubeOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: isAdmin } = await sb.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");

    const [members, premium, visits30d, refs, alerts, topVisits, recentSignups] = await Promise.all([
      sb.from("consumer_profiles").select("user_id", { count: "exact", head: true }),
      sb.from("consumer_memberships").select("user_id", { count: "exact", head: true }).eq("plan", "premium").eq("status", "active"),
      sb.from("clube_visits").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
      sb.from("clube_referrals").select("id", { count: "exact", head: true }),
      sb.from("clube_alerts").select("id", { count: "exact", head: true }).eq("active", true),
      sb.from("clube_visits").select("company_id, companies(trade_name, name)").not("company_id", "is", null).limit(500),
      sb.from("consumer_profiles").select("user_id, full_name, city, state, current_level, created_at").order("created_at", { ascending: false }).limit(8),
    ]);

    // agrega top parceiros do mês
    const counts = new Map<string, { name: string; total: number }>();
    for (const v of (topVisits.data ?? []) as any[]) {
      const key = v.company_id;
      const name = v.companies?.trade_name || v.companies?.name || "Parceiro";
      const cur = counts.get(key) ?? { name, total: 0 };
      cur.total += 1;
      counts.set(key, cur);
    }
    const topPartners = [...counts.values()].sort((a, b) => b.total - a.total).slice(0, 8);

    return {
      kpis: {
        totalMembers: members.count ?? 0,
        premiumActive: premium.count ?? 0,
        visits30d: visits30d.count ?? 0,
        referrals: refs.count ?? 0,
        activeAlerts: alerts.count ?? 0,
        mrrCents: (premium.count ?? 0) * 999,
      },
      topPartners,
      recentSignups: recentSignups.data ?? [],
    };
  });

// -----------------------------------------------------------------
// Comprovantes digitais (Pix, consumo, manual)
// -----------------------------------------------------------------
export const listMyClubeReceipts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clube_receipts")
      .select("*")
      .eq("user_id", context.userId)
      .order("issued_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// -----------------------------------------------------------------
// Recomendações por interesse (matching simples por segmento / nome)
// -----------------------------------------------------------------
export const getClubeRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: profile } = await sb
      .from("consumer_profiles")
      .select("interests_tags, city, state")
      .eq("user_id", context.userId)
      .maybeSingle();

    const tags: string[] = (profile?.interests_tags as any) ?? [];
    const city = profile?.city as string | undefined;

    let q = sb
      .from("companies")
      .select("id, name, trade_name, segment, logo_url, public_slug, address_city, address_state")
      .eq("vitrine_enabled", true)
      .limit(24);
    if (city) q = q.ilike("address_city", `%${city}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const scored = (rows ?? []).map((c: any) => {
      const hay = `${c.segment ?? ""} ${c.trade_name ?? ""} ${c.name ?? ""}`.toLowerCase();
      const score = tags.reduce((acc, t) => (hay.includes(t.toLowerCase()) ? acc + 1 : acc), 0);
      return { ...c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return { interests: tags, items: scored.slice(0, 12) };
  });

// -----------------------------------------------------------------
// Admin: jornada de 21 dias (CRUD + run manual)
// -----------------------------------------------------------------
export const listJourneySteps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clube_journey_steps")
      .select("*")
      .order("day_offset", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertJourneyStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      day_offset: z.number().int().min(0).max(60),
      channel: z.enum(["email", "whatsapp", "in_app"]),
      audience: z.enum(["free", "premium", "all"]),
      event_code: z.string().min(2).max(80),
      subject: z.string().max(200).nullable().optional(),
      body: z.string().min(2).max(2000),
      active: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");
    const { error } = await context.supabase.from("clube_journey_steps").upsert(data as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteJourneyStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");
    const { error } = await context.supabase.from("clube_journey_steps").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -----------------------------------------------------------------
// Enquetes (parceiro cria/edita, admin modera)
// -----------------------------------------------------------------
export const listMyPartnerPolls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clube_polls")
      .select("*")
      .eq("created_by", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPartnerPoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      company_id: z.string().uuid().optional(),
      question: z.string().min(4).max(280),
      options: z.array(z.object({ id: z.string().min(1).max(40), label: z.string().min(1).max(120) })).min(2).max(8),
      kind: z.enum(["preference", "experience", "rating", "feature"]).default("preference"),
      audience: z.enum(["all", "free", "premium", "city"]).default("all"),
      city: z.string().max(120).optional(),
      active: z.boolean().default(true),
      closes_at: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const row = { ...data, created_by: context.userId } as any;
    const { error } = await context.supabase.from("clube_polls").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setPollActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clube_polls").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminPolls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");
    const { data, error } = await context.supabase
      .from("clube_polls")
      .select("*, companies(trade_name, name)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
