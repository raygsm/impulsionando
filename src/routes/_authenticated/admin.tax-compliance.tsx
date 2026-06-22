import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTaxCompliance } from "@/lib/tax-compliance.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, ShieldCheck, AlertTriangle, CalendarClock, FileWarning } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tax-compliance")({
  head: () => ({
    meta: [
      { title: "Tax & Compliance Cockpit — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TaxPage,
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function TaxPage() {
  const fn = useServerFn(getTaxCompliance);
  const { data, isLoading } = useQuery({
    queryKey: ["tax-compliance"],
    queryFn: () => fn({ data: {} }),
    staleTime: 60_000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
      </div>
    );

  const { kpis, issuerHealth, stuckInvoices, obligationsOverdue, obligationsDueSoon, upcomingCalendar, topFailures } = data;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Receipt className="h-6 w-6" /> Tax & Compliance Cockpit
        </h1>
        <p className="text-sm text-muted-foreground">
          NF-e, emissores fiscais, obrigações e calendário tributário (90 dias).
        </p>
      </header>

      {(kpis.stuck > 0 || kpis.obligationsOverdue > 0 || kpis.activeIssuers === 0) && (
        <Card className="p-4 border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1 text-sm">
              {kpis.activeIssuers === 0 && <div>Nenhum emissor fiscal ativo — emissão de NF-e bloqueada.</div>}
              {kpis.stuck > 0 && <div>{kpis.stuck} NF-e travadas há mais de 24h.</div>}
              {kpis.obligationsOverdue > 0 && <div>{kpis.obligationsOverdue} obrigações fiscais vencidas.</div>}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Receipt} label="NF-e 90d" value={kpis.invoices90d} />
        <Kpi label="Emitidas" value={kpis.issued} accent="ok" />
        <Kpi label="Pendentes" value={kpis.pending} accent={kpis.pending > 0 ? "warn" : undefined} />
        <Kpi label="Falhas" value={kpis.failed} accent={kpis.failed > 0 ? "warn" : undefined} />
        <Kpi label="Taxa de sucesso" value={`${kpis.successRate}%`} accent={kpis.successRate >= 95 ? "ok" : kpis.successRate < 80 ? "warn" : undefined} />
        <Kpi label="Travadas >24h" value={kpis.stuck} accent={kpis.stuck > 0 ? "warn" : undefined} />
        <Kpi label="Serviço faturado" value={BRL(kpis.totalServiceAmount)} accent="ok" />
        <Kpi label="ISS apurado" value={BRL(kpis.totalIss)} />
        <Kpi icon={ShieldCheck} label="Emissores ativos" value={`${kpis.activeIssuers}/${kpis.totalIssuers}`} accent={kpis.activeIssuers === 0 ? "warn" : undefined} />
        <Kpi icon={AlertTriangle} label="Obrigações vencidas" value={kpis.obligationsOverdue} accent={kpis.obligationsOverdue > 0 ? "warn" : undefined} />
        <Kpi icon={CalendarClock} label="Vencendo 30d" value={kpis.obligationsDueSoon} />
        <Kpi icon={FileWarning} label="Eventos com erro" value={kpis.errorEvents90d} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-medium mb-3">Saúde dos emissores</h2>
          {issuerHealth.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum emissor cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-1 pr-2">CNPJ / Razão</th>
                  <th className="py-1 pr-2">Provider</th>
                  <th className="py-1 pr-2">Ambiente</th>
                  <th className="py-1 pr-2">Regime</th>
                  <th className="py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {issuerHealth.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="py-1 pr-2">
                      <div className="font-medium">{i.legalName}</div>
                      <div className="text-xs text-muted-foreground">{i.cnpj}</div>
                    </td>
                    <td className="py-1 pr-2">{i.provider}</td>
                    <td className="py-1 pr-2">
                      <Badge variant={i.environment === "production" ? "default" : "secondary"}>{i.environment}</Badge>
                    </td>
                    <td className="py-1 pr-2">{i.taxRegime}</td>
                    <td className="py-1">
                      <Badge variant={i.isActive ? "default" : "destructive"}>
                        {i.isActive ? "ativo" : "inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-medium mb-3">Top motivos de falha</h2>
          {topFailures.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem falhas registradas.</p>
          ) : (
            <div className="space-y-1">
              {topFailures.map((f) => (
                <div key={f.reason} className="flex items-center justify-between text-sm border-t pt-1">
                  <span className="truncate pr-2 text-xs">{f.reason}</span>
                  <Badge variant="destructive">{f.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {stuckInvoices.length > 0 && (
        <Card className="p-4">
          <h2 className="font-medium mb-3">NF-e travadas (&gt;24h)</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="py-1 pr-2">Beneficiário</th>
                <th className="py-1 pr-2">Status</th>
                <th className="py-1 pr-2">Tentativas</th>
                <th className="py-1 pr-2">Valor</th>
                <th className="py-1">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {stuckInvoices.map((i) => (
                <tr key={i.id} className="border-t align-top">
                  <td className="py-1 pr-2 font-medium">{i.beneficiary}</td>
                  <td className="py-1 pr-2"><Badge variant="secondary">{i.status}</Badge></td>
                  <td className="py-1 pr-2">{i.attempts}</td>
                  <td className="py-1 pr-2">{BRL(i.amount)}</td>
                  <td className="py-1 text-xs text-muted-foreground max-w-md truncate">{i.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-medium mb-3">Obrigações vencidas</h2>
          {obligationsOverdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma obrigação vencida 🎉</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-1 pr-2">Título</th>
                  <th className="py-1 pr-2">Tipo</th>
                  <th className="py-1 pr-2">Vencimento</th>
                  <th className="py-1">Valor</th>
                </tr>
              </thead>
              <tbody>
                {obligationsOverdue.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-1 pr-2 font-medium">{o.title}</td>
                    <td className="py-1 pr-2 text-xs">{o.obligation_type}</td>
                    <td className="py-1 pr-2 text-red-600">{o.due_date}</td>
                    <td className="py-1">{o.amount ? BRL(Number(o.amount)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-medium mb-3">Próximas obrigações (30d)</h2>
          {obligationsDueSoon.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma obrigação próxima.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-1 pr-2">Título</th>
                  <th className="py-1 pr-2">Vencimento</th>
                  <th className="py-1">Valor</th>
                </tr>
              </thead>
              <tbody>
                {obligationsDueSoon.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-1 pr-2 font-medium">{o.title}</td>
                    <td className="py-1 pr-2">{o.due_date}</td>
                    <td className="py-1">{o.amount ? BRL(Number(o.amount)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {upcomingCalendar.length > 0 && (
        <Card className="p-4">
          <h2 className="font-medium mb-3">Calendário fiscal recorrente — próximos 30 dias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {upcomingCalendar.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.obligation_type} · dia {c.day_of_month} · {c.applies_to_regime ?? "todos os regimes"}
                  </div>
                </div>
                <Badge variant={c.daysAway <= 3 ? "destructive" : c.daysAway <= 7 ? "default" : "secondary"}>
                  {c.daysAway === 0 ? "hoje" : `em ${c.daysAway}d`}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, accent,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: "warn" | "ok";
}) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className={`text-xl font-semibold ${accent === "warn" ? "text-amber-600" : accent === "ok" ? "text-emerald-600" : ""}`}>
        {value}
      </div>
    </Card>
  );
}
