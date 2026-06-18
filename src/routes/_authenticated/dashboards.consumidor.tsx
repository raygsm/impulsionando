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
import { Loader2, Heart, MapPin, Receipt, Sparkles, Gift, FileText, Ticket, TicketCheck, CalendarDays, Star, Lock, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

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

const STORAGE_KEY = "dashboards:consumidor:section";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function ConsumidorDashboardPage() {
  const fn = useServerFn(fetchConsumidorDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboards", "consumidor", 30],
    queryFn: () => fn({ data: { days: 30 } }),
    staleTime: 60_000,
  });

  const reducedMotion = usePrefersReducedMotion();
  const navRef = useRef<HTMLDivElement>(null);
  const [headerOffset, setHeaderOffset] = useState(72);
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const hash = window.location.hash.replace("#", "");
    if (hash && SECTIONS.some((s) => s.id === hash)) return hash;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) ?? "";
      if (saved && SECTIONS.some((s) => s.id === saved)) return saved;
    } catch {}
    return "";
  });

  // Measure real header (sticky sub-nav) height — recompute on resize
  useEffect(() => {
    if (!navRef.current) return;
    const measure = () => {
      if (!navRef.current) return;
      const h = navRef.current.getBoundingClientRect().height;
      setHeaderOffset(Math.round(h + 8));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(navRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const scrollToId = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [headerOffset, reducedMotion],
  );

  const handleSelect = useCallback(
    (id: string, scroll = false) => {
      setActiveId(id);
      try {
        const newUrl = `${window.location.pathname}${window.location.search}#${id}`;
        window.history.replaceState(null, "", newUrl);
        sessionStorage.setItem(STORAGE_KEY, id);
      } catch {}
      if (scroll) scrollToId(id);
    },
    [scrollToId],
  );

  // Restore scroll on initial load (hash > sessionStorage)
  const restoredRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || isLoading || restoredRef.current) return;
    const hash = window.location.hash.replace("#", "");
    const target =
      (hash && SECTIONS.some((s) => s.id === hash) && hash) ||
      (() => {
        try {
          const s = sessionStorage.getItem(STORAGE_KEY) ?? "";
          return SECTIONS.some((x) => x.id === s) ? s : "";
        } catch {
          return "";
        }
      })();
    if (target) {
      restoredRef.current = true;
      requestAnimationFrame(() => scrollToId(target));
    }
  }, [isLoading, scrollToId]);

  // Scroll-spy: mark active chip while scrolling
  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = SECTIONS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          const id = visible[0].target.id;
          setActiveId(id);
          try {
            const newUrl = `${window.location.pathname}${window.location.search}#${id}`;
            window.history.replaceState(null, "", newUrl);
            sessionStorage.setItem(STORAGE_KEY, id);
          } catch {}
        }
      },
      { rootMargin: `-${headerOffset}px 0px -55% 0px`, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data, headerOffset]);

  // Global keyboard shortcuts: Alt+Left/Right to move between sections
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      const idx = Math.max(0, SECTIONS.findIndex((s) => s.id === activeId));
      const next =
        e.key === "ArrowRight"
          ? Math.min(SECTIONS.length - 1, idx + 1)
          : Math.max(0, idx - 1);
      handleSelect(SECTIONS[next].id, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, handleSelect]);

  const activeLabel = SECTIONS.find((s) => s.id === activeId)?.label;

  return (
    <div
      className="space-y-6"
      style={{ ["--sec-offset" as never]: `${headerOffset}px` }}
    >
      <nav
        aria-label="Trilha"
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap"
      >
        <Link
          to="/dashboard"
          className="rounded hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background px-1"
        >
          Início
        </Link>
        <span className="opacity-50" aria-hidden="true">›</span>
        <Link
          to="/clube"
          className="rounded hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background px-1"
        >
          Clube
        </Link>
        <span className="opacity-50" aria-hidden="true">›</span>
        {activeLabel ? (
          <>
            <Link
              to="/dashboards/consumidor"
              className="rounded hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background px-1"
            >
              Minha área
            </Link>
            <span className="opacity-50" aria-hidden="true">›</span>
            <span className="text-foreground font-medium px-1" aria-current="page">
              {activeLabel}
            </span>
          </>
        ) : (
          <span className="text-foreground font-medium px-1" aria-current="page">
            Minha área
          </span>
        )}
      </nav>

      <PageHeader
        title="Minha área"
        description="Tudo o que você curte, consome e economiza num só lugar."
      />

      <SectionNav
        ref={navRef}
        activeId={activeId}
        onSelect={handleSelect}
        reducedMotion={reducedMotion}
      />

      {/* Live region announces active section to assistive tech */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {activeLabel ? `Seção ativa: ${activeLabel}` : ""}
      </div>








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
              anchor="favoritos"
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
              anchor="historico"
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
              anchor="cupons"
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
              anchor="vouchers"
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
              anchor="reservas"
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
              anchor="avaliacoes"
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
              anchor="comprovantes"
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
              anchor="notas"
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
              anchor="creditos"
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
      <Card id={id} className={`p-4 relative overflow-hidden scroll-mt-[var(--sec-offset,6rem)] ${className ?? ""}`}>
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
    <Card id={id} className={`p-4 scroll-mt-[var(--sec-offset,6rem)] ${className ?? ""}`}>
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

type SectionNavProps = {
  activeId: string;
  onSelect: (id: string, scroll?: boolean) => void;
  reducedMotion?: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

function SectionNav({ activeId, onSelect, reducedMotion = false, ref }: SectionNavProps) {
  const chipsRef = useRef<HTMLDivElement>(null);

  // Keep active chip visible when it changes
  useEffect(() => {
    if (!activeId || !chipsRef.current) return;
    const chip = chipsRef.current.querySelector<HTMLElement>(`[data-chip="${activeId}"]`);
    if (chip)
      chip.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
  }, [activeId, reducedMotion]);

  const focusChip = (id: string) => {
    chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${id}"]`)?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLAnchorElement>, idx: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = SECTIONS[(idx + 1) % SECTIONS.length];
      focusChip(next.id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = SECTIONS[(idx - 1 + SECTIONS.length) % SECTIONS.length];
      focusChip(prev.id);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusChip(SECTIONS[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      focusChip(SECTIONS[SECTIONS.length - 1].id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(SECTIONS[idx].id, true);
    }
  };

  const currentIdx = Math.max(0, SECTIONS.findIndex((s) => s.id === activeId));
  const prevSec = currentIdx > 0 ? SECTIONS[currentIdx - 1] : null;
  const nextSec = currentIdx < SECTIONS.length - 1 ? SECTIONS[currentIdx + 1] : null;
  const goPrev = () => prevSec && onSelect(prevSec.id, true);
  const goNext = () => nextSec && onSelect(nextSec.id, true);

  // Disable scroll-snap when user prefers reduced motion (snap can cause
  // sudden jumps that feel like motion). Keeps horizontal scrolling usable.
  const chipsClass = `flex gap-1.5 overflow-x-auto scrollbar-none px-1 flex-1 ${
    reducedMotion ? "" : "snap-x snap-mandatory"
  }`;

  return (
    <div
      ref={ref}
      className="sticky top-0 z-10 py-2 bg-background/85 backdrop-blur border-b border-border/60"
    >
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            prevSec ? `Seção anterior: ${prevSec.label}` : "Seção anterior"
          }
          aria-keyshortcuts="Alt+ArrowLeft"
          onClick={goPrev}
          disabled={!prevSec}
          className="md:hidden h-8 w-8 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div
          ref={chipsRef}
          role="tablist"
          aria-label="Seções da Minha área"
          aria-orientation="horizontal"
          aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
          className={chipsClass}
        >
          {SECTIONS.map((s, idx) => {
            const active = s.id === activeId;
            return (
              <a
                key={s.id}
                data-chip={s.id}
                href={`#${s.id}`}
                role="tab"
                id={`tab-${s.id}`}
                aria-controls={s.id}
                aria-selected={active}
                aria-current={active ? "true" : undefined}
                aria-label={
                  active ? `${s.label} (seção atual)` : s.label
                }
                tabIndex={active || (!activeId && idx === 0) ? 0 : -1}
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(s.id, true);
                }}
                onKeyDown={(e) => handleKey(e, idx)}
                className={`shrink-0 ${
                  reducedMotion ? "" : "snap-start"
                } text-xs px-3 py-1.5 rounded-full border transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/60 bg-card hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {s.label}
              </a>
            );
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            nextSec ? `Próxima seção: ${nextSec.label}` : "Próxima seção"
          }
          aria-keyshortcuts="Alt+ArrowRight"
          onClick={goNext}
          disabled={!nextSec}
          className="md:hidden h-8 w-8 shrink-0"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />

        </Button>
      </div>
    </div>
  );
}

