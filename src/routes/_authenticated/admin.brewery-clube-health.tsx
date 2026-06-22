import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getBreweryClubeHealth } from "@/lib/brewery-clube-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Beer, RefreshCw, Crown, Star, Gift, Share2, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/brewery-clube-health")({
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

function Page() {
  const fn = useServerFn(getBreweryClubeHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "brewery-clube-health", days],
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
  const b = data.brewery;
  const c = data.clube;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Beer className="h-6 w-6 text-primary" />
            Brewery & Clube Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Sell-out de cervejarias, PDVs, degustações e engajamento do Clube (visitas, consumo, rewards, indicações).
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

      <h2 className="text-lg font-semibold flex items-center gap-2"><Beer className="h-5 w-5" />Brewery</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Marcas Ativas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(b.activeBrands)}<span className="text-sm text-muted-foreground">/{fmt(b.brands)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(b.activeProducts)} produtos · {fmt(b.seasonal)} sazonais</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Store className="h-4 w-4" />PDVs Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(b.activePdvs)}<span className="text-sm text-muted-foreground">/{fmt(b.pdvs)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sell-out (Unidades)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(b.units)}</div>
            <p className="text-xs text-muted-foreground">{fmt(b.couponRedemptions)} cupons resgatados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Sell-out</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(b.revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Degustações</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(b.tastings)}</div>
            <p className="text-xs text-muted-foreground">{fmt(b.tastingParticipants)} participantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Conv. Degustação</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct(b.tastingConv)}</div>
            <p className="text-xs text-muted-foreground">{fmt(b.tastingLeads)} leads · {fmt(b.tastingUnits)} unid.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Leads / Opt-in</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(b.leads)}</div>
            <p className="text-xs text-muted-foreground">{pct(b.consentRate)} consentimento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Ranking de Marcas (Top 15)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2">Marca</th>
                    <th className="text-left">UF</th>
                    <th className="text-right">PDVs</th>
                    <th className="text-right">Unid.</th>
                    <th className="text-right">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.brandsRanking.map((br) => (
                    <tr key={br.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{br.name}</td>
                      <td className="text-xs">{br.city}</td>
                      <td className="text-right">{fmt(br.pdvs)}</td>
                      <td className="text-right">{fmt(br.units)}</td>
                      <td className="text-right font-medium">{brl(br.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Produtos (Receita)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2">Produto</th>
                    <th className="text-left">Marca</th>
                    <th className="text-left">Estilo</th>
                    <th className="text-right">Unid.</th>
                    <th className="text-right">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="text-xs">{p.brand}</td>
                      <td className="text-xs capitalize">{p.style}</td>
                      <td className="text-right">{fmt(p.units)}</td>
                      <td className="text-right font-medium">{brl(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold flex items-center gap-2 pt-4"><Crown className="h-5 w-5" />Clube</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Visitas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(c.visits)}</div>
            <p className="text-xs text-muted-foreground">{fmt(c.uniqueVisitors)} membros únicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4" />Nota Média</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">de 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Consumo Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(c.consumptionTotal)}</div>
            <p className="text-xs text-muted-foreground">{fmt(c.consumptionCount)} transações · ticket {brl(c.consumptionAvg)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gift className="h-4 w-4" />Rewards</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(c.rewardsBalance)}</div>
            <p className="text-xs text-muted-foreground">+{fmt(c.rewardsEarned)} ganhos · −{fmt(c.rewardsRedeemed)} resgates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Share2 className="h-4 w-4" />Indicações</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(c.referrals)}</div>
            <p className="text-xs text-muted-foreground">{fmt(c.referralsConverted)} convertidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Conv. Indicações</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={c.referralsConvRate >= 30 ? "default" : c.referralsConvRate >= 15 ? "secondary" : "destructive"} className="text-base">{pct(c.referralsConvRate)}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recompensa Paga</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{brl(c.referralsRewardBRL)}</div>
            <p className="text-xs text-muted-foreground">cashback indicações</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
