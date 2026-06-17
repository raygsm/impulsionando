import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCommercialAvailability } from "@/lib/commercial.functions";
import {
  ArrowRight, MessageCircle, Sparkles, CheckCircle2, Minus, HelpCircle, Star,
  Building2, Layers, UserRound, PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

/** Preço por módulo adicional além da quota do plano. */
const EXTRA_MODULE_BRL = 497;

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20entender%20melhor%20os%20planos%20da%20Impulsionando.";

export const Route = createFileRoute("/planos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Planos e Preços — Essencial, Integrado, Avançado e Sob Medida | Impulsionando Tecnologia" },
      { name: "description", content: "Planos atrelados ao salário mínimo: Essencial (½ SM), Integrado (1 SM), Avançado (2 SM) e Sob Medida. Mensal ou anual com 2 meses grátis." },
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

/**
 * Constrói a lista de planos a partir do salário mínimo vigente.
 *  - Essencial: ½ SM
 *  - Integrado: 1 SM
 *  - Avançado:  2 SM
 * Setup (1ª parcela) = mensalidade do plano.
 */
function buildPlans(wage: number): Plan[] {
  return [
    {
      name: "Essencial",
      tagline: "Comece pelo módulo que mais dói hoje — sem peso desnecessário.",
      monthly: wage / 2,
      modulesLabel: "1 módulo principal + base operacional",
      features: [
        "1 módulo principal à escolha: CRM, Agenda, EHR (prontuário), PDV, Vitrine Imobiliária, Área do Cliente ou Eventos",
        "Base inclusa: dashboard, cadastros, perfis e permissões, auditoria",
        "Financeiro essencial (contas a receber + fluxo de caixa)",
        "Até 3 usuários · 1 unidade",
        "Suporte por e-mail e WhatsApp",
        "7 dias de Trial com tudo liberado, sem cartão",
      ],
      cta: "Começar Trial de 7 dias",
    },
    {
      name: "Integrado",
      tagline: "Dois módulos que se potencializam, com automação entre eles.",
      monthly: wage,
      modulesLabel: "2 módulos principais integrados + automação",
      features: [
        "Pares curados de alta sinergia: CRM + Agenda, PDV + Estoque, Commerce + Delivery, Vitrine + CRM Imobiliário, EHR + Agenda Clínica",
        "Financeiro completo (contas a pagar/receber, conciliação, comissões)",
        "Automações cruzadas entre módulos (gatilhos e fluxos)",
        "Central de mensagens (WhatsApp + E-mail transacional)",
        "Até 5 usuários · 1 unidade · API e webhooks",
        "Suporte prioritário",
      ],
      highlight: true,
      cta: "Começar Trial de 7 dias",
    },
    {
      name: "Avançado",
      tagline: "Operação digital ponta a ponta, com BI e multi-unidades.",
      monthly: wage * 2,
      modulesLabel: "3 módulos principais + BI & Dashboards",
      features: [
        "3 módulos principais à escolha (ex.: ERP + CRM + Agenda, ou Commerce + PDV + Estoque)",
        "BI & Dashboards consolidados com indicadores por unidade",
        "Multi-unidades (até 3) e gestão por setores",
        "Automação avançada multi-módulo + jornadas de CRM",
        "Governança LGPD, exportações e logs de auditoria expandidos",
        "Até 10 usuários · API, webhooks e ambiente de homologação",
        "Suporte prioritário com acompanhamento técnico dedicado",
      ],
      cta: "Começar Trial de 7 dias",
    },
  ];
}



type Row = { feature: string; values: (boolean | string)[] };

const COMPARE: Row[] = [
  { feature: "Módulos principais incluídos", values: ["1", "2 (par curado)", "3 + BI"] },
  { feature: "Módulos adicionais", values: ["R$ 497/mês", "R$ 497/mês", "R$ 497/mês"] },
  { feature: "Usuários", values: ["Até 3", "Até 5", "Até 10"] },
  { feature: "Unidades / filiais", values: ["1", "1", "Até 3"] },
  { feature: "Financeiro", values: ["Essencial", "Completo", "Completo + DRE"] },
  { feature: "Central de mensagens (WhatsApp + E-mail)", values: [false, true, true] },
  { feature: "Automações entre módulos", values: [false, true, "Avançada"] },
  { feature: "BI & Dashboards consolidados", values: [false, false, true] },
  { feature: "API e webhooks", values: [false, true, true] },
  { feature: "Governança LGPD + auditoria expandida", values: [false, false, true] },
  { feature: "Onboarding guiado", values: ["Self-service", "1h", "4h"] },
  { feature: "Suporte", values: ["E-mail/WhatsApp", "Prioritário", "Prioritário + técnico"] },
  { feature: "Contrato mínimo", values: ["90 dias", "90 dias", "90 dias"] },
];

const FAQ = [
  {
    q: "Como funciona o Trial de 7 dias?",
    a: "Você libera o ambiente com TODOS os módulos do plano escolhido por 7 dias, sem cartão obrigatório no início. Ao converter, entra no ciclo regular: setup + 3 mensalidades (mensal) ou setup + anuidade (anual). O conteúdo criado no Trial é preservado.",
  },
  {
    q: "Quem é elegível ao Trial?",
    a: "Empresas com CNPJ ativo e e-mail corporativo. Cada CNPJ tem direito a 1 Trial. Whitelabel/Sob Medida não usam Trial — entram via POC dedicada.",
  },
  {
    q: "O que acontece no fim do Trial se eu não converter?",
    a: "O ambiente entra em modo somente-leitura por 15 dias para você exportar dados (LGPD). Sem cobrança automática se o cartão não foi cadastrado.",
  },
  {
    q: "Por que o mínimo é 90 dias no mensal?",
    a: "Os 90 dias cobrem o setup técnico, o onboarding e a curva de adoção. O ciclo cobrado é setup + 3 mensalidades (4 pagamentos no total). Depois disso, segue mês a mês sem fidelidade.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Sim, a qualquer momento. Pagamentos são proporcionais e o histórico do sistema é preservado.",
  },
  {
    q: "Tem fidelidade?",
    a: "Não há fidelidade obrigatória no mensal após os 90 dias iniciais. No anual, oferecemos desconto equivalente a 2 meses grátis (paga 10, usa 12).",
  },
  {
    q: "Como funciona o desconto anual?",
    a: "Você paga o equivalente a 10 meses e usa 12. O checkout cobra setup + anuidade (12× preço/mês com desconto aplicado). É um único contrato anual.",
  },
  {
    q: "Quais formas de pagamento?",
    a: "Cartão de crédito, Pix recorrente, boleto (anual) e link de pagamento. Se o checkout falhar, liberamos Pix manual com o valor exato do ciclo inicial.",
  },
  {
    q: "O preço inclui implantação?",
    a: "No Essencial é self-service com setup R$ 297. Integrado e Avançado incluem onboarding guiado com setup proporcional. Sob Medida tem implantação dedicada orçada à parte.",
  },
  {
    q: "Os módulos podem ser adicionados depois?",
    a: "Sim. Você pode evoluir do Essencial ao Avançado adicionando módulos quando precisar. Módulos extras custam R$ 497/mês cada.",
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

type Audience = "empresas" | "white-label" | "consumidor";

function PlanosPage() {
  const [audience, setAudience] = useState<Audience>("empresas");
  const [annual, setAnnual] = useState(false);
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const { data: user } = useCurrentUser();
  const fetchAvailability = useServerFn(getCommercialAvailability);
  const { data: availability } = useQuery({
    queryKey: ["commercial-availability"],
    queryFn: () => fetchAvailability(),
    staleTime: 60_000,
  });

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
    const quota = PLAN_QUOTA[plan.name] ?? 1;
    const included = modules.slice(0, quota);
    const extras = modules.slice(quota);
    const extrasMonthly = extras.length * EXTRA_MODULE_BRL;
    const baseMonthly = annual
      ? Math.round((plan.monthly ?? 0) * 10 / 12)
      : (plan.monthly ?? 0);
    const totalMonthly = baseMonthly + extrasMonthly;
    const setup = PLAN_SETUP_BRL[plan.name] ?? 0;

    try {
      await openCheckout({
        priceId: PRICE_IDS[plan.name][annual ? "annual" : "monthly"],
        customerEmail: user?.user?.email ?? undefined,
        customData: {
          ...(user?.user?.id ? { userId: user.user.id } : {}),
          plan: plan.name,
          modules_included: included.join(","),
          modules_extra: extras.join(","),
          extras_monthly_brl: String(extrasMonthly),
          setup_brl: String(setup),
          minimum_term_days: "90",
        },
      });
    } catch {
      // Pix fallback espelha o ciclo mínimo cobrado pelo gateway:
      // - Mensal: setup + 3 mensalidades (mínimo 90 dias)
      // - Anual: setup + 12× preço/mês no rate anual (= 10× preço cheio, 2 meses grátis)
      const cycleMonths = annual ? 12 : 3;
      const cycleValue = totalMonthly * cycleMonths;
      toast.message(
        "Instabilidade no checkout. Liberei o pagamento via Pix para você seguir agora.",
      );
      setPixState({
        open: true,
        amountCents: Math.round((setup + cycleValue) * 100),
        txid: `PLANO-${plan.name.toUpperCase()}-${annual ? "ANUAL" : "MENSAL"}`,
        label: `Plano ${plan.name}${modules.length ? ` (${modules.length} mód.)` : ""} — ${annual ? "anual (setup + 12 mensalidades)" : "mensal (setup + 3 mensalidades)"}`,
      });
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PaymentTestModeBanner />
      <PublicHeader />

      {/* SELETOR DE PÚBLICO */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Planos por público</div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Para qual perfil você está vendo planos?</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-3xl mx-auto" role="tablist">
            {([
              { id: "empresas", label: "Empresas", icon: Building2 },
              { id: "white-label", label: "White Label", icon: Layers },
              { id: "consumidor", label: "Consumidor", icon: UserRound },
            ] as { id: Audience; label: string; icon: typeof Building2 }[]).map(({ id, label, icon: Icon }) => {
              const active = audience === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setAudience(id)}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-all",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                      : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {audience === "white-label" && (
        <WhiteLabelPlansPanel />
      )}

      {audience === "consumidor" && (
        <ConsumidorPlansPanel />
      )}

      {audience === "empresas" && (
        <>
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
            Três planos atrelados ao salário mínimo (½ SM, 1 SM e 2 SM) cobrem do módulo único à operação multi-empresa.
            Mais a opção <strong>Sob Medida</strong> para escopos específicos. Sem letras miúdas.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent/40 px-4 py-1.5 text-sm">
            <Sparkles className="w-4 h-4" /> Comece com <strong className="font-semibold">7 dias de Trial</strong> com tudo liberado — sem cartão
          </div>
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
          Valores de referência. Tributos podem ser aplicados conforme nota fiscal.
          Cobrança recorrente após o ciclo inicial obrigatório de 90 dias.
        </p>

        {/* Sob Medida — secundário */}
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card/50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Operação maior ou white label?
            </div>
            <div className="text-lg font-semibold mt-1">
              Projeto Sob Medida
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Múltiplos módulos, marca própria, integrações específicas e SLA
              dedicado. Conversamos sobre escopo e orçamento direto com você —
              sem entrar no fluxo de assinatura padrão.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/orcamento" search={{ plano: "Sob Medida", origem: "planos" }}>
              Falar com consultor
            </Link>
          </Button>
        </div>
      </section>

      {/* MÓDULOS POR PLANO + SINERGIAS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">O que compõe cada plano</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Lista explícita dos módulos disponíveis em cada plano e exemplos de pares com alta sinergia
            entre eles. Você escolhe os módulos principais dentro da quota do plano.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Essencial */}
          <Card className="p-5 flex flex-col">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Plano Essencial</div>
            <div className="text-lg font-semibold mt-1">1 módulo principal à escolha</div>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> CRM (leads, oportunidades, pipeline)</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Agenda (profissionais, serviços, bloqueios)</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> EHR — Prontuário Eletrônico</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> PDV / Frente de caixa</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Vitrine Imobiliária</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Área do Cliente</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Eventos</li>
            </ul>
            <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Sempre incluso:</strong> dashboard, cadastros, perfis e permissões, auditoria, financeiro essencial.
            </div>
          </Card>

          {/* Integrado */}
          <Card className="p-5 flex flex-col border-primary/40 ring-1 ring-primary/10">
            <div className="text-xs uppercase tracking-wider text-primary">Plano Integrado · pares curados</div>
            <div className="text-lg font-semibold mt-1">2 módulos com alta sinergia</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><strong>CRM + Agenda</strong> — lead vira agendamento sem digitar duas vezes.</li>
              <li><strong>PDV + Estoque</strong> — venda baixa estoque em tempo real.</li>
              <li><strong>Commerce + Delivery</strong> — pedido online entra direto na rota.</li>
              <li><strong>Vitrine + CRM Imobiliário</strong> — visita do site vira lead qualificado.</li>
              <li><strong>EHR + Agenda Clínica</strong> — prontuário pré-carregado na consulta.</li>
              <li><strong>Área do Cliente + Automação</strong> — autoatendimento + jornadas.</li>
            </ul>
            <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">A mais que o Essencial:</strong> financeiro completo, central de mensagens (WhatsApp + e-mail), API & webhooks, automações cruzadas.
            </div>
          </Card>

          {/* Avançado */}
          <Card className="p-5 flex flex-col">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Plano Avançado · operação ponta a ponta</div>
            <div className="text-lg font-semibold mt-1">3 módulos principais + BI</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><strong>ERP + CRM + Agenda + BI</strong> — clínica/serviço com gestão financeira.</li>
              <li><strong>Commerce + PDV + Estoque + BI</strong> — varejo omnichannel real.</li>
              <li><strong>Vitrine + CRM Imobiliário + ERP + BI</strong> — imobiliária com pipeline e contratos.</li>
              <li><strong>EHR + Agenda + Área do Cliente + BI</strong> — clínica completa.</li>
            </ul>
            <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">A mais que o Integrado:</strong> BI consolidado, multi-unidades (até 3), governança LGPD, auditoria expandida, homologação e acompanhamento técnico.
            </div>
          </Card>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Módulos extras além da quota: <strong>{formatBRL(EXTRA_MODULE_BRL)}/mês</strong> cada — somáveis em qualquer plano.
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
        </>
      )}

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
          extraPriceCents={EXTRA_MODULE_BRL * 100}
          availableSlugs={availability?.availableModuleSlugs}
          moduleStatus={availability?.moduleStatus}
          confirmLabel="Continuar para o resumo da contratação"
          onConfirm={(slugs) => {
            const plan = picker.plan!;
            setPickedModules((prev) => ({ ...prev, [plan.name]: slugs }));
            setPicker({ open: false, plan: null });
            setSummary({ open: true, plan });
          }}
        />
      )}
      {summary.plan && (
        <ContractingSummaryDialog
          open={summary.open}
          onOpenChange={(o) => setSummary((s) => ({ ...s, open: o }))}
          planName={summary.plan.name}
          quota={PLAN_QUOTA[summary.plan.name] ?? 1}
          selectedSlugs={pickedModules[summary.plan.name] ?? []}
          baseMonthlyCents={Math.round(
            (annual
              ? Math.round((summary.plan.monthly ?? 0) * 10 / 12)
              : (summary.plan.monthly ?? 0)) * 100,
          )}
          setupCents={(PLAN_SETUP_BRL[summary.plan.name] ?? 0) * 100}
          extraPriceCents={EXTRA_MODULE_BRL * 100}
          annual={annual}
          confirmLabel={`Confirmar e ir para o pagamento ${annual ? "anual" : "mensal"}`}
          onEditModules={() => {
            const plan = summary.plan!;
            setSummary({ open: false, plan: null });
            setPicker({ open: true, plan });
          }}
          onConfirm={async () => {
            const plan = summary.plan!;
            const slugs = pickedModules[plan.name] ?? [];
            setSummary({ open: false, plan: null });
            await runCheckout(plan, slugs);
          }}
        />
      )}
    </div>
  );
}

function WhiteLabelPlansPanel() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <Badge className="bg-white/15 text-primary-foreground border-0 mb-4">
            <Layers className="w-3.5 h-3.5 mr-1" /> Planos White Label
          </Badge>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Plataforma com a sua marca
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
            Os planos White Label são montados por volume de clientes, módulos ativos e nível de suporte.
            Recursos detalhados estão na jornada White Label.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 w-full sm:w-auto">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                Quero minha plataforma White Label <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white gap-2 w-full sm:w-auto">
              <Link to="/white-label">Ver jornada White Label <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {[
            { title: "Sob medida", desc: "Plano dimensionado para o seu volume de clientes e operação." },
            { title: "Setup dedicado", desc: "Implantação acompanhada por especialista, do domínio à marca." },
            { title: "Crescimento sem teto", desc: "Adicione módulos, clientes e marcas conforme escala." },
          ].map((b) => (
            <Card key={b.title} className="p-6">
              <h3 className="font-semibold tracking-tight">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b.desc}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Button asChild size="lg" className="btn-whatsapp gap-2 w-full sm:w-auto">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" /> Falar com especialista
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
            <Link to="/demo"><PlayCircle className="w-4 h-4" /> Ver demonstração</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function ConsumidorPlansPanel() {
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
      <Badge variant="secondary" className="mb-4">
        <UserRound className="w-3.5 h-3.5 mr-1" /> Consumidor
      </Badge>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
        Acesso gratuito para consumidores
      </h1>
      <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
        Consumidores acessam benefícios, fidelidade, parceiros, eventos e experiências sem custo —
        através das empresas participantes da rede Impulsionando.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <Button asChild size="lg" className="bg-gradient-primary gap-2 w-full sm:w-auto">
          <Link to="/auth">
            Quero acessar benefícios <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
          <Link to="/consumidor">Ver jornada do consumidor <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
    </section>
  );
}
