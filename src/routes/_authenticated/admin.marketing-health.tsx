import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMarketingHealth } from "@/lib/marketing-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, RefreshCw, Send, MessageSquare, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marketing-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getMarketingHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","marketing-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div><h1 className="text-2xl font-semibold flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary"/>Marketing & Outbox</h1>
          <p className="text-sm text-muted-foreground">Leads de marketing por UTM/campanha, outbox por canal, supressões e WhatsApp.</p></div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Leads Marketing</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.leads.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.leads.assigned)} atribuídos · {fmt(data.leads.unassigned)} órfãos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4"/>Outbox Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.outbox.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.templates.active)} templates ativos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Inbox className="h-4 w-4"/>E-mail</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.email.sent)}</div><p className="text-xs text-muted-foreground">{fmt(data.email.failed)} falhas · {fmt(data.email.suppressed)} suprimidos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4"/>WhatsApp</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.whatsapp.sent)}</div><p className="text-xs text-muted-foreground">{fmt(data.whatsapp.read)} lidas · {fmt(data.whatsapp.failed)} falhas</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Outbox por Canal</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm"><thead className="text-xs text-muted-foreground border-b"><tr>
          <th className="text-left py-2">Canal</th><th className="text-right">Total</th><th className="text-right">Enviadas</th><th className="text-right">Pendentes</th><th className="text-right">Falhas</th><th className="text-right">Entrega</th>
        </tr></thead><tbody>
          {data.outbox.channels.map((c)=>(<tr key={c.channel} className="border-b last:border-0">
            <td className="py-2 font-medium capitalize">{c.channel}</td>
            <td className="text-right">{fmt(c.total)}</td>
            <td className="text-right text-emerald-600">{fmt(c.sent)}</td>
            <td className="text-right">{fmt(c.pending)}</td>
            <td className="text-right text-destructive">{fmt(c.failed)}</td>
            <td className="text-right"><Badge variant={c.deliveryRate>=90?"default":c.deliveryRate>=70?"secondary":"destructive"}>{pct(c.deliveryRate)}</Badge></td>
          </tr>))}
        </tbody></table>
      </CardContent></Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Top UTM (source · medium)</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.leads.topUtm.map((u,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 text-xs">{u.utm}</td><td className="text-right">{fmt(u.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top Campanhas</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.leads.topCampaigns.map((c,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{c.campaign}</td><td className="text-right">{fmt(c.count)}</td></tr>))}
          {data.leads.topCampaigns.length===0 && <tr><td className="py-2 text-muted-foreground text-center">Sem campanhas</td></tr>}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top Event Codes</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.outbox.topEvents.map((e,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 text-xs">{e.event}</td><td className="text-right">{fmt(e.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
