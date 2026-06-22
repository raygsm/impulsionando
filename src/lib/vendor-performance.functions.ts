import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Vendor & Partner Performance — Fase 36.
 * Performance de afiliados, managers e fornecedores do marketplace B2B.
 *
 *  Afiliados/Managers (aff_*):
 *   - GMV (gross_amount aprovado) por afiliado + ranking
 *   - Conversão: vendas aprovadas / total (incluindo refunded/chargeback)
 *   - Top managers por GMV de afiliados sob gestão
 *
 *  Marketplace B2B (mp_*):
 *   - GMV por fornecedor (subtotal aprovado/concluído)
 *   - Taxa de Intermediação Digital arrecadada
 *   - Order count, ticket médio, taxa de aprovação
 */
export const getVendorPerformance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(365, d?.days ?? 90)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [affiliatesRes, managersRes, salesRes, suppliersRes, ordersRes] = await Promise.all([
      supabaseAdmin
        .from("aff_affiliates")
        .select("id, name, email, status, manager_id, main_channel, is_lifetime, wallet_balance, wallet_pending, created_at")
        .limit(5000),
      supabaseAdmin
        .from("aff_managers")
        .select("id, name, email, commission_pct, status")
        .limit(500),
      supabaseAdmin
        .from("aff_sales")
        .select("id, affiliate_id, manager_id, gross_amount, net_amount, status, sold_at, refunded_at, chargeback_at")
        .gte("sold_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("mp_suppliers")
        .select("id, company_id, display_name, supplier_type, status, custom_fee_pct")
        .limit(2000),
      supabaseAdmin
        .from("mp_orders")
        .select("id, supplier_id, status, subtotal_cents, fee_cents, total_cents, supplier_net_cents, placed_at, approved_at, completed_at, rejected_at")
        .gte("created_at", sinceIso)
        .limit(20000),
    ]);

    const affiliates = affiliatesRes.data ?? [];
    const managers = managersRes.data ?? [];
    const sales = salesRes.data ?? [];
    const suppliers = suppliersRes.data ?? [];
    const orders = ordersRes.data ?? [];

    // ===== Afiliados =====
    type AffStat = {
      id: string; name: string; email: string; status: string;
      mainChannel: string; isLifetime: boolean; managerId: string | null;
      walletBalance: number; walletPending: number;
      totalSales: number; approvedSales: number; refundedSales: number;
      gmv: number; netRevenue: number; conversionRate: number; avgTicket: number;
    };

    const affMap = new Map<string, AffStat>();
    for (const a of affiliates) {
      affMap.set(a.id, {
        id: a.id, name: a.name ?? "—", email: a.email ?? "—",
        status: a.status ?? "—", mainChannel: a.main_channel ?? "—",
        isLifetime: !!a.is_lifetime, managerId: a.manager_id,
        walletBalance: Number(a.wallet_balance ?? 0),
        walletPending: Number(a.wallet_pending ?? 0),
        totalSales: 0, approvedSales: 0, refundedSales: 0,
        gmv: 0, netRevenue: 0, conversionRate: 0, avgTicket: 0,
      });
    }

    for (const s of sales) {
      if (!s.affiliate_id) continue;
      const stat = affMap.get(s.affiliate_id);
      if (!stat) continue;
      stat.totalSales += 1;
      const isApproved = ["aprovado", "approved", "pago", "paid"].includes((s.status ?? "").toLowerCase()) && !s.refunded_at && !s.chargeback_at;
      const isRefunded = !!s.refunded_at || !!s.chargeback_at;
      if (isApproved) {
        stat.approvedSales += 1;
        stat.gmv += Number(s.gross_amount ?? 0);
        stat.netRevenue += Number(s.net_amount ?? 0);
      }
      if (isRefunded) stat.refundedSales += 1;
    }

    for (const stat of affMap.values()) {
      stat.conversionRate = stat.totalSales > 0
        ? Math.round((stat.approvedSales / stat.totalSales) * 100)
        : 0;
      stat.avgTicket = stat.approvedSales > 0 ? stat.gmv / stat.approvedSales : 0;
    }

    const topAffiliates = Array.from(affMap.values())
      .filter((a) => a.gmv > 0 || a.totalSales > 0)
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 25);

    // ===== Managers =====
    type MgrStat = {
      id: string; name: string; email: string; commissionPct: number; status: string;
      affiliatesCount: number; activeAffiliates: number; gmv: number; managerCommission: number;
    };
    const mgrMap = new Map<string, MgrStat>();
    for (const m of managers) {
      mgrMap.set(m.id, {
        id: m.id, name: m.name ?? "—", email: m.email ?? "—",
        commissionPct: Number(m.commission_pct ?? 0),
        status: m.status ?? "—",
        affiliatesCount: 0, activeAffiliates: 0, gmv: 0, managerCommission: 0,
      });
    }
    for (const a of affMap.values()) {
      if (!a.managerId) continue;
      const m = mgrMap.get(a.managerId);
      if (!m) continue;
      m.affiliatesCount += 1;
      if (a.approvedSales > 0) m.activeAffiliates += 1;
      m.gmv += a.gmv;
    }
    for (const m of mgrMap.values()) {
      m.managerCommission = (m.gmv * m.commissionPct) / 100;
    }
    const topManagers = Array.from(mgrMap.values())
      .filter((m) => m.gmv > 0 || m.affiliatesCount > 0)
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 15);

    // ===== Fornecedores Marketplace B2B =====
    type SupStat = {
      id: string; displayName: string; supplierType: string; status: string;
      customFeePct: number;
      ordersTotal: number; ordersApproved: number; ordersRejected: number;
      gmvCents: number; feeCents: number; netCents: number;
      approvalRate: number; avgTicketCents: number;
    };
    const supMap = new Map<string, SupStat>();
    for (const s of suppliers) {
      supMap.set(s.id, {
        id: s.id, displayName: s.display_name ?? "—",
        supplierType: s.supplier_type ?? "—", status: s.status ?? "—",
        customFeePct: Number(s.custom_fee_pct ?? 0),
        ordersTotal: 0, ordersApproved: 0, ordersRejected: 0,
        gmvCents: 0, feeCents: 0, netCents: 0,
        approvalRate: 0, avgTicketCents: 0,
      });
    }
    for (const o of orders) {
      if (!o.supplier_id) continue;
      const stat = supMap.get(o.supplier_id);
      if (!stat) continue;
      stat.ordersTotal += 1;
      const st = (o.status ?? "").toLowerCase();
      const isFinal = ["approved", "aprovado", "completed", "concluido", "concluído", "invoiced"].includes(st) || !!o.approved_at || !!o.completed_at;
      const isRejected = st === "rejected" || st === "rejeitado" || !!o.rejected_at;
      if (isFinal) {
        stat.ordersApproved += 1;
        stat.gmvCents += Number(o.subtotal_cents ?? 0);
        stat.feeCents += Number(o.fee_cents ?? 0);
        stat.netCents += Number(o.supplier_net_cents ?? 0);
      }
      if (isRejected) stat.ordersRejected += 1;
    }
    for (const s of supMap.values()) {
      s.approvalRate = s.ordersTotal > 0 ? Math.round((s.ordersApproved / s.ordersTotal) * 100) : 0;
      s.avgTicketCents = s.ordersApproved > 0 ? s.gmvCents / s.ordersApproved : 0;
    }
    const topSuppliers = Array.from(supMap.values())
      .filter((s) => s.gmvCents > 0 || s.ordersTotal > 0)
      .sort((a, b) => b.gmvCents - a.gmvCents)
      .slice(0, 25);

    // ===== KPIs globais =====
    const totalAffGmv = topAffiliates.reduce((s, a) => s + a.gmv, 0);
    const totalMpGmv = topSuppliers.reduce((s, x) => s + x.gmvCents, 0) / 100;
    const totalMpFee = topSuppliers.reduce((s, x) => s + x.feeCents, 0) / 100;
    const walletPendingTotal = affiliates.reduce((s, a) => s + Number(a.wallet_pending ?? 0), 0);
    const walletBalanceTotal = affiliates.reduce((s, a) => s + Number(a.wallet_balance ?? 0), 0);

    const kpis = {
      totalAffiliates: affiliates.length,
      activeAffiliates: topAffiliates.length,
      totalManagers: managers.length,
      affGmv: Math.round(totalAffGmv),
      walletBalanceTotal: Math.round(walletBalanceTotal),
      walletPendingTotal: Math.round(walletPendingTotal),
      totalSuppliers: suppliers.length,
      activeSuppliers: topSuppliers.length,
      mpGmv: Math.round(totalMpGmv),
      mpFeeCollected: Math.round(totalMpFee),
      mpEffectiveFeePct: totalMpGmv > 0 ? Number(((totalMpFee / totalMpGmv) * 100).toFixed(2)) : 0,
      mpOrdersApproved: topSuppliers.reduce((s, x) => s + x.ordersApproved, 0),
    };

    return {
      generatedAt: new Date().toISOString(),
      windowDays: data.days,
      kpis,
      topAffiliates,
      topManagers,
      topSuppliers,
    };
  });
