import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRealEstateHealth } from "@/lib/real-estate-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, RefreshCw, Users, CalendarClock, FileSignature, Banknote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/real-estate-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function rateVariant(r: number, good = 80, ok = 60): "default" | "secondary" | "destructive" {
  if (r >= good) return "default";
  if (r >= ok) return "secondary";
  return "destructive";
}

function Page() {
  const fn = useServerFn(getRealEstateHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "real-estate-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (!data) return null;
  const k = data.kpis;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            Real Estate Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Portfólio, leads, visitas, contratos e financiamentos imobiliários.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Imóveis Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.activeProps)}<span className="text-sm text-muted-foreground">/{fmt(k.totalProperties)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(k.newProps)} novos · {fmt(k.reservedProps)} reservados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">VGV Ativo (Venda)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(k.saleTotal)}</div>
            <p className="text-xs text-muted-foreground">Aluguel: {brl(k.rentTotal)}/mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Leads / Interesses</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.totalLeads)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.searchIntents)} buscas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">SLA de Resposta</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.avgResponseHours.toFixed(1)}h</div>
            <Badge variant={rateVariant(k.responseRate, 80, 50)} className="mt-1">{pct(k.responseRate)} respondidos</Badge>
            {k.staleLeads > 0 && <p className="text-xs text-destructive mt-1">{fmt(k.staleLeads)} sem resposta &gt;24h</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4" />Visitas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.completedVisits)}<span className="text-sm text-muted-foreground">/{fmt(k.totalVisits)}</span></div>
            <p className="text-xs text-muted-foreground">{pct(k.visitCompletionRate)} concluídas · {pct(k.visitNoShowRate)} no-show</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileSignature className="h-4 w-4 text-emerald-600" />Contratos Assinados</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.signedContracts)}<span className="text-sm text-muted-foreground">/{fmt(k.totalContracts)}</span></div>
            <p className="text-xs text-muted-foreground">{brl(k.contractsValue)} em contratos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Conversão Lead→Contrato</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct(k.conversionRate)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.assignmentsTotal)} distribuições</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4" />Financiamentos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.finApproved)}<span className="text-sm text-muted-foreground">/{fmt(k.totalFin)}</span></div>
            <p className="text-xs text-muted-foreground">{brl(k.finApprovedAmount)} aprovados · {fmt(k.finPending)} pend. · {fmt(k.finDenied)} neg.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Operação</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.operationBreakdown.map((o) => (
                  <tr key={o.key} className="border-b last:border-0"><td className="py-2 capitalize">{o.key}</td><td className="text-right">{fmt(o.count)}</td></tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Tipo de Imóvel</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.typeBreakdown.map((t) => (
                  <tr key={t.key} className="border-b last:border-0"><td className="py-2 capitalize">{t.key}</td><td className="text-right">{fmt(t.count)}</td></tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Fontes de Lead</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.sourceBreakdown.map((s) => (
                  <tr key={s.source} className="border-b last:border-0"><td className="py-2">{s.source}</td><td className="text-right">{fmt(s.count)}</td></tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Distribuição de Leads — Estratégias</CardTitle></CardHeader>
        <CardContent>
          {data.strategyBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem distribuições no período.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.strategyBreakdown.map((s) => (
                <Badge key={s.strategy} variant="outline">{s.strategy}: {fmt(s.count)}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Performance dos Corretores (Top 20)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Corretor</th>
                  <th className="text-right">Atribuições</th>
                  <th className="text-right">Leads</th>
                  <th className="text-right">Respond.</th>
                  <th className="text-right">Visitas</th>
                  <th className="text-right">Visitas OK</th>
                  <th className="text-right">Contratos</th>
                  <th className="text-right">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {data.brokers.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{b.id.slice(0, 8)}…</td>
                    <td className="text-right">{fmt(b.assignments)}</td>
                    <td className="text-right">{fmt(b.leads)}</td>
                    <td className="text-right">
                      <Badge variant={rateVariant(b.responseRate, 80, 50)}>{pct(b.responseRate)}</Badge>
                    </td>
                    <td className="text-right">{fmt(b.visits)}</td>
                    <td className="text-right">{fmt(b.visitsCompleted)}</td>
                    <td className="text-right text-emerald-600 font-semibold">{fmt(b.contracts)}</td>
                    <td className="text-right">
                      <Badge variant={rateVariant(b.conversionRate, 10, 5)}>{pct(b.conversionRate)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
