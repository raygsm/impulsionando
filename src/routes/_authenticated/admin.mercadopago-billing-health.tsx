import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMercadoPagoBillingHealth } from "@/lib/mercadopago-billing-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, RefreshCw, Banknote, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/mercadopago-billing-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getMercadoPagoBillingHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","mp-bill",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary"/>MercadoPago & Billing</h1>
          <p className="text-sm text-muted-foreground">Credenciais, pagamentos, assinaturas, faturas, dunning, Pix e contratos.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Credenciais MP</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.credentials.active)}<span className="text-sm text-muted-foreground">/{fmt(data.credentials.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.credentials.production)} em produção</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4"/>Pagamentos MP</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.payments.amount)}</div><p className="text-xs text-muted-foreground">{fmt(data.payments.approved)}/{fmt(data.payments.total)} aprovados ({pct(data.payments.approvalRate)})</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Refunds</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.refunds.amount)}</div><p className="text-xs text-muted-foreground">{fmt(data.refunds.total)} estornos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Assinaturas MP</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.subscriptions.active)}<span className="text-sm text-muted-foreground">/{fmt(data.subscriptions.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.subscriptions.cancelled)} canceladas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Webhooks MP</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.webhooks.processed)}<span className="text-sm text-muted-foreground">/{fmt(data.webhooks.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4"/>Faturas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.invoices.revenue)}</div><p className="text-xs text-muted-foreground">{fmt(data.invoices.paid)} pagas · {fmt(data.invoices.open)} abertas · {fmt(data.invoices.overdue)} vencidas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Planos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.plans.active)}<span className="text-sm text-muted-foreground">/{fmt(data.plans.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Dunning Ativo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.dunning.active)}</div><p className="text-xs text-muted-foreground">{fmt(data.dunning.failed)} falhas · {fmt(data.dunning.total)} total</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Suspensões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.suspensions.active)}<span className="text-sm text-muted-foreground">/{fmt(data.suspensions.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Contratos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.contracts.active)}<span className="text-sm text-muted-foreground">/{fmt(data.contracts.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pix</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.pix.amount)}</div><p className="text-xs text-muted-foreground">{fmt(data.pix.approved)} aprovados · {fmt(data.pix.pending)} pendentes</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Provedores de Pagamento</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-1">Provider</th><th>Total</th><th>OK</th><th>Aprovação</th><th>Receita</th></tr></thead>
        <tbody>{data.providers.map((r:any)=>(<tr key={r.provider} className="border-t"><td className="py-1">{r.provider}</td><td>{fmt(r.total)}</td><td className="text-green-600">{fmt(r.ok)}</td><td>{pct(r.approvalRate)}</td><td>{brl(r.amount)}</td></tr>))}</tbody></table>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-sm">Top Eventos de Webhook MP</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm"><tbody>{data.webhooks.topTypes.map((r:any)=>(<tr key={r.type} className="border-t"><td className="py-1">{r.type}</td><td className="text-right">{fmt(r.count)}</td></tr>))}</tbody></table>
      </CardContent></Card>
    </div>
  );
}
