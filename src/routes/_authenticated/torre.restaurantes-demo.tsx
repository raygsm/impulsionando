/**
 * /torre/restaurantes-demo — Dashboard executivo do nicho Bar & Restaurante (demo).
 *
 * Agrega tudo o que o showroom captura: scans por QR, conversão até checkout,
 * mix de pagamento, top itens, preferências dos leads e vouchers emitidos.
 * Restrito a Super Admin via server fn.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QrCode, Users, ShoppingBag, CreditCard, Gift, Receipt, RefreshCw,
  ArrowRight, Sparkles, BarChart3,
} from "lucide-react";
import { fetchDemoRestauranteDashboard } from "@/lib/demo-restaurante.functions";

export const Route = createFileRoute("/_authenticated/torre/restaurantes-demo")({
  component: TorreRestaurantesDemoPage,
});

const SCENARIO = "boteco-aurora";
const BRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const KIND_LABEL: Record<string, string> = {
  mesa: "Mesa", delivery: "Delivery", evento: "Evento", pesquisa: "Pesquisa", clube: "Clube",
};
const FAV_LABEL: Record<string, string> = {
  chopp: "Chopp & cerveja", petiscos: "Petiscos", drinks: "Drinks", massas: "Massas", sobremesas: "Sobremesas",
};
const FREQ_LABEL: Record<string, string> = {
  primeira: "Primeira vez", mensal: "Mensal", quinzenal: "Quinzenal", semanal: "Semanal",
};
const COMPANY_LABEL: Record<string, string> = {
  sozinho: "Sozinho", casal: "Casal", amigos: "Amigos", familia: "Família", trabalho: "Trabalho",
};
const INTEREST_LABEL: Record<string, string> = {
  eventos: "Eventos", clube: "Clube", delivery: "Delivery", happy_hour: "Happy hour", private: "Evento privado",
};

function Kpi({
  icon: Icon, label, value, sub,
}: {
  icon: typeof Users; label: string; value: string | number; sub?: string;
}) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function FunnelStep({ label, value, base }: { label: string; value: number; base: number }) {
  const pct = base > 0 ? Math.round((value / base) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} · {pct}%</span>
      </div>
      <div className="h-2 rounded bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CountList({
  items, labelMap, empty,
}: {
  items: Array<{ key: string; count: number }>;
  labelMap?: Record<string, string>;
  empty?: string;
}) {
  if (!items.length) return <p className="text-xs text-muted-foreground">{empty ?? "Sem dados ainda."}</p>;
  const max = items[0].count;
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.key} className="text-xs">
          <div className="flex justify-between">
            <span>{labelMap?.[i.key] ?? i.key}</span>
            <span className="text-muted-foreground">{i.count}</span>
          </div>
          <div className="h-1.5 mt-0.5 rounded bg-muted overflow-hidden">
            <div className="h-full bg-primary/70" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TorreRestaurantesDemoPage() {
  const fetchDash = useServerFn(fetchDemoRestauranteDashboard);
  const [windowHours, setWindow] = useState(24 * 7);

  const q = useQuery({
    queryKey: ["torre-restaurantes-demo", SCENARIO, windowHours],
    queryFn: () => fetchDash({ data: { scenarioSlug: SCENARIO, sinceHours: windowHours } }),
    refetchInterval: 15_000,
  });

  if (q.isLoading) {
    return <main className="p-6 text-sm text-muted-foreground">Carregando torre…</main>;
  }
  if (q.error || !q.data) {
    return (
      <main className="p-6">
        <Card className="p-4 text-sm">
          Não foi possível carregar a torre. {String((q.error as Error | undefined)?.message ?? "")}
        </Card>
      </main>
    );
  }

  const d = q.data;
  const conv = d.conversion;
  const totalPay = d.paymentMix.pix + d.paymentMix.card + d.paymentMix.on_delivery;

  return (
    <main className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="w-3.5 h-3.5" /> Torre de Controle · Bar & Restaurante (demo)
          </div>
          <h1 className="text-2xl font-bold leading-tight">{d.scenario.name}</h1>
          <p className="text-sm text-muted-foreground">{d.scenario.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(windowHours)} onValueChange={(v) => setWindow(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24">Últimas 24h</SelectItem>
              <SelectItem value="72">Últimos 3 dias</SelectItem>
              <SelectItem value="168">Últimos 7 dias</SelectItem>
              <SelectItem value="720">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => q.refetch()} aria-label="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button asChild variant="default" size="sm">
            <Link to="/showroom/restaurante">
              Showroom <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={QrCode} label="Scans" value={conv.scans} sub={`${d.totals.distinctSessions} sessões`} />
        <Kpi icon={ShoppingBag} label="Carrinho ativo" value={conv.menuActive} sub={`${d.topItems.length} itens diferentes`} />
        <Kpi icon={CreditCard} label="Checkouts simulados" value={conv.checkoutDone} sub={`${conv.checkoutAttempts} tentativas`} />
        <Kpi icon={Receipt} label="Receita simulada" value={BRL(d.totals.simulatedRevenueCents)} sub={`Ticket médio ${BRL(d.totals.avgTicketCents)}`} />
        <Kpi icon={Gift} label="Leads + Vouchers" value={`${d.totals.leads} / ${conv.surveysSubmitted}`} sub="Pesquisas enviadas" />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Funil da demonstração</h2>
            <Badge variant="outline" className="text-[10px]">Janela: {windowHours}h</Badge>
          </div>
          <FunnelStep label="Scans" value={conv.scans} base={Math.max(conv.scans, 1)} />
          <FunnelStep label="Abriu cardápio (adicionou)" value={conv.menuActive} base={Math.max(conv.scans, 1)} />
          <FunnelStep label="Tentou checkout" value={conv.checkoutAttempts} base={Math.max(conv.scans, 1)} />
          <FunnelStep label="Simulou pagamento" value={conv.checkoutDone} base={Math.max(conv.scans, 1)} />
          <FunnelStep label="Respondeu pesquisa" value={conv.surveysSubmitted} base={Math.max(conv.scans, 1)} />
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Mix de pagamento simulado</h2>
          {totalPay === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum pagamento simulado ainda.</p>
          ) : (
            <div className="space-y-2">
              {(["pix", "card", "on_delivery"] as const).map((m) => {
                const v = d.paymentMix[m];
                const pct = Math.round((v / totalPay) * 100);
                const lbl = m === "pix" ? "Pix" : m === "card" ? "Cartão" : "Na entrega";
                return (
                  <div key={m}>
                    <div className="flex justify-between text-xs">
                      <span>{lbl}</span>
                      <span className="text-muted-foreground">{v} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="border-t pt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Scans por tipo</p>
              <CountList items={d.scanByKind} labelMap={KIND_LABEL} />
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">QRs mais escaneados</p>
              {d.topQrs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem scans ainda.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {d.topQrs.slice(0, 5).map((q) => (
                    <li key={q.slug} className="flex justify-between gap-2">
                      <span className="truncate">{q.title}</span>
                      <span className="text-muted-foreground">{q.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Top itens adicionados
          </h2>
          {d.topItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum item adicionado ainda.</p>
          ) : (
            <ul className="divide-y">
              {d.topItems.map((it) => (
                <li key={it.name} className="py-2 flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{it.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {it.qty}× · {BRL(it.revenueCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Gift className="w-4 h-4" /> Vouchers emitidos
          </h2>
          {d.vouchers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Catálogo de vouchers vazio.</p>
          ) : (
            <ul className="space-y-2">
              {d.vouchers.map((v) => (
                <li key={v.code} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-semibold">{v.code}</p>
                    <p className="text-muted-foreground">{v.name} · {v.audience ?? "geral"}</p>
                  </div>
                  <Badge variant={v.emitted > 0 ? "default" : "outline"}>{v.emitted} emitidos</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Categoria favorita</h3>
          <CountList items={d.preferences.favorites} labelMap={FAV_LABEL} empty="Sem pesquisas." />
        </Card>
        <Card className="p-4 space-y-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Frequência</h3>
          <CountList items={d.preferences.frequency} labelMap={FREQ_LABEL} empty="Sem pesquisas." />
        </Card>
        <Card className="p-4 space-y-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Companhia</h3>
          <CountList items={d.preferences.company} labelMap={COMPANY_LABEL} empty="Sem pesquisas." />
        </Card>
        <Card className="p-4 space-y-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Interesses</h3>
          <CountList items={d.preferences.interests} labelMap={INTEREST_LABEL} empty="Sem pesquisas." />
        </Card>
      </section>

      <section>
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Últimos leads
          </h2>
          {d.recentLeads.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma pesquisa enviada na janela atual.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3">Nome (mascarado)</th>
                    <th className="text-left py-2 pr-3">WhatsApp</th>
                    <th className="text-left py-2 pr-3">Favorito</th>
                    <th className="text-left py-2 pr-3">Voucher</th>
                    <th className="text-right py-2">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentLeads.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{l.name}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground font-mono">{l.whatsapp}</td>
                      <td className="py-2 pr-3 text-xs">{l.favorite ? FAV_LABEL[l.favorite] ?? l.favorite : "—"}</td>
                      <td className="py-2 pr-3">{l.voucher ? <Badge className="font-mono">{l.voucher}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="py-2 text-right text-xs text-muted-foreground">
                        {new Date(l.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <p className="text-[11px] text-muted-foreground text-center">
        Todos os números acima vêm de sessões marcadas como <code>is_demo=true</code>. Nenhum dado é
        sincronizado com produção.
      </p>
    </main>
  );
}
