import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, MessageCircle, Sparkles, CheckCircle2,
  Stethoscope, Scissors, UtensilsCrossed, Store, Briefcase, GraduationCap,
  Calendar, Users, CreditCard, BarChart3, Bot, FileText, Share2, Globe, Cog, Plug, ShieldCheck,
  Zap, Workflow, Layers, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20conhecer%20as%20solu%C3%A7%C3%B5es%20da%20Impulsionando.";

// Reusable placeholder for routes that still want the simple coming-soon shell.
function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </main>
      <PublicFooter />
    </div>
  );
}
export { ComingSoon };

export const Route = createFileRoute("/solucoes")({
  head: () => ({
    meta: [
      { title: "Soluções por segmento — Atendimento, Vendas e Gestão | Impulsionando Tecnologia" },
      { name: "description", content: "Soluções digitais para clínicas, salões, restaurantes, varejo, serviços e educação. Atendimento, agenda, vendas, pagamentos, CRM e BI em um sistema modular." },
      { property: "og:title", content: "Soluções — Impulsionando Tecnologia" },
      { property: "og:description", content: "Atendimento, agenda, vendas, pagamentos e gestão em um só sistema modular." },
      { property: "og:url", content: "https://sistemas.impulsionando.com.br/solucoes" },
    ],
    links: [{ rel: "canonical", href: "https://sistemas.impulsionando.com.br/solucoes" }],
  }),
  component: SolucoesPage,
});

const SEGMENTS = [
  {
    icon: Stethoscope,
    title: "Clínicas e Saúde",
    desc: "Agenda multiprofissional, prontuário leve, lembretes automáticos e pagamento antes da consulta.",
    modules: ["Agenda Online", "WhatsApp", "Pagamentos", "CRM"],
    segmento: "saude",
    dores: ["agenda", "whatsapp", "crm"],
  },
  {
    icon: Scissors,
    title: "Estética, Salões e Barbearias",
    desc: "Profissionais, comissão, pacotes, fidelidade e confirmação automática pelo WhatsApp.",
    modules: ["Agenda Online", "PDV", "WhatsApp", "Financeiro"],
    segmento: "estetica",
    dores: ["agenda", "vendas", "whatsapp", "financeiro"],
  },
  {
    icon: UtensilsCrossed,
    title: "Bares, Restaurantes e Delivery",
    desc: "PDV no balcão, comanda, controle de estoque, pedidos online e baixa automática no caixa.",
    modules: ["PDV", "Estoque", "Pagamentos", "Relatórios"],
    segmento: "alimentacao",
    dores: ["vendas", "estoque", "relatorios"],
  },
  {
    icon: Store,
    title: "Varejo e E-commerce",
    desc: "Venda integrada (loja + online), múltiplas unidades, emissão fiscal e relatórios consolidados.",
    modules: ["PDV", "Estoque", "Emissão Fiscal", "BI"],
    segmento: "varejo",
    dores: ["vendas", "estoque", "relatorios"],
  },
  {
    icon: Briefcase,
    title: "Prestadores de Serviços",
    desc: "Propostas, orçamentos, contratos, recebimentos recorrentes e follow-up de clientes.",
    modules: ["CRM", "Pagamentos", "WhatsApp", "Sites"],
    segmento: "servicos",
    dores: ["crm", "whatsapp", "financeiro"],
  },
  {
    icon: GraduationCap,
    title: "Educação e Cursos",
    desc: "Matrículas, turmas, mensalidades, certificados e acompanhamento de alunos.",
    modules: ["CRM", "Pagamentos", "Sites", "Relatórios"],
    segmento: "educacao",
    dores: ["crm", "financeiro", "relatorios"],
  },
];

const OUTCOMES = [
  { icon: Zap, title: "Resposta em minutos", desc: "Reduza o tempo médio de primeiro contato com automação no WhatsApp e CRM." },
  { icon: Workflow, title: "Fim do retrabalho", desc: "Um dado registrado uma única vez circula entre agenda, caixa, CRM e relatórios." },
  { icon: Layers, title: "Comece pequeno, escale", desc: "Ative só o módulo que resolve a dor atual e adicione novos quando precisar." },
  { icon: Building2, title: "Pronto para multi-unidade", desc: "Hierarquia, permissões e relatórios consolidados quando o negócio crescer." },
];

