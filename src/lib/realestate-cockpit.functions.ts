import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Imobiliária Cockpit — Fase 68.
 */
export const getRealestateHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [prRes, intRes, visRes, ctRes, finRes, blRes, ownRes, brkRes] = await Promise.all([
      supabaseAdmin.from("realestate_properties").select("id, status, property_type, transaction_type, price, city, created_at").limit(50000),
      supabaseAdmin.from("realestate_interests").select("id, status, source, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_visits").select("id, status, scheduled_at, completed_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("realestate_contracts").select("id, status, signed_at, value, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("realestate_financings").select("id, status, amount, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("realestate_blasts").select("id, channel, status, sent_count, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("realestate_owners").select("id, created_at").limit(20000),
      supabaseAdmin.from("realestate_partner_brokers").select("id, active, created_at").limit(20000),
    ]);

    const err = prRes.error || intRes.error || visRes.error || ctRes.error || finRes.error || blRes.error || ownRes.error || brkRes.error;
    if (err) throw new Error(err.message);

    const pr = (prRes.data ?? []) as any[];
    const ints = (intRes.data ?? []) as any[];
    const vis = (visRes.data ?? []) as any[];
    const ct = (ctRes.data ?? []) as any[];
    const fin = (finRes.data ?? []) as any[];
    const bl = (blRes.data ?? []) as any[];
    const own = (ownRes.data ?? []) as any[];
    const brk = (brkRes.data ?? []) as any[];

    const prActive = pr.filter((p) => p.status === "ativo" || p.status === "active" || p.status === "publicado").length;
    const prSold = pr.filter((p) => p.status === "vendido" || p.status === "sold").length;
    const prRented = pr.filter((p) => p.status === "alugado" || p.status === "rented").length;
    const prByTrans = (() => { const m = new Map<string, number>(); for (const p of pr) { const k = p.transaction_type || "—"; m.set(k, (m.get(k) ?? 0) + 1); } return Array.from(m, ([k, v]) => ({ kind: k, count: v })).sort((a, b) => b.count - a.count); })();
    const prByType = (() => { const m = new Map<string, number>(); for (const p of pr) { const k = p.property_type || "—"; m.set(k, (m.get(k) ?? 0) + 1); } return Array.from(m, ([k, v]) => ({ type: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 10); })();
    const prByCity = (() => { const m = new Map<string, number>(); for (const p of pr) { const k = p.city || "—"; m.set(k, (m.get(k) ?? 0) + 1); } return Array.from(m, ([k, v]) => ({ city: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 10); })();
    const prices = pr.map((p) => Number(p.price)).filter((v) => Number.isFinite(v) && v > 0);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    const intBySrc = (() => { const m = new Map<string, number>(); for (const i of ints) { const k = i.source || "—"; m.set(k, (m.get(k) ?? 0) + 1); } return Array.from(m, ([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10); })();
    const intActive = ints.filter((i) => i.status === "active" || i.status === "ativo" || i.status === "open").length;

    const visScheduled = vis.filter((v) => v.scheduled_at).length;
    const visCompleted = vis.filter((v) => v.completed_at || v.status === "completed" || v.status === "realizada").length;
    const visCanceled = vis.filter((v) => v.status === "canceled" || v.status === "cancelada").length;

    const ctSigned = ct.filter((c) => c.signed_at || c.status === "signed" || c.status === "assinado").length;
    const ctValues = ct.filter((c) => c.signed_at).map((c) => Number(c.value)).filter((v) => Number.isFinite(v));
    const ctTotalGmv = ctValues.reduce((a, b) => a + b, 0);

    const finApproved = fin.filter((f) => f.status === "approved" || f.status === "aprovado").length;
    const finAmount = fin.map((f) => Number(f.amount)).filter((v) => Number.isFinite(v)).reduce((a, b) => a + b, 0);

    const blSent = bl.reduce((a, b) => a + (Number(b.sent_count) || 0), 0);
    const blByChannel = (() => { const m = new Map<string, number>(); for (const b of bl) { const k = b.channel || "—"; m.set(k, (m.get(k) ?? 0) + 1); } return Array.from(m, ([channel, count]) => ({ channel, count })); })();

    const brkActive = brk.filter((b) => b.active).length;

    return {
      days: data.days,
      properties: { total: pr.length, active: prActive, sold: prSold, rented: prRented, avgPrice, byTransaction: prByTrans, byType: prByType, byCity: prByCity },
      interests: { total: ints.length, active: intActive, bySource: intBySrc },
      visits: { total: vis.length, scheduled: visScheduled, completed: visCompleted, canceled: visCanceled },
      contracts: { total: ct.length, signed: ctSigned, totalGmv: ctTotalGmv },
      financings: { total: fin.length, approved: finApproved, totalAmount: finAmount },
      blasts: { total: bl.length, sent: blSent, byChannel: blByChannel },
      owners: { total: own.length },
      brokers: { total: brk.length, active: brkActive },
    };
  });
