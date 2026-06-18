import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/insights/KpiCard";
import { PercebidoSection } from "@/components/insights/PercebidoSection";
import { fetchConsumidorDashboard } from "@/lib/audience-dashboards.functions";
import { Loader2, Heart, MapPin, Receipt, Sparkles, Gift, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboards/consumidor")({
  head: () => ({
    meta: [
      { title: "Minha área — Clube Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ConsumidorDashboardPage,
});

const brl = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents ?? 0) / 100);
const dt = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("pt-BR") : "—";

function ConsumidorDashboardPage() {
  const fn = useServerFn(fetchConsumidorDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboards", "consumidor", 30],
    queryFn: () => fn({ data: { days: 30 } }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha área"
        description="Tudo o que você curte, consome e economiza num só lugar."
      />

      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">
          {(error as Error).message ?? "Não foi possível carregar."}
        </Card>
      )}

      {isLoading || !data ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando sua área pessoal…
        </Card>
      ) : (
        <>
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Bem-vindo(a)</div>
              <div className="text-lg font-semibold">{data.profile?.full_name ?? "Você"}</div>
              {data.nextDue && (
                <Badge variant="secondary" className="mt-2">
                  Próxima renovação: {dt(data.nextDue)}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/clube">Explorar Clube</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/minha-assinatura">Minha assinatura</Link>
              </Button>
            </div>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Assinaturas ativas" value={data.kpis.activeMemberships.value} />
            <KpiCard label="Gasto no período" value={data.kpis.totalSpent.value} format="currency" />
            <KpiCard label="Visitas (30d)" value={data.kpis.visits.value} />
            <KpiCard label="Favoritos" value={data.kpis.favorites.value} />
            <KpiCard label="Créditos" value={data.kpis.credits.value} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <Heart className="h-4 w-4 text-rose-500" /> Meus favoritos
              </div>
              {data.lists.favorites.length === 0 ? (
                <EmptyHint text="Você ainda não favoritou nenhum lugar. Explore o Clube perto de você." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.lists.favorites.slice(0, 6).map((f) => (
                    <li key={f.id} className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="truncate">{f.company_id ?? "—"}</span>
                      <span className="text-muted-foreground text-xs">{dt(f.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-blue-500" /> Histórico de visitas
              </div>
              {data.lists.visits.length === 0 ? (
                <EmptyHint text="Suas visitas e check-ins aparecerão aqui." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.lists.visits.slice(0, 6).map((v) => (
                    <li key={v.id} className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="truncate">{v.company_id ?? "Visita"}</span>
                      <span className="text-muted-foreground text-xs">{dt(v.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-emerald-500" /> Comprovantes e recibos
              </div>
              {data.lists.receipts.length === 0 ? (
                <EmptyHint text="Quando você consumir benefícios, seus comprovantes ficam aqui." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.lists.receipts.slice(0, 6).map((r) => (
                    <li key={r.id} className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="truncate">{r.title}</span>
                      <span className="text-muted-foreground text-xs">{brl(r.amount_cents ?? 0)} · {dt(r.issued_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <FileText className="h-4 w-4 text-violet-500" /> Notas e cobranças
              </div>
              {data.lists.invoices.length === 0 ? (
                <EmptyHint text="Suas faturas e notas fiscais aparecerão aqui." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.lists.invoices.slice(0, 6).map((i) => (
                    <li key={i.id} className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="truncate">
                        {brl(i.amount_cents ?? 0)}{" "}
                        <Badge variant={i.status === "paid" ? "secondary" : "outline"} className="ml-1">
                          {i.status}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground text-xs">venc. {dt(i.due_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4 lg:col-span-2">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <Gift className="h-4 w-4 text-amber-500" /> Movimentação de créditos
              </div>
              {data.lists.rewards.length === 0 ? (
                <EmptyHint text="Acumule créditos visitando, indicando e participando." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.lists.rewards.slice(0, 8).map((r) => (
                    <li key={r.id} className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="truncate">
                        <Badge variant="outline" className="mr-2 capitalize">{r.kind}</Badge>
                        {r.reason}
                      </span>
                      <span className={`text-xs font-mono ${Number(r.delta) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {Number(r.delta) >= 0 ? "+" : ""}{r.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-4 bg-gradient-to-br from-fuchsia-50 to-rose-50 border-fuchsia-200">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-fuchsia-900">
              <Sparkles className="h-4 w-4" /> Dica do Clube
            </div>
            <p className="text-sm text-fuchsia-900/80">
              Atualize seu CEP e favorite os lugares que você mais visita — assim a gente te avisa quando aparecer um benefício novo perto de você.
            </p>
          </Card>
        </>
      )}

      <PercebidoSection audience="consumidor" days={30} />
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground py-4 text-center">{text}</div>;
}
