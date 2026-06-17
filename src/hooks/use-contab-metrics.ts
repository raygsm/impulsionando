import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContabFilters {
  from?: string;     // ISO date YYYY-MM-DD
  to?: string;       // ISO date YYYY-MM-DD
  regime?: string;   // tax_regime ou "all"
  clientId?: string; // contab_clients.id ou "all"
}

interface RawData {
  clients: Array<{ id: string; status: string; tax_regime: string | null; monthly_fee: number | null; created_at: string }>;
  docs: Array<{ status: string; created_at: string; client_id: string | null }>;
  obls: Array<{ status: string; due_date: string | null; amount: number | null; client_id: string | null }>;
  tasks: Array<{ status: string; priority: string; created_at: string; client_id: string | null }>;
  irpf: Array<{ status: string; current_step: number; fee_amount: number | null; fee_paid: boolean | null; base_year: number }>;
  finance: Array<{ kind: string; status: string; amount: number | null; due_date: string | null; paid_at: string | null; client_id: string | null }>;
  contracts: Array<{ status: string; monthly_fee: number | null; client_id: string | null }>;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

export function useContabMetrics(companyId: string | undefined, filters?: ContabFilters) {
  const q = useQuery({
    queryKey: ["contab-metrics", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<RawData> => {
      const [clients, docs, obls, tasks, irpf, finance, contracts] = await Promise.all([
        supabase.from("contab_clients").select("id, status, tax_regime, monthly_fee, created_at").eq("company_id", companyId!),
        supabase.from("contab_documents").select("status, created_at, client_id").eq("company_id", companyId!),
        supabase.from("contab_obligations").select("status, due_date, amount, client_id").eq("company_id", companyId!),
        supabase.from("contab_tasks").select("status, priority, created_at, client_id").eq("company_id", companyId!),
        supabase.from("contab_irpf_journeys").select("status, current_step, fee_amount, fee_paid, base_year").eq("company_id", companyId!),
        supabase.from("contab_office_finance").select("kind, status, amount, due_date, paid_at, client_id").eq("company_id", companyId!),
        supabase.from("contab_contracts").select("status, monthly_fee, client_id").eq("company_id", companyId!),
      ]);
      return {
        clients: (clients.data ?? []) as RawData["clients"],
        docs: (docs.data ?? []) as RawData["docs"],
        obls: (obls.data ?? []) as RawData["obls"],
        tasks: (tasks.data ?? []) as RawData["tasks"],
        irpf: (irpf.data ?? []) as RawData["irpf"],
        finance: (finance.data ?? []) as RawData["finance"],
        contracts: (contracts.data ?? []) as RawData["contracts"],
      };
    },
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    if (!q.data) return null;
    const f = filters || {};
    const inRange = (d?: string | null) => {
      if (!d) return true;
      if (f.from && d < f.from) return false;
      if (f.to && d > f.to) return false;
      return true;
    };
    const okClient = (cid?: string | null) => !f.clientId || f.clientId === "all" || cid === f.clientId;
    let clients = q.data.clients;
    if (f.regime && f.regime !== "all") clients = clients.filter((c) => c.tax_regime === f.regime);
    if (f.clientId && f.clientId !== "all") clients = clients.filter((c) => c.id === f.clientId);
    const allowedClientIds = new Set(clients.map((c) => c.id));
    const keepClient = (cid?: string | null) => {
      if (!f.clientId && (!f.regime || f.regime === "all")) return true;
      if (!cid) return false;
      return allowedClientIds.has(cid);
    };
    return {
      clients,
      docs: q.data.docs.filter((d) => inRange(d.created_at) && keepClient(d.client_id) && okClient(d.client_id)),
      obls: q.data.obls.filter((o) => inRange(o.due_date) && keepClient(o.client_id) && okClient(o.client_id)),
      tasks: q.data.tasks.filter((t) => inRange(t.created_at) && keepClient(t.client_id) && okClient(t.client_id)),
      irpf: q.data.irpf,
      finance: q.data.finance.filter((x) => inRange(x.due_date || x.paid_at) && keepClient(x.client_id) && okClient(x.client_id)),
      contracts: q.data.contracts.filter((c) => keepClient(c.client_id) && okClient(c.client_id)),
    };
  }, [q.data, filters]);

  const metrics = useMemo(() => {
    if (!filtered) return null;
    const today = TODAY();
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const active = filtered.clients.filter((c) => c.status === "active");
    const mrr = active.reduce((s, c) => s + +(c.monthly_fee || 0), 0);

    const byRegime: Record<string, { count: number; mrr: number }> = {};
    for (const c of active) {
      const k = c.tax_regime || "—";
      if (!byRegime[k]) byRegime[k] = { count: 0, mrr: 0 };
      byRegime[k].count++;
      byRegime[k].mrr += +(c.monthly_fee || 0);
    }

    const docsPending = filtered.docs.filter((d) => d.status === "pending").length;
    const oblOverdue = filtered.obls.filter((o) => o.status !== "paid" && o.due_date && o.due_date < today).length;
    const oblUpcoming7 = filtered.obls.filter((o) => o.status !== "paid" && o.due_date && o.due_date >= today && o.due_date <= in7).length;
    const oblUpcoming30 = filtered.obls.filter((o) => o.status !== "paid" && o.due_date && o.due_date >= today && o.due_date <= in30);
    const oblValueUpcoming = oblUpcoming30.reduce((s, o) => s + +(o.amount || 0), 0);
    const oblByStatus: Record<string, number> = {};
    for (const o of filtered.obls) oblByStatus[o.status] = (oblByStatus[o.status] || 0) + 1;

    const tasksOpen = filtered.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;
    const tasksUrgent = filtered.tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;

    const irpfDone = filtered.irpf.filter((j) => j.current_step >= 14).length;
    const irpfInProgress = filtered.irpf.filter((j) => j.current_step < 14).length;
    const irpfFeesPending = filtered.irpf.filter((j) => !j.fee_paid).reduce((s, j) => s + +(j.fee_amount || 0), 0);

    const finReceivable = filtered.finance.filter((f) => f.kind === "receita" && f.status !== "pago").reduce((s, f) => s + +(f.amount || 0), 0);
    const finReceived = filtered.finance.filter((f) => f.kind === "receita" && f.status === "pago").reduce((s, f) => s + +(f.amount || 0), 0);
    const finPayable = filtered.finance.filter((f) => f.kind === "despesa" && f.status !== "pago").reduce((s, f) => s + +(f.amount || 0), 0);
    const finPaid = filtered.finance.filter((f) => f.kind === "despesa" && f.status === "pago").reduce((s, f) => s + +(f.amount || 0), 0);

    const contractsActive = filtered.contracts.filter((c) => c.status === "assinado").length;

    // série mensal MRR (cumulativa baseada em created_at de clientes ativos)
    const monthlyMrr: { month: string; mrr: number; clients: number }[] = [];
    const sorted = [...active].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const buckets: Record<string, { mrr: number; clients: number }> = {};
    let cumMrr = 0, cumClients = 0;
    for (const c of sorted) {
      const m = c.created_at.slice(0, 7);
      cumMrr += +(c.monthly_fee || 0);
      cumClients += 1;
      buckets[m] = { mrr: cumMrr, clients: cumClients };
    }
    for (const m of Object.keys(buckets).sort()) {
      monthlyMrr.push({ month: m, mrr: buckets[m].mrr, clients: buckets[m].clients });
    }

    return {
      active: active.length,
      mrr,
      avgTicket: active.length ? mrr / active.length : 0,
      byRegime,
      docsPending,
      oblOverdue,
      oblUpcoming7,
      oblUpcoming30: oblUpcoming30.length,
      oblValueUpcoming,
      oblByStatus,
      tasksOpen,
      tasksUrgent,
      irpfDone,
      irpfInProgress,
      irpfFeesPending,
      finReceivable,
      finReceived,
      finPayable,
      finPaid,
      contractsActive,
      monthlyMrr,
    };
  }, [filtered]);

  const dataStatus = useMemo(() => {
    if (!q.data) return { hasData: false, total: 0 };
    const total =
      q.data.clients.length + q.data.docs.length + q.data.obls.length +
      q.data.tasks.length + q.data.irpf.length + q.data.finance.length + q.data.contracts.length;
    return {
      hasData: total > 0,
      total,
      counts: {
        clients: q.data.clients.length,
        docs: q.data.docs.length,
        obls: q.data.obls.length,
        tasks: q.data.tasks.length,
        irpf: q.data.irpf.length,
        finance: q.data.finance.length,
        contracts: q.data.contracts.length,
      },
    };
  }, [q.data]);

  return {
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    error: q.error,
    raw: q.data,
    metrics,
    dataStatus,
    refetch: q.refetch,
  };
}
