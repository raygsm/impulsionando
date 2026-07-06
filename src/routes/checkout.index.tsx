import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useMinimumWage } from "@/hooks/useCoreSetting";

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
      ctaHref: "/contratar?plano=essencial",
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
      ctaHref: "/contratar?plano=integrado",
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
      ctaHref: "/contratar?plano=avancado",
    },
  ];
}

function CheckoutIndex() {
  const wage = useMinimumWage();
  const plans = buildPlans(wage);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mx-auto">
            <Sparkles className="w-3 h-3 mr-1" /> Preços atrelados ao salário mínimo vigente
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Escolha seu plano</h1>
          <p className="text-muted-foreground">
            Três planos que crescem com a sua operação: Essencial (½ SM), Ideal (1 SM) e Full (2 SM).
            Pagamento via Pix, cartão ou boleto — 100% dentro da plataforma.
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Salário mínimo vigente considerado: <b className="ml-1">{brl(wage)}</b>
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const price = wage * p.factor;
            const label = p.displayName ?? p.name;
            return (
              <Card
                key={p.code}
                className={`flex flex-col relative ${p.highlight ? "border-primary shadow-lg md:scale-[1.02]" : ""}`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Recomendado</Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between gap-2">
                    <span>{label}</span>
                    <span className="text-xs text-muted-foreground font-normal">{p.factorLabel}</span>
                  </CardTitle>
                  <CardDescription>{p.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{brl(price)}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{p.modulesLabel}</div>
                  </div>
                  <ul className="text-sm space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-auto" variant={p.highlight ? "default" : "outline"}>
                    <Link to={p.ctaHref as any}>
                      {p.cta} <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Precisa de algo sob medida (multi-empresa, white label total, integrações dedicadas)?{" "}
            <Link to="/contratar/sob-medida" className="text-primary underline">
              Solicitar proposta Sob Medida
            </Link>
            .
          </p>
          <p>
            Quer comparar os planos em detalhes?{" "}
            <Link to="/planos" className="text-primary underline">
              Ver comparativo completo
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
