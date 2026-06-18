/**
 * Fase 1 — Core orientado a entidades.
 *
 * Dashboard do Consumidor Final + busca global de entidades para o Super Admin.
 * Toda métrica e busca aqui exige `is_super_admin(auth.uid())`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DEFAULT_DAYS = 30;

function windowFrom(days: number) {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now.getTime() - days * 86400_000).toISOString();
  const prevTo = from;
  const prevFrom = new Date(now.getTime() - 2 * days * 86400_000).toISOString();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return { from, to, prevFrom, prevTo, days, today: startOfToday.toISOString() };
}

function delta(curr: number, prev: number): { delta: number; deltaPct: number | null } {
  const d = curr - prev;
  const pct = prev > 0 ? (d / prev) * 100 : prev === 0 && curr > 0 ? 100 : null;
  return { delta: d, deltaPct: pct };
}

async function requireSuperAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user: userId } as Record<string, unknown>);
  if (!data) throw new Error("Acesso restrito ao Super Admin");
}

// ───────────── DASHBOARD CONSUMIDOR FINAL ─────────────

const DashInput = z.object({ days: z.number().int().min(7).max(180).default(DEFAULT_DAYS) });

export const fetchConsumidorDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DashInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireSuperAdmin(supabase as never, userId);

    const w = windowFrom(data.days);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      profiles, profilesPrev, memberships, visitsCurr, visitsPrev,
      consumption, receipts, journeyCurr, journeyPrev, referrals,
    ] = await Promise.all([
      supabaseAdmin.from("consumer_profiles").select("id,user_id,full_name,cep,city,state,created_at,total_savings_cents,interests_tags"),
      supabaseAdmin.from("consumer_profiles").select("id,created_at").gte("created_at", w.prevFrom).lt("created_at", w.prevTo),
      supabaseAdmin.from("consumer_memberships").select("user_id,plan,status,amount_cents,started_at"),
      supabaseAdmin.from("clube_visits").select("id,user_id,company_id,rating,created_at").gte("created_at", w.from).lte("created_at", w.to),
      supabaseAdmin.from("clube_visits").select("id,created_at").gte("created_at", w.prevFrom).lt("created_at", w.prevTo),
      supabaseAdmin.from("clube_consumption").select("id,user_id,company_id,total_cents,source,consumed_at").gte("consumed_at", w.from).lte("consumed_at", w.to),
      supabaseAdmin.from("clube_receipts").select("id,user_id,amount_cents,status,created_at").gte("created_at", w.from).lte("created_at", w.to),
      supabaseAdmin.from("clube_journey_log").select("user_id,step_id,enqueued_at").gte("enqueued_at", w.from).lte("enqueued_at", w.to),
      supabaseAdmin.from("clube_journey_log").select("user_id,enqueued_at").gte("enqueued_at", w.prevFrom).lt("enqueued_at", w.prevTo),
      supabaseAdmin.from("clube_referrals").select("id,referrer_user_id,status,created_at").gte("created_at", w.from).lte("created_at", w.to),
    ]);

    const allProfiles = profiles.data ?? [];
    const totalConsumidores = allProfiles.length;
    const novosNoPeriodo = allProfiles.filter((p) => p.created_at >= w.from).length;
    const novosHoje = allProfiles.filter((p) => p.created_at >= w.today).length;
    const novosPrev = (profilesPrev.data ?? []).length;
    const trendNovos = delta(novosNoPeriodo, novosPrev);

    const mems = memberships.data ?? [];
    const free = mems.filter((m) => m.plan === "free" && m.status === "active").length;
    const premium = mems.filter((m) => m.plan === "premium" && m.status === "active").length;
    const conversaoPremium = totalConsumidores > 0 ? (premium / totalConsumidores) * 100 : 0;

    const diagnosticosIniciados = new Set((journeyCurr.data ?? []).map((j) => j.user_id)).size;
    const diagnosticosPrev = new Set((journeyPrev.data ?? []).map((j) => j.user_id)).size;
    const trendDiag = delta(diagnosticosIniciados, diagnosticosPrev);

    const visits = visitsCurr.data ?? [];
    const trendVisitas = delta(visits.length, (visitsPrev.data ?? []).length);
    const ratings = visits.map((v) => v.rating).filter((r): r is number => typeof r === "number");
    const ratingMedia = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const cons = consumption.data ?? [];
    const cuponsUsados = cons.filter((c) => c.source === "coupon").length;
    const economiaCents = cons.reduce((sum, c) => sum + (c.total_cents ?? 0), 0);
    const totalEconomiaAllTime = allProfiles.reduce((sum, p) => sum + (p.total_savings_cents ?? 0), 0);

    // Top nichos (interests_tags), CEPs, parceiros
    const tagFreq = new Map<string, number>();
    for (const p of allProfiles) for (const t of p.interests_tags ?? []) tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1);
    const topNichos = Array.from(tagFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => ({ tag, count }));

    const cepFreq = new Map<string, number>();
    for (const p of allProfiles) if (p.cep) cepFreq.set(p.cep, (cepFreq.get(p.cep) ?? 0) + 1);
    const topCeps = Array.from(cepFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cep, count]) => ({ cep, count }));

    const companyFreq = new Map<string, number>();
    for (const v of visits) if (v.company_id) companyFreq.set(v.company_id, (companyFreq.get(v.company_id) ?? 0) + 1);
    const topCompanyIds = Array.from(companyFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    let topParceiros: Array<{ id: string; name: string; count: number }> = [];
    if (topCompanyIds.length) {
      const { data: comps } = await supabaseAdmin.from("companies").select("id,name").in("id", topCompanyIds.map(([id]) => id));
      const nameById = new Map((comps ?? []).map((c) => [c.id, c.name as string]));
      topParceiros = topCompanyIds.map(([id, count]) => ({ id, name: nameById.get(id) ?? id.slice(0, 8), count }));
    }

    const refs = referrals.data ?? [];
    const indicacoesAprovadas = refs.filter((r) => r.status === "approved").length;

    // Avaliações = recibos com status enviado/aprovado
    const recs = receipts.data ?? [];
    const avaliacoesEnviadas = recs.length;

    const ultimosCadastros = [...allProfiles]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name ?? "—",
        city: p.city ?? null,
        state: p.state ?? null,
        cep: p.cep ?? null,
        created_at: p.created_at,
      }));

    return {
      window: { days: data.days, from: w.from, to: w.to },
      kpis: {
        totalConsumidores,
        novosHoje,
        novosNoPeriodo,
        trendNovos,
        diagnosticosIniciados,
        trendDiag,
        clubeFree: free,
        clubePremium: premium,
        conversaoPremium,
        visitasPeriodo: visits.length,
        trendVisitas,
        ratingMedia,
        cuponsUsados,
        economiaCentsPeriodo: economiaCents,
        economiaCentsTotal: totalEconomiaAllTime,
        avaliacoesEnviadas,
        indicacoesAprovadas,
      },
      topNichos,
      topCeps,
      topParceiros,
      ultimosCadastros,
    };
  });

// ───────────── BUSCA GLOBAL DE ENTIDADES ─────────────

const SearchInput = z.object({ q: z.string().trim().min(2).max(120) });

export type GlobalEntityHit = {
  type: "consumidor" | "empresa" | "lead" | "afiliado" | "usuario";
  id: string;
  label: string;
  sublabel: string | null;
  to: string;
};

export const globalEntitySearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SearchInput.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ hits: GlobalEntityHit[] }> => {
    const { supabase, userId } = context;
    await requireSuperAdmin(supabase as never, userId);

    const q = data.q;
    const like = `%${q}%`;
    const digits = q.replace(/\D/g, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [consumidores, empresas, leads, afiliados] = await Promise.all([
      supabaseAdmin
        .from("consumer_profiles")
        .select("id,full_name,city,state,phone,cep")
        .or(
          [
            `full_name.ilike.${like}`,
            digits ? `phone.ilike.%${digits}%` : null,
            digits ? `cep.ilike.%${digits}%` : null,
          ].filter(Boolean).join(","),
        )
        .limit(5),
      supabaseAdmin
        .from("companies")
        .select("id,name,trade_name,document,address_city,address_state")
        .or([`name.ilike.${like}`, `trade_name.ilike.${like}`, digits ? `document.ilike.%${digits}%` : null].filter(Boolean).join(","))
        .limit(5),
      supabaseAdmin
        .from("marketing_leads")
        .select("id,name,email,company,created_at")
        .or([`name.ilike.${like}`, `email.ilike.${like}`, `company.ilike.${like}`].join(","))
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("aff_affiliates")
        .select("id,name,email,whatsapp")
        .or([`name.ilike.${like}`, `email.ilike.${like}`, digits ? `whatsapp.ilike.%${digits}%` : null].filter(Boolean).join(","))
        .limit(5),
    ]);

    const hits: GlobalEntityHit[] = [];
    for (const c of consumidores.data ?? []) {
      hits.push({
        type: "consumidor",
        id: c.id,
        label: c.full_name ?? "Consumidor sem nome",
        sublabel: [c.city, c.state, c.cep].filter(Boolean).join(" · ") || null,
        to: `/torre/consumidores?focus=${c.id}`,
      });
    }
    for (const e of empresas.data ?? []) {
      hits.push({
        type: "empresa",
        id: e.id,
        label: (e.trade_name ?? e.name) as string,
        sublabel: [e.document, e.address_city, e.address_state].filter(Boolean).join(" · ") || null,
        to: `/companies?focus=${e.id}`,
      });
    }
    for (const l of leads.data ?? []) {
      hits.push({
        type: "lead",
        id: l.id,
        label: (l.name ?? l.email ?? "Lead") as string,
        sublabel: [l.company, l.email].filter(Boolean).join(" · ") || null,
        to: `/marketing/leads?focus=${l.id}`,
      });
    }
    for (const a of afiliados.data ?? []) {
      hits.push({
        type: "afiliado",
        id: a.id,
        label: (a.name ?? a.email ?? "Afiliado") as string,
        sublabel: a.email ?? null,
        to: `/affiliates/affiliates?focus=${a.id}`,
      });
    }

    return { hits };
  });
