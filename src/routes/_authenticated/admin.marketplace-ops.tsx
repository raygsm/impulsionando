import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMarketplaceOps } from "@/lib/marketplace-ops.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, RefreshCw, TrendingUp, Truck, Building2, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marketplace-ops")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent></Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok"|"warn"|"bad" }) {
  const color = tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "";
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </CardContent></Card>
  );
}

function Page() {
  const [days, setDays] = useState(30);
  const fetchFn = useServerFn(getMarketplaceOps);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["marketplace-ops", days],
    queryFn: () => fetchFn({ data: { days } }),
  });

  if (isLoading || !data) {
    return <div className="p-6 space-y-4"><Skeleton className="h-10 w-72"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div>
      <Skeleton className="h-64"/></div>;
  }

  const d = data;
  const k = d.kpis;
  const maxGmv = Math.max(1, ...d.dailyGmv.map((x) => x.gmv));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Store className="h-6 w-6"/> Marketplace Operations</h1>
          <p className="text-sm text-muted-foreground">Pedidos B2B, GMV e Taxa de Intermediação Digital — janela {d.windowDays}d.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching?"animate-spin":""}`}/>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="GMV" value={brl(k.gmv)} hint={`${fmt(k.approvedOrders)} pedidos aprovados`} />
        <Kpi label="Taxa de Intermediação" value={brl(k.feesCollected)} hint={k.gmv ? `${pct((k.feesCollected/k.gmv)*100)} média` : ""} />
        <Kpi label="Repasse fornecedores" value={brl(k.supplierNet)} />
        <Kpi label="Ticket médio" value={brl(k.avgTicket)} />
        <Kpi label="Taxa de aprovação" value={pct(k.approvalRate)} tone={k.approvalRate>=80?"ok":k.approvalRate>=60?"warn":"bad"} hint={`${k.rejectedOrders} rejeitados`} />
        <Kpi label="Pendentes" value={fmt(k.pendingOrders)} tone={k.pendingOrders>10?"warn":"ok"} />
        <Kpi label="Tempo médio aprovação" value={k.avgApprovalHours != null ? `${k.avgApprovalHours.toFixed(1)}h` : "—"} tone={k.avgApprovalHours != null && k.avgApprovalHours > 24 ? "warn" : "ok"} />
        <Kpi label="Fornecedores ativos" value={`${k.activeSuppliers}/${k.totalSuppliers}`} hint={`${k.activeBuyers} compradores ativos`} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4"/> GMV diário</CardTitle></CardHeader>
        <CardContent>
          {d.dailyGmv.length === 0 ? <p className="text-sm text-muted-foreground">Sem vendas no período.</p> : (
            <div className="space-y-1">
              {d.dailyGmv.slice(-30).map((day) => (
                <div key={day.day} className="flex items-center gap-3 text-xs">
                  <div className="w-20 text-muted-foreground tabular-nums">{day.day}</div>
                  <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(day.gmv/maxGmv)*100}%` }} />
                  </div>
                  <div className="w-28 text-right tabular-nums">{brl(day.gmv)}</div>
                  <div className="w-12 text-right text-muted-foreground tabular-nums">{day.orders}p</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/> Status dos pedidos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(d.statusCount).map(([s,c]) => (
                <div key={s} className="flex justify-between border-b last:border-0 py-1">
                  <Badge variant="outline">{s}</Badge>
                  <span className="tabular-nums">{fmt(c)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Eventos do funil</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(d.eventTypeCount).length === 0 ? <p className="text-sm text-muted-foreground">Sem eventos.</p> :
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(d.eventTypeCount).map(([t,c]) => (
                  <div key={t} className="flex justify-between border-b last:border-0 py-1">
                    <span className="font-mono text-xs truncate">{t}</span>
                    <span className="tabular-nums">{fmt(c)}</span>
                  </div>
                ))}
              </div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4"/> Top fornecedores</CardTitle></CardHeader>
          <CardContent>
            {d.topSuppliers.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Fornecedor</th><th className="text-right">Pedidos</th><th className="text-right">Aprov%</th><th className="text-right">GMV</th><th className="text-right">Taxa</th></tr>
                </thead>
                <tbody>
                  {d.topSuppliers.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="truncate max-w-[200px]">{s.name}</div>
                        {s.type && <div className="text-xs text-muted-foreground">{s.type}</div>}
                      </td>
                      <td className="text-right tabular-nums">{s.orders}</td>
                      <td className="text-right tabular-nums">{pct(s.approvalRate)}</td>
                      <td className="text-right tabular-nums font-medium">{brl(s.gmv)}</td>
                      <td className="text-right tabular-nums text-muted-foreground">{brl(s.fees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4"/> Top compradores</CardTitle></CardHeader>
          <CardContent>
            {d.topBuyers.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Comprador</th><th className="text-right">Pedidos</th><th className="text-right">GMV</th></tr>
                </thead>
                <tbody>
                  {d.topBuyers.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="truncate max-w-[220px]">{b.name}</div>
                        {b.type && <div className="text-xs text-muted-foreground">{b.type}</div>}
                      </td>
                      <td className="text-right tabular-nums">{b.orders}</td>
                      <td className="text-right tabular-nums font-medium">{brl(b.gmv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
