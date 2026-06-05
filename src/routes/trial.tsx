import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Sparkles, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

export const Route = createFileRoute("/trial")({
  head: () => ({
    meta: [
      { title: "Trial Gratuito de 7 Dias — Impulsionando Tecnologia" },
      {
        name: "description",
        content:
          "Teste a Impulsionando Tecnologia por 7 dias com todos os recursos ativos. Cobrança automática ao final do prazo conforme plano escolhido.",
      },
      { property: "og:title", content: "Trial de 7 dias — Impulsionando Tecnologia" },
      {
        property: "og:description",
        content: "Todos os módulos ativos por 7 dias. Sem cartão para começar — escolha o plano para o pós-Trial.",
      },
    ],
  }),
  component: TrialLanding,
});

const RESOURCES = [
  "WhatsApp Inteligente",
  "CRM e Relacionamento",
  "Agenda Online",
  "Pagamentos e Baixa Automática",
  "PDV, Comandas e Reservas",
  "Delivery",
  "Eventos e Ingressos",
  "Prontuário Eletrônico",
  "Produtos e Estoque",
  "Fornecedores e B2B",
  "Afiliados e Clube de Indicação",
  "Dashboards e Relatórios",
  "Comunicação e Templates",
  "Automações e Follow-ups",
  "Área do Cliente/Paciente/Aluno",
  "White Label",
];

function TrialLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs mb-6">
            <Sparkles className="w-3.5 h-3.5" /> 7 dias com todos os recursos ativos
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Trial gratuito de 7 dias da<br />Impulsionando Tecnologia
          </h1>
          <p className="text-lg text-white/85 max-w-2xl mx-auto leading-relaxed mt-6">
            Teste a plataforma completa, com todos os módulos liberados e jornadas reais.
            Ao final, a cobrança do plano escolhido é gerada automaticamente.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
              <Link to="/trial/cadastro">
                Começar Trial de 7 dias <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
              <Link to="/planos">Ver planos</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8 bg-muted/30 border-primary/20">
          <p className="text-sm leading-relaxed">
            <strong>O Trial permite testar a Impulsionando Tecnologia por 7 dias com todos os recursos ativos.</strong>{" "}
            Após esse período, a cobrança será gerada automaticamente. Caso o pagamento não seja identificado,
            o acesso operacional será suspenso, permanecendo disponível apenas a área financeira para regularização.
          </p>
        </Card>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            { i: Sparkles, t: "Todos os recursos", d: "Modules liberados em modo demonstração por 7 dias." },
            { i: Clock, t: "Cobrança automática", d: "No 7º dia, geramos a cobrança do plano escolhido." },
            { i: ShieldCheck, t: "Sem surpresas", d: "Sem pagamento, o acesso operacional é suspenso — apenas o financeiro fica disponível." },
          ].map((b) => (
            <Card key={b.t} className="p-5">
              <b.i className="w-5 h-5 text-primary mb-3" />
              <div className="font-semibold">{b.t}</div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{b.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold tracking-tight mb-6">O que você testa nos 7 dias</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {RESOURCES.map((r) => (
            <div key={r} className="flex items-start gap-2 text-sm py-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Ambiente Trial — dados de teste, sem impacto em dados reais. Publicação de páginas reais, exportação e
          integrações reais ficam bloqueadas por padrão.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="p-10 bg-gradient-primary text-primary-foreground border-0 shadow-elegant text-center">
          <h2 className="text-3xl font-bold tracking-tight">Pronto para começar?</h2>
          <p className="text-white/85 mt-3">Crie seu Trial agora e receba o acesso por WhatsApp e e-mail.</p>
          <Button asChild size="lg" className="mt-6 bg-white text-primary hover:bg-white/90">
            <Link to="/trial/cadastro">Começar agora <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
