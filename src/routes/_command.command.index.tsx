import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCommandCenter } from "@/lib/command-center.functions";
import { CommandPage } from "@/components/command/CommandPage";
import { KpiCard } from "@/components/command/KpiCard";
import {
  DollarSign,
  Building2,
  UserPlus,
  FileText,
  AlertTriangle,
  Ticket,
  Workflow,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/_command/command/")({
  head: () => ({ meta: [{ title: "Dashboard · Command" }] }),
  component: CommandDashboard,
});

function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}

function CommandDashboard() {
  const fetchSnapshot = useServerFn(getCommandCenter);
  const { data, isLoading, error } = useQuery({
    queryKey: ["command-center-snapshot"],
    queryFn: () => fetchSnapshot(),
    staleTime: 30_000,
  });

  return (
    <CommandPage
      title="Centro de Comando"
      description="Visão consolidada da operação Impulsionando em tempo real."
    >
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Falha ao carregar snapshot: {(error as Error).message}
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="MRR"
          value={isLoading ? "…" : fmtBRL(data?.kpis.mrr ?? 0)}
          icon={DollarSign}
          tone="positive"
          href="/command/financeiro"
        />
        <KpiCard
          label="Clientes ativos"
          value={isLoading ? "…" : (data?.kpis.activeTenants ?? 0)}
          icon={Building2}
          href="/command/clientes?status=active"
        />
        <KpiCard
          label="Leads 24h"
          value={isLoading ? "…" : (data?.kpis.leads24h ?? 0)}
          hint={data ? `${data.kpis.leads7d} nos últimos 7d` : undefined}
          icon={UserPlus}
          href="/command/comercial"
        />
        <KpiCard
          label="Propostas 7d"
          value={isLoading ? "…" : (data?.kpis.quotes7d ?? 0)}
          icon={FileText}
          href="/command/comercial"
        />
        <KpiCard
          label="Suspensões"
          value={isLoading ? "…" : (data?.kpis.suspensions ?? 0)}
          icon={AlertTriangle}
          tone={data && data.kpis.suspensions > 0 ? "warning" : "default"}
          href="/command/clientes?status=suspended"
        />
        <KpiCard
          label="Tickets abertos"
          value={isLoading ? "…" : (data?.kpis.openTickets ?? 0)}
          hint={data ? `${data.kpis.urgentTickets} urgentes` : undefined}
          icon={Ticket}
          tone={data && data.kpis.urgentTickets > 0 ? "danger" : "default"}
          href="/command/atendimento"
        />
        <KpiCard
          label="Automações"
          value={isLoading ? "…" : `${data?.kpis.automationHealth ?? 100}%`}
          hint={data ? `${data.kpis.automationRuns} execuções · ${data.kpis.automationFailed} falhas` : undefined}
          icon={Workflow}
          tone={data && data.kpis.automationHealth < 90 ? "warning" : "positive"}
          href="/command/automacoes"
        />
        <KpiCard
          label="Demos 7d"
          value={isLoading ? "…" : (data?.kpis.demos7d ?? 0)}
          icon={Activity}
          href="/command/comercial"
        />

      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Tickets urgentes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Casos com prioridade alta ou urgente aguardando resposta.
          </p>
          <div className="mt-4 divide-y">
            {isLoading ? (
              <p className="text-xs text-muted-foreground py-4">Carregando…</p>
            ) : (data?.urgentTickets ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">Nenhum ticket urgente.</p>
            ) : (
              data!.urgentTickets.map((t: any) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.subject ?? "(sem assunto)"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Alertas inteligentes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sinais operacionais consolidados a partir do snapshot.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {!isLoading && data && (
              <>
                {data.kpis.suspensions > 0 && (
                  <li className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{data.kpis.suspensions} tenants com cobrança suspensa.</span>
                  </li>
                )}
                {data.kpis.automationFailed > 0 && (
                  <li className="flex gap-2">
                    <Workflow className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{data.kpis.automationFailed} execuções de automação falharam nos últimos 7 dias.</span>
                  </li>
                )}
                {data.kpis.leadsDelta < -10 && (
                  <li className="flex gap-2">
                    <UserPlus className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span>Volume de leads caiu {Math.abs(data.kpis.leadsDelta)}% vs. semana anterior.</span>
                  </li>
                )}
                {data.kpis.leadsDelta > 10 && (
                  <li className="flex gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Leads cresceram {data.kpis.leadsDelta}% vs. semana anterior.</span>
                  </li>
                )}
                {data.kpis.urgentTickets > 0 && (
                  <li className="flex gap-2">
                    <Ticket className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span>{data.kpis.urgentTickets} tickets urgentes exigem atenção imediata.</span>
                  </li>
                )}
                {data.kpis.suspensions === 0 &&
                  data.kpis.automationFailed === 0 &&
                  data.kpis.urgentTickets === 0 && (
                    <li className="text-xs text-muted-foreground">Nenhum alerta ativo — operação saudável.</li>
                  )}
              </>
            )}
          </ul>
        </div>
      </section>
    </CommandPage>
  );
}
