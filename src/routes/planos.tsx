import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Bot, CheckCircle2, CreditCard, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getContratarPricing } from "@/lib/contratar.functions";
import { openImpulsionito } from "@/lib/impulsionito-tracking";

type PublicPlan = {
  code: "ESSENCIAL" | "PRO" | "ENTERPRISE" | "WHITE_LABEL";
  name: string;
  description: string | null;
  setup_fee: number | string;
  recurring_amount: number | string;
  min_contract_days: number;
  included_module_count: number;
  show_on_site: boolean;
  allow_direct_checkout: boolean;
  cta: string | null;
  legal_text: string | null;
};

export const Route = createFileRoute("/planos")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    plano: typeof search.plano === "string" ? search.plano : undefined,
    nicho: typeof search.nicho === "string" ? search.nicho : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Planos — Essencial, Ideal e Full | Impulsionando" },
      { name: "description", content: "Três formas de entrar no ecossistema Impulsionando, com implantação assistida, Impulsionito, vencimento no dia 5 e evolução de plano com cálculo proporcional automático." },
      { property: "og:title", content: "Planos Impulsionando" },
      { property: "og:description", content: "Escolha Essencial, Ideal ou Full e conecte operação, vendas, atendimento, financeiro, automação e relacionamento." },
      { property: "og:url", content: "https://impulsionando.com.br/planos" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/planos" }],
  }),
  component: PlanosPage,
});

function money(value: number | string) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const VALUE_BY_PLAN: Record<string, string[]> = {
  ESSENCIAL: [
    "Core Impulsionando + Impulsionito",
    "Até 3 módulos prioritários homologados",
    "Implantação e configuração assistidas",
    "CRM, operação e relacionamento conforme módulos escolhidos",
    "Evolução de plano sem reconstruir o ambiente",
  ],
  PRO: [
    "Tudo do Essencial com mais integração",
    "Capacidade de evolução para até 6 módulos, conforme homologação e escopo",
    "Jornadas e automações entre áreas",
    "Mais inteligência de CRM, LTV, recorrência e pesquisas",
    "Ideal para substituir sistemas e planilhas desconectados",
  ],
  ENTERPRISE: [
    "Ecossistema completo com todos os módulos homologados aplicáveis",
    "Operação multiárea e visão executiva",
    "BI, integrações e automação avançada",
    "Acompanhamento prioritário de implantação e evolução",
    "Impulsionito atuando como concierge operacional contínuo",
  ],
};

function PlanosPage() {
  const load = useServerFn(getContratarPricing);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    load()
      .then((r) => mounted && setPlans((r.plans ?? []).filter((p: any) => p.show_on_site && p.code !== "WHITE_LABEL") as PublicPlan[]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <Badge className="border-0 bg-white/15 text-white"><Sparkles className="mr-1 h-3.5 w-3.5" /> Planos para empresas</Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">Comece no tamanho certo. Evolua sem trocar de ecossistema.</h1>
            <p className="mt-5 max-w-3xl text-lg text-white/85">A Impulsionando conecta PDV, ERP, CRM, atendimento, agenda, financeiro, automação, pesquisas e relacionamento. O Impulsionito acompanha a implantação e ajuda sua equipe a usar, configurar, testar e evoluir o ambiente.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => openImpulsionito("planos-diagnostico")}>Descobrir meu plano com o Impulsionito <ArrowRight className="ml-2 h-4 w-4" /></Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/nichos">Ver por segmento</Link></Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 grid gap-3 md:grid-cols-4">
            {[
              [CreditCard, "Dia 5", "Vencimento mensal padronizado"],
              [ShieldCheck, "90 dias", "Ciclo médio inicial de implantação, treinamento e adoção"],
              [HeartHandshake, "Mãos dadas", "Onboarding e evolução acompanhados"],
              [Bot, "Impulsionito", "Concierge permanente do ecossistema"],
            ].map(([Icon, title, text]: any) => <Card key={title} className="p-5"><Icon className="h-5 w-5 text-primary"/><div className="mt-3 font-semibold">{title}</div><div className="mt-1 text-sm text-muted-foreground">{text}</div></Card>)}
          </div>

          {loading ? <Card className="p-8 text-center text-muted-foreground">Carregando catálogo oficial…</Card> : (
            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.code} className={plan.code === "PRO" ? "relative border-primary shadow-lg p-6" : "p-6"}>
                  {plan.code === "PRO" && <Badge className="mb-3">Mais equilibrado</Badge>}
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                  <p className="mt-2 min-h-14 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-5"><span className="text-3xl font-bold">{money(plan.recurring_amount)}</span><span className="text-muted-foreground"> / mês</span></div>
                  <div className="mt-1 text-sm text-muted-foreground">Setup inicial integral: <strong className="text-foreground">{money(plan.setup_fee)}</strong></div>
                  <div className="mt-5 space-y-2">
                    {(VALUE_BY_PLAN[plan.code] ?? []).map((item) => <div key={item} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><span>{item}</span></div>)}
                  </div>
                  <Button asChild size="lg" className="mt-6 w-full"><Link to="/auth" search={{ persona: "empresa", mode: "signup", next: `/onboarding/empresa?plano=${plan.code}` }}>{`Contratar ${plan.name}`} <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
                  <p className="mt-3 text-center text-xs text-muted-foreground">Cadastro autônomo: conta → empresa → subdomínio → termos → pagamento → onboarding.</p>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-8 p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Trocar de plano sem sustos</h2>
            <p className="mt-2 text-muted-foreground">O setup pertence à implantação inicial e é sempre integral. Em uma troca de plano ele não é cobrado novamente. Upgrade gera somente a diferença proporcional da mensalidade até o próximo dia 5; downgrade gera crédito proporcional, com aceite e histórico auditável.</p>
          </Card>

          <Card className="mt-5 p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
              <div><Badge variant="secondary">White Label</Badge><h2 className="mt-3 text-2xl font-bold">Quer operar a Impulsionando com sua própria marca?</h2><p className="mt-2 text-muted-foreground">White Label possui jornada e capacidade próprias. A contratação é consultiva porque envolve estrutura, marca, limites de clientes e provisionamento.</p></div>
              <Button asChild size="lg"><Link to="/white-label">Conhecer White Label <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
            </div>
          </Card>

          <div className="mt-10 text-center"><h2 className="text-3xl font-bold">Não escolha módulos. Escolha o resultado que quer alcançar.</h2><p className="mx-auto mt-3 max-w-2xl text-muted-foreground">O Impulsionito entende seu segmento, sua operação e suas perdas invisíveis para indicar a combinação de recursos mais adequada.</p><Button size="lg" className="mt-6" onClick={() => openImpulsionito("planos-fechamento")}>Quero montar meu ecossistema <ArrowRight className="ml-2 h-4 w-4"/></Button></div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
