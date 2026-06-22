import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Real Estate Cockpit — Fase 47.
 * Cockpit imobiliário: portfólio de imóveis, leads/interesses, visitas, contratos,
 * financiamentos, distribuição de leads e performance de corretores.
 */
export const getRealEstateHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const staleIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const [propsRes, interestsRes, visitsRes, contractsRes, finsRes, assignsRes, intentsRes] = await Promise.all([
      supabaseAdmin
        .from("realestate_properties")
        .select("id, company_id, operation, property_type, status, sale_price, rent_price, created_at, updated_at")
        .limit(50000),
      supabaseAdmin
        .from("realestate_interests")
        .select("id, company_id, property_id, broker_user_id, kind, status, source, responded_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("realestate_visits")
        .select("id, company_id, property_id, broker_user_id, status, scheduled_at, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("realestate_contracts")
        .select("id, company_id, property_id, contract_type, value, status, start_date, signed_at, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("realestate_financings")
        .select("id, company_id, status, property_value, financed_value, submitted_at, approved_at, denied_reason, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("realestate_lead_assignments")
        .select("id, company_id, broker_user_id, strategy, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("realestate_search_intents")
        .select("id, company_id, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
    ]);

    const err = propsRes.error || interestsRes.error || visitsRes.error || contractsRes.error || finsRes.error || assignsRes.error || intentsRes.error;
    if (err) throw new Error(err.message);

    const properties = propsRes.data ?? [];
    const interests = interestsRes.data ?? [];
    const visits = visitsRes.data ?? [];
    const contracts = contractsRes.data ?? [];
    const financings = finsRes.data ?? [];
    const assignments = assignsRes.data ?? [];
    const intents = intentsRes.data ?? [];

    const num = (v: unknown) => Number(v ?? 0);
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    const lower = (s: string | null | undefined) => (s ?? "").toLowerCase();

    // ===== Portfólio =====
    const ACTIVE = new Set(["active", "ativo", "disponivel", "available", "publicado", "published"]);
    const SOLD = new Set(["sold", "vendido", "rented", "alugado", "fechado", "closed"]);
    const RESERVED = new Set(["reserved", "reservado"]);
    const activeProps = properties.filter((p) => ACTIVE.has(lower(p.status))).length;
    const soldProps = properties.filter((p) => SOLD.has(lower(p.status))).length;
    const reservedProps = properties.filter((p) => RESERVED.has(lower(p.status))).length;
    const newProps = properties.filter((p) => (p.created_at ?? "") >= sinceIso).length;

    const opMap = new Map<string, number>();
    const typeMap = new Map<string, number>();
    for (const p of properties) {
      const op = lower(p.operation) || "outros";
      opMap.set(op, (opMap.get(op) ?? 0) + 1);
      const t = lower(p.property_type) || "outros";
      typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
    }
    const operationBreakdown = Array.from(opMap.entries()).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count);
    const typeBreakdown = Array.from(typeMap.entries()).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 10);

    const saleTotal = sum(properties.filter((p) => ACTIVE.has(lower(p.status))).map((p) => num(p.sale_price)));
    const rentTotal = sum(properties.filter((p) => ACTIVE.has(lower(p.status))).map((p) => num(p.rent_price)));

    // ===== Interests (leads) =====
    const totalLeads = interests.length;
    const responded = interests.filter((i) => i.responded_at).length;
    const responseRate = totalLeads ? (responded / totalLeads) * 100 : 0;
    const unresponded = interests.filter((i) => !i.responded_at).length;
    const staleLeads = interests.filter((i) => !i.responded_at && i.created_at < staleIso).length;
    const responseDurations = interests
      .filter((i) => i.responded_at && i.created_at)
      .map((i) => (new Date(i.responded_at!).getTime() - new Date(i.created_at).getTime()) / 3600000)
      .filter((h) => h >= 0 && h < 24 * 30);
    const avgResponseHours = responseDurations.length ? responseDurations.reduce((a, b) => a + b, 0) / responseDurations.length : 0;

    const sourceMap = new Map<string, number>();
    for (const i of interests) {
      const s = i.source ?? "direto";
      sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1);
    }
    const sourceBreakdown = Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    // ===== Visits =====
    const VIS_DONE = new Set(["completed", "realizada", "concluida", "done"]);
    const VIS_CANCEL = new Set(["cancelled", "cancelada", "canceled"]);
    const VIS_NO_SHOW = new Set(["no_show", "no-show", "ausente", "noshow"]);
    const VIS_SCHED = new Set(["scheduled", "agendada", "confirmed", "confirmada"]);
    const totalVisits = visits.length;
    const completedVisits = visits.filter((v) => VIS_DONE.has(lower(v.status))).length;
    const cancelledVisits = visits.filter((v) => VIS_CANCEL.has(lower(v.status))).length;
    const noShowVisits = visits.filter((v) => VIS_NO_SHOW.has(lower(v.status))).length;
    const scheduledVisits = visits.filter((v) => VIS_SCHED.has(lower(v.status))).length;
    const visitCompletionRate = totalVisits ? (completedVisits / totalVisits) * 100 : 0;
    const visitNoShowRate = totalVisits ? (noShowVisits / totalVisits) * 100 : 0;

    // ===== Contracts =====
    const SIGNED = new Set(["signed", "assinado", "active", "ativo", "vigente"]);
    const totalContracts = contracts.length;
    const signedContracts = contracts.filter((c) => SIGNED.has(lower(c.status)) || c.signed_at).length;
    const contractsValue = sum(contracts.filter((c) => SIGNED.has(lower(c.status)) || c.signed_at).map((c) => num(c.value)));
    const conversionRate = totalLeads ? (signedContracts / totalLeads) * 100 : 0;

    // ===== Financings =====
    const FIN_APPROVED = new Set(["approved", "aprovado"]);
    const FIN_DENIED = new Set(["denied", "negado", "rejected", "rejeitado"]);
    const FIN_PENDING = new Set(["pending", "submitted", "em_analise", "analise", "processando"]);
    const totalFin = financings.length;
    const finApproved = financings.filter((f) => FIN_APPROVED.has(lower(f.status)) || f.approved_at).length;
    const finDenied = financings.filter((f) => FIN_DENIED.has(lower(f.status))).length;
    const finPending = financings.filter((f) => FIN_PENDING.has(lower(f.status))).length;
    const finApprovedAmount = sum(financings.filter((f) => FIN_APPROVED.has(lower(f.status)) || f.approved_at).map((f) => num(f.financed_value)));

    // ===== Distribuição / Corretores =====
    type BrokerRow = { id: string; leads: number; responded: number; visits: number; visitsCompleted: number; contracts: number; assignments: number };
    const brokerMap = new Map<string, BrokerRow>();
    const touchB = (id: string): BrokerRow => {
      let r = brokerMap.get(id);
      if (!r) { r = { id, leads: 0, responded: 0, visits: 0, visitsCompleted: 0, contracts: 0, assignments: 0 }; brokerMap.set(id, r); }
      return r;
    };
    for (const i of interests) {
      if (!i.broker_user_id) continue;
      const r = touchB(i.broker_user_id);
      r.leads++;
      if (i.responded_at) r.responded++;
    }
    for (const v of visits) {
      if (!v.broker_user_id) continue;
      const r = touchB(v.broker_user_id);
      r.visits++;
      if (VIS_DONE.has(lower(v.status))) r.visitsCompleted++;
    }
    for (const a of assignments) {
      if (!a.broker_user_id) continue;
      touchB(a.broker_user_id).assignments++;
    }

    // Map property_id -> contract owner broker via interests (proxy)
    const propBrokerMap = new Map<string, string>();
    for (const i of interests) {
      if (i.property_id && i.broker_user_id && !propBrokerMap.has(i.property_id)) {
        propBrokerMap.set(i.property_id, i.broker_user_id);
      }
    }
    for (const c of contracts) {
      const b = c.property_id ? propBrokerMap.get(c.property_id) : null;
      if (b && (SIGNED.has(lower(c.status)) || c.signed_at)) touchB(b).contracts++;
    }
    const brokers = Array.from(brokerMap.values()).map((r) => ({
      ...r,
      responseRate: r.leads ? (r.responded / r.leads) * 100 : 0,
      conversionRate: r.leads ? (r.contracts / r.leads) * 100 : 0,
    })).sort((a, b) => b.leads - a.leads).slice(0, 20);

    // Estratégia de distribuição
    const stratMap = new Map<string, number>();
    for (const a of assignments) {
      const s = a.strategy ?? "manual";
      stratMap.set(s, (stratMap.get(s) ?? 0) + 1);
    }
    const strategyBreakdown = Array.from(stratMap.entries()).map(([strategy, count]) => ({ strategy, count })).sort((a, b) => b.count - a.count);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days, since: sinceIso },
      kpis: {
        totalProperties: properties.length,
        activeProps,
        reservedProps,
        soldProps,
        newProps,
        saleTotal,
        rentTotal,
        totalLeads,
        responded,
        unresponded,
        staleLeads,
        responseRate,
        avgResponseHours,
        searchIntents: intents.length,
        totalVisits,
        completedVisits,
        cancelledVisits,
        noShowVisits,
        scheduledVisits,
        visitCompletionRate,
        visitNoShowRate,
        totalContracts,
        signedContracts,
        contractsValue,
        conversionRate,
        totalFin,
        finApproved,
        finDenied,
        finPending,
        finApprovedAmount,
        assignmentsTotal: assignments.length,
      },
      operationBreakdown,
      typeBreakdown,
      sourceBreakdown,
      strategyBreakdown,
      brokers,
    };
  });
