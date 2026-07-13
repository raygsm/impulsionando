import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  getPlanBySlug,
  getMercadoPagoConfig,
  createPixPayment,
  createCardPayment,
  getPaymentStatus,
} from "@/lib/mercadopago.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2, Copy, CheckCircle2, AlertTriangle, ShieldCheck, Lock, TrendingUp,
  Headphones, Zap, ChevronDown, ArrowRight, Package, Info, CreditCard, QrCode,
  Receipt, PackagePlus, Brain, Palette, ArrowLeft, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useCheckoutCart, formatBRL, summarizeCart } from "@/hooks/useCheckoutCart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout/$slug")({
  component: CheckoutPlanPage,
  head: ({ params }) => ({
    meta: [
      { title: `Checkout ${params.slug} — Impulsionando` },
      { name: "description", content: "Finalize seu plano com Pix, cartão ou boleto, sem sair da plataforma. Ambiente 100% seguro." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

declare global { interface Window { MercadoPago: any } }

let mercadoPagoSdkPromise: Promise<void> | null = null;

function loadMercadoPagoSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  if (mercadoPagoSdkPromise) return mercadoPagoSdkPromise;

  mercadoPagoSdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.mercadopago.com/js/v2"]');
    const script = existing ?? document.createElement("script");

    const timeout = window.setTimeout(() => {
      mercadoPagoSdkPromise = null;
      reject(new Error("Não foi possível carregar o SDK do Mercado Pago. Recarregue a página e tente novamente."));
    }, 12000);

    const finish = () => {
      window.clearTimeout(timeout);
      if (window.MercadoPago) resolve();
      else {
        mercadoPagoSdkPromise = null;
        reject(new Error("SDK do Mercado Pago carregou sem inicializar."));
      }
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => {
      window.clearTimeout(timeout);
      mercadoPagoSdkPromise = null;
      reject(new Error("Falha ao carregar o SDK do Mercado Pago."));
    }, { once: true });

    if (!existing) {
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      document.head.appendChild(script);
    }

    if (existing) {
      const startedAt = Date.now();
      const poll = window.setInterval(() => {
        if (window.MercadoPago) {
          window.clearInterval(poll);
          finish();
        } else if (Date.now() - startedAt > 12000) {
          window.clearInterval(poll);
        }
      }, 150);
    }
  });

  return mercadoPagoSdkPromise;
}

/** Etapas do checkout premium. */
const STEPS = [
  { id: "plano", label: "Plano" },
  { id: "dados", label: "Dados" },
  { id: "pagamento", label: "Pagamento" },
  { id: "revisao", label: "Revisão" },
  { id: "confirmacao", label: "Confirmação" },
] as const;

/** Módulos complementares disponíveis (mesmo catálogo da /planos, Onda 1.3). */
const ORDER_BUMPS = [
  { id: "impulsionito-adv", title: "Impulsionito Avançado", desc: "IA de atendimento com base de conhecimento personalizada.", icon: Brain, priceLabel: "R$ 197/mês", priceCents: 19700 },
  { id: "n8n", title: "Automação n8n dedicada", desc: "Fluxos entre ERP, contábil e marketplaces.", icon: Zap, priceLabel: "R$ 297/mês", priceCents: 29700 },
  { id: "modulo-extra", title: "Módulo extra", desc: "Adicione qualquer módulo além da quota do plano.", icon: PackagePlus, priceLabel: "R$ 497/mês", priceCents: 49700 },
  { id: "wl-parcial", title: "White Label parcial", desc: "Sua marca em domínio, e-mails e área do cliente.", icon: Palette, priceLabel: "Sob consulta", priceCents: 0 },
];

function useMpSdk(publicKey: string | null) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!publicKey) return;
    if (typeof window === "undefined") return;
    let alive = true;
    loadMercadoPagoSdk()
      .then(() => { if (alive) setReady(true); })
      .catch((error) => {
        if (!alive) return;
        setReady(false);
        toast.error(error?.message ?? "Falha ao carregar Mercado Pago.");
      });
    return () => { alive = false; };
  }, [publicKey]);
  return ready;
}

