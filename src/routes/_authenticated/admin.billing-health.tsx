import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getBillingHealth } from "@/lib/billing-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, RefreshCw, FileText, AlertTriangle, Banknote, ShieldOff, Repeat, QrCode, BadgeDollarSign, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/billing-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Tab({ title, rows, unit }: { title: string; rows: { k: string; count: number }[]; unit?: "brl" | "n" }) {
  const f = unit === "brl" ? brl : fmt;
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
        <table className="w-full text-sm"><tbody>
          {rows.map((s, i) => (<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{f(s.count)}</td></tr>))}
        </tbody></table>
      )}
    </CardContent></Card>
  );
}

function Page() {
  const fn = useServerFn(getBillingHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","billing-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;
  const pl = data.plans, ct = data.contracts, inv = data.invoices, px = data.pix, du = data.dunning, su = data.suspensions, sb = data.subscriptions, mp = data.mpago;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary"/>Billing & Assinaturas — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Planos, contratos, faturas, PIX, dunning, suspensões, assinaturas e Mercado Pago.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4"/>Planos ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(pl.active)}/{fmt(pl.total)}</div><p className="text-xs text-muted-foreground">cadastrados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>Contratos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(ct.active)}/{fmt(ct.total)}</div><p className="text-xs text-muted-foreground">{fmt(ct.canceled)} cancelados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Repeat className="h-4 w-4"/>Assinaturas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(sb.active)}/{fmt(sb.total)}</div><p className="text-xs text-muted-foreground">churn {pct(sb.churnRate)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4"/>Faturas pagas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(inv.paidBRL)}</div><p className="text-xs text-muted-foreground">{fmt(inv.paidCount)}/{fmt(inv.total)} · {pct(inv.payRate)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500"/>Em aberto</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(inv.openBRL)}</div><p className="text-xs text-muted-foreground">{fmt(inv.openCount)} faturas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-500"/>Vencidas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(inv.overdueBRL)}</div><p className="text-xs text-muted-foreground">{fmt(inv.overdueCount)} faturas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><QrCode className="h-4 w-4"/>PIX</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(px.payRate)}</div><p className="text-xs text-muted-foreground">{fmt(px.paid)}/{fmt(px.total)} · {brl(px.paidBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Repeat className="h-4 w-4"/>Dunning</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(du.total)}</div><p className="text-xs text-muted-foreground">execuções no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldOff className="h-4 w-4 text-rose-500"/>Suspensões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(su.active)}/{fmt(su.total)}</div><p className="text-xs text-muted-foreground">ativas / total</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BadgeDollarSign className="h-4 w-4"/>Mercado Pago</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pct(mp.approvalRate)}</div><p className="text-xs text-muted-foreground">{fmt(mp.approved)}/{fmt(mp.total)} · {brl(mp.approvedBRL)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Repeat className="h-4 w-4"/>Assinat. MP</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(mp.subActive)}/{fmt(mp.subTotal)}</div><p className="text-xs text-muted-foreground">autorizadas / total</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tab title="Planos por tier" rows={pl.byTier} />
        <Tab title="Planos por intervalo" rows={pl.byInterval} />
        <Tab title="Contratos por status" rows={ct.byStatus} />
        <Tab title="Contratos por plano" rows={ct.byPlan} />
        <Tab title="Faturas por status" rows={inv.byStatus} />
        <Tab title="PIX por status" rows={px.byStatus} />
        <Tab title="Dunning por status" rows={du.byStatus} />
        <Tab title="Dunning por tentativa" rows={du.byAttempt} />
        <Tab title="Suspensões por motivo" rows={su.byReason} />
        <Tab title="Suspensões por status" rows={su.byStatus} />
        <Tab title="Assinaturas por status" rows={sb.byStatus} />
        <Tab title="Assinaturas por plano" rows={sb.byPlan} />
        <Tab title="MP por status" rows={mp.byStatus} />
        <Tab title="MP por método" rows={mp.byMethod} unit="brl" />
        <Tab title="MP Assinaturas por status" rows={mp.subByStatus} />
      </div>
    </div>
  );
}
