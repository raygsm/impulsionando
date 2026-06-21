import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCommandCenter } from "@/lib/command-center.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, Users, TrendingUp, TrendingDown, AlertTriangle, Activity,
  ListChecks, BarChart3, Building2, Mail, Inbox, LineChart, Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/command-center")({
  head: () => ({ meta: [{ title: "Command Center — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CommandCenterPage,
});

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const shortcuts = [
  { to: "/admin/action-center", label: "Action Center", icon: ListChecks, hint: "Fila priorizada" },
  { to: "/admin/health", label: "Health Score", icon: Activity, hint: "Saúde dos tenants" },
  { to: "/admin/inbox-unificada", label: "Inbox Omnichannel", icon: Inbox, hint: "Mensagens unificadas" },
  { to: "/admin/expansion-radar", label: "Expansion Radar", icon: Zap, hint: "Upsell por peers" },
  { to: "/admin/attribution", label: "Revenue Attribution", icon: DollarSign, hint: "MRR por origem" },
  { to: "/admin/peer-benchmark", label: "Peer Benchmark", icon: BarChart3, hint: "Quartis por nicho" },
  { to: "/admin/tenant-360", label: "Tenant 360º", icon: Building2, hint: "Drill-down" },
  { to: "/admin/cohort-retention", label: "Cohort Retention", icon: LineChart, hint: "Retenção mensal" },
];

function Kpi({ icon: Icon, label, value, hint, tone }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone ?? ""}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}

function CommandCenterPage() {
  const fn = useServerFn(getCommandCenter);
  const { data, isLoading } = useQuery({ queryKey: ["command-center"], queryFn: () => fn(), refetchInterval: 60_000 });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  if (!data) return <div className="p-6">Sem dados.</div>;

  const k = data.kpis;
  const deltaIcon = k.leadsDelta >= 0 ? TrendingUp : TrendingDown;
  const deltaTone = k.leadsDelta >= 0 ? "text-emerald-600" : "text-destructive";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6" /> Command Center</h1>
        <p className="text-sm text-muted-foreground">Visão única da operação Impulsionando. Atualiza a cada 60s.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={DollarSign} label="MRR ativo" value={fmtBRL(k.mrr)} hint={`${k.activeTenants} tenants ativos`} />
        <Kpi icon={Users} label="Leads 7d" value={k.leads7d} hint={`${k.leads24h} nas últimas 24h · ${k.leadsDelta >= 0 ? "+" : ""}${k.leadsDelta}% vs 7d anteriores`} tone={deltaTone} />
        <Kpi icon={Mail} label="Demos 7d" value={k.demos7d} hint={`${k.quotes7d} orçamentos`} />
        <Kpi icon={AlertTriangle} label="Tickets abertos" value={k.openTickets} hint={`${k.urgentTickets} urgentes`} tone={k.urgentTickets > 0 ? "text-destructive" : ""} />
        <Kpi icon={Zap} label="Saúde N8N 7d" value={`${k.automationHealth}%`} hint={`${k.automationFailed}/${k.automationRuns} falharam`} tone={k.automationHealth < 90 ? "text-amber-600" : "text-emerald-600"} />
        <Kpi icon={deltaIcon} label="Tendência leads" value={`${k.leadsDelta >= 0 ? "+" : ""}${k.leadsDelta}%`} hint="vs 7d anteriores" tone={deltaTone} />
        <Kpi icon={AlertTriangle} label="Suspensões" value={k.suspensions} hint="Contas suspensas" tone={k.suspensions > 0 ? "text-destructive" : ""} />
        <Kpi icon={Building2} label="Tenants ativos" value={k.activeTenants} />
      </div>

      {data.urgentTickets.length > 0 && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <h2 className="font-semibold mb-2 flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> Tickets urgentes</h2>
          <div className="space-y-1 text-sm">
            {data.urgentTickets.map((t: any) => (
              <Link key={t.id} to="/admin/tenant-360" search={{ companyId: t.company_id }} className="block hover:underline">
                <span className="font-medium">{t.subject ?? "(sem assunto)"}</span>
                <Badge variant="destructive" className="ml-2">{t.priority}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div>
        <h2 className="font-semibold mb-3">Atalhos da operação</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {shortcuts.map((s) => (
            <Link key={s.to} to={s.to as any} className="block">
              <Card className="p-3 hover:border-primary/40 hover:bg-primary/5 transition">
                <div className="flex items-center gap-2"><s.icon className="h-4 w-4 text-primary" /><span className="font-medium text-sm">{s.label}</span></div>
                <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
