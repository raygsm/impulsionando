import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, PlayCircle, MessageCircle, Stethoscope, UtensilsCrossed, Dumbbell,
  Briefcase, Store, Sparkles, Calendar, HeartPulse, Users, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20automatizar%20minha%20empresa%20com%20a%20Impulsionando.";

const APLICACOES = [
  { icon: HeartPulse, title: "Saúde", desc: "Clínicas, consultórios e terapias — agenda, prontuário, lembretes e área do paciente." },
  { icon: Briefcase, title: "Serviços", desc: "Prestadores e consultorias — orçamentos, agenda, CRM e cobrança em um fluxo só." },
  { icon: UtensilsCrossed, title: "Alimentação", desc: "Bares, restaurantes e delivery — PDV, comandas, cupons e fidelidade." },
  { icon: Calendar, title: "Eventos", desc: "Produtores e casas de show — ingressos, lotes, check-in e transferência." },
  { icon: Store, title: "Comércio", desc: "Lojas e e-commerce — PDV, estoque, recompra e clube de vantagens." },
  { icon: Dumbbell, title: "Bem-estar", desc: "Academias, estúdios e personal — planos, avaliações e cobrança recorrente." },
  { icon: Users, title: "Comunidades", desc: "Associações, clubes e franquias — multi-unidade, permissões e financeiro consolidado." },
  { icon: Sparkles, title: "Projetos personalizados", desc: "Operações fora do padrão — módulos sob medida e integrações dedicadas." },
];

const SOLUCAO = [
  { title: "Atendimento e comercial", desc: "CRM, funis, WhatsApp automatizado e integração com leads." },
  { title: "Operação", desc: "Agenda, PDV, estoque, ordens de serviço e checkout." },
  { title: "Financeiro", desc: "Cobrança recorrente, Pix, cartão, conciliação e nota fiscal." },
  { title: "Fidelização e crescimento", desc: "Cupons, indicações, afiliados, programas de pontos e BI." },
];

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — Automatize sua operação | Impulsionando Tecnologia" },
      { name: "description", content: "Plataforma modular para empresas: CRM, agenda, PDV, financeiro, WhatsApp, BI e automações por segmento. Veja a solução, aplicações por nicho e planos." },
      { property: "og:title", content: "Empresas — Impulsionando Tecnologia" },
      { property: "og:description", content: "Centralize vendas, atendimento, pagamentos e relacionamento em uma plataforma adaptável ao seu negócio." },
      { property: "og:url", content: "https://impulsionando.com.br/empresas" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/empresas" }],
  }),
  component: EmpresasPage,
});

function SectionAnchor({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-24">{children}</section>;
}

function EmpresasPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* SUBNAV da jornada */}
        <div className="sticky top-16 sm:top-20 md:top-24 lg:top-28 z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto">
            <nav className="flex items-center gap-1 text-xs sm:text-sm min-w-max">
              {[
                { href: "#visao-geral", label: "Visão Geral" },
                { href: "#solucao", label: "Solução" },
                { href: "#aplicacoes", label: "Aplicações por Nicho" },
                { href: "#demonstracoes", label: "Demonstrações" },
                { href: "#planos", label: "Planos" },
              ].map((it) => (
                <a key={it.href} href={it.href} className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap">
                  {it.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* VISÃO GERAL / HERO */}
        <SectionAnchor id="visao-geral">
          <div className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
            <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
            <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 text-center">
              <Badge className="bg-white/15 text-primary-foreground border-0 mb-4">Empresas</Badge>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Automatize sua empresa de ponta a ponta
              </h1>
              <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
                Centralize vendas, atendimento, pagamentos, automação e relacionamento em uma única
                plataforma adaptável ao seu negócio.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
                <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                  <a href="#planos">Quero automatizar minha empresa <ArrowRight className="w-4 h-4" /></a>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto">
                  <a href="#demonstracoes"><PlayCircle className="w-4 h-4" /> Ver demonstração</a>
                </Button>
              </div>
            </div>
          </div>
        </SectionAnchor>

        {/* SOLUÇÃO */}
        <SectionAnchor id="solucao">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-3xl mb-8">
              <Badge variant="secondary" className="mb-3">Solução</Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Uma plataforma, quatro frentes de impacto
              </h2>
              <p className="text-muted-foreground mt-3 leading-relaxed text-sm sm:text-base">
                Recursos organizados pelos objetivos de negócio que mais importam para a sua operação.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SOLUCAO.map((b) => (
                <Card key={b.title} className="p-5 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b.desc}</p>
                </Card>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild size="lg" className="bg-gradient-primary gap-2">
                <a href="#planos">Quero automatizar minha empresa <ArrowRight className="w-4 h-4" /></a>
              </Button>
            </div>
          </div>
        </SectionAnchor>

        {/* APLICAÇÕES POR NICHO */}
        <SectionAnchor id="aplicacoes">
          <div className="bg-muted/30 border-y border-border">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <div className="max-w-3xl mb-8">
                <Badge variant="secondary" className="mb-3">Aplicações por nicho</Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                  A mesma plataforma, contextualizada para o seu segmento
                </h2>
                <p className="text-muted-foreground mt-3 leading-relaxed text-sm sm:text-base">
                  Nichos são aplicações da solução — não produtos separados. Cada segmento recebe
                  módulos, telas e automações alinhados à sua realidade.
                </p>
              </div>
              <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {APLICACOES.map(({ icon: Icon, title, desc }) => (
                  <Card key={title} className="p-5 sm:p-6 flex flex-col">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </SectionAnchor>

        {/* DEMONSTRAÇÕES */}
        <SectionAnchor id="demonstracoes">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <Badge variant="secondary" className="mb-3"><PlayCircle className="w-3.5 h-3.5 mr-1" /> Demonstração</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Veja a plataforma rodando em uma operação real
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Ambiente navegável com agenda, CRM, vendas, financeiro e BI configurados.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-primary gap-2 w-full sm:w-auto">
                <Link to="/demo"><PlayCircle className="w-4 h-4" /> Ver demonstração</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  Solicitar implantação <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </SectionAnchor>

        {/* PLANOS + CTA */}
        <SectionAnchor id="planos">
          <div className="bg-muted/30 border-y border-border">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
              <Badge variant="secondary" className="mb-3"><Layers className="w-3.5 h-3.5 mr-1" /> Planos</Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Comece pelo essencial e escale conforme cresce
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Planos por número de módulos ativos. Sem fidelidade obrigatória, com trial de 7 dias.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
                <Button asChild size="lg" className="bg-gradient-primary gap-2 w-full sm:w-auto">
                  <Link to="/planos" search={{ audience: "empresas" }}>
                    Quero automatizar minha empresa <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" className="btn-whatsapp gap-2 w-full sm:w-auto">
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4" /> Falar com especialista
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </SectionAnchor>
      </main>
      <PublicFooter />
    </div>
  );
}