function CheckoutPlanPage() {
  const { slug } = useParams({ from: "/checkout/$slug" });
  const getPlan = useServerFn(getPlanBySlug);
  const getCfg = useServerFn(getMercadoPagoConfig);
  const createPix = useServerFn(createPixPayment);
  const createCard = useServerFn(createCardPayment);
  const getStatus = useServerFn(getPaymentStatus);

  const { cart } = useCheckoutCart();

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["plan", slug], queryFn: () => getPlan({ data: { slug } }),
  });
  const { data: cfg } = useQuery({
    queryKey: ["mp-config"], queryFn: () => getCfg(),
  });
  const mpReady = useMpSdk(cfg?.public_key ?? null);

  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => setSession(data.user))
      .finally(() => setSessionLoading(false));
  }, []);

  /** Passo atual — orienta o indicador de progresso.
   *  Sem plano → 1, sem sessão → 2, com sessão → 3 (pagamento). */
  const currentStep: number = useMemo(() => {
    if (!plan) return 1;
    if (!session) return 2;
    return 3;
  }, [plan, session]);

  /** Order bumps selecionados (apenas UI — integração real fica para o Codex). */
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set());
  const toggleBump = (id: string) =>
    setSelectedBumps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // Loading state — plano ainda carregando
  if (planLoading) {
    return <CheckoutSkeleton />;
  }

  // Estado vazio — plano não encontrado (ex.: slug inválido)
  if (!plan) {
    return <EmptyPlanState />;
  }

  // Pagamento não configurado (backend)
  if (!cfg?.configured) {
    return (
      <CheckoutShell currentStep={currentStep} planName={plan.name}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Pagamento indisponível
            </CardTitle>
            <CardDescription>
              Nosso gateway ainda está sendo ativado. Entre em contato para finalizar sua contratação por Pix manual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/orcamento" search={{ plano: plan.name, origem: "checkout" } as never}>
                Falar com um consultor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </CheckoutShell>
    );
  }

  // Sessão carregando
  if (sessionLoading) {
    return <CheckoutSkeleton />;
  }

  // Não autenticado — pede login preservando destino
  if (!session) {
    return (
      <CheckoutShell currentStep={2} planName={plan.name}>
        <Card>
          <CardHeader>
            <CardTitle>Entre para continuar</CardTitle>
            <CardDescription>
              Para assinar o plano <b>{plan.name}</b>, faça login ou crie sua conta em segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Button asChild size="lg" className="min-h-11">
              <Link to="/auth">Fazer login <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11">
              <Link to="/planos">Voltar aos planos</Link>
            </Button>
          </CardContent>
        </Card>
      </CheckoutShell>
    );
  }

  // Checkout normal
  return (
    <CheckoutShell
      currentStep={currentStep}
      planName={plan.name}
      summary={
        <OrderSummary
          plan={plan}
          cart={cart}
          selectedBumps={selectedBumps}
        />
      }
    >
      <div className="space-y-6">
        {/* Complementos — pré-seleção visual (NÃO ENTRA na cobrança de agora) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-primary" />
              Interesse em complementos (opcional)
            </CardTitle>
            <CardDescription>
              Marque os módulos que você quer avaliar depois. Nesta etapa <strong>eles não são cobrados</strong> —
              nosso time entra em contato para incluir no seu plano quando você quiser.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-2">
            {ORDER_BUMPS.map((b) => {
              const active = selectedBumps.has(b.id);
              const BIcon = b.icon;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBump(b.id)}
                  aria-pressed={active}
                  className={cn(
                    "text-left p-3 rounded-lg border transition-all flex gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-9 h-9 rounded-md flex items-center justify-center transition-colors",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
                    )}
                    aria-hidden="true"
                  >
                    <BIcon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{b.title}</span>
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider shrink-0",
                          active ? "text-primary font-semibold" : "text-muted-foreground",
                        )}
                      >
                        {active ? "Marcado" : "Solicitar inclusão"}
                      </span>
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                      {b.desc}
                    </span>
                    <span className="block text-[11px] mt-1 text-muted-foreground">
                      Referência: <span className="font-medium text-foreground">{b.priceLabel}</span>
                      <span className="text-muted-foreground/70"> · cobrado só após inclusão</span>
                    </span>
                  </span>

                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4 text-primary" />
              Pagamento — {plan.name}
            </CardTitle>
            <CardDescription className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Ambiente {cfg.environment === "production" ? "produção" : "sandbox"} · dados criptografados · 100% dentro da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pix" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="pix" className="gap-1.5">
                  <QrCode className="w-3.5 h-3.5" /> Pix
                </TabsTrigger>
                <TabsTrigger value="card" className="gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Cartão
                </TabsTrigger>
                <TabsTrigger value="boleto" className="gap-1.5">
                  <Receipt className="w-3.5 h-3.5" /> Boleto
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pix" className="mt-4">
                <PixForm planId={plan.id} userEmail={session.email} createPix={createPix} getStatus={getStatus} />
              </TabsContent>
              <TabsContent value="card" className="mt-4">
                <CardForm
                  planId={plan.id}
                  publicKey={cfg.public_key!}
                  mpReady={mpReady}
                  userEmail={session.email}
                  createCard={createCard}
                />
              </TabsContent>
              <TabsContent value="boleto" className="mt-4">
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center space-y-2">
                  <Receipt className="w-8 h-8 mx-auto text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">Boleto será habilitado em breve</p>
                  <p className="text-xs text-muted-foreground">
                    Enquanto isso, use Pix (aprovação em segundos) ou cartão de crédito.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Trust bar */}
        <TrustBar />

        {/* Objeções */}
        <ObjectionsFaq />

        {/* Voltar / suporte */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground pt-2">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/planos"><ArrowLeft className="w-3.5 h-3.5" /> Voltar aos planos</Link>
          </Button>
          <span className="inline-flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" />
            Precisa de ajuda? <Link to="/orcamento" search={{ origem: "checkout:ajuda" } as never} className="text-primary hover:underline font-medium">Fale com um consultor</Link>
          </span>
        </div>
      </div>
    </CheckoutShell>
  );
}

