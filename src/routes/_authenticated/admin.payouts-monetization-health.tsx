import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPayoutsMonetizationHealth } from "@/lib/payouts-monetization-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, RefreshCw, Percent, Wallet, Calculator } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payouts-monetization-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const bps = (n: number) => `${(n / 100).toFixed(2)}%`;

function Page() {
  const fn = useServerFn(getPayoutsMonetizationHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","payouts-mon-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Banknote className="h-6 w-6 text-primary"/>Payouts & Monetization</h1>
          <p className="text-sm text-muted-foreground">Modelos de monetização, fees, revshare, payouts, ledger, refund e reschedule.</p>
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
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Modelos Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.models.active)}<span className="text-sm text-muted-foreground">/{fmt(data.models.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4"/>Fee Rules</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.fees.active)}<span className="text-sm text-muted-foreground">/{fmt(data.fees.total)}</span></div><p className="text-xs text-muted-foreground">média {bps(data.fees.avgPercentBps)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Revshare Rates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.revshare.active)}<span className="text-sm text-muted-foreground">/{fmt(data.revshare.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Payout Events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.payoutEvents.total)}</div><p className="text-xs text-muted-foreground">{brl(data.payoutEvents.net)} líquido</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4"/>Ledger</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.ledger.paid)}<span className="text-sm text-muted-foreground">/{fmt(data.ledger.total)}</span></div><p className="text-xs text-muted-foreground">{brl(data.ledger.paidAmount)} pagos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Schedule Rules</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.schedule.active)}<span className="text-sm text-muted-foreground">/{fmt(data.schedule.total)}</span></div><p className="text-xs text-muted-foreground">delay médio {data.schedule.avgDelayDays.toFixed(1)}d · reserve {bps(data.schedule.avgReserveBps)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Refund Rules</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.refunds.auto)}<span className="text-sm text-muted-foreground">/{fmt(data.refunds.total)}</span></div><p className="text-xs text-muted-foreground">auto · deadline médio {data.refunds.avgDeadlineDays.toFixed(0)}d</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4"/>Revenue Calcs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.calcs.total)}</div><p className="text-xs text-muted-foreground">{brl(data.calcs.net)} líquido</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Payout Events por Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Tipo</th><th className="text-right">Qtde</th><th className="text-right">Bruto</th><th className="text-right">Líquido</th></tr></thead><tbody>
          {data.payoutEvents.byEventType.map((e,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{e.event}</td><td className="text-right">{fmt(e.count)}</td><td className="text-right">{brl(e.gross)}</td><td className="text-right">{brl(e.net)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Revshare por Evento</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">Evento</th><th className="text-right">Regras</th><th className="text-right">% médio</th></tr></thead><tbody>
          {data.revshare.byEvent.map((r,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{r.event}</td><td className="text-right">{fmt(r.count)}</td><td className="text-right">{bps(r.avgBps)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Modelos por Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.models.types.map((m,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{m.model}</td><td className="text-right">{fmt(m.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Frequência de Payout</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.models.frequencies.map((f,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{f.frequency}</td><td className="text-right">{fmt(f.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Fee Rules por Escopo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.fees.scopes.map((f,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{f.scope}</td><td className="text-right">{fmt(f.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Cálculos de Receita — Decomposição</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Bruto</div><div className="font-bold">{brl(data.calcs.gross)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Líquido</div><div className="font-bold text-green-600">{brl(data.calcs.net)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Gateway</div><div className="font-bold">{brl(data.calcs.gatewayFee)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Impulsionando</div><div className="font-bold">{brl(data.calcs.impulsionandoFee)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Afiliado</div><div className="font-bold">{brl(data.calcs.affiliate)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Coprodutor</div><div className="font-bold">{brl(data.calcs.coproducer)}</div></div>
            <div className="p-2 rounded bg-muted/30 col-span-2"><div className="text-xs text-muted-foreground">Reserva</div><div className="font-bold">{brl(data.calcs.reserve)}</div></div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Status: {data.calcs.statuses.map((s)=>`${s.status}: ${fmt(s.count)}`).join(" · ")}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Ledger & Regras Auxiliares</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-3 gap-2 text-sm mb-3 text-center">
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Pagos</div><div className="font-bold text-green-600">{fmt(data.ledger.paid)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Pendentes</div><div className="font-bold text-amber-600">{fmt(data.ledger.pending)}</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Falhas</div><div className="font-bold text-red-600">{fmt(data.ledger.failed)}</div></div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Ledger bruto: <strong>{brl(data.ledger.gross)}</strong> · líquido: <strong>{brl(data.ledger.net)}</strong></div>
            <div>Status events: {data.payoutEvents.statuses.map((s)=>`${s.status}: ${fmt(s.count)}`).join(" · ")}</div>
            <div>Reschedule: {fmt(data.reschedule.auto)}/{fmt(data.reschedule.total)} auto · fee em {fmt(data.reschedule.feeEnabled)} · min {data.reschedule.avgMinHours.toFixed(1)}h</div>
            <div>Refund: {fmt(data.refunds.allowFull)} permitem integral · auto em {fmt(data.refunds.auto)}</div>
          </div>
        </CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
