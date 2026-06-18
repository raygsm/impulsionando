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
import { Loader2, Heart, MapPin, Receipt, Sparkles, Gift, FileText, Ticket, TicketCheck, CalendarDays, Star, Lock, Crown } from "lucide-react";
import type { ReactNode } from "react";

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
      <nav aria-label="Trilha" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/clube" className="hover:text-foreground transition-colors">Clube</Link>
        <span className="opacity-50">›</span>
        <span className="text-foreground font-medium">Minha área</span>
      </nav>

      <PageHeader
        title="Minha área"
        description="Tudo o que você curte, consome e economiza num só lugar."
      />

      <SectionNav />


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

          {data.kpis.activeMemberships.value === 0 ? (
            <PaywallHero />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<Heart className="h-4 w-4 text-rose-500" />}
              title="Meus favoritos"
              teaser="Salve restaurantes, clínicas, eventos e lugares para acessar com um toque."
              empty="Você ainda não favoritou nenhum lugar. Explore o Clube perto de você."
              items={data.lists.favorites}
              render={(f) => (
                <>
                  <span className="truncate">{f.company_id ?? "—"}</span>
                  <span className="text-muted-foreground text-xs">{dt(f.created_at)}</span>
                </>
              )}
            />

            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<MapPin className="h-4 w-4 text-blue-500" />}
              title="Histórico de visitas"
              teaser="Veja tudo o que você consumiu, quando e onde — organizado por mês."
              empty="Suas visitas e check-ins aparecerão aqui."
              items={data.lists.visits}
              render={(v) => (
                <>
                  <span className="truncate">{v.company_id ?? "Visita"}</span>
                  <span className="text-muted-foreground text-xs">{dt(v.created_at)}</span>
                </>
              )}
            />

            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<Ticket className="h-4 w-4 text-pink-500" />}
              title="Meus cupons"
              teaser="Descontos personalizados para você usar nas marcas e lugares que você ama."
              empty="Você ainda não resgatou nenhum cupom. Explore o Clube e pegue o próximo."
              items={data.lists.coupons}
              render={(r) => (
                <>
                  <span className="truncate">{r.title}</span>
                  <span className="text-muted-foreground text-xs">
                    <Badge variant={r.status === "used" ? "secondary" : "outline"} className="mr-2">
                      {r.status === "used" ? "usado" : "disponível"}
                    </Badge>
                    {dt(r.issued_at)}
                  </span>
                </>
              )}
            />

            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<TicketCheck className="h-4 w-4 text-fuchsia-500" />}
              title="Meus vouchers"
              teaser="Vouchers e brindes para resgatar quando e onde você quiser."
              empty="Seus vouchers de benefícios aparecerão aqui assim que você resgatar."
              items={data.lists.vouchers}
              render={(r) => (
                <>
                  <span className="truncate">{r.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {brl(r.amount_cents ?? 0)} · {dt(r.issued_at)}
                  </span>
                </>
              )}
            />

            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<CalendarDays className="h-4 w-4 text-blue-600" />}
              title="Minhas reservas e ingressos"
              teaser="Reservas, agendamentos e ingressos centralizados — com QR Code e lembretes."
              empty="Você ainda não tem reservas. Encontre eventos e experiências no Clube."
              items={data.lists.tickets}
              render={(t) => (
                <>
                  <span className="truncate font-mono text-xs">{t.code}</span>
                  <span className="text-muted-foreground text-xs">
                    {t.cancelled_at ? (
                      <Badge variant="destructive" className="mr-2">cancelado</Badge>
                    ) : (
                      <Badge variant="secondary" className="mr-2">ativo</Badge>
                    )}
                    {dt(t.created_at)}
                  </span>
                </>
              )}
            />

            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<Star className="h-4 w-4 text-amber-500" />}
              title="Minhas avaliações"
              teaser="Suas notas e comentários sobre lugares e experiências que você viveu."
              empty="Depois de visitar um lugar, você poderá avaliar e ajudar outras pessoas."
              items={data.lists.ratings}
              render={(v) => (
                <>
                  <span className="truncate">
                    <span className="text-amber-500 mr-2">{"★".repeat(Math.max(1, Math.min(5, v.rating ?? 0)))}</span>
                    {v.notes ?? "Sem comentário"}
                  </span>
                  <span className="text-muted-foreground text-xs">{dt(v.created_at)}</span>
                </>
              )}
            />

            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<Receipt className="h-4 w-4 text-emerald-500" />}
              title="Comprovantes de consumo"
              teaser="Tudo o que você consumiu organizado por data, valor e estabelecimento."
              empty="Seus comprovantes de consumo aparecerão aqui."
              items={data.lists.receipts.filter((r) => r.kind !== "coupon" && r.kind !== "cupom" && r.kind !== "voucher")}
              render={(r) => (
                <>
                  <span className="truncate">{r.title}</span>
                  <span className="text-muted-foreground text-xs">{brl(r.amount_cents ?? 0)} · {dt(r.issued_at)}</span>
                </>
              )}
            />

            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<FileText className="h-4 w-4 text-violet-500" />}
              title="Minhas notas e cobranças"
              teaser="Faturas e notas fiscais da sua assinatura do Clube, sempre à mão."
              empty="Suas faturas e notas fiscais aparecerão aqui assim que houver cobranças."
              items={data.lists.invoices}
              render={(i) => (
                <>
                  <span className="truncate">
                    {brl(i.amount_cents ?? 0)}{" "}
                    <Badge variant={i.status === "paid" ? "secondary" : "outline"} className="ml-1">
                      {i.status === "paid" ? "pago" : i.status}
                    </Badge>
                  </span>
                  <span className="text-muted-foreground text-xs">venc. {dt(i.due_date)}</span>
                </>
              )}
            />

            <PremiumSection
              isPremium={data.kpis.activeMemberships.value > 0}
              icon={<Gift className="h-4 w-4 text-amber-500" />}
              title="Movimentação de créditos"
              teaser="Acumule créditos e cashback toda vez que consumir ou indicar."
              empty="Acumule créditos visitando, indicando e participando."
              items={data.lists.rewards}
              className="lg:col-span-2"
              render={(r) => (
                <>
                  <span className="truncate">
                    <Badge variant="outline" className="mr-2 capitalize">{r.kind}</Badge>
                    {r.reason}
                  </span>
                  <span className={`text-xs font-mono ${Number(r.delta) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {Number(r.delta) >= 0 ? "+" : ""}{r.delta}
                  </span>
                </>
              )}
            />
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

function PaywallHero() {
  return (
    <Card className="p-5 border-amber-300 bg-gradient-to-br from-amber-50 via-rose-50 to-fuchsia-50">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/20 p-2.5">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="text-base font-semibold text-amber-900">Assine o Clube e desbloqueie tudo</div>
            <p className="text-sm text-amber-900/80 mt-0.5 max-w-xl">
              Versão gratuita mostra o guia perto de você. Assinantes acessam histórico
              completo, créditos, cupons, vouchers e benefícios exclusivos por R$ 9,99/mês.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild>
            <Link to="/minha-assinatura">Assinar Clube</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/clube">Continuar gratuito</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PremiumSection<T extends { id: string }>({
  isPremium,
  icon,
  title,
  teaser,
  empty,
  items,
  render,
  className,
  anchor,
}: {
  isPremium: boolean;
  icon: ReactNode;
  title: string;
  teaser: string;
  empty: string;
  items: T[];
  render: (item: T) => ReactNode;
  className?: string;
  anchor?: string;
}) {
  const id = anchor;
  if (!isPremium) {
    return (
      <Card id={id} className={`p-4 relative overflow-hidden scroll-mt-24 ${className ?? ""}`}>
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
          {icon} {title}
          <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
            <Lock className="h-3 w-3" /> Premium
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{teaser}</p>
        <Button asChild size="sm" variant="secondary" className="w-full">
          <Link to="/minha-assinatura">Desbloquear com assinatura</Link>
        </Button>
      </Card>
    );
  }
  return (
    <Card id={id} className={`p-4 scroll-mt-24 ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold">{icon} {title}</div>
      {items.length === 0 ? (
        <EmptyHint text={empty} />
      ) : (
        <ul className="space-y-2 text-sm">
          {items.slice(0, 6).map((it) => (
            <li key={it.id} className="flex justify-between border-b border-border/40 pb-1.5">
              {render(it)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const SECTIONS: Array<{ id: string; label: string }> = [
  { id: "favoritos", label: "Meus favoritos" },
  { id: "historico", label: "Histórico de visitas" },
  { id: "cupons", label: "Meus cupons" },
  { id: "vouchers", label: "Meus vouchers" },
  { id: "reservas", label: "Minhas reservas" },
  { id: "avaliacoes", label: "Minhas avaliações" },
  { id: "comprovantes", label: "Comprovantes" },
  { id: "notas", label: "Minhas notas" },
  { id: "creditos", label: "Meus créditos" },
];

function SectionNav() {
  return (
    <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-background/85 backdrop-blur border-b border-border/60">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border/60 bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
