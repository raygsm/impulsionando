import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAuditSecurityHealth } from "@/lib/audit-security-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, RefreshCw, KeyRound, Webhook, AlertTriangle, History as HistoryIcon } from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/impulsionando";
import { formatInt, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/audit-security-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Auditoria & Segurança"
          description={error.message}
          action={
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

type Row = { k: string; count: number };

function SimpleTable({ rows, emptyLabel }: { rows: Row[]; emptyLabel?: string }) {
  if (rows.length === 0) {
    return <EmptyState variant="compact" title={emptyLabel ?? "Sem dados no período"} />;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((s, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="py-2">{s.k}</td>
            <td className="text-right tabular-nums">{formatInt(s.count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Page() {
  const fn = useServerFn(getAuditSecurityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "audit-security-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando Auditoria & Segurança…" />
      </div>
    );
  }
  if (!data) return null;

  const maxDaily = Math.max(1, ...data.audit.daily.map((d) => d.count));
  const webhookTone: "positive" | "warning" | "critical" =
    data.webhooks.failed === 0 ? "positive" : data.webhooks.failed < 10 ? "warning" : "critical";
  const abuseTone: "warning" | "critical" | "default" =
    data.trialAbuse.total >= 20 ? "critical" : data.trialAbuse.total > 0 ? "warning" : "default";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Auditoria & Segurança"
        description="Auditoria sensível, RBAC, overrides, webhooks, dedupe thresholds e abuso de trial."
        actions={
          <>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-32" aria-label="Janela de análise">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">180 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Atualizar dados"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Atualizar
            </Button>
          </>
        }
      />

      <CoreSection title="Indicadores do período">
        <KpiGrid columns={4}>
          <MetricCard
            icon={<HistoryIcon className="h-4 w-4" />}
            label="Eventos de auditoria"
            value={formatInt(data.audit.total)}
            hint={`${formatInt(data.audit.uniqueUsers)} usuários · ${formatInt(data.audit.uniqueCompanies)} clientes`}
          />
          <MetricCard
            icon={<KeyRound className="h-4 w-4" />}
            label="Roles RBAC"
            value={formatInt(data.rbac.roles)}
            hint={`${formatInt(data.rbac.uniqueUsersWithRole)} usuários com role`}
          />
          <MetricCard
            label="Permissões"
            value={formatInt(data.rbac.permissions)}
            hint={`${data.rbac.avgPermsPerProfile.toFixed(1)} por perfil · ${formatInt(data.rbac.profiles)} perfis`}
          />
          <MetricCard
            label="Overrides"
            value={formatInt(data.rbac.overrides)}
            hint={
              <>
                <span className="text-emerald-600 dark:text-emerald-400">{formatInt(data.rbac.allow)} allow</span>
                {" · "}
                <span className="text-destructive">{formatInt(data.rbac.deny)} deny</span>
              </>
            }
          />
          <MetricCard
            icon={<Webhook className="h-4 w-4" />}
            label="Webhook events"
            tone={webhookTone}
            value={formatInt(data.webhooks.total)}
            hint={`${formatInt(data.webhooks.failed)} falhas · ${formatInt(data.webhooks.replayed)} replays`}
          />
          <MetricCard
            label="Dedupe thresholds"
            value={formatInt(data.dedupe.users)}
            hint={`média ${data.dedupe.avgMin.toFixed(1)}–${data.dedupe.avgMax.toFixed(1)}% · ${formatInt(data.dedupe.transitions)} transições`}
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Abuso de trial"
            tone={abuseTone}
            value={formatInt(data.trialAbuse.total)}
            hint={`${formatInt(data.trialAbuse.uniqueEmail)} e-mails · ${formatInt(data.trialAbuse.uniqueDoc)} documentos`}
          />
          <MetricCard
            label="Retenção de notif."
            value={formatInt(data.retention.total)}
            hint="mudanças de política"
          />
        </KpiGrid>
      </CoreSection>

      <Card>
        <CardHeader><CardTitle className="text-base">Auditoria — eventos por dia ({data.window.days}d)</CardTitle></CardHeader>
        <CardContent>
          {data.audit.daily.length === 0 ? (
            <EmptyState variant="compact" title="Sem eventos no período" />
          ) : (
            <div className="flex items-end gap-1 h-32" role="img" aria-label={`Distribuição diária de eventos de auditoria nos últimos ${data.window.days} dias`}>
              {data.audit.daily.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${d.d}: ${formatInt(d.count)}`}>
                  <div className="w-full bg-primary/70 rounded-t" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: "2px" }} />
                  <div className="text-[9px] text-muted-foreground mt-1 tabular-nums">{d.d.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Top ações</CardTitle></CardHeader><CardContent><SimpleTable rows={data.audit.byAction} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top entidades</CardTitle></CardHeader><CardContent><SimpleTable rows={data.audit.byEntity} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top usuários</CardTitle></CardHeader><CardContent><SimpleTable rows={data.audit.byUser} /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Roles distribuídas</CardTitle></CardHeader><CardContent><SimpleTable rows={data.rbac.byRole} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Permissões por módulo</CardTitle></CardHeader><CardContent><SimpleTable rows={data.rbac.byModule} /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Webhooks por status</CardTitle></CardHeader><CardContent><SimpleTable rows={data.webhooks.byStatus} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Webhooks por origem</CardTitle></CardHeader><CardContent><SimpleTable rows={data.webhooks.bySource} /></CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Dedupe — estados</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">{formatInt(data.dedupe.events)} eventos · {formatInt(data.dedupe.auditChanges)} mudanças manuais</p>
            <SimpleTable rows={data.dedupe.byState} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Últimas mudanças de retenção</CardTitle></CardHeader>
          <CardContent>
            {data.retention.last.length === 0 ? (
              <EmptyState variant="compact" title="Sem mudanças de retenção no período" />
            ) : (
              <ul className="text-sm space-y-2">
                {data.retention.last.map((r) => (
                  <li key={r.id} className="border-b pb-2 last:border-0">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">{r.email}</span>
                      <span className="text-xs tabular-nums shrink-0">{formatDateTime(r.at)}</span>
                    </div>
                    <div>
                      <strong className="tabular-nums">{r.previous}d</strong> → <strong className="tabular-nums">{r.next}d</strong>
                      {r.reason ? <span className="text-xs text-muted-foreground"> — {r.reason}</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Logs de agentes por evento</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">{formatInt(data.agents.logs)} logs no período</p>
            <SimpleTable rows={data.agents.byEvent} emptyLabel="Sem logs de agentes no período" />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
