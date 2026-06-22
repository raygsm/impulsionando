import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Community Cockpit — Fase 72.
 * Comunidades, membros, mensalidades, doações e presenças em eventos.
 */
export const getCommunityHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({
    days: Math.max(7, Math.min(180, d?.days ?? 30)),
  }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [comRes, memRes, mshRes, donRes, attRes] = await Promise.all([
      supabaseAdmin.from("comm_communities")
        .select("id, company_id, name, kind, monthly_fee, accepts_donations, is_active")
        .limit(5000),
      supabaseAdmin.from("comm_members")
        .select("id, company_id, community_id, status, member_since, created_at")
        .limit(100000),
      supabaseAdmin.from("comm_memberships")
        .select("id, company_id, community_id, member_id, amount, status, due_date, paid_at, payment_method, period_year, period_month, created_at")
        .limit(100000),
      supabaseAdmin.from("comm_donations")
        .select("id, company_id, community_id, amount, payment_method, received_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin.from("comm_attendance")
        .select("id, company_id, community_id, member_id, status, event_date, created_at")
        .gte("event_date", sinceIso.slice(0, 10))
        .limit(100000),
    ]);

    const coms = comRes.data ?? [];
    const mems = memRes.data ?? [];
    const mshs = mshRes.data ?? [];
    const dons = donRes.data ?? [];
    const atts = attRes.data ?? [];

    const activeCommunities = coms.filter((c: any) => c.is_active).length;
    const donationsAccepted = coms.filter((c: any) => c.accepts_donations).length;
    const comByKind: Record<string, number> = {};
    for (const c of coms) comByKind[c.kind ?? "—"] = (comByKind[c.kind ?? "—"] ?? 0) + 1;

    const activeMembers = mems.filter((m: any) => m.status === "active").length;
    const newMembers = mems.filter((m: any) => m.created_at && m.created_at >= sinceIso).length;

    const paidMshs = mshs.filter((m: any) => m.status === "paid" || m.paid_at);
    const pendingMshs = mshs.filter((m: any) => m.status === "pending" || m.status === "open");
    const overdueMshs = mshs.filter((m: any) => {
      if (m.status === "paid" || m.paid_at) return false;
      return m.due_date && new Date(m.due_date) < new Date();
    });
    const mshRevenue = paidMshs.reduce((s: number, m: any) => s + Number(m.amount ?? 0), 0);

    const mshByMethod: Record<string, { count: number; amount: number }> = {};
    for (const m of paidMshs) {
      const k = m.payment_method ?? "—";
      mshByMethod[k] ??= { count: 0, amount: 0 };
      mshByMethod[k].count++;
      mshByMethod[k].amount += Number(m.amount ?? 0);
    }

    const donRevenue = dons.reduce((s: number, d: any) => s + Number(d.amount ?? 0), 0);
    const donByMethod: Record<string, { count: number; amount: number }> = {};
    for (const d of dons) {
      const k = d.payment_method ?? "—";
      donByMethod[k] ??= { count: 0, amount: 0 };
      donByMethod[k].count++;
      donByMethod[k].amount += Number(d.amount ?? 0);
    }

    const presentAtts = atts.filter((a: any) => a.status === "present" || a.status === "attended").length;
    const absentAtts = atts.filter((a: any) => a.status === "absent" || a.status === "missed").length;
    const uniqueAttendees = new Set(atts.map((a: any) => a.member_id)).size;

    const comNameMap = new Map(coms.map((c: any) => [c.id, c.name]));
    const revenueByCommunity: Record<string, { name: string; msh: number; don: number }> = {};
    for (const m of paidMshs) {
      const k = String(m.community_id ?? "—");
      revenueByCommunity[k] ??= { name: comNameMap.get(m.community_id) ?? "—", msh: 0, don: 0 };
      revenueByCommunity[k].msh += Number(m.amount ?? 0);
    }
    for (const d of dons) {
      const k = String(d.community_id ?? "—");
      revenueByCommunity[k] ??= { name: comNameMap.get(d.community_id) ?? "—", msh: 0, don: 0 };
      revenueByCommunity[k].don += Number(d.amount ?? 0);
    }
    const topCommunities = Object.values(revenueByCommunity)
      .map((r) => ({ ...r, total: r.msh + r.don }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      communities: {
        total: coms.length,
        active: activeCommunities,
        acceptsDonations: donationsAccepted,
        byKind: Object.entries(comByKind).map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
      },
      members: {
        total: mems.length,
        active: activeMembers,
        new: newMembers,
      },
      memberships: {
        total: mshs.length,
        paid: paidMshs.length,
        pending: pendingMshs.length,
        overdue: overdueMshs.length,
        revenue: mshRevenue,
        byMethod: Object.entries(mshByMethod).map(([method, v]) => ({ method, ...v })).sort((a, b) => b.amount - a.amount),
      },
      donations: {
        total: dons.length,
        amount: donRevenue,
        byMethod: Object.entries(donByMethod).map(([method, v]) => ({ method, ...v })).sort((a, b) => b.amount - a.amount),
      },
      attendance: {
        total: atts.length,
        present: presentAtts,
        absent: absentAtts,
        uniqueAttendees,
      },
      topCommunities,
    };
  });
