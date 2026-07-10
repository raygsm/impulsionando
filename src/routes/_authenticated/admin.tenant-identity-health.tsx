import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getTenantIdentityHealth } from "@/lib/tenant-identity-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, RefreshCw, Globe, ShieldCheck, MapPin, Layers } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin/tenant-identity-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar Identidade & Branding"
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

function SimpleTable({ rows, empty }: { rows: Row[]; empty?: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        variant="compact"
        title={empty ?? "Sem dados no período"}
        description="Assim que houver registros correspondentes, esta visão será preenchida automaticamente."
      />
    );
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
  const fn = useServerFn(getTenantIdentityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "tenant-identity-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando Identidade & Branding…" />
      </div>
    );
  }
  if (!data) return null;

  const sslTone: "positive" | "warning" | "critical" =
    data.identity.sslExpired > 0 ? "critical" : data.identity.sslExpiringSoon > 0 ? "warning" : "positive";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="Identidade & Branding"
        description="Empresas do Core, identidade (domínio/DNS/SSL), aliases de e-mail, settings, unidades, taxonomia e smoke por nicho."
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
            icon={<Building2 className="h-4 w-4" />}
            label="Clientes ativos"
            value={<>{formatInt(data.companies.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.companies.total)}</span></>}
            hint={`${formatInt(data.companies.real)} reais · ${formatInt(data.companies.demo)} demo`}
          />
          <MetricCard
            label="Consolidados"
            value={formatInt(data.companies.consolidated)}
            hint={`${formatInt(data.companies.master)} master · ${formatInt(data.companies.vitrine)} vitrine`}
          />
          <MetricCard
            label="Branding completo"
            value={<>{formatInt(data.companies.branded)}<span className="text-sm text-muted-foreground">/{formatInt(data.companies.total)}</span></>}
            hint="cor + logo"
          />
          <MetricCard
            icon={<Globe className="h-4 w-4" />}
            label="Identidades"
            value={formatInt(data.identity.total)}
            hint={`${formatInt(data.identity.customDomains)} domínios próprios · ${formatInt(data.identity.withoutIdentity)} sem identidade`}
          />
          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="SSL"
            tone={sslTone}
            value={formatInt(data.identity.provisioned)}
            hint={`${formatInt(data.identity.sslExpiringSoon)} expirando <30d · ${formatInt(data.identity.sslExpired)} expirados`}
          />
          <MetricCard
            label="E-mail aliases"
            value={<>{formatInt(data.aliases.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.aliases.total)}</span></>}
            hint={`${formatInt(data.aliases.defaults)} default`}
          />
          <MetricCard
            icon={<MapPin className="h-4 w-4" />}
            label="Unidades"
            value={<>{formatInt(data.units.active)}<span className="text-sm text-muted-foreground">/{formatInt(data.units.total)}</span></>}
            hint="filiais ativas"
          />
          <MetricCard
            icon={<Layers className="h-4 w-4" />}
            label="Taxonomia"
            value={<>{formatInt(data.taxonomy.activeNiches)}<span className="text-sm text-muted-foreground">/{formatInt(data.taxonomy.niches)}</span></>}
            hint={`${formatInt(data.taxonomy.macros)} macros · ${formatInt(data.taxonomy.subnichos)} subnichos`}
          />
        </KpiGrid>
      </CoreSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Status comercial</CardTitle></CardHeader><CardContent><SimpleTable rows={data.companies.statusComm} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Status financeiro</CardTitle></CardHeader><CardContent><SimpleTable rows={data.companies.statusFin} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Status técnico</CardTitle></CardHeader><CardContent><SimpleTable rows={data.companies.statusTech} /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Clientes por nicho</CardTitle></CardHeader><CardContent><SimpleTable rows={data.companies.byNiche} /></CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Tipos & ambientes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Tipo</div>
                <SimpleTable rows={data.companies.kinds} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Ambiente / canal</div>
                <table className="w-full text-sm"><tbody>
                  {data.companies.env.map((s, i) => (<tr key={`e-${i}`} className="border-b last:border-0"><td className="py-1">env: {s.k}</td><td className="text-right tabular-nums">{formatInt(s.count)}</td></tr>))}
                  {data.companies.channels.map((s, i) => (<tr key={`c-${i}`} className="border-b last:border-0"><td className="py-1">canal: {s.k}</td><td className="text-right tabular-nums">{formatInt(s.count)}</td></tr>))}
                  {data.companies.env.length === 0 && data.companies.channels.length === 0 && (
                    <tr><td colSpan={2}><EmptyState variant="compact" title="Sem registros" /></td></tr>
                  )}
                </tbody></table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">DNS (identidade)</CardTitle></CardHeader><CardContent><SimpleTable rows={data.identity.dnsStatuses} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">SSL</CardTitle></CardHeader><CardContent><SimpleTable rows={data.identity.sslStatuses} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Aliases por propósito</CardTitle></CardHeader><CardContent><SimpleTable rows={data.aliases.byPurpose} /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Settings por categoria</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">Total {formatInt(data.settings.total)} · média {data.settings.avgPerCompany.toFixed(1)} por cliente</p>
            <SimpleTable rows={data.settings.byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Migration log ({data.window.days}d)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">Total {formatInt(data.migration.total)} · falhas {formatInt(data.migration.failed)}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground mb-1">Etapa</div><SimpleTable rows={data.migration.bySteps} /></div>
              <div><div className="text-xs text-muted-foreground mb-1">Status</div><SimpleTable rows={data.migration.byStatus} /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Smoke runs por nicho ({data.window.days}d)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">Total {formatInt(data.smoke.total)} · sucesso {formatInt(data.smoke.success)}</p>
          {data.smoke.byNiche.length === 0 ? (
            <EmptyState variant="compact" title="Sem execuções no período" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th scope="col" className="text-left py-2 font-medium">Nicho</th>
                  <th scope="col" className="text-right font-medium">Runs</th>
                  <th scope="col" className="text-right font-medium">OK</th>
                  <th scope="col" className="text-right font-medium">Sucesso</th>
                  <th scope="col" className="text-right font-medium">Duração média</th>
                </tr>
              </thead>
              <tbody>
                {data.smoke.byNiche.map((s: { k: string; count: number; ok: number; avgMs: number }, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{s.k}</td>
                    <td className="text-right tabular-nums">{formatInt(s.count)}</td>
                    <td className="text-right tabular-nums">{formatInt(s.ok)}</td>
                    <td className="text-right tabular-nums">{formatPct(s.count ? (s.ok / s.count) * 100 : 0, { basis100: true })}</td>
                    <td className="text-right tabular-nums">{Math.round(s.avgMs)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
