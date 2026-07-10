import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCommandCenter } from "@/lib/command-center.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Users, TrendingUp, TrendingDown, AlertTriangle, Activity,
  ListChecks, BarChart3, Building2, Mail, Inbox, LineChart, Zap,
} from "lucide-react";
import { CoreSection, LoadingState, ErrorState, EmptyState } from "@/components/impulsionando";
import { formatBRL, formatInt, formatPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/command-center")({
  head: () => ({ meta: [{ title: "Command Center — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CommandCenterPage,
});

const shortcuts = [
  { to: "/admin/action-center", label: "Action Center", icon: ListChecks, hint: "Fila priorizada" },
  { to: "/admin/health", label: "Health Score", icon: Activity, hint: "Saúde dos clientes" },
  { to: "/admin/inbox-unificada", label: "Inbox Omnichannel", icon: Inbox, hint: "Mensagens unificadas" },
  { to: "/admin/expansion-radar", label: "Expansion Radar", icon: Zap, hint: "Upsell por peers" },
  { to: "/admin/attribution", label: "Revenue Attribution", icon: DollarSign, hint: "MRR por origem" },
  { to: "/admin/peer-benchmark", label: "Peer Benchmark", icon: BarChart3, hint: "Quartis por nicho" },
  { to: "/admin/tenant-360", label: "Cliente 360°", icon: Building2, hint: "Drill-down por cliente" },
  { to: "/admin/cohort-retention", label: "Cohort Retention", icon: LineChart, hint: "Retenção mensal" },
];

type KpiTone = "default" | "danger" | "success" | "warning";
const toneClass: Record<KpiTone, string> = {
  default: "text-foreground",
  danger: "text-destructive",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
};

function Kpi({
  icon: Icon, label, value, hint, tone = "default",
}: { icon: any; label: string; value: React.ReactNode; hint?: string; tone?: KpiTone }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" /> {label}
      </div>
      <div className={`text-2xl font-bold mt-1 tabular-nums ${toneClass[tone]}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}

function CommandCenterPage() {
  const fn = useServerFn(getCommandCenter);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["command-center"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
    retry: false,
  });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" aria-hidden="true" /> Command Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão única da operação Impulsionando. Atualiza a cada 60s.
        </p>
      </header>

      {isLoading && <LoadingState label="Carregando cockpit…" />}

      {!isLoading && error && (
        <ErrorState
          title="Não foi possível carregar o Command Center"
          description="Esta visão requer acesso da equipe Impulsionando. Verifique suas permissões ou tente novamente."
          detail={(error as Error).message}
        />
      )}

      {!isLoading && data && (() => {
        const k = data.kpis;
        const deltaIcon = k.leadsDelta >= 0 ? TrendingUp : TrendingDown;
        const deltaTone: KpiTone = k.leadsDelta >= 0 ? "success" : "danger";
        return (
          <>
            <CoreSection title="Indicadores primários" description="Snapshot cross-cliente das últimas horas.">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Kpi icon={DollarSign} label="MRR ativo" value={formatBRL(k.mrr)} hint={`${formatInt(k.activeTenants)} clientes ativos`} />
                <Kpi
                  icon={Users}
                  label="Leads 7d"
                  value={formatInt(k.leads7d)}
                  hint={`${formatInt(k.leads24h)} nas últimas 24h · ${k.leadsDelta >= 0 ? "+" : ""}${k.leadsDelta}% vs 7d anteriores`}
                  tone={deltaTone}
                />
                <Kpi icon={Mail} label="Demos 7d" value={formatInt(k.demos7d)} hint={`${formatInt(k.quotes7d)} orçamentos`} />
                <Kpi
                  icon={AlertTriangle}
                  label="Tickets abertos"
                  value={formatInt(k.openTickets)}
                  hint={`${formatInt(k.urgentTickets)} urgentes`}
                  tone={k.urgentTickets > 0 ? "danger" : "default"}
                />
                <Kpi
                  icon={Zap}
                  label="Saúde N8N 7d"
                  value={formatPct(k.automationHealth, { basis100: true, digits: 0 })}
                  hint={`${formatInt(k.automationFailed)}/${formatInt(k.automationRuns)} falharam`}
                  tone={k.automationHealth < 90 ? "warning" : "success"}
                />
                <Kpi
                  icon={deltaIcon}
                  label="Tendência leads"
                  value={`${k.leadsDelta >= 0 ? "+" : ""}${k.leadsDelta}%`}
                  hint="vs 7d anteriores"
                  tone={deltaTone}
                />
                <Kpi
                  icon={AlertTriangle}
                  label="Suspensões"
                  value={formatInt(k.suspensions)}
                  hint="Contas suspensas"
                  tone={k.suspensions > 0 ? "danger" : "default"}
                />
                <Kpi icon={Building2} label="Clientes ativos" value={formatInt(k.activeTenants)} />
              </div>
            </CoreSection>

            {data.urgentTickets.length > 0 && (
              <Card className="p-4 border-destructive/40 bg-destructive/5">
                <h2 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Tickets urgentes
                </h2>
                <ul className="space-y-1 text-sm">
                  {data.urgentTickets.map((t: any) => (
                    <li key={t.id}>
                      <Link
                        to="/admin/tenant-360"
                        search={{ companyId: t.company_id }}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        <span className="font-medium">{t.subject ?? "(sem assunto)"}</span>
                        <Badge variant="destructive" className="ml-2">{t.priority}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <CoreSection
              title="Atalhos da operação"
              description="Rotas mais utilizadas pela equipe Impulsionando."
              actions={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-xs text-primary hover:underline"
                >
                  Atualizar agora
                </button>
              }
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {shortcuts.map((s) => (
                  <Link
                    key={s.to}
                    to={s.to as any}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  >
                    <Card className="p-3 hover:border-primary/40 hover:bg-primary/5 transition h-full">
                      <div className="flex items-center gap-2">
                        <s.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="font-medium text-sm">{s.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
                    </Card>
                  </Link>
                ))}
              </div>
            </CoreSection>

            {data.urgentTickets.length === 0 && (
              <EmptyState
                title="Nenhum ticket urgente no momento"
                description="Assim que surgir um ticket urgente, ele aparecerá aqui em destaque com atalho para o Cliente 360°."
                variant="compact"
              />
            )}
          </>
        );
      })()}
    </div>
  );
}
