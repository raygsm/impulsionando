import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, MessageCircle, Sparkles, CheckCircle2, Minus, HelpCircle, Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { PixFallbackDialog } from "@/components/payments/PixFallbackDialog";
import { ModulePicker } from "@/components/marketing/ModulePicker";
import { ContractingSummaryDialog } from "@/components/marketing/ContractingSummaryDialog";

const PLAN_QUOTA: Record<string, number> = {
  Essencial: 1,
  Integrado: 2,
  Avançado: 3,
};

/** Setup de implantação (1ª parcela) em reais — usado no resumo de contratação. */
const PLAN_SETUP_BRL: Record<string, number> = {
  Essencial: 297,
  Integrado: 497,
  Avançado: 997,
};

/** Preço por módulo adicional além da quota do plano. */
const EXTRA_MODULE_BRL = 497;

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20entender%20melhor%20os%20planos%20da%20Impulsionando.";

export const Route = createFileRoute("/planos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Planos e Preços — Essencial, Integrado, Avançado e Sob Medida | Impulsionando Tecnologia" },
      { name: "description", content: "Planos flexíveis a partir de R$ 297/mês. Essencial (1 módulo), Integrado (2), Avançado (3+) e Sob Medida. Mensal ou anual com 2 meses grátis." },
      { property: "og:title", content: "Planos — Impulsionando Tecnologia" },
      { property: "og:description", content: "Do Essencial ao Sob Medida. Anual com 2 meses grátis. Sem fidelidade obrigatória." },
      { property: "og:url", content: "https://sistemas.impulsionando.com.br/planos" },
    ],
    links: [{ rel: "canonical", href: "https://sistemas.impulsionando.com.br/planos" }],
  }),
  component: PlanosPage,
});

type Plan = {
  name: string;
  tagline: string;
  monthly: number | null; // null = sob consulta
  modulesLabel: string;
  features: string[];
  highlight?: boolean;
  cta: string;
};

const PLANS: Plan[] = [
  {
    name: "Essencial",
    tagline: "Comece pelo módulo principal que mais dói.",
    monthly: 697,
    modulesLabel: "1 módulo principal ativo",
    features: [
      "1 módulo principal ativo após conversão (CRM, Agenda, Eventos, Área do Cliente etc.)",
      "Até 3 usuários",
      "Suporte por e-mail e WhatsApp",
      "7 dias de Trial com tudo liberado",
    ],
    cta: "Começar Trial de 7 dias",
  },
  {
    name: "Integrado",
    tagline: "Dois módulos principais trabalhando juntos.",
    monthly: 997.9,
    modulesLabel: "2 módulos principais ativos",
    features: [
      "2 módulos principais integrados (ex.: CRM + Agenda, Commerce + Delivery)",
      "Até 5 usuários",
      "Maior prioridade no suporte",
      "Automações entre módulos",
    ],
    highlight: true,
    cta: "Começar Trial de 7 dias",
  },
  {
    name: "Avançado",
    tagline: "Operação digital de ponta a ponta.",
    monthly: 1497.97,
    modulesLabel: "3 módulos principais + BI",
    features: [
      "3 módulos principais ativos + BI & Dashboards (ex.: ERP + CRM + Agenda + BI)",
      "Até 10 usuários",
      "Suporte prioritário",
      "Acompanhamento técnico",
    ],
    cta: "Começar Trial de 7 dias",
  },
];


type Row = { feature: string; values: (boolean | string)[] };

const COMPARE: Row[] = [
  { feature: "Módulos principais incluídos", values: ["1", "2", "3 + BI"] },
  { feature: "Módulos adicionais", values: ["Sim", "Sim", "Sim"] },
  { feature: "Usuários", values: ["Até 3", "Até 5", "Até 10"] },
  { feature: "Unidades / filiais", values: ["1", "1", "Até 3"] },
  { feature: "Automações entre módulos", values: [false, true, true] },
  { feature: "BI & Dashboards consolidados", values: [false, false, true] },
  { feature: "API e webhooks", values: [false, true, true] },
  { feature: "Onboarding guiado", values: ["Self-service", "1h", "4h"] },
  { feature: "Suporte", values: ["E-mail/WhatsApp", "Prioritário", "Prioritário"] },
  { feature: "Contrato mínimo", values: ["90 dias", "90 dias", "90 dias"] },
];

