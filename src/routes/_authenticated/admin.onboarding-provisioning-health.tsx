import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getOnboardingProvisioningHealth } from "@/lib/onboarding-provisioning-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, RefreshCw, Globe, Mail, ScrollText, ShieldCheck } from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/impulsionando";
import { formatInt, formatPct, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/onboarding-provisioning-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Onboarding & Provisioning"
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

function Page() {
  const fn = useServerFn(getOnboardingProvisioningHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "onb-prov-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando Onboarding & Provisioning…" />
      </div>
    );
  }
  if (!data) return null;

  const compTone: "positive" | "warning" | "critical" =
    data.onboarding.avgCompletion >= 0.75 ? "positive" : data.onboarding.avgCompletion >= 0.5 ? "warning" : "critical";
  const sslTone: "warning" | "critical" | "default" =
    data.tenants.sslExpiringSoon >= 5 ? "critical" : data.tenants.sslExpiringSoon > 0 ? "warning" : "default";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Onboarding & Provisioning"
        description="Checklist, domínios, e-mails, identidade DNS/SSL, migrações e contratos de adesão do cliente conectado ao Core."
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
            icon={<Rocket className="h-4 w-4" />}
            label="Clientes em onboarding"
            value={formatInt(data.onboarding.companies)}
            hint={`${formatInt(data.onboarding.fullyOnboarded)} 100% concluídas`}
          />
          <MetricCard
            label="Conclusão média"
            tone={compTone}
            value={formatPct(data.onboarding.avgCompletion)}
          />
          <MetricCard
            icon={<Globe className="h-4 w-4" />}
            label="Tenants provisionados"
            value={<>{formatInt(data.tenants.provisioned)}<span className="text-sm text-muted-foreground">/{formatInt(data.tenants.total)}</span></>}
            hint={`${formatInt(data.tenants.customDomains)} c/ domínio próprio`}
          />
          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="SSL expira <30d"
            tone={sslTone}
            value={formatInt(data.tenants.sslExpiringSoon)}
          />
          <MetricCard label="Pedidos de domínio" value={formatInt(data.domains.requests)} />
          <MetricCard
            icon={<Mail className="h-4 w-4" />}
            label="E-mails / aliases"
            value={<>{formatInt(data.emails.aliasesActive)}<span className="text-sm text-muted-foreground">/{formatInt(data.emails.aliases)}</span></>}
            hint={`${formatInt(data.emails.requests)} solicitações`}
          />
          <MetricCard label="Migrações" value={formatInt(data.migrations.events)} />
          <MetricCard
            icon={<ScrollText className="h-4 w-4" />}
            label="Contratos"
            value={<>{formatInt(data.contracts.signed)}<span className="text-sm text-muted-foreground">/{formatInt(data.contracts.total)}</span></>}
            hint={`${data.contracts.avgSignHours.toFixed(1)}h até assinar`}
          />
        </KpiGrid>
      </CoreSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Itens do checklist (top 20)</CardTitle></CardHeader>
          <CardContent>
            {data.onboarding.items.length === 0 ? (
              <EmptyState variant="compact" title="Sem itens de checklist no período" />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left py-2 font-medium">Item</th>
                    <th scope="col" className="text-right font-medium">Concluídos</th>
                    <th scope="col" className="text-right font-medium">Total</th>
                    <th scope="col" className="text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.onboarding.items.map((i, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2">{i.item}</td>
                      <td className="text-right tabular-nums">{formatInt(i.done)}</td>
                      <td className="text-right tabular-nums">{formatInt(i.total)}</td>
                      <td className="text-right tabular-nums">{formatPct(i.pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pedidos de domínio</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-1">Por status</div>
              {data.domains.statusBreakdown.length === 0 ? (
                <EmptyState variant="compact" title="Sem pedidos no período" />
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {data.domains.statusBreakdown.map((s, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 capitalize">{s.status}</td>
                        <td className="text-right tabular-nums">{formatInt(s.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {data.domains.modes.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Por modo</div>
                <table className="w-full text-sm">
                  <tbody>
                    {data.domains.modes.map((m, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 capitalize">{m.mode}</td>
                        <td className="text-right tabular-nums">{formatInt(m.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">DNS dos tenants</CardTitle></CardHeader>
          <CardContent>
            {data.tenants.dnsBreakdown.length === 0 ? (
              <EmptyState variant="compact" title="Sem registros" />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.tenants.dnsBreakdown.map((d, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 capitalize">{d.status}</td>
                      <td className="text-right tabular-nums">{formatInt(d.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">SSL dos tenants</CardTitle></CardHeader>
          <CardContent>
            {data.tenants.sslBreakdown.length === 0 ? (
              <EmptyState variant="compact" title="Sem registros" />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.tenants.sslBreakdown.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 capitalize">{s.status}</td>
                      <td className="text-right tabular-nums">{formatInt(s.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Aliases por propósito</CardTitle></CardHeader>
          <CardContent>
            {data.emails.aliasPurposes.length === 0 ? (
              <EmptyState variant="compact" title="Sem aliases" />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.emails.aliasPurposes.map((a, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 capitalize">{a.purpose}</td>
                      <td className="text-right tabular-nums">{formatInt(a.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Migrações por etapa</CardTitle></CardHeader>
          <CardContent>
            {data.migrations.steps.length === 0 ? (
              <EmptyState variant="compact" title="Sem migrações no período" />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left py-2 font-medium">Etapa</th>
                    <th scope="col" className="text-right font-medium">Eventos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.migrations.steps.map((m, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{m.step}</td>
                      <td className="text-right tabular-nums">{formatInt(m.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {data.migrations.statusBreakdown.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                Status: {data.migrations.statusBreakdown.map((s) => `${s.status}: ${formatInt(s.count)}`).join(" · ")}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Contratos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="p-2 rounded bg-muted/30">
                <div className="text-xs text-muted-foreground">Assinados</div>
                <div className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatInt(data.contracts.signed)}</div>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <div className="text-xs text-muted-foreground">Enviados</div>
                <div className="font-bold tabular-nums text-primary">{formatInt(data.contracts.sent)}</div>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <div className="text-xs text-muted-foreground">Pendentes</div>
                <div className="font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatInt(data.contracts.pending)}</div>
              </div>
            </div>
            {data.contracts.statusBreakdown.length > 0 && (
              <table className="w-full text-sm">
                <tbody>
                  {data.contracts.statusBreakdown.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 capitalize">{s.status}</td>
                      <td className="text-right tabular-nums">{formatInt(s.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-3 text-xs text-muted-foreground">
              {formatInt(data.contracts.signaturesCompleted)} de {formatInt(data.contracts.signatures)} assinaturas concluídas · tempo médio {data.contracts.avgSignHours.toFixed(1)}h
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
