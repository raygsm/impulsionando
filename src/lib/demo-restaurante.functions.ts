/**
 * Demo Bar & Restaurante — fase 1.
 *
 * Server fns para:
 *  - getDemoScenario: cenário + QRs + cardápio + vouchers (público).
 *  - recordDemoScan: registra leitura de QR Code, cria/reusa demo_sessions, grava demo_actions.
 *    SEMPRE marca a sessão como demo. Validação estrita: nada de CPF, cartão ou dado real.
 *  - listLiveDemoActivity: feed ao vivo de eventos da demo (Super Admin / vendedor).
 *
 * SEGURANÇA: nenhum server fn aqui processa pagamento, dispara webhook real ou aceita PII.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const NICHE = "restaurante";

// ───────────────── GET SCENARIO (público) ─────────────────

const SlugInput = z.object({ slug: z.string().trim().min(2).max(60) });

export const getDemoScenario = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SlugInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: scenario, error } = await supabaseAdmin
      .from("demo_resto_scenarios")
      .select("id,slug,name,tagline,primary_color")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!scenario) return null;

    const [qrs, items, vouchers] = await Promise.all([
      supabaseAdmin
        .from("demo_resto_qr_codes")
        .select("slug,kind,title,instruction,sort_order")
        .eq("scenario_id", scenario.id)
        .order("sort_order"),
      supabaseAdmin
        .from("demo_resto_menu_items")
        .select("id,category,name,description,price_cents,tags,harmony,is_bestseller,sort_order")
        .eq("scenario_id", scenario.id)
        .order("sort_order"),
      supabaseAdmin
        .from("demo_resto_vouchers")
        .select("code,name,rule,validity_label,audience,channel,status")
        .eq("scenario_id", scenario.id)
        .order("code"),
    ]);

    return {
      scenario,
      qrs: qrs.data ?? [],
      items: items.data ?? [],
      vouchers: vouchers.data ?? [],
    };
  });

// ───────────────── RECORD SCAN (público, anônimo) ─────────────────

const ScanInput = z.object({
  scenarioSlug: z.string().trim().min(2).max(60),
  qrSlug: z.string().trim().min(1).max(60),
  sessionId: z.string().uuid().optional(),
  userAgent: z.string().max(500).optional(),
});

export const recordDemoScan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScanInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Confirma que o cenário e o QR existem (evita poluir telemetria com slugs forjados).
    const { data: scenario } = await supabaseAdmin
      .from("demo_resto_scenarios").select("id,slug").eq("slug", data.scenarioSlug).maybeSingle();
    if (!scenario) throw new Error("Cenário de demonstração inexistente.");
    const { data: qr } = await supabaseAdmin
      .from("demo_resto_qr_codes").select("id,slug,kind,title")
      .eq("scenario_id", scenario.id).eq("slug", data.qrSlug).maybeSingle();
    if (!qr) throw new Error("QR Code de demonstração inexistente.");

    // Reusa sessão se válida; caso contrário cria uma nova.
    let sessionId = data.sessionId;
    if (sessionId) {
      const { data: existing } = await supabaseAdmin
        .from("demo_sessions").select("id").eq("id", sessionId).maybeSingle();
      if (!existing) sessionId = undefined;
    }
    if (!sessionId) {
      const { data: created, error } = await supabaseAdmin
        .from("demo_sessions")
        .insert({
          niche_slug: NICHE,
          user_agent: data.userAgent ?? null,
          metadata: { scenario_slug: scenario.slug, qr_slug: qr.slug, is_demo: true },
        })
        .select("id").single();
      if (error) throw new Error(error.message);
      sessionId = created.id;
    }

    const { error: actErr } = await supabaseAdmin.from("demo_actions").insert({
      session_id: sessionId!,
      niche_slug: NICHE,
      module: "restaurante",
      action_key: "qr.scan",
      payload: { scenario_slug: scenario.slug, qr_slug: qr.slug, kind: qr.kind, title: qr.title },
    });
    if (actErr) throw new Error(actErr.message);

    return { sessionId: sessionId!, scenarioSlug: scenario.slug, qrSlug: qr.slug, kind: qr.kind };
  });

// ───────────────── RECORD GENERIC DEMO EVENT (público) ─────────────────
// Telemetria de interações na demo (abrir cardápio, adicionar item, checkout simulado, etc).
// Nunca aceita PII; payload é restrito a chaves seguras.

const ALLOWED_ACTIONS = [
  "menu.open",
  "menu.category.view",
  "cart.add",
  "cart.remove",
  "cart.open",
  "cart.checkout_attempt",
  "cart.checkout_simulated",
  "voucher.apply",
  "survey.submit",
] as const;

const EventInput = z.object({
  scenarioSlug: z.string().trim().min(2).max(60),
  qrSlug: z.string().trim().min(1).max(60).optional(),
  sessionId: z.string().uuid(),
  actionKey: z.enum(ALLOWED_ACTIONS),
  payload: z
    .object({
      itemId: z.string().uuid().optional(),
      itemName: z.string().max(120).optional(),
      category: z.string().max(60).optional(),
      qty: z.number().int().min(1).max(50).optional(),
      priceCents: z.number().int().min(0).max(1_000_000).optional(),
      totalCents: z.number().int().min(0).max(10_000_000).optional(),
      voucherCode: z.string().max(40).optional(),
      paymentMethod: z.enum(["pix", "card", "on_delivery"]).optional(),
    })
    .partial()
    .default({}),
});

export const recordDemoEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EventInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: scenario } = await supabaseAdmin
      .from("demo_resto_scenarios").select("id,slug").eq("slug", data.scenarioSlug).maybeSingle();
    if (!scenario) throw new Error("Cenário inexistente.");

    const { data: session } = await supabaseAdmin
      .from("demo_sessions").select("id").eq("id", data.sessionId).maybeSingle();
    if (!session) throw new Error("Sessão inexistente.");

    const { error } = await supabaseAdmin.from("demo_actions").insert({
      session_id: data.sessionId,
      niche_slug: NICHE,
      module: "restaurante",
      action_key: data.actionKey,
      payload: { ...data.payload, scenario_slug: scenario.slug, qr_slug: data.qrSlug, is_demo: true },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ───────────────── SUBMIT SURVEY + EMIT VOUCHER (público) ─────────────────
// Coleta preferências da demo e atribui automaticamente um voucher do cenário.
// PII é mínima: aceitamos nome curto e WhatsApp, mas mascaramos antes de salvar
// (apenas iniciais + últimos 4 dígitos). Tudo marcado como is_demo=true.

const SurveyInput = z.object({
  scenarioSlug: z.string().trim().min(2).max(60),
  qrSlug: z.string().trim().min(1).max(60).optional(),
  sessionId: z.string().uuid(),
  displayName: z.string().trim().min(1).max(60).optional(),
  whatsappLast4: z.string().trim().regex(/^\d{0,4}$/).optional(),
  favoriteCategory: z.enum(["chopp", "petiscos", "drinks", "massas", "sobremesas"]),
  visitFrequency: z.enum(["primeira", "mensal", "quinzenal", "semanal"]),
  comesWith: z.enum(["sozinho", "casal", "amigos", "familia", "trabalho"]),
  interestedIn: z.array(z.enum(["eventos", "clube", "delivery", "happy_hour", "private"])).max(5),
});

function maskName(input?: string): string {
  if (!input) return "Convidado da demo";
  const parts = input.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Convidado da demo";
  const first = parts[0].slice(0, 12);
  const initial = parts[1]?.[0]?.toUpperCase();
  return initial ? `${first} ${initial}.` : first;
}

export const submitDemoSurvey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SurveyInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: scenario } = await supabaseAdmin
      .from("demo_resto_scenarios").select("id,slug").eq("slug", data.scenarioSlug).maybeSingle();
    if (!scenario) throw new Error("Cenário inexistente.");

    const { data: session } = await supabaseAdmin
      .from("demo_sessions").select("id").eq("id", data.sessionId).maybeSingle();
    if (!session) throw new Error("Sessão inexistente.");

    // Escolhe voucher por afinidade (audience) + fallback no primeiro ativo.
    const audienceMap: Record<string, string[]> = {
      chopp: ["chopp", "happy_hour", "geral"],
      petiscos: ["happy_hour", "geral"],
      drinks: ["drinks", "happy_hour", "geral"],
      massas: ["massas", "casal", "geral"],
      sobremesas: ["casal", "geral"],
    };
    const preferredAudiences = audienceMap[data.favoriteCategory] ?? ["geral"];

    const { data: vouchers } = await supabaseAdmin
      .from("demo_resto_vouchers")
      .select("code,name,rule,validity_label,audience,channel,status")
      .eq("scenario_id", scenario.id)
      .eq("status", "active");

    const pool = vouchers ?? [];
    const picked =
      preferredAudiences
        .map((a) => pool.find((v) => v.audience === a))
        .find(Boolean) ?? pool[0] ?? null;

    const maskedName = maskName(data.displayName);
    const maskedWhats = data.whatsappLast4 ? `(••) •••••-${data.whatsappLast4}` : "(••) •••••-••••";

    const preferences = {
      favoriteCategory: data.favoriteCategory,
      visitFrequency: data.visitFrequency,
      comesWith: data.comesWith,
      interestedIn: data.interestedIn,
      voucher_emitted: picked?.code ?? null,
    };

    const { error: leadErr } = await supabaseAdmin.from("demo_resto_leads").insert({
      session_id: data.sessionId,
      scenario_id: scenario.id,
      name: maskedName,
      whatsapp: maskedWhats,
      preferences,
      is_demo: true,
    });
    if (leadErr) throw new Error(leadErr.message);

    await supabaseAdmin.from("demo_actions").insert({
      session_id: data.sessionId,
      niche_slug: NICHE,
      module: "restaurante",
      action_key: "survey.submit",
      payload: {
        scenario_slug: scenario.slug,
        qr_slug: data.qrSlug,
        is_demo: true,
        favoriteCategory: data.favoriteCategory,
        visitFrequency: data.visitFrequency,
        comesWith: data.comesWith,
        interestedIn: data.interestedIn,
        voucher_code: picked?.code ?? null,
      },
    });

    return {
      ok: true,
      voucher: picked,
      maskedName,
    };
  });

// ───────────────── LIVE ACTIVITY (Super Admin) ─────────────────

const LiveInput = z.object({
  scenarioSlug: z.string().trim().min(2).max(60),
  sinceMinutes: z.number().int().min(1).max(720).default(60),
});

export const listLiveDemoActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LiveInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc(
      "is_super_admin" as never,
      { _user: userId } as never,
    );
    if (!isAdmin) throw new Error("Acesso restrito ao Super Admin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.sinceMinutes * 60_000).toISOString();

    const { data: actions, error } = await supabaseAdmin
      .from("demo_actions")
      .select("id,session_id,module,action_key,payload,created_at")
      .eq("niche_slug", NICHE)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) throw new Error(error.message);

    const filtered = (actions ?? []).filter((a) => {
      const p = a.payload as { scenario_slug?: string } | null;
      return p?.scenario_slug === data.scenarioSlug;
    });

    const totalScans = filtered.filter((a) => a.action_key === "qr.scan").length;
    const distinctSessions = new Set(filtered.map((a) => a.session_id)).size;

    return {
      since,
      totals: { events: filtered.length, scans: totalScans, sessions: distinctSessions },
      events: filtered.slice(0, 40),
    };
  });

// ───────────────── DEMO DASHBOARD (Super Admin) ─────────────────
// Agrega scans, carrinho, checkout, vouchers e preferências para uma visão
// executiva por cenário. Restrito a Super Admin.

const DashboardInput = z.object({
  scenarioSlug: z.string().trim().min(2).max(60),
  sinceHours: z.number().int().min(1).max(24 * 30).default(24 * 7),
  qrKind: z.enum(["mesa", "delivery", "evento", "pesquisa", "clube"]).optional(),
});


type DemoActionRow = {
  id: string;
  session_id: string;
  action_key: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export const fetchDemoRestauranteDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DashboardInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc(
      "is_super_admin" as never,
      { _user: userId } as never,
    );
    if (!isAdmin) throw new Error("Acesso restrito ao Super Admin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sinceIso = new Date(Date.now() - data.sinceHours * 3_600_000).toISOString();

    const { data: scenario } = await supabaseAdmin
      .from("demo_resto_scenarios").select("id,slug,name,tagline,primary_color")
      .eq("slug", data.scenarioSlug).maybeSingle();
    if (!scenario) throw new Error("Cenário inexistente.");

    const [actionsRes, leadsRes, vouchersRes, qrsRes] = await Promise.all([
      supabaseAdmin
        .from("demo_actions")
        .select("id,session_id,action_key,payload,created_at")
        .eq("niche_slug", NICHE)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabaseAdmin
        .from("demo_resto_leads")
        .select("id,name,whatsapp,preferences,created_at")
        .eq("scenario_id", scenario.id)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("demo_resto_vouchers")
        .select("code,name,audience,status")
        .eq("scenario_id", scenario.id),
      supabaseAdmin
        .from("demo_resto_qr_codes")
        .select("slug,kind,title")
        .eq("scenario_id", scenario.id),
    ]);

    const rawActions = (actionsRes.data ?? []) as DemoActionRow[];
    let actions = rawActions.filter((a) => {
      const p = a.payload as { scenario_slug?: string } | null;
      return p?.scenario_slug === scenario.slug;
    });

    // Index session → kind (do primeiro scan da sessão) para permitir filtros drill-down.
    const sessionKind = new Map<string, string>();
    const sessionQrSlug = new Map<string, string>();
    for (const a of actions) {
      if (a.action_key !== "qr.scan") continue;
      const p = a.payload as { kind?: string; qr_slug?: string } | null;
      if (p?.kind && !sessionKind.has(a.session_id)) sessionKind.set(a.session_id, p.kind);
      if (p?.qr_slug && !sessionQrSlug.has(a.session_id)) sessionQrSlug.set(a.session_id, p.qr_slug);
    }

    if (data.qrKind) {
      actions = actions.filter((a) => sessionKind.get(a.session_id) === data.qrKind);
    }

    const byKey = (k: string) => actions.filter((a) => a.action_key === k);
    const scans = byKey("qr.scan");
    const adds = byKey("cart.add");
    const checkoutAttempts = byKey("cart.checkout_attempt");
    const checkoutSimulated = byKey("cart.checkout_simulated");
    const surveys = byKey("survey.submit");

    const distinctSessions = new Set(actions.map((a) => a.session_id)).size;

    const conversion = {
      scans: scans.length,
      menuActive: new Set(adds.map((a) => a.session_id)).size,
      checkoutAttempts: new Set(checkoutAttempts.map((a) => a.session_id)).size,
      checkoutDone: new Set(checkoutSimulated.map((a) => a.session_id)).size,
      surveysSubmitted: surveys.length,
    };

    // Drill-down: funil por tipo de QR e por QR específico.
    const buildFunnel = (sessionFilter: (sid: string) => boolean) => {
      const sf = (rows: DemoActionRow[]) => rows.filter((a) => sessionFilter(a.session_id));
      return {
        scans: sf(scans).length,
        menuActive: new Set(sf(adds).map((a) => a.session_id)).size,
        checkoutAttempts: new Set(sf(checkoutAttempts).map((a) => a.session_id)).size,
        checkoutDone: new Set(sf(checkoutSimulated).map((a) => a.session_id)).size,
        surveysSubmitted: sf(surveys).length,
      };
    };

    const kinds = Array.from(new Set(Array.from(sessionKind.values())));
    const funnelByKind = kinds.map((kind) => ({
      kind,
      ...buildFunnel((sid) => sessionKind.get(sid) === kind),
    })).sort((a, b) => b.scans - a.scans);

    const qrSlugs = Array.from(new Set(Array.from(sessionQrSlug.values())));
    const funnelByQr = qrSlugs.map((slug) => ({
      slug,
      ...buildFunnel((sid) => sessionQrSlug.get(sid) === slug),
    })).sort((a, b) => b.scans - a.scans);



    const scanByKind = new Map<string, number>();
    for (const a of scans) {
      const p = a.payload as { kind?: string } | null;
      const k = p?.kind ?? "?";
      scanByKind.set(k, (scanByKind.get(k) ?? 0) + 1);
    }

    const qrIndex = new Map<string, { slug: string; kind: string; title: string }>();
    for (const q of qrsRes.data ?? []) qrIndex.set(q.slug, q);
    const scanByQr = new Map<string, number>();
    for (const a of scans) {
      const p = a.payload as { qr_slug?: string } | null;
      const slug = p?.qr_slug ?? "?";
      scanByQr.set(slug, (scanByQr.get(slug) ?? 0) + 1);
    }
    const topQrs = Array.from(scanByQr.entries())
      .map(([slug, count]) => ({
        slug, count,
        kind: qrIndex.get(slug)?.kind ?? "?",
        title: qrIndex.get(slug)?.title ?? slug,
      }))
      .sort((a, b) => b.count - a.count);

    const itemAgg = new Map<string, { name: string; qty: number; revenueCents: number }>();
    for (const a of adds) {
      const p = a.payload as { itemName?: string; qty?: number; priceCents?: number } | null;
      const name = p?.itemName ?? "?";
      const qty = p?.qty ?? 1;
      const price = p?.priceCents ?? 0;
      const cur = itemAgg.get(name) ?? { name, qty: 0, revenueCents: 0 };
      cur.qty += qty;
      cur.revenueCents += qty * price;
      itemAgg.set(name, cur);
    }
    const topItems = Array.from(itemAgg.values()).sort((a, b) => b.qty - a.qty).slice(0, 8);

    const paymentMix: Record<string, number> = { pix: 0, card: 0, on_delivery: 0 };
    let simulatedRevenueCents = 0;
    for (const a of checkoutSimulated) {
      const p = a.payload as { paymentMethod?: string; totalCents?: number } | null;
      if (p?.paymentMethod && paymentMix[p.paymentMethod] !== undefined) paymentMix[p.paymentMethod]++;
      simulatedRevenueCents += p?.totalCents ?? 0;
    }
    const avgTicketCents =
      conversion.checkoutDone > 0 ? Math.round(simulatedRevenueCents / conversion.checkoutDone) : 0;

    const interestCount = new Map<string, number>();
    const favoriteCount = new Map<string, number>();
    const frequencyCount = new Map<string, number>();
    const companyCount = new Map<string, number>();
    for (const lead of leadsRes.data ?? []) {
      const prefs = (lead.preferences ?? {}) as {
        interestedIn?: string[]; favoriteCategory?: string;
        visitFrequency?: string; comesWith?: string;
      };
      for (const i of prefs.interestedIn ?? []) interestCount.set(i, (interestCount.get(i) ?? 0) + 1);
      if (prefs.favoriteCategory) favoriteCount.set(prefs.favoriteCategory, (favoriteCount.get(prefs.favoriteCategory) ?? 0) + 1);
      if (prefs.visitFrequency) frequencyCount.set(prefs.visitFrequency, (frequencyCount.get(prefs.visitFrequency) ?? 0) + 1);
      if (prefs.comesWith) companyCount.set(prefs.comesWith, (companyCount.get(prefs.comesWith) ?? 0) + 1);
    }
    const sortMap = (m: Map<string, number>) =>
      Array.from(m.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);

    const voucherEmitted = new Map<string, number>();
    for (const s of surveys) {
      const p = s.payload as { voucher_code?: string } | null;
      if (p?.voucher_code) voucherEmitted.set(p.voucher_code, (voucherEmitted.get(p.voucher_code) ?? 0) + 1);
    }
    const vouchers = (vouchersRes.data ?? []).map((v) => ({
      ...v, emitted: voucherEmitted.get(v.code) ?? 0,
    }));

    const recentLeads = (leadsRes.data ?? []).slice(0, 12).map((l) => ({
      id: l.id, name: l.name, whatsapp: l.whatsapp, createdAt: l.created_at,
      voucher: ((l.preferences ?? {}) as { voucher_emitted?: string }).voucher_emitted ?? null,
      favorite: ((l.preferences ?? {}) as { favoriteCategory?: string }).favoriteCategory ?? null,
    }));

    return {
      scenario,
      windowHours: data.sinceHours,
      totals: {
        events: actions.length,
        distinctSessions,
        leads: leadsRes.data?.length ?? 0,
        simulatedRevenueCents,
        avgTicketCents,
      },
      conversion,
      qrKind: data.qrKind ?? null,
      scanByKind: Array.from(scanByKind.entries()).map(([key, count]) => ({ key, count })),
      topQrs, topItems, paymentMix,
      funnelByKind, funnelByQr,

      preferences: {
        interests: sortMap(interestCount),
        favorites: sortMap(favoriteCount),
        frequency: sortMap(frequencyCount),
        company: sortMap(companyCount),
      },
      vouchers, recentLeads,
    };
  });