/* ---------------- Shell ---------------- */

function CheckoutShell({
  currentStep,
  planName,
  summary,
  children,
}: {
  currentStep: number;
  planName?: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-muted/20">
      {/* Top bar */}
      <header className="bg-background border-b border-border sticky top-0 z-30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold text-sm sm:text-base tracking-tight text-primary" aria-label="Impulsionando — início">
            Impulsionando
          </Link>
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-primary" />
            Checkout seguro · SSL
          </div>
        </div>
        <ProgressBar currentStep={currentStep} />
      </header>

      <main
        className="max-w-6xl mx-auto px-4 py-6 sm:py-10 grid gap-6 lg:grid-cols-[1fr_360px]"
        aria-label={planName ? `Finalizar contratação do plano ${planName}` : "Finalizar contratação"}
      >
        <div>{children}</div>

        {/* Resumo — desktop fixo, mobile colapsável */}
        {summary && (
          <>
            <aside className="hidden lg:block">
              <div className="sticky top-[92px] space-y-4">
                {summary}
              </div>
            </aside>
            <MobileSummary>{summary}</MobileSummary>
          </>
        )}
      </main>
    </div>
  );
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-3 sm:pb-4">
      <ol className="flex items-center gap-1 sm:gap-2" aria-label="Etapas do checkout">
        {STEPS.map((s, idx) => {
          const stepNum = idx + 1;
          const done = stepNum < currentStep;
          const active = stepNum === currentStep;
          return (
            <li key={s.id} className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
              <span
                className={cn(
                  "shrink-0 w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-semibold border",
                  done && "bg-primary text-primary-foreground border-primary",
                  active && "bg-primary/10 text-primary border-primary",
                  !done && !active && "bg-muted text-muted-foreground border-border",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNum}
              </span>
              <span
                className={cn(
                  "text-[11px] sm:text-xs truncate",
                  active ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <span className="hidden sm:block flex-1 h-px bg-border ml-1" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MobileSummary({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden -mx-4 sticky bottom-0 z-20 bg-background border-t border-border shadow-lg">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-11"
            aria-label={open ? "Ocultar resumo do pedido" : "Ver resumo do pedido"}
          >
            <span className="inline-flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Resumo do pedido
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/* ---------------- Resumo ---------------- */

function OrderSummary({
  plan,
  cart,
  selectedBumps,
}: {
  plan: any;
  cart: ReturnType<typeof useCheckoutCart>["cart"];
  selectedBumps: Set<string>;
}) {
  const usingCart = cart && cart.planName;

  // Complementos são apenas INTERESSE — não somam ao total cobrado agora.
  const interestedBumps = ORDER_BUMPS.filter((b) => selectedBumps.has(b.id));


  // Fallback: se não há cart, usar o preço direto do plano do backend.
  const summaryPreview = usingCart
    ? summarizeCart(cart!)
    : {
        cycleMonths: 1,
        recurringMonthlyCents: plan.price_cents,
        firstChargeCents: plan.price_cents,
        cycleTotalCents: plan.price_cents,
      };

  const displayedName = usingCart ? cart!.planName : plan.name;
  const billingLabel = usingCart
    ? (cart!.billing === "annual" ? "Cobrança anual (2 meses grátis)" : "Cobrança mensal")
    : plan.interval === "yearly" ? "Cobrança anual" : "Cobrança mensal";

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wider text-muted-foreground font-medium">
          <Package className="w-4 h-4 text-primary" /> Resumo do pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Plano */}
        <div className="rounded-lg border border-border p-3 bg-muted/30">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold flex items-center gap-1.5">
                {displayedName}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Plano</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{billingLabel}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-sm">
                {brl(usingCart ? cart!.monthlyCents : plan.price_cents)}
              </div>
              <div className="text-[10px] text-muted-foreground">/mês</div>
            </div>
          </div>

          {/* Módulos incluídos */}
          {usingCart && cart!.modulesIncluded.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Módulos inclusos ({cart!.modulesIncluded.length})
              </div>
              <ul className="space-y-0.5">
                {cart!.modulesIncluded.map((m) => (
                  <li key={m} className="text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
                    <span className="truncate">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Módulos extras */}
          {usingCart && cart!.modulesExtra.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Módulos extras ({cart!.modulesExtra.length})
              </div>
              <ul className="space-y-0.5">
                {cart!.modulesExtra.map((m) => (
                  <li key={m} className="text-xs flex items-center justify-between gap-1.5">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <PackagePlus className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
                      <span className="truncate">{m}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0">R$ 497</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Complementos — interesse (não cobrados nesta contratação) */}
        {interestedBumps.length > 0 && (
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/[0.03] p-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="text-[10px] uppercase tracking-wider text-primary font-medium">
                Interesse em incluir ({interestedBumps.length})
              </div>
              <span className="text-[10px] text-muted-foreground">Não cobrado agora</span>
            </div>
            <ul className="space-y-1">
              {interestedBumps.map((b) => (
                <li key={b.id} className="text-xs flex items-center justify-between gap-2">
                  <span className="truncate">{b.title}</span>
                  <span className="text-muted-foreground shrink-0">Ref.: {b.priceLabel}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
              Nosso time entra em contato para incluir estes módulos quando você quiser.
              Cobrança começa apenas após a ativação, com upgrade proporcional.
            </p>
          </div>
        )}

        {/* Totais — apenas o que ENTRA na cobrança do Mercado Pago */}
        <div className="space-y-1.5 pt-1">
          {usingCart && cart!.setupCents > 0 && (
            <Row label="Setup (1ª cobrança)" value={brl(cart!.setupCents)} />
          )}
          <Row
            label={usingCart ? "Mensalidade recorrente" : "Total"}
            value={brl(summaryPreview.recurringMonthlyCents)}
          />
          {usingCart && cart!.billing === "annual" && (
            <Row
              label="Economia anual"
              value={`− ${brl(cart!.monthlyCents * 2)}`}
              highlight
            />
          )}
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-end justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {usingCart && cart!.billing === "annual" ? "Total do 1º ciclo (anual)" : "Cobrança agora"}
            </span>
            <span className="text-lg font-bold text-primary">
              {brl(summaryPreview.firstChargeCents)}
            </span>
          </div>
          {usingCart && cart!.billing !== "annual" && (
            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
              Ciclo inicial obrigatório de {summaryPreview.cycleMonths} meses.
              Depois: <b>{brl(summaryPreview.recurringMonthlyCents)}/mês</b> sem fidelidade.
            </p>
          )}
          {interestedBumps.length > 0 && (
            <p className="text-[10px] text-primary mt-1 leading-snug inline-flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
              Os complementos marcados <strong>não entram nesta cobrança</strong> —
              eles são registrados como interesse para inclusão posterior.
            </p>
          )}
        </div>


        <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
          <ShieldCheck className="w-3 h-3 text-primary" aria-hidden="true" />
          Nota fiscal emitida a cada cobrança
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", highlight && "text-primary")}>{value}</span>
    </div>
  );
}

/* ---------------- Trust bar / objections / empty / skeleton ---------------- */

function TrustBar() {
  const items = [
    { icon: ShieldCheck, label: "Contratação 100% online" },
    { icon: Lock, label: "Ambiente seguro (SSL)" },
    { icon: ShieldCheck, label: "Conforme LGPD" },
    { icon: Headphones, label: "Suporte especializado" },
    { icon: Zap, label: "Atualizações contínuas" },
    { icon: TrendingUp, label: "Upgrade a qualquer momento" },
  ];
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" /> Por que contratar com segurança
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((it) => {
          const IIcon = it.icon;
          return (
            <li key={it.label} className="flex items-center gap-1.5 text-xs">
              <IIcon className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="text-foreground">{it.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ObjectionsFaq() {
  const items = [
    { q: "Posso trocar de plano depois?", a: "Sim. Você pode fazer upgrade a qualquer momento sem perder dados, histórico ou automações. Ajustes de valor são proporcionais." },
    { q: "Meus dados ficam seguros?", a: "Ambiente com SSL, backups automáticos, logs de auditoria e conformidade LGPD. Você pode exportar seus dados a qualquer momento." },
    { q: "Receberei suporte?", a: "Sim — e-mail no Essencial, prioritário no Ideal e técnico dedicado no Full. Nosso time responde em horário comercial (SLA no contrato)." },
    { q: "Como funciona a ativação?", a: "Após aprovado o pagamento, seu ambiente é liberado automaticamente. Você recebe os acessos por e-mail e o onboarding começa em minutos." },
  ];
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" /> Antes de finalizar
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Dúvidas rápidas para você contratar sem receio.</p>
      </div>
      <Accordion type="single" collapsible className="px-4">
        {items.map((it, i) => (
          <AccordionItem key={i} value={`obj-${i}`} className="border-b-0 last:border-0">
            <AccordionTrigger className="text-sm text-left py-3 hover:no-underline">
              {it.q}
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
              {it.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function EmptyPlanState() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-2">
            <Package className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
          </div>
          <CardTitle>Nenhum plano selecionado</CardTitle>
          <CardDescription className="mt-1">
            Você chegou aqui sem escolher um plano. Volte aos nossos planos e selecione o que mais combina com sua operação.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild size="lg" className="min-h-11">
            <Link to="/planos">Ver planos disponíveis <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-11">
            <Link to="/orcamento" search={{ origem: "checkout:empty" } as never}>
              Falar com um consultor
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-dvh bg-muted/20 flex items-center justify-center p-12">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Preparando checkout seguro…</p>
      </div>
    </div>
  );
}

/* ---------------- Payment forms (lógica preservada) ---------------- */

function PixForm({ planId, userEmail, createPix, getStatus }: any) {
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState("");
  const [pix, setPix] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pix?.id) return;
    const t = setInterval(async () => {
      try {
        const r = await getStatus({ data: { payment_id: String(pix.id) } });
        if (r?.status) setStatus(r.status);
        if (r?.status === "approved") clearInterval(t);
      } catch {}
    }, 4000);
    return () => clearInterval(t);
  }, [pix?.id]);

  async function pay() {
    setLoading(true);
    try {
      const res = await createPix({
        data: {
          plan_id: planId,
          payer: {
            email: userEmail,
            identification: doc ? { type: "CPF", number: doc.replace(/\D/g, "") } : undefined,
          },
        },
      });
      setPix(res);
      setStatus(res.status);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar Pix.");
    } finally { setLoading(false); }
  }

  if (status === "approved") {
    return (
      <div className="text-center space-y-2 py-8 rounded-lg bg-primary/5 border border-primary/20">
        <CheckCircle2 className="w-12 h-12 mx-auto text-primary" aria-hidden="true" />
        <p className="font-semibold text-base">Pagamento aprovado!</p>
        <p className="text-sm text-muted-foreground">Seu plano será liberado em instantes. Você receberá os acessos por e-mail.</p>
      </div>
    );
  }
  if (pix) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            Aguardando confirmação{status && status !== "pending" ? ` · ${status}` : "…"}
          </div>
        </div>
        {pix.qr_code_base64 && (
          <div className="flex justify-center">
            <img
              src={`data:image/png;base64,${pix.qr_code_base64}`}
              alt="QR Code Pix para pagamento"
              className="w-56 h-56 border-2 border-border rounded-lg p-2 bg-background"
            />
          </div>
        )}
        {pix.qr_code && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">Pix copia e cola</Label>
            <div className="flex gap-2">
              <Input readOnly value={pix.qr_code} className="text-xs font-mono" aria-label="Código Pix copia e cola" />
              <Button
                variant="outline"
                size="icon"
                className="min-h-11 min-w-11 shrink-0"
                aria-label="Copiar código Pix"
                onClick={() => {
                  navigator.clipboard.writeText(pix.qr_code);
                  setCopied(true);
                  toast.success("Código Pix copiado!");
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
        {pix.expires_at && (
          <p className="text-xs text-muted-foreground text-center">
            Código expira em {new Date(pix.expires_at).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pix-doc">CPF (opcional)</Label>
        <Input
          id="pix-doc"
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="off"
        />
        <p className="text-[11px] text-muted-foreground">Informar o CPF acelera a confirmação bancária.</p>
      </div>
      <Button
        onClick={pay}
        disabled={loading}
        size="lg"
        className="w-full min-h-12 text-base font-semibold"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando código Pix…</>
        ) : (
          <>Gerar Pix e finalizar <ArrowRight className="w-4 h-4 ml-1" /></>
        )}
      </Button>
      <p className="text-[11px] text-center text-muted-foreground inline-flex items-center gap-1 w-full justify-center">
        <Lock className="w-3 h-3" /> Pagamento processado com segurança pelo Mercado Pago
      </p>
    </div>
  );
}

function CardForm({ planId, publicKey, mpReady, userEmail, createCard }: any) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ status: string; detail?: string } | null>(null);
  const [form, setForm] = useState({
    cardNumber: "", cardholderName: "",
    expMonth: "", expYear: "", cvv: "",
    docType: "CPF", docNumber: "",
    installments: 1,
  });

  async function pay() {
    setLoading(true);
    try {
      if (!mpReady || !window.MercadoPago) {
        await loadMercadoPagoSdk();
      }
      const mp = new window.MercadoPago(publicKey);
      const cardToken = await mp.createCardToken({
        cardNumber: form.cardNumber.replace(/\s+/g, ""),
        cardholderName: form.cardholderName,
        cardExpirationMonth: form.expMonth,
        cardExpirationYear: form.expYear,
        securityCode: form.cvv,
        identificationType: form.docType,
        identificationNumber: form.docNumber.replace(/\D/g, ""),
      });

      const bin = form.cardNumber.replace(/\s+/g, "").slice(0, 6);
      const methods = await mp.getPaymentMethods({ bin });
      const pm = methods?.results?.[0];
      if (!pm) throw new Error("Bandeira de cartão não reconhecida.");

      const res = await createCard({
        data: {
          plan_id: planId,
          token: cardToken.id,
          installments: Number(form.installments),
          payment_method_id: pm.id,
          payer: {
            email: userEmail,
            identification: { type: form.docType, number: form.docNumber.replace(/\D/g, "") },
          },
        },
      });
      setDone({ status: res.status, detail: res.status_detail });
    } catch (e: any) {
      toast.error(e?.message ?? "Pagamento recusado.");
    } finally { setLoading(false); }
  }

  if (done?.status === "approved") {
    return (
      <div className="text-center space-y-2 py-8 rounded-lg bg-primary/5 border border-primary/20">
        <CheckCircle2 className="w-12 h-12 mx-auto text-primary" aria-hidden="true" />
        <p className="font-semibold text-base">Pagamento aprovado!</p>
        <p className="text-sm text-muted-foreground">Seu plano foi liberado. Você receberá os acessos por e-mail em instantes.</p>
      </div>
    );
  }
  if (done) {
    return (
      <div className="text-center space-y-3 py-6 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-600" aria-hidden="true" />
        <p className="font-medium">{done.status === "in_process" ? "Pagamento em análise" : "Pagamento não aprovado"}</p>
        {done.detail && <p className="text-xs text-muted-foreground max-w-xs mx-auto">{done.detail}</p>}
        <Button variant="outline" onClick={() => setDone(null)} className="min-h-11">Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="cc-number">Número do cartão</Label>
        <Input
          id="cc-number"
          value={form.cardNumber}
          onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          autoComplete="cc-number"
        />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="cc-name">Nome no cartão</Label>
        <Input
          id="cc-name"
          value={form.cardholderName}
          onChange={(e) => setForm({ ...form, cardholderName: e.target.value })}
          placeholder="Como impresso no cartão"
          autoComplete="cc-name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-mm">Mês</Label>
        <Input id="cc-mm" value={form.expMonth} onChange={(e) => setForm({ ...form, expMonth: e.target.value })} placeholder="MM" inputMode="numeric" autoComplete="cc-exp-month" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-yy">Ano</Label>
        <Input id="cc-yy" value={form.expYear} onChange={(e) => setForm({ ...form, expYear: e.target.value })} placeholder="AAAA" inputMode="numeric" autoComplete="cc-exp-year" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-cvv">CVV</Label>
        <Input id="cc-cvv" value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} placeholder="000" inputMode="numeric" autoComplete="cc-csc" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-inst">Parcelas</Label>
        <Input id="cc-inst" type="number" min={1} max={12} value={form.installments} onChange={(e) => setForm({ ...form, installments: Number(e.target.value) })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-doctype">Tipo doc.</Label>
        <Select value={form.docType} onValueChange={(v) => setForm({ ...form, docType: v })}>
          <SelectTrigger id="cc-doctype" aria-label="Tipo de documento">
            <SelectValue placeholder="CPF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CPF">CPF</SelectItem>
            <SelectItem value="CNPJ">CNPJ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-doc">Documento ({form.docType})</Label>
        <Input
          id="cc-doc"
          value={form.docNumber}
          onChange={(e) => setForm({ ...form, docNumber: e.target.value.replace(/\D/g, "").slice(0, form.docType === "CPF" ? 11 : 14) })}
          placeholder={form.docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <div className="col-span-2 space-y-2 mt-2">
        <Button
          onClick={pay}
          disabled={loading}
          size="lg"
          className="w-full min-h-12 text-base font-semibold"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando pagamento…</>
          ) : (
            <>Pagar agora <ArrowRight className="w-4 h-4 ml-1" /></>
          )}
        </Button>
        <p className="text-[11px] text-center text-muted-foreground inline-flex items-center gap-1 w-full justify-center">
          <Lock className="w-3 h-3" /> Dados do cartão criptografados pelo Mercado Pago — nunca trafegam pelos nossos servidores
        </p>
      </div>
    </div>
  );
}
