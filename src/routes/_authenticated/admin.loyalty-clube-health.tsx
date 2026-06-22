import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getLoyaltyClubeHealth } from "@/lib/loyalty-clube-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/loyalty-clube-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

function Page() {
  const fn = useServerFn(getLoyaltyClubeHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "loyalty-clube", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-72 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Loyalty & Clube — Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Assinaturas de consumidor, visitas, consumo, pontos, indicações, alertas e polls.
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
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Assinaturas ativas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.memberships.active)}<span className="text-sm text-muted-foreground">/{fmt(data.memberships.total)}</span></div>
            <p className="text-xs text-muted-foreground">MRR {brl(data.memberships.mrr)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Visitas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.visits.total)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.visits.unique)} únicos · ★ {data.visits.avgRating}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Consumo</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.consumption.amount)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.consumption.total)} reg · ticket {brl(data.consumption.avgTicket)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pontos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.rewards.net)}</div>
            <p className="text-xs text-muted-foreground">+{fmt(data.rewards.earned)} · −{fmt(data.rewards.spent)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Indicações</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.referrals.converted)}<span className="text-sm text-muted-foreground">/{fmt(data.referrals.total)}</span></div>
            <p className="text-xs text-muted-foreground">conv. {data.referrals.convRate}% · {brl(data.referrals.rewardAmount)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Recibos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.receipts.amount)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.receipts.total)} reg</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Alertas ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.alerts.active)}<span className="text-sm text-muted-foreground">/{fmt(data.alerts.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Polls / Votos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.polls.active)}<span className="text-sm text-muted-foreground">/{fmt(data.polls.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.polls.votes)} votos</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Assinaturas por Plano</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.memberships.byPlan.map((r: any) => (
            <tr key={r.plan} className="border-t"><td className="py-1">{r.plan}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Consumo por Método</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.consumption.byMethod.map((r: any) => (
            <tr key={r.method} className="border-t"><td className="py-1">{r.method}</td><td className="text-right">{fmt(r.count)}</td><td className="text-right text-muted-foreground">{brl(r.amount)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pontos por Kind</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.rewards.byKind.map((r: any) => (
            <tr key={r.kind} className="border-t"><td className="py-1">{r.kind}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Visitas por Source</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.visits.bySource.map((r: any) => (
            <tr key={r.source} className="border-t"><td className="py-1">{r.source}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Recibos por Status</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.receipts.byStatus.map((r: any) => (
            <tr key={r.status} className="border-t"><td className="py-1">{r.status}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Alertas por Kind</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.alerts.byKind.map((r: any) => (
            <tr key={r.kind} className="border-t"><td className="py-1">{r.kind}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
