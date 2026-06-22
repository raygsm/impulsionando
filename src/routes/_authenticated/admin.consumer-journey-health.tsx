import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getConsumerJourneyHealth } from "@/lib/consumer-journey-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRound, RefreshCw, Crown, ShieldCheck, Heart, Bell, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/consumer-journey-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const brl = (n: number) => (Number(n || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getConsumerJourneyHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","consumer-journey-health",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><UserRound className="h-6 w-6 text-primary"/>Consumer Journey & Membership</h1>
          <p className="text-sm text-muted-foreground">Camada B2C: perfis, memberships, faturas, favoritos, reviews, LGPD, preferências e privacidade.</p>
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Perfis Consumidor</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.profiles.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.profiles.optin)} opt-in · {fmt(data.profiles.withGeo)} c/ geo</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Crown className="h-4 w-4"/>Memberships Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.memberships.active)}<span className="text-sm text-muted-foreground">/{fmt(data.memberships.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.memberships.atRisk)} em risco</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">MRR Estimado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.memberships.mrrCents)}</div><p className="text-xs text-muted-foreground">{fmt(data.memberships.canceled)} cancelados</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Faturas — Receita</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(data.invoices.revenueCents)}</div><p className="text-xs text-muted-foreground">{fmt(data.invoices.paid)}/{fmt(data.invoices.total)} pagas · {fmt(data.invoices.overdue)} vencidas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4"/>Favoritos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.favorites.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.favorites.uniqueUsers)} usuários únicos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4"/>Reviews</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.reviews.avgStars.toFixed(1)}<span className="text-sm text-muted-foreground"> ★</span></div><p className="text-xs text-muted-foreground">{fmt(data.reviews.total)} reviews</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>LGPD</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.lgpd.accepted)}<span className="text-sm text-muted-foreground">/{fmt(data.lgpd.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.lgpd.revoked)} revogados · {fmt(data.deletions.pending)} deleções pendentes</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4"/>Notif. Prefs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.preferences.enabled)}<span className="text-sm text-muted-foreground">/{fmt(data.preferences.total)}</span></div><p className="text-xs text-muted-foreground">{fmt(data.suppressed.total)} emails suprimidos</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Engajamento & Loyalty</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded bg-muted/40"><div className="text-xs text-muted-foreground">Pontos acumulados</div><div className="text-xl font-bold">{fmt(data.profiles.pointsTotal)}</div></div>
            <div className="p-3 rounded bg-muted/40"><div className="text-xs text-muted-foreground">Economia gerada</div><div className="text-xl font-bold">{brl(data.profiles.savingsCents)}</div></div>
            <div className="p-3 rounded bg-muted/40"><div className="text-xs text-muted-foreground">Visitas registradas</div><div className="text-xl font-bold">{fmt(data.profiles.visitsTotal)}</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Memberships por Plano</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.memberships.byPlan.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.memberships.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Ciclos</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.memberships.byCycle.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Perfis por Estado</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.profiles.byState.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Níveis de Loyalty</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.profiles.byLevel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2 capitalize">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top Interesses</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.profiles.topTags.length===0 && <tr><td className="py-2 text-muted-foreground">—</td></tr>}
          {data.profiles.topTags.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Faturas por Status</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.invoices.byStatus.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Distribuição de Reviews</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.reviews.distribution.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k} ★</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">LGPD Consents por Tipo</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>
          {data.lgpd.byType.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Privacidade — Pedidos</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Exportações</div><div className="font-bold">{fmt(data.exports.done)}/{fmt(data.exports.total)}</div><div className="text-xs">{fmt(data.exports.pending)} pendentes</div></div>
            <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Deleções</div><div className="font-bold">{fmt(data.deletions.done)}/{fmt(data.deletions.total)}</div><div className="text-xs">{fmt(data.deletions.pending)} pendentes</div></div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Emails suprimidos: {data.suppressed.byReason.map((s)=>`${s.k}: ${fmt(s.count)}`).join(" · ") || "—"}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Notificação — Canais & Categorias</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground mb-1">Canal</div><table className="w-full"><tbody>{data.preferences.byChannel.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table></div>
            <div><div className="text-xs text-muted-foreground mb-1">Categoria</div><table className="w-full"><tbody>{data.preferences.byCategory.map((s,i)=>(<tr key={i} className="border-b last:border-0"><td className="py-1">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}</tbody></table></div>
          </div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Customers Ativados (área de paciente / cliente)</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-sm">
          <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Total ({data.window.days}d)</div><div className="font-bold">{fmt(data.customers.total)}</div></div>
          <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Ativos</div><div className="font-bold">{fmt(data.customers.active)}</div></div>
          <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Convidados</div><div className="font-bold">{fmt(data.customers.invited)}</div></div>
          <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Ativados</div><div className="font-bold text-green-600">{fmt(data.customers.activated)}</div></div>
          <div className="p-2 rounded bg-muted/30"><div className="text-xs text-muted-foreground">Taxa de Ativação</div><div className="font-bold">{pct(data.customers.activationRate)}</div></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Anonimizados: {fmt(data.customers.anonymized)}</p>
      </CardContent></Card>

      <p className="text-xs text-muted-foreground">Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}</p>
    </div>
  );
}
