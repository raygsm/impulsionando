import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, MessageCircle, KanbanSquare, Calendar, CreditCard, Dumbbell,
  HeartHandshake, BarChart3, TrendingUp, Sparkles, Repeat, ArrowDown, PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/como-funciona/fitness")({
  head: () => ({
    meta: [
      { title: "Como funciona — Vertical Fitness | Impulsionando Tecnologia" },
      { name: "description", content: "Mapa visual da jornada completa de academias, CrossFit, funcional e personal trainer dentro da plataforma Impulsionando." },
      { property: "og:title", content: "Como funciona — Vertical Fitness | Impulsionando" },
      { property: "og:description", content: "Lead → CRM → Agenda → Pagamento → Execução → Retenção → Crescimento. Veja o fluxo inteiro." },
    ],
  }),
  component: ComoFuncionaFitness,
});

const STEPS = [
  { icon: UserPlus, t: "Lead", d: "Captura via site, Instagram, Google Meu Negócio, indicação ou QR no box. Formulário estruturado (listas, sem texto livre) entra direto no CRM." },
  { icon: MessageCircle, t: "Contato", d: "WhatsApp automático em segundos. Régua de boas-vindas, agendamento de aula experimental e envio do PAR-Q digital." },
  { icon: KanbanSquare, t: "CRM", d: "Funil Lead → Trial → Matrícula → Ativo → Em risco → Reativação. Score de probabilidade e atividades para o consultor." },
  { icon: Calendar, t: "Agendamento", d: "Aula experimental ou primeira avaliação. Confirmação imediata + lembretes (24h, 12h, 6h, 2h, 1h, 30 min) configuráveis." },
  { icon: CreditCard, t: "Pagamento", d: "Pix, cartão recorrente, boleto, cartão avulso, dinheiro ou crédito interno. Pagamento aprovado libera matrícula e vagas." },
  { icon: Dumbbell, t: "Execução", d: "Check-in (QR/biometria/catraca), aula, prescrição de treino, avaliação física periódica, evolução do aluno." },
  { icon: HeartHandshake, t: "Relacionamento", d: "Pós-aula com NPS, aniversário, marcos (50/100/365 check-ins), conteúdo do professor, comunidade." },
  { icon: Repeat, t: "Retenção", d: "Score de risco, gatilhos de reativação (15d/30d/60d), oferta personalizada, recuperação de matrícula." },
  { icon: BarChart3, t: "Relatórios", d: "MRR, churn, ocupação por horário, frequência por modalidade, performance por professor, fechamento de caixa." },
  { icon: TrendingUp, t: "Crescimento", d: "Painel multi-unidade, comparativos, expansão para nova praça com setup em horas, não meses." },
  { icon: Sparkles, t: "Fidelização", d: "Programa de pontos, indique e ganhe, planos família, upgrade automático Trial → Plano anual." },
  { icon: Repeat, t: "Expansão", d: "Novas modalidades, novas salas, franquias, white-label do app — tudo no mesmo motor, sem refazer nada." },
];

function ComoFuncionaFitness() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <section className="border-b border-border bg-gradient-to-br from-background via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Badge variant="outline" className="gap-1 mb-4"><Dumbbell className="w-3 h-3" /> Vertical Fitness</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Como funciona a operação de uma academia, box ou estúdio dentro da Impulsionando.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            Do primeiro lead até a fidelização do aluno e a expansão para novas unidades. Tudo conectado, tudo automatizável, tudo auditável.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-primary gap-2">
              <Link to="/showroom/fitness"><PlayCircle className="w-4 h-4" /> Abrir showroom navegável</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/orcamento" search={{ origem: "como-funciona-fitness", nicho: "fitness" } as never}>Pedir orçamento</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <ol className="space-y-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <li key={s.t}>
                <Card className="p-5 flex gap-4 items-start">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-lg">{s.t}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
                  </div>
                </Card>
                {!isLast && (
                  <div className="flex justify-center py-1 text-muted-foreground/50">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <Card className="mt-10 p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <h3 className="text-xl font-bold">Pronto para ver isso aplicado à sua operação?</h3>
          <p className="text-muted-foreground text-sm mt-1">Te enviamos um orçamento modular: você escolhe agenda, CRM, pagamentos, app, relatórios, integrações.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button asChild className="bg-gradient-primary">
              <Link to="/orcamento" search={{ origem: "como-funciona-fitness", nicho: "fitness" } as never}>Quero um orçamento</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/showroom/fitness">Explorar a demo</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/trabalhe-conosco/fitness">Trabalhe conosco no Fitness</Link>
            </Button>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