const FAQ = [
  {
    q: "Posso trocar de plano depois?",
    a: "Sim, a qualquer momento. Pagamentos são proporcionais e o histórico do sistema é preservado.",
  },
  {
    q: "Tem fidelidade?",
    a: "Não há fidelidade obrigatória no mensal. No anual, oferecemos desconto equivalente a 2 meses grátis.",
  },
  {
    q: "Como funciona o desconto anual?",
    a: "Você paga 10 meses e usa 12. O desconto é aplicado direto no checkout.",
  },
  {
    q: "Quais formas de pagamento?",
    a: "Cartão de crédito, Pix recorrente, boleto (anual) e link de pagamento.",
  },
  {
    q: "Posso testar antes de contratar?",
    a: "Sim. Temos demo navegável em /demo, e oferecemos período de validação na implantação.",
  },
  {
    q: "O preço inclui implantação?",
    a: "No Essencial é self-service. Integrado e Avançado incluem onboarding guiado. Sob Medida tem implantação dedicada orçada à parte.",
  },
  {
    q: "Os módulos podem ser adicionados depois?",
    a: "Sim. Você pode evoluir do Essencial ao Avançado adicionando módulos quando precisar.",
  },
  {
    q: "Tem versão white label?",
    a: "Sim, disponível no plano Sob Medida — com sua marca, domínio e gestão master de clientes.",
  },
];

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  Essencial: { monthly: "essencial_monthly", annual: "essencial_annual" },
  Integrado: { monthly: "integrado_monthly", annual: "integrado_annual" },
  Avançado: { monthly: "avancado_monthly", annual: "avancado_annual" },
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PlanosPage() {
  const [annual, setAnnual] = useState(false);
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const { data: user } = useCurrentUser();
  const [pixState, setPixState] = useState<{
    open: boolean;
    amountCents: number;
    txid: string;
    label: string;
  }>({ open: false, amountCents: 0, txid: "", label: "" });
  const [picker, setPicker] = useState<{ open: boolean; plan: Plan | null }>({
    open: false,
    plan: null,
  });
  const [summary, setSummary] = useState<{ open: boolean; plan: Plan | null }>({
    open: false,
    plan: null,
  });
  const [pickedModules, setPickedModules] = useState<Record<string, string[]>>({});

  async function runCheckout(plan: Plan, modules: string[]) {
    try {
      await openCheckout({
        priceId: PRICE_IDS[plan.name][annual ? "annual" : "monthly"],
        customerEmail: user?.user?.email ?? undefined,
        customData: {
          ...(user?.user?.id ? { userId: user.user.id } : {}),
          plan: plan.name,
          modules: modules.join(","),
        },
      });
    } catch {
      const monthly = plan.monthly ?? 0;
      const finalValue = annual ? monthly * 10 : monthly;
      toast.message(
        "Instabilidade no checkout. Liberei o pagamento via Pix para você seguir agora.",
      );
      setPixState({
        open: true,
        amountCents: Math.round(finalValue * 100),
        txid: `PLANO-${plan.name.toUpperCase()}-${annual ? "ANUAL" : "MENSAL"}`,
        label: `Plano ${plan.name}${modules.length ? ` (${modules.length} mód.)` : ""} — ${annual ? "anual" : "mensal"}`,
      });
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PaymentTestModeBanner />
      <PublicHeader />



      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Planos transparentes
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Pague só pelo que usar.<br />Escale quando precisar.
          </h1>
          <p className="text-lg text-white/85 max-w-2xl mx-auto leading-relaxed mt-6">
            Quatro planos cobrem desde o autônomo até a operação multi-empresa.
            Sem letras miúdas, sem custo escondido.
          </p>
          {/* Toggle mensal/anual */}
          <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full bg-white/10 backdrop-blur">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm transition-colors",
                !annual ? "bg-white text-primary font-medium" : "text-white/80 hover:text-white"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm transition-colors inline-flex items-center gap-1.5",
                annual ? "bg-white text-primary font-medium" : "text-white/80 hover:text-white"
              )}
            >
              Anual
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">-17%</span>
            </button>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const monthlyEffective = plan.monthly !== null
              ? (annual ? Math.round(plan.monthly * 10 / 12) : plan.monthly)
              : null;
            return (
              <Card
                key={plan.name}
                className={cn(
                  "p-6 flex flex-col relative",
                  plan.highlight && "border-primary shadow-elegant ring-1 ring-primary/20"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-[11px] font-medium inline-flex items-center gap-1 shadow-elegant">
                    <Star className="w-3 h-3 fill-current" /> Mais escolhido
                  </div>
                )}
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{plan.modulesLabel}</div>
                <div className="text-xl font-semibold tracking-tight mt-1">{plan.name}</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{plan.tagline}</p>

                <div className="mt-5 min-h-[68px]">
                  {monthlyEffective !== null ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{formatBRL(monthlyEffective)}</span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      {annual && plan.monthly && (
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {formatBRL(plan.monthly * 10)} /ano · economize {formatBRL(plan.monthly * 2)}
                        </div>
                      )}
                      {!annual && (
                        <div className="text-[11px] text-muted-foreground mt-1">
                          ou {formatBRL(Math.round(plan.monthly! * 10 / 12))}/mês no anual
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold">Sob consulta</div>
                      <div className="text-[11px] text-muted-foreground mt-1">Conforme escopo e volume</div>
                    </>
                  )}
                </div>

                <ul className="mt-5 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.monthly !== null && PRICE_IDS[plan.name] ? (
                  <div className="mt-6 space-y-2">
                    <div className="rounded-md border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-2.5 text-[11px] leading-snug text-amber-900 dark:text-amber-100">
                      <strong>Contrato mínimo 90 dias.</strong> Setup{" "}
                      {formatBRL(PLAN_SETUP_BRL[plan.name] ?? 0)} (1ª parcela) + 3
                      mensalidades = <strong>4 pagamentos obrigatórios</strong> no
                      ciclo inicial. Módulos extras: {formatBRL(EXTRA_MODULE_BRL)}/mês.
                    </div>
                    {pickedModules[plan.name]?.length ? (
                      <div className="text-[11px] text-muted-foreground">
                        {pickedModules[plan.name].length} módulo(s) selecionado(s)
                      </div>
                    ) : null}
                    <Button
                      className={cn("w-full", plan.highlight && "bg-gradient-primary shadow-elegant")}
                      variant={plan.highlight ? "default" : "outline"}
                      disabled={checkoutLoading}
                      onClick={() => setPicker({ open: true, plan })}
                    >
                      {checkoutLoading
                        ? "Abrindo checkout..."
                        : `Escolher módulos e assinar ${annual ? "anual" : "mensal"}`}
                    </Button>

                    <Button asChild variant="ghost" size="sm" className="w-full text-xs">
                      <Link to="/trial/cadastro">ou começar Trial de 7 dias</Link>
                    </Button>
                  </div>
                ) : (
                  <Button
                    asChild
                    className={cn("mt-6 w-full", plan.highlight && "bg-gradient-primary shadow-elegant")}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    <Link to="/orcamento" search={{ plano: plan.name, origem: "planos" }}>{plan.cta}</Link>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Valores de referência. Tributos podem ser aplicados conforme nota fiscal. Validação no orçamento.
        </p>
      </section>

      {/* COMPARE TABLE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Comparativo completo</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Tudo o que está incluído em cada plano. Sem asterisco escondido.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium w-1/3">Recurso</th>
                {PLANS.map((p) => (
                  <th key={p.name} className="text-center px-4 py-3 font-semibold whitespace-nowrap">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, idx) => (
                <tr key={row.feature} className={cn("border-b border-border last:border-0", idx % 2 === 1 && "bg-muted/20")}>
                  <td className="px-4 py-3">{row.feature}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {typeof v === "boolean" ? (
                        v ? (
                          <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* GUARANTEES */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { t: "Sem fidelidade obrigatória", d: "Cancele quando quiser no mensal. Sem multa." },
              { t: "Dados seus, sempre", d: "Exportação completa a qualquer momento, LGPD em dia." },
              { t: "Pagamento simples", d: "Cartão, Pix ou boleto. Nota fiscal mensal." },
              { t: "Atualizações inclusas", d: "Novas funções e correções sem custo extra." },
            ].map((g) => (
              <div key={g.t} className="p-5 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <div className="font-semibold text-sm">{g.t}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{g.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <HelpCircle className="w-3.5 h-3.5" /> Dúvidas frequentes
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Antes de contratar</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="p-10 lg:p-14 bg-gradient-primary text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-3xl space-y-5">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Em dúvida sobre qual plano escolher?
            </h2>
            <p className="text-white/85 leading-relaxed">
              Faça o briefing de 1 minuto e receba a recomendação certa para sua operação — ou fale com um especialista.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <Link to="/orcamento" search={{ origem: "planos:cta" }}>Fazer briefing <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
      <PixFallbackDialog
        open={pixState.open}
        onOpenChange={(v) => setPixState((s) => ({ ...s, open: v }))}
        amountCents={pixState.amountCents}
        txid={pixState.txid}
        label={pixState.label}
      />
      {picker.plan && (
        <ModulePicker
          open={picker.open}
          onOpenChange={(o) => setPicker((s) => ({ ...s, open: o }))}
          quota={PLAN_QUOTA[picker.plan.name] ?? 1}
          planName={picker.plan.name}
          planSubtitle={picker.plan.tagline}
          initialSelected={pickedModules[picker.plan.name] ?? []}
          confirmLabel={`Assinar ${annual ? "anual" : "mensal"} e ir para o pagamento`}
          onConfirm={async (slugs) => {
            const plan = picker.plan!;
            setPickedModules((prev) => ({ ...prev, [plan.name]: slugs }));
            setPicker({ open: false, plan: null });
            await runCheckout(plan, slugs);
          }}
        />
      )}
    </div>
  );
}
