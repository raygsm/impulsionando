import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Fiscal & NF-e Health — Fase 44.
 * Saúde da emissão fiscal: status das NFS-e, rejeições, retries, eventos do provedor,
 * configuração de emissores ativos e disparo dos relatórios fiscais por e-mail.
 */
export const getFiscalHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const staleIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const [invRes, evRes, issuersRes, emailRes] = await Promise.all([
      supabaseAdmin
        .from("core_fiscal_invoices")
        .select("id, issuer_id, status, status_message, service_amount, net_amount, iss_amount, provider, environment, issued_at, cancelled_at, attempt_count, last_attempt_at, created_at, nf_number")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("core_fiscal_invoice_events")
        .select("id, invoice_id, event_type, message, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("core_fiscal_issuer_config")
        .select("id, is_active, legal_name, cnpj, provider, environment, tax_regime, iss_rate, next_rps_number, updated_at")
        .limit(2000),
      supabaseAdmin
        .from("fiscal_email_runs")
        .select("id, year, month, recipient, status, attempt, error_message, email_mode, created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const err = invRes.error || evRes.error || issuersRes.error || emailRes.error;
    if (err) throw new Error(err.message);

    const invoices = invRes.data ?? [];
    const events = evRes.data ?? [];
    const issuers = issuersRes.data ?? [];
    const emails = emailRes.data ?? [];

    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    const num = (v: unknown) => Number(v ?? 0);

    // Status breakdown
    const statusMap = new Map<string, { count: number; amount: number }>();
    for (const i of invoices) {
      const key = (i.status ?? "desconhecido").toLowerCase();
      const e = statusMap.get(key) ?? { count: 0, amount: 0 };
      e.count++;
      e.amount += num(i.service_amount);
      statusMap.set(key, e);
    }
    const statusBreakdown = Array.from(statusMap.entries())
      .map(([status, v]) => ({ status, ...v }))
      .sort((a, b) => b.count - a.count);

    const isIssued = (s: string | null) =>
      ["issued", "emitida", "autorizada", "authorized", "success", "ok"].includes((s ?? "").toLowerCase());
    const isRejected = (s: string | null) =>
      ["rejected", "rejeitada", "error", "erro", "failed", "falha"].includes((s ?? "").toLowerCase());
    const isPending = (s: string | null) =>
      ["pending", "processing", "queued", "fila", "processando", "aguardando"].includes((s ?? "").toLowerCase());
    const isCancelled = (s: string | null, c?: string | null) =>
      Boolean(c) || ["cancelled", "cancelada"].includes((s ?? "").toLowerCase());

    const total = invoices.length;
    const issued = invoices.filter((i) => isIssued(i.status)).length;
    const rejected = invoices.filter((i) => isRejected(i.status)).length;
    const pending = invoices.filter((i) => isPending(i.status)).length;
    const cancelled = invoices.filter((i) => isCancelled(i.status, i.cancelled_at)).length;
    const stalePending = invoices.filter((i) => isPending(i.status) && i.created_at < staleIso).length;
    const retriesHigh = invoices.filter((i) => (i.attempt_count ?? 0) >= 3 && !isIssued(i.status)).length;

    const approvalRate = total ? (issued / total) * 100 : 0;
    const rejectionRate = total ? (rejected / total) * 100 : 0;

    const serviceTotal = sum(invoices.map((i) => num(i.service_amount)));
    const issuedRevenue = sum(invoices.filter((i) => isIssued(i.status)).map((i) => num(i.service_amount)));
    const lostRevenue = sum(invoices.filter((i) => isRejected(i.status) || isCancelled(i.status, i.cancelled_at)).map((i) => num(i.service_amount)));
    const issTotal = sum(invoices.filter((i) => isIssued(i.status)).map((i) => num(i.iss_amount)));
    const netTotal = sum(invoices.filter((i) => isIssued(i.status)).map((i) => num(i.net_amount)));

    // Tempo médio de emissão (created_at -> issued_at)
    const durations = invoices
      .filter((i) => i.issued_at && i.created_at)
      .map((i) => (new Date(i.issued_at!).getTime() - new Date(i.created_at).getTime()) / 60000);
    const avgIssueMinutes = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Top rejection messages
    const rejMap = new Map<string, number>();
    for (const i of invoices) {
      if (isRejected(i.status) && i.status_message) {
        const k = (i.status_message ?? "").slice(0, 120);
        rejMap.set(k, (rejMap.get(k) ?? 0) + 1);
      }
    }
    const topRejections = Array.from(rejMap.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Eventos
    const eventMap = new Map<string, number>();
    for (const e of events) {
      const k = e.event_type ?? "outro";
      eventMap.set(k, (eventMap.get(k) ?? 0) + 1);
    }
    const eventBreakdown = Array.from(eventMap.entries())
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Issuers
    const issuerMap = new Map(issuers.map((x) => [x.id, x]));
    type IssRow = {
      issuerId: string;
      name: string;
      cnpj: string | null;
      provider: string | null;
      environment: string | null;
      issued: number;
      rejected: number;
      pending: number;
      total: number;
      revenue: number;
      approvalRate: number;
    };
    const issuerStats = new Map<string, IssRow>();
    for (const i of invoices) {
      if (!i.issuer_id) continue;
      const cfg = issuerMap.get(i.issuer_id);
      let row = issuerStats.get(i.issuer_id);
      if (!row) {
        row = {
          issuerId: i.issuer_id,
          name: cfg?.legal_name ?? i.issuer_id.slice(0, 8),
          cnpj: cfg?.cnpj ?? null,
          provider: cfg?.provider ?? null,
          environment: cfg?.environment ?? null,
          issued: 0,
          rejected: 0,
          pending: 0,
          total: 0,
          revenue: 0,
          approvalRate: 0,
        };
        issuerStats.set(i.issuer_id, row);
      }
      row.total++;
      row.revenue += num(i.service_amount);
      if (isIssued(i.status)) row.issued++;
      else if (isRejected(i.status)) row.rejected++;
      else if (isPending(i.status)) row.pending++;
    }
    const issuerRanking = Array.from(issuerStats.values())
      .map((r) => ({ ...r, approvalRate: r.total ? (r.issued / r.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    const activeIssuers = issuers.filter((i) => i.is_active).length;
    const homologIssuers = issuers.filter((i) => (i.environment ?? "").toLowerCase() === "homologacao" || (i.environment ?? "").toLowerCase() === "homologation").length;

    // E-mail runs
    const emailTotal = emails.length;
    const emailFailed = emails.filter((e) => ["failed", "error", "erro"].includes((e.status ?? "").toLowerCase())).length;
    const emailSent = emails.filter((e) => ["sent", "ok", "delivered"].includes((e.status ?? "").toLowerCase())).length;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days, since: sinceIso },
      kpis: {
        total,
        issued,
        rejected,
        pending,
        cancelled,
        stalePending,
        retriesHigh,
        approvalRate,
        rejectionRate,
        serviceTotal,
        issuedRevenue,
        lostRevenue,
        issTotal,
        netTotal,
        avgIssueMinutes,
        activeIssuers,
        homologIssuers,
        totalIssuers: issuers.length,
        emailTotal,
        emailSent,
        emailFailed,
      },
      statusBreakdown,
      topRejections,
      eventBreakdown,
      issuerRanking: issuerRanking.slice(0, 25),
      recentEmails: emails.slice(0, 15),
    };
  });