const FLOW = [
  { step: "01", title: "Captação", desc: "Site, anúncios e indicações trazem o lead para o CRM com origem rastreada." },
  { step: "02", title: "Atendimento", desc: "WhatsApp com agente virtual qualifica e direciona para o time certo." },
  { step: "03", title: "Agendamento", desc: "Cliente escolhe horário, profissional e paga em poucos cliques." },
  { step: "04", title: "Execução & PDV", desc: "Atendimento confirmado, venda registrada e caixa atualizado em tempo real." },
  { step: "05", title: "Pós-venda & BI", desc: "Reativação automática, indicadores e dashboards prontos para decidir." },
];

const ALL_MODULES = [
  { icon: Calendar, label: "Agenda Online" },
  { icon: Bot, label: "WhatsApp e Agente Virtual" },
  { icon: Users, label: "CRM e Automação" },
  { icon: Share2, label: "Afiliados e Parceiros" },
  { icon: Globe, label: "Sites e Landing Pages" },
  { icon: CreditCard, label: "Pagamentos" },
  { icon: FileText, label: "Emissão Fiscal" },
  { icon: ShieldCheck, label: "Usuários e Permissões" },
  { icon: BarChart3, label: "Relatórios e BI" },
  { icon: Cog, label: "Sistemas Personalizados" },
  { icon: Plug, label: "Integrações" },
];

function SolucoesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Soluções por segmento
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Um sistema, vários negócios.<br />Resultados reais em cada operação.
            </h1>
            <p className="text-lg text-white/85 max-w-2xl leading-relaxed">
              Combinamos atendimento, agenda, vendas, pagamentos e gestão em uma plataforma única.
              Cada solução é montada com os módulos certos para o seu segmento — nada a mais, nada a menos.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <Link to="/orcamento">Montar minha solução <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com especialista
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OUTCOMES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6">
              <div className="w-10 h-10 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-semibold tracking-tight">{title}</div>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* SEGMENTS */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Soluções pensadas para o seu segmento</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Cada negócio tem suas regras. Mostramos abaixo as combinações de módulos que mais
              entregam resultado em cada setor — todas personalizáveis.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SEGMENTS.map(({ icon: Icon, title, desc, modules, segmento, dores }) => (
              <Card key={title} className="p-6 hover:shadow-elegant transition-shadow flex flex-col">
                <div className="w-11 h-11 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-semibold tracking-tight text-lg">{title}</div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed flex-1">{desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {modules.map((m) => (
                    <span key={m} className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[11px]">
                      {m}
                    </span>
                  ))}
                </div>
                <Button asChild size="sm" variant="outline" className="mt-5 w-full gap-2">
                  <Link
                    to="/orcamento"
                    search={{ segmento, dores: dores.join(","), origem: "solucoes" }}
                  >
                    Quero esta solução <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FLOW */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Da captação ao pós-venda, em um único fluxo</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Tudo conectado: o que entra no marketing termina no relatório financeiro, sem planilhas paralelas.
          </p>
        </div>
        <div className="grid md:grid-cols-5 gap-4">
          {FLOW.map((s) => (
            <Card key={s.step} className="p-5 relative overflow-hidden">
              <div className="text-[11px] font-mono text-primary">{s.step}</div>
              <div className="font-semibold tracking-tight mt-1">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* MODULES STRIP */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Todos os módulos disponíveis</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Cada solução combina apenas o que você precisa — e cresce com você.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/modulos">Ver detalhes de cada módulo <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ALL_MODULES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-md border border-border bg-card">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "Implantação guiada", d: "Onboarding com especialista, importação de base e treinamento da equipe." },
            { t: "Suporte humano", d: "Atendimento por WhatsApp e e-mail em horário comercial estendido." },
            { t: "Sem fidelidade obrigatória", d: "Planos mensais. Anuais com desconto e benefícios extras." },
          ].map((g) => (
            <div key={g.t} className="flex gap-3 p-5 rounded-lg border border-border bg-card">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold tracking-tight">{g.t}</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{g.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="p-10 lg:p-14 bg-gradient-primary text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-3xl space-y-5">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Conte o que você precisa resolver. Mostramos a solução exata em minutos.
            </h2>
            <p className="text-white/85 leading-relaxed">
              Briefing inteligente: responda 6 perguntas e receba a recomendação personalizada.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <Link to="/orcamento">Começar briefing <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Link to="/demo">Ver o sistema em ação</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
