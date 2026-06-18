import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Beer, Store, TrendingUp, Users, Sparkles, Wine } from "lucide-react";
import { fetchBreweryDashboard, listMyBreweryBrands } from "@/lib/brewery.functions";

export const Route = createFileRoute("/_authenticated/cervejaria")({
  component: BreweryDashboard,
  head: () => ({
    meta: [
      { title: "Microcervejaria · Painel — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function BreweryDashboard() {
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [sinceDays, setSinceDays] = useState<number>(30);

  const brandsFn = useServerFn(listMyBreweryBrands);
  const { data: brands = [] } = useQuery({
    queryKey: ["brewery", "brands"],
    queryFn: () => brandsFn(),
    staleTime: 60_000,
  });

  const dashFn = useServerFn(fetchBreweryDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["brewery", "dashboard", brandId ?? "all", sinceDays],
    queryFn: () => dashFn({ data: { brandId, sinceDays } }),
    refetchInterval: 60_000,
  });

  const kpi = data?.kpis;
  const funnel = data?.funnel;
  const funnelMax = Math.max(
    funnel?.degustacoes ?? 0,
    funnel?.participantes ?? 0,
    funnel?.leadsCapturados ?? 0,
    funnel?.leadsConsentimento ?? 0,
    1,
  );

  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Beer className="w-7 h-7 text-primary" /> Painel da Microcervejaria
          </h1>
          <p className="text-sm text-muted-foreground">
            Sell-out por PDV, estilos em alta, degustações e relacionamento com o consumidor final.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={brandId ?? "all"} onValueChange={(v) => setBrandId(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(sinceDays)} onValueChange={(v) => setSinceDays(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 180 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando…</CardContent></Card>
      )}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={Store} label="PDVs ativos" value={String(kpi!.pdvAtivos)} />
            <KpiCard icon={Beer} label="Sell-out (un.)" value={kpi!.sellOutUnidades.toLocaleString("pt-BR")} />
            <KpiCard icon={TrendingUp} label="Receita estimada" value={brl(kpi!.sellOutReceita)} />
            <KpiCard icon={Wine} label="Ticket médio" value={brl(kpi!.ticketMedio)} />
            <KpiCard icon={Users} label="Leads no Clube" value={String(kpi!.leadsClube)} />
            <KpiCard icon={Sparkles} label="Degustações" value={String(kpi!.degustacoes)} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Top rótulos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem sell-out registrado no período.</p>
                ) : data.topProducts.map((p) => (
                  <div key={p.productId} className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.style}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{p.units} un.</div>
                      <div className="text-xs text-muted-foreground">{brl(p.revenueCents)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Estilos em alta</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.topStyles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados no período.</p>
                ) : data.topStyles.map((s) => (
                  <div key={s.style} className="flex items-center justify-between text-sm">
                    <Badge variant="secondary">{s.style}</Badge>
                    <span><strong>{s.units}</strong> un. · {brl(s.revenueCents)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Top PDVs</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.topPdvs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem PDV com sell-out no período.</p>
                ) : data.topPdvs.map((p) => (
                  <div key={p.pdvLinkId} className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[p.city, p.state].filter(Boolean).join(" / ") || "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{p.units} un.</div>
                      <div className="text-xs text-muted-foreground">{brl(p.revenueCents)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funil: degustação → Clube</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const steps = [
                    { label: "Degustações realizadas", value: funnel!.degustacoes },
                    { label: "Participantes", value: funnel!.participantes },
                    { label: "Leads capturados", value: funnel!.leadsCapturados },
                    { label: "Com consentimento marketing", value: funnel!.leadsConsentimento },
                  ];
                  return steps.map((s, i) => {
                    const pct = (s.value / funnelMax) * 100;
                    const prev = i === 0 ? null : steps[i - 1].value;
                    const conv = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
                    return (
                      <div key={s.label}>
                        <div className="flex justify-between text-sm">
                          <span>{s.label}</span>
                          <span className="font-semibold">
                            {s.value.toLocaleString("pt-BR")}
                            {conv !== null && <span className="text-xs text-muted-foreground ml-2">({conv}% vs etapa anterior)</span>}
                          </span>
                        </div>
                        <div className="h-2 rounded bg-muted overflow-hidden mt-1">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
