import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEventsHealth } from "@/lib/events-health.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, RefreshCw, Calendar, TrendingUp, Repeat, DoorOpen } from "lucide-react";
import {
  PageHeader,
  KpiGrid,
  MetricCard,
  CoreSection,
  LoadingState,
  EmptyState,
  ErrorState,
  KeyCountTable,
} from "@/components/impulsionando";
import { formatBRL, formatInt, formatPct, formatDateTime } from "@/lib/format";
import type { MetricTone } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/events-health")({
  head: () => ({
    meta: [
      { title: "Eventos & Ticketing — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Erro ao carregar eventos"
          description="Não foi possível consultar os dados de vendas e check-in nesta janela."
          detail={error.message}
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

function rateTone(p: number): MetricTone {
  if (p >= 80) return "positive";
  if (p >= 50) return "warning";
  return "critical";
}

function rateVariant(p: number): "default" | "secondary" | "destructive" {
  if (p >= 80) return "default";
  if (p >= 50) return "secondary";
  return "destructive";
}

function Page() {
  const fn = useServerFn(getEventsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "events-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Consultando saúde de eventos…" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Eventos & ticketing"
        title="Cockpit de eventos"
        description="Vendas, sell-through, check-in, transferências e receita por evento."
        actions={
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="ev-window" className="sr-only">Janela de análise</label>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger id="ev-window" className="w-32" aria-label="Janela de análise">
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
              aria-label="Atualizar dados de eventos"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Atualizar
            </Button>
          </div>
        }
      />

      <KpiGrid columns={4}>
        <MetricCard
          icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
          label="Eventos"
          value={formatInt(data.events.total)}
          hint={`${formatInt(data.events.published)} publicados · ${formatInt(data.events.upcoming)} futuros`}
        />
        <MetricCard
          label="GMV total"
          value={formatBRL(data.sales.gmv)}
          hint={`Na janela: ${formatBRL(data.sales.gmvWindow)}`}
        />
        <MetricCard
          label="Ingressos válidos"
          value={`${formatInt(data.sales.ticketsValid)} / ${formatInt(data.sales.ticketsTotal)}`}
          hint={`${formatInt(data.sales.ticketsCancelled)} cancelados`}
        />
        <MetricCard
          label="Ticket médio"
          value={formatBRL(data.sales.avgTicket)}
          hint={`Reembolso: ${formatBRL(data.sales.refundedRevenue)}`}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          label="Sell-through"
          value={formatPct(data.sales.sellThrough, { basis100: true })}
          tone={rateTone(data.sales.sellThrough)}
          hint={`${formatInt(data.sales.totalSold)} vendidos / ${formatInt(data.sales.totalOffered)} ofertados`}
        />
        <MetricCard
          icon={<DoorOpen className="h-4 w-4" aria-hidden="true" />}
          label="Check-in rate"
          value={formatPct(data.sales.checkinRate, { basis100: true })}
          tone={rateTone(data.sales.checkinRate)}
          hint={`${formatInt(data.sales.ticketsUsed)} usados · ${formatInt(data.sales.checkinsWindow)} na janela`}
        />
        <MetricCard
          icon={<Repeat className="h-4 w-4" aria-hidden="true" />}
          label="Transferências"
          value={formatInt(data.transfers.total)}
          hint={`${formatInt(data.transfers.approved)} aprovadas · ${formatInt(data.transfers.pending)} pendentes · ${formatInt(data.transfers.rejected)} negadas`}
        />
        <MetricCard
          label="Receita de transferências"
          value={formatBRL(data.transfers.feeRevenue)}
          tone="positive"
          hint="Taxas cobradas na janela"
        />
      </KpiGrid>

      <CoreSection
        title="Ranking de eventos (top 20)"
        description="Ordenado por receita bruta na janela."
      >
        {data.eventsRanking.length === 0 ? (
          <EmptyState
            title="Sem eventos na janela"
            description="Nenhum evento com vendas ou check-ins foi registrado no período selecionado."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <caption className="sr-only">Top eventos por receita, ocupação e check-in</caption>
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th scope="col" className="text-left py-2 px-3 font-medium">Evento</th>
                  <th scope="col" className="text-left py-2 px-3 font-medium">Cidade/UF</th>
                  <th scope="col" className="text-right py-2 px-3 font-medium">Capacidade</th>
                  <th scope="col" className="text-right py-2 px-3 font-medium">Vendidos</th>
                  <th scope="col" className="text-right py-2 px-3 font-medium">Ocupação</th>
                  <th scope="col" className="text-right py-2 px-3 font-medium">Check-in</th>
                  <th scope="col" className="text-right py-2 px-3 font-medium">Receita</th>
                </tr>
              </thead>
              <tbody>
                {data.eventsRanking.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium">{e.title}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{e.city}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatInt(e.capacity)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatInt(e.sold)}</td>
                    <td className="py-2 px-3 text-right">
                      {e.capacity > 0 ? (
                        <Badge variant={rateVariant(e.occupancy)}>
                          {formatPct(e.occupancy, { basis100: true })}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {e.sold > 0 ? (
                        <Badge variant={rateVariant(e.checkinRate)}>
                          {formatPct(e.checkinRate, { basis100: true })}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium">
                      {formatBRL(e.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CoreSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <CoreSection
          title="Top tipos de ingresso"
          description="Ranking por receita bruta na janela."
        >
          {data.topTypes.length === 0 ? (
            <EmptyState
              variant="compact"
              title="Sem tipos vendidos"
              description="Nenhum tipo de ingresso registrou vendas nesta janela."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <caption className="sr-only">Tipos de ingresso por receita</caption>
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="text-left py-2 px-3 font-medium">Tipo</th>
                    <th scope="col" className="text-right py-2 px-3 font-medium">Preço</th>
                    <th scope="col" className="text-right py-2 px-3 font-medium">Vendidos</th>
                    <th scope="col" className="text-right py-2 px-3 font-medium">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTypes.map((t, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium">{t.name}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatBRL(t.price)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {formatInt(t.sold)}
                        <span className="text-xs text-muted-foreground"> / {formatInt(t.offered)}</span>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-medium">
                        {formatBRL(t.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CoreSection>

        <CoreSection title="Check-ins por portaria" description="Volume de acessos por gate na janela.">
          <KeyCountTable
            keyLabel="Gate"
            countLabel="Check-ins"
            ariaLabel="Check-ins por gate"
            rows={data.gates.map((g) => ({ k: g.gate, count: g.count }))}
            emptyTitle="Sem check-ins na janela"
            emptyDescription="Nenhuma portaria registrou acessos no período selecionado."
          />
        </CoreSection>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
