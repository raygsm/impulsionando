import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Boxes,
  KeyRound,
  BarChart3,
  Store,
  Receipt,
  LifeBuoy,
  Lock,
  Palette,
  Layers,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { SectionHeader, StatGrid, TrustBadges } from "@/components/impulsionando";

/* --------------------------- Console do Parceiro --------------------------- */

type ConsoleCard = {
  icon: typeof Building2;
  title: string;
  description: string;
  bullets: string[];
  to?: string;
  toHash?: string;
  demoTo: string;
  demoHash?: string;
};

const CARDS: ConsoleCard[] = [
  {
    icon: Building2,
    title: "Clientes (multi-tenant)",
    description: "Cadastre, ative, suspenda e migre clientes. Cada empresa é um tenant isolado com dados, usuários e branding próprios.",
    bullets: ["Onboarding guiado por nicho", "Templates aplicados automaticamente", "Isolamento total entre clientes"],
    demoTo: "/demo/white-label",
  },
  {
    icon: Boxes,
    title: "Planos & módulos",
    description: "Monte a sua tabela de planos, defina limites por volume e ative agenda, CRM, PDV, BI, WhatsApp e demais módulos por plano.",
    bullets: ["2 a N planos por parceiro", "Limites por MRR / usuários / lojas", "Ativação de módulos por cliente"],
    demoTo: "/demo/white-label",
  },
  {
    icon: KeyRound,
    title: "Perfis & permissões",
    description: "Modelos reutilizáveis de acesso para aplicar em qualquer cliente em segundos. Permissões granulares por módulo.",
    bullets: ["RBAC granular", "Perfis reutilizáveis", "SSO + MFA no console"],
    demoTo: "/demo/white-label",
  },
  {
    icon: BarChart3,
    title: "Relatórios consolidados",
    description: "MRR, churn, NPS, uso de módulos e comparativos por nicho e plano. Painel executivo do parceiro.",
    bullets: ["BI cross-clientes", "Alertas de churn e uso", "Exportação CSV/PDF"],
    demoTo: "/demo/white-label",
  },
  {
    icon: Receipt,
    title: "Financeiro do parceiro",
    description: "Cobrança recorrente dos seus clientes na sua conta. Suporte a gateway próprio (Mercado Pago, Stripe, PagSeguro).",
    bullets: ["Recorrência automatizada", "Split e repasse", "Conciliação e extrato"],
    demoTo: "/demo/white-label",
  },
  {
    icon: LifeBuoy,
    title: "Suporte white-label",
    description: "Sua equipe atende seus clientes com a sua marca. Nossa engenharia entra apenas via escalonamento controlado.",
    bullets: ["Central de tickets", "Base de conhecimento própria", "Escalonamento para a Impulsionando"],
    demoTo: "/demo/white-label",
  },
  {
    icon: Store,
    title: "Vitrine própria",
    description: "Página pública de captação com seus planos, cases e os 8 nichos-modelo já homologados do ecossistema.",
    bullets: ["Landing por nicho", "8 verticais herdados", "Personalização por parceiro"],
    demoTo: "/demo/white-label",
  },
  {
    icon: Palette,
    title: "Marca & domínio",
    description: "Logotipo, paleta, e-mails transacionais e domínio próprio. Cada parceiro tem a sua identidade em todos os pontos.",
    bullets: ["sistemas.suamarca.com", "E-mails assinados", "Paleta e tipografia próprias"],
    demoTo: "/demo/white-label",
  },
  {
    icon: Lock,
    title: "Isolamento entre parceiros",
    description: "Arquitetura multi-tenant nativa: nenhum parceiro enxerga outro; nenhum cliente-final enxerga outro cliente-final.",
    bullets: ["RLS por parceiro e por cliente", "Auditoria completa", "LGPD by design"],
    demoTo: "/demo/white-label",
  },
];

const STATS = [
  { value: "9", label: "capacidades do console" },
  { value: "8", label: "verticais herdados" },
  { value: "48h", label: "para publicação" },
  { value: "100%", label: "marca própria" },
];

const TRUST = [
  { title: "Isolamento por RLS", description: "Dados de cada parceiro e cliente-final segregados por Row-Level Security multi-tenant." },
  { title: "SSO & MFA", description: "Login corporativo e segundo fator no console do parceiro." },
  { title: "Auditoria completa", description: "Trilha de criação, alteração e remoção com ator, ação e alvo." },
  { title: "LGPD by design", description: "DPO, ROPA e políticas herdadas do core Impulsionando." },
];

/* -------------------------------- Route -------------------------------- */

export const Route = createFileRoute("/white-label/parceiro")({
  head: () => ({
    meta: [
      { title: "Console do Parceiro — White Label | Impulsionando" },
      { name: "description", content: "Console oficial do parceiro White Label: clientes multi-tenant, planos, módulos, permissões, vitrine, relatórios, financeiro, suporte e isolamento." },
      { property: "og:title", content: "Console do Parceiro — White Label Impulsionando" },
      { property: "og:description", content: "Nove capacidades do console do parceiro, cada uma com demo navegável." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: PartnerConsoleHub,
});

function PartnerConsoleHub() {
  return (
    <div data-tenant="whitelabel" className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] mb-4">
              <Layers className="h-3.5 w-3.5" /> Console do Parceiro
            </div>
            <h1 className="font-serif text-3xl md:text-5xl leading-tight max-w-3xl">
              Nove capacidades para revender o ecossistema Impulsionando com sua marca.
            </h1>
            <p className="opacity-85 mt-4 max-w-2xl">
              Explore cada área do console. Todas já vêm implementadas — nenhuma
              linha de código do seu lado. Abra a demonstração para navegar em um
              ambiente real com dados de exemplo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-background text-primary hover:bg-background/90 gap-2">
                <Link to="/demo/white-label">
                  Abrir demo do console <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/white-label">Voltar para a apresentação</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          <StatGrid stats={STATS} columns={4} />
        </section>

        {/* Cards do console */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <SectionHeader
            eyebrow="Capacidades homologadas"
            title="Cada card é uma área navegável do console"
            description="Clique em 'Abrir demo' para explorar cada área com dados de exemplo do parceiro fictício."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-10">
            {CARDS.map(({ icon: Icon, title, description, bullets, demoTo }) => (
              <Card key={title} className="p-6 flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-lg mb-2">{title}</h2>
                <p className="text-sm opacity-75 leading-relaxed">{description}</p>
                <ul className="mt-4 space-y-2 text-sm flex-1">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="opacity-90">{b}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-5 gap-2">
                  <Link to={demoTo}>
                    Abrir demo <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <SectionHeader
              eyebrow="Garantias de plataforma"
              title="Segurança, isolamento e conformidade herdados do core"
            />
            <div className="mt-10">
              <TrustBadges badges={TRUST} columns={4} />
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Pronto para operar sua marca sobre o core Impulsionando?
          </h2>
          <p className="opacity-80 max-w-xl mx-auto mb-8">
            Fale com um especialista, apresente sua carteira e receba a proposta
            com plano, módulos, cronograma de implantação e integração de gateway.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/white-label">Ver planos White Label</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/demo/white-label">Explorar console navegável</Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
