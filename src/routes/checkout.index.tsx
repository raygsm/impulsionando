import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useMinimumWage } from "@/hooks/useCoreSetting";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/checkout/")({
  component: CheckoutIndex,
  head: () => ({
    meta: [
      { title: "Checkout — Impulsionando" },
      {
        name: "description",
        content:
          "Planos atrelados ao salário mínimo: Essencial (½ SM), Ideal (1 SM) e Full (2 SM). Pagamento via Pix, cartão ou boleto sem sair da plataforma.",
      },
    ],
  }),
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

interface CheckoutPlan {
  code: string;
  name: string;
  displayName?: string;
  tagline: string;
  factor: number;
  factorLabel: string;
  modulesLabel: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  ctaHref: string;
}

function buildPlans(wage: number): CheckoutPlan[] {
  return [
    {
      code: "essencial",
      name: "Essencial",
      tagline: "Comece pelo módulo que mais dói hoje — sem peso desnecessário.",
      factor: 0.5,
      factorLabel: "½ salário mínimo",
      modulesLabel: "Até 3 módulos + base operacional",
      features: [
        "Até 3 módulos à escolha (CRM, Agenda, EHR, PDV, Vitrine, Área do Cliente ou Eventos)",
        "Base inclusa: dashboard, cadastros, perfis e permissões, auditoria",
        "Financeiro essencial (contas a receber + fluxo de caixa)",
        "Até 3 usuários · 1 unidade",
        "Suporte por e-mail e WhatsApp",
        "7 dias de Trial com tudo liberado, sem cartão",
      ],
      cta: "Contratar Essencial",
      ctaHref: "/checkout/essencial",
    },
    {
      code: "integrado",
      name: "Integrado",
      displayName: "Ideal",
      tagline: "Plano recomendado — módulos que se potencializam, com automação entre eles.",
      factor: 1,
      factorLabel: "1 salário mínimo",
      modulesLabel: "Até 6 módulos integrados + automação",
      features: [
        "Até 6 módulos em pares curados de alta sinergia",
        "Financeiro completo (contas a pagar/receber, conciliação, comissões)",
        "Automações cruzadas entre módulos (gatilhos e fluxos)",
        "Central de mensagens (WhatsApp + E-mail transacional)",
        "Até 5 usuários · 1 unidade · API e webhooks",
        "Suporte prioritário",
      ],
      highlight: true,
      cta: "Contratar Ideal",
      ctaHref: "/checkout/integrado",
    },
    {
      code: "avancado",
      name: "Avançado",
      displayName: "Full",
      tagline: "Operações avançadas, multiunidade, IA avançada e White Label parcial.",
      factor: 2,
      factorLabel: "2 salários mínimos",
      modulesLabel: "Módulos ilimitados + BI consolidado + IA avançada",
      features: [
        "Módulos ilimitados conforme o desenho da operação",
        "Multi-unidade sem limite prático + gestão por setores",
        "Customizações sob medida e integrações dedicadas",
        "IA avançada (atendimento, recomendação, copilots internos)",
        "White Label parcial (sua marca em áreas selecionadas)",
        "Governança LGPD, exportações e logs expandidos",
      ],
      cta: "Contratar Full",
      ctaHref: "/checkout/avancado",
    },
  ];
}

