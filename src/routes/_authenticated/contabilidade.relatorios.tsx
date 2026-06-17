import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatCard } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, FolderOpen, ClipboardList, AlertTriangle, FileText,
  Wallet, TrendingUp, ListChecks, FileSignature, BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/relatorios")({
  head: () => ({ meta: [{ title: "BI Contábil — Impulsionando" }] }),
  component: ContabBI,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ContabBI() {
  const { companyId } = useActiveCompany();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const { data, isLoading } = useQuery({
    queryKey: ["contab-bi", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [clients, docs, obls, tasks, irpf, finance, contracts] = await Promise.all([
        supabase.from("contab_clients").select("status, tax_regime, monthly_fee").eq("company_id", companyId!),
        supabase.from("contab_documents").select("status").eq("company_id", companyId!),
        supabase.from("contab_obligations").select("status, due_date, amount").eq("company_id", companyId!),
        supabase.from("contab_tasks").select("status, priority").eq("company_id", companyId!),
        supabase.from("contab_irpf_journeys").select("status, current_step, fee_amount, fee_paid").eq("company_id", companyId!),
        supabase.from("contab_office_finance").select("kind, status, amount").eq("company_id", companyId!),
        supabase.from("contab_contracts").select("status, monthly_fee").eq("company_id", companyId!),
      ]);
      return {
        clients: clients.data ?? [],
        docs: docs.data ?? [],
        obls: obls.data ?? [],
        tasks: tasks.data ?? [],
        irpf: irpf.data ?? [],
        finance: finance.data ?? [],
        contracts: contracts.data ?? [],
      };
    },
  });

  const m = useMemo(() => {
    if (!data) return null;
    const active = data.clients.filter((c) => c.status === "active");
    const mrr = active.reduce((s, c) => s + (+(c.monthly_fee || 0)), 0);
    const byRegime = active.reduce((acc, c) => {
      const k = c.tax_regime || "—";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const docsPending = data.docs.filter((d) => d.status === "pending").length;
    const oblOverdue = data.obls.filter((o) => o.status !== "paid" && o.due_date && o.due_date < today).length;
    const oblUpcoming = data.obls.filter((o) => o.status !== "paid" && o.due_date && o.due_date >= today && o.due_date <= in30).length;
    const oblValueUpcoming = data.obls
      .filter((o) => o.status !== "paid" && o.due_date && o.due_date >= today && o.due_date <= in30)
      .reduce((s, o) => s + (+(o.amount || 0)), 0);
    const tasksOpen = data.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;
    const tasksUrgent = data.tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;
    const irpfDone = data.irpf.filter((j) => j.current_step >= 14).length;
    const irpfInProgress = data.irpf.filter((j) => j.current_step < 14).length;
    const irpfFeesPending = data.irpf.filter((j) => !j.fee_paid).reduce((s, j) => s + (+(j.fee_amount || 0)), 0);
    const finReceivable = data.finance.filter((f) => f.kind === "receita" && f.status !== "pago")
      .reduce((s, f) => s + (+(f.amount || 0)), 0);
    const finPayable = data.finance.filter((f) => f.kind === "despesa" && f.status !== "pago")
      .reduce((s, f) => s + (+(f.amount || 0)), 0);
    const contractsActive = data.contracts.filter((c) => c.status === "assinado").length;
    return {
      active: active.length, mrr, byRegime,
      docsPending, oblOverdue, oblUpcoming, oblValueUpcoming,
      tasksOpen, tasksUrgent,
      irpfDone, irpfInProgress, irpfFeesPending,
      finReceivable, finPayable,
      contractsActive,
    };
  }, [data, today, in30]);

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;
  if (isLoading || !m) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando indicadores…</div>;

  return (
    <div>
      <PageHeader
        title="BI Contábil"
        description="Indicadores gerenciais consolidados — operação, IRPF, financeiro e contratos."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Badge className="gap-1"><BarChart3 className="w-3 h-3" /> BI Gerencial</Badge>
          </div>
        }
      />

      <h2 className="font-semibold mb-3 text-sm text-muted-foreground">Carteira & Receita Recorrente</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Clientes ativos" value={m.active} icon={Users} accent />
        <StatCard label="MRR (honorários)" value={fmt(m.mrr)} icon={TrendingUp} />
        <StatCard label="Contratos assinados" value={m.contractsActive} icon={FileSignature} />
        <StatCard label="Ticket médio" value={fmt(m.active ? m.mrr / m.active : 0)} icon={Wallet} />
      </div>

      <h2 className="font-semibold mb-3 text-sm text-muted-foreground">Operação fiscal</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Docs pendentes" value={m.docsPending} icon={FolderOpen} />
        <StatCard label="Obrigações 30d" value={m.oblUpcoming} icon={ClipboardList} hint={fmt(m.oblValueUpcoming)} />
        <StatCard
          label="Obrigações atrasadas"
          value={m.oblOverdue}
          icon={AlertTriangle}
          hint={m.oblOverdue ? "Requer ação" : "OK"}
        />
        <StatCard label="Tarefas abertas" value={m.tasksOpen} icon={ListChecks} hint={m.tasksUrgent ? `${m.tasksUrgent} urgentes` : undefined} />
      </div>

      <h2 className="font-semibold mb-3 text-sm text-muted-foreground">IRPF & Financeiro</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="IRPF em andamento" value={m.irpfInProgress} icon={FileText} />
        <StatCard label="IRPF concluídas" value={m.irpfDone} icon={FileText} />
        <StatCard label="Honorários IRPF pendentes" value={fmt(m.irpfFeesPending)} icon={Wallet} />
        <StatCard label="A receber - escritório" value={fmt(m.finReceivable)} icon={TrendingUp} accent />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-medium mb-3">Composição da carteira por regime tributário</h3>
          {Object.keys(m.byRegime).length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
          <div className="space-y-2">
            {Object.entries(m.byRegime).sort((a, b) => b[1] - a[1]).map(([reg, count]) => {
              const pct = m.active ? Math.round((count / m.active) * 100) : 0;
              return (
                <div key={reg}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{reg}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-3">Resumo financeiro do escritório</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">A receber</span>
              <span className="font-semibold text-emerald-600">{fmt(m.finReceivable)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">A pagar</span>
              <span className="font-semibold text-red-600">{fmt(m.finPayable)}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-medium">Saldo projetado</span>
              <span className={`font-bold ${m.finReceivable - m.finPayable >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {fmt(m.finReceivable - m.finPayable)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-muted-foreground">+ MRR de honorários</span>
              <span className="font-medium">{fmt(m.mrr)}/mês</span>
            </div>
          </div>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Indicadores atualizados em tempo real a partir das tabelas operacionais do nicho Contabilidade Inteligente.
      </p>
    </div>
  );
}
