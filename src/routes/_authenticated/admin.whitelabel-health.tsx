import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getWhitelabelHealth } from "@/lib/whitelabel-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, RefreshCw, FileCode, Star } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin/whitelabel-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar White-Label & Vitrine"
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
  const fn = useServerFn(getWhitelabelHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "wl-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Carregando White-Label & Vitrine…" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Saúde do ecossistema"
        title="White-Label & Vitrine"
        description="Planos WL, clientes vinculados, páginas geradas, vitrine pública e exports."
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
          <MetricCard label="Planos WL" value={formatInt(data.wl.plans)} hint={`${formatInt(data.wl.subscriptions)} assinaturas`} />
          <MetricCard
            icon={<Globe className="h-4 w-4" />}
            label="Clientes vinculados"
            value={<>{formatInt(data.wl.activeLinks)}<span className="text-sm text-muted-foreground">/{formatInt(data.wl.links)}</span></>}
            hint={`${formatInt(data.wl.consumedPoints)} pontos consumidos`}
          />
          <MetricCard
            icon={<FileCode className="h-4 w-4" />}
            label="Páginas geradas"
            value={<>{formatInt(data.pages.published)}<span className="text-sm text-muted-foreground">/{formatInt(data.pages.total)}</span></>}
            hint={`${formatInt(data.pages.versions)} versões`}
          />
          <MetricCard
            label="Templates de site"
            value={<>{formatInt(data.pages.activeTemplates)}<span className="text-sm text-muted-foreground">/{formatInt(data.pages.templates)}</span></>}
          />
          <MetricCard label="Vitrine pública" value={formatInt(data.vitrine.total)} hint={`${formatInt(data.vitrine.ratedCount)} avaliadas`} />
          <MetricCard
            icon={<Star className="h-4 w-4" />}
            label="Rating médio"
            value={data.vitrine.avgRating.toFixed(1)}
          />
          <MetricCard
            label="Exports"
            tone={data.exports.failed > 0 ? "warning" : "default"}
            value={<>{formatInt(data.exports.done)}<span className="text-sm text-muted-foreground">/{formatInt(data.exports.total)}</span></>}
            hint={`${formatInt(data.exports.totalRows)} linhas · ${formatInt(data.exports.failed)} falhas`}
          />
          <MetricCard label="Versões publicadas" value={formatInt(data.pages.versionsPublished)} />
        </KpiGrid>
      </CoreSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição de planos (vínculos)</CardTitle></CardHeader>
          <CardContent>
            {data.wl.planDistribution.length === 0 ? (
              <EmptyState variant="compact" title="Sem vínculos no período" />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.wl.planDistribution.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 capitalize">{p.plan}</td>
                      <td className="text-right tabular-nums">{formatInt(p.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top donos de WL</CardTitle></CardHeader>
          <CardContent>
            {data.wl.topOwners.length === 0 ? (
              <EmptyState variant="compact" title="Sem donos com vínculo no período" />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left py-2 font-medium">Dono</th>
                    <th scope="col" className="text-right font-medium">Vínculos</th>
                    <th scope="col" className="text-right font-medium">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.wl.topOwners.map((o, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 text-xs font-mono">{o.owner_id.slice(0, 12)}…</td>
                      <td className="text-right tabular-nums">{formatInt(o.links)}</td>
                      <td className="text-right tabular-nums">{formatInt(o.pontos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Templates por nicho</CardTitle></CardHeader>
          <CardContent>
            {data.pages.templateNiches.length === 0 ? (
              <EmptyState variant="compact" title="Sem templates cadastrados" />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.pages.templateNiches.map((t, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 capitalize">{t.niche}</td>
                      <td className="text-right tabular-nums">{formatInt(t.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vitrine por segmento</CardTitle></CardHeader>
          <CardContent>
            {data.vitrine.segments.length === 0 ? (
              <EmptyState variant="compact" title="Sem publicações no período" />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.vitrine.segments.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 capitalize">{s.segment}</td>
                      <td className="text-right tabular-nums">{formatInt(s.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vitrine por UF</CardTitle></CardHeader>
          <CardContent>
            {data.vitrine.states.length === 0 ? (
              <EmptyState variant="compact" title="Sem distribuição regional" />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {data.vitrine.states.map((s) => (
                  <div key={s.state} className="p-2 rounded bg-muted/30 text-center">
                    <div className="text-xs text-muted-foreground">{s.state}</div>
                    <div className="font-bold tabular-nums">{formatInt(s.count)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