function CheckoutIndex() {
  const wage = useMinimumWage();
  const plans = buildPlans(wage);

  // Analytics: view_item_list ao entrar em /checkout — permite calcular a taxa
  // de conversão por plano (cliques no CTA ÷ visualizações da listagem).
  useEffect(() => {
    trackEvent("view_item_list", {
      item_list_id: "checkout_plans",
      item_list_name: "Checkout — Planos Impulsionando",
      currency: "BRL",
      items: plans.map((p, index) => ({
        item_id: p.code,
        item_name: p.displayName ?? p.name,
        price: Number((wage * p.factor).toFixed(2)),
        index,
        item_variant: p.highlight ? "recommended" : "standard",
        item_list_name: "Checkout — Planos Impulsionando",
      })),
    });
  }, [wage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlanCta = (p: CheckoutPlan) => {
    const price = Number((wage * p.factor).toFixed(2));
    // GA4 recommended event — select_item + begin_checkout — permitem funil
    // por plano no painel de eventos.
    trackEvent("select_item", {
      item_list_id: "checkout_plans",
      item_list_name: "Checkout — Planos Impulsionando",
      items: [{
        item_id: p.code,
        item_name: p.displayName ?? p.name,
        price,
        item_variant: p.highlight ? "recommended" : "standard",
      }],
    });
    trackEvent("begin_checkout", {
      currency: "BRL",
      value: price,
      plan_code: p.code,
      plan_name: p.displayName ?? p.name,
      highlight: !!p.highlight,
      items: [{ item_id: p.code, item_name: p.displayName ?? p.name, price, quantity: 1 }],
    });
  };

  return (
    <div className="min-h-dvh bg-background py-12 px-4">
      <main
        className="max-w-6xl mx-auto space-y-10"
        aria-labelledby="checkout-heading"
        data-testid="checkout-page"
      >
        <header className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mx-auto">
            <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" /> Preços atrelados ao salário mínimo vigente
          </Badge>
          <h1 id="checkout-heading" className="text-3xl md:text-4xl font-bold">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground">
            Três planos que crescem com a sua operação: Essencial (½ SM), Ideal (1 SM) e Full (2 SM).
            Pagamento via Pix, cartão ou boleto — 100% dentro da plataforma.
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            Salário mínimo vigente considerado:{" "}
            <b className="ml-1" data-testid="checkout-minimum-wage">{brl(wage)}</b>
          </p>
        </header>

        <ul
          className="grid md:grid-cols-3 gap-5 list-none p-0"
          role="list"
          aria-label="Planos disponíveis"
        >
          {plans.map((p) => {
            const price = wage * p.factor;
            const label = p.displayName ?? p.name;
            const priceId = `checkout-plan-price-${p.code}`;
            return (
              <li key={p.code} className="flex">
                <Card
                  className={`flex flex-col relative w-full focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                    p.highlight ? "border-primary shadow-lg md:scale-[1.02]" : ""
                  }`}
                  data-testid={`checkout-plan-${p.code}`}
                  data-highlight={p.highlight ? "true" : "false"}
                  aria-labelledby={`checkout-plan-title-${p.code}`}
                >
                  {p.highlight && (
                    <Badge
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                      data-testid={`checkout-plan-badge-${p.code}`}
                    >
                      Recomendado
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-baseline justify-between gap-2">
                      <span id={`checkout-plan-title-${p.code}`}>{label}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {p.factorLabel}
                      </span>
                    </CardTitle>
                    <CardDescription>{p.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span
                          id={priceId}
                          className="text-3xl font-bold"
                          data-testid={`checkout-plan-price-${p.code}`}
                          data-price-cents={Math.round(price * 100)}
                        >
                          {brl(price)}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{p.modulesLabel}</div>
                    </div>
                    <ul className="text-sm space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check
                            className="w-4 h-4 text-primary mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="mt-auto min-h-11"
                      variant={p.highlight ? "default" : "outline"}
                    >
                      <Link
                        to={p.ctaHref as any}
                        data-testid={`checkout-plan-cta-${p.code}`}
                        data-plan-code={p.code}
                        aria-describedby={priceId}
                        aria-label={`${p.cta} por ${brl(price)} ao mês`}
                        onClick={() => handlePlanCta(p)}
                      >
                        {p.cta}
                        <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Precisa de algo sob medida (multi-empresa, white label total, integrações dedicadas)?{" "}
            <Link
              to="/contratar/sob-medida"
              className="text-primary underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
              data-testid="checkout-cta-sob-medida"
              onClick={() => trackEvent("select_item", {
                item_list_id: "checkout_plans",
                items: [{ item_id: "sob-medida", item_name: "Sob Medida" }],
              })}
            >
              Solicitar proposta Sob Medida
            </Link>
            .
          </p>
          <p>
            Quer comparar os planos em detalhes?{" "}
            <Link
              to="/planos"
              className="text-primary underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
              data-testid="checkout-cta-comparativo"
            >
              Ver comparativo completo
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
