import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Layers, UserRound, ArrowRight, PlayCircle, MessageCircle,
} from "lucide-react";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20solicitar%20uma%20demonstra%C3%A7%C3%A3o%20da%20Impulsionando.";

export const Route = createFileRoute("/demo/")({
  head: () => ({
    meta: [
      { title: "Demonstrações — Empresas, White Label e Consumidor | Impulsionando" },
      { name: "description", content: "Escolha o público e veja a demonstração específica: automação para empresas, plataforma White Label ou área do consumidor." },
      { property: "og:title", content: "Demonstrações — Impulsionando" },
      { property: "og:description", content: "Demonstrações por público: Empresas, White Label e Consumidor." },
      { property: "og:url", content: "https://impulsionando.com.br/demo" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo" }],
  }),
  component: DemoLanding,
});

type AudienceCard = {
  icon: React.ElementType;
  badge: string;
  title: string;
  description: string;
  cta: string;
  to: string;
  implantationCta?: { label: string; href: string };
  accent?: boolean;
};

const AUDIENCES: AudienceCard[] = [
  {
    icon: Building2,
    badge: "Empresas",
    title: "Demonstração para empresas",
    description: "Plataforma navegável com agenda, CRM, vendas, financeiro, WhatsApp e BI — pronta para operar no seu segmento.",
    cta: "Ver demonstração",
    to: "/demo/modulos",
    implantationCta: { label: "Solicitar implantação", href: WHATSAPP_URL },
  },
  {
    icon: Layers,
    badge: "White Label",
    title: "Demonstração da plataforma White Label",
    description: "Painel master, gestão de clientes, módulos liberados, branding próprio e faturamento — operação de revenda completa.",
    cta: "Ver demonstração",
    to: "/demo/white-label",
    implantationCta: { label: "Solicitar implantação", href: WHATSAPP_URL },
    accent: true,
  },
  {
    icon: UserRound,
    badge: "Consumidor",
    title: "Demonstração da área do consumidor",
    description: "Benefícios, fidelidade, agendas, pedidos, cupons e eventos das empresas participantes — em um só lugar.",
    cta: "Ver demonstração",
    to: "/demo/cliente-final",
  },
];

function DemoLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />

      <main className="flex-1 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge className="bg-gradient-primary mb-4">Acesso livre · sem cadastro</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Escolha o público da demonstração
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Cada demonstração mostra apenas o que importa para o público selecionado, sem misturar
            conteúdos. Os recursos detalhados ficam nas jornadas de Empresas, White Label e Consumidor.
          </p>
        </div>

        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, badge, title, description, cta, to, implantationCta, accent }) => (
            <Card
              key={badge}
              className={`p-6 sm:p-7 flex flex-col ${accent ? "ring-1 ring-accent/40 shadow-elegant" : ""}`}
            >
              <div className={`w-12 h-12 rounded-xl ${accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"} inline-flex items-center justify-center mb-4 shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="self-start mb-3">{badge}</Badge>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">{description}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Button asChild className={`gap-2 w-full ${accent ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-gradient-primary"}`}>
                  <Link to={to}>
                    <PlayCircle className="w-4 h-4 shrink-0" /> {cta}
                  </Link>
                </Button>
                {implantationCta && (
                  <Button asChild variant="outline" size="sm" className="gap-1.5 w-full">
                    <a href={implantationCta.href} target="_blank" rel="noopener noreferrer">
                      {implantationCta.label} <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-primary/5 p-6 sm:p-8">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <Badge variant="outline" className="mb-2">🍺 Demo em forma de história</Badge>
              <h3 className="font-semibold text-lg tracking-tight">Beer House: uma sexta-feira, do QR Code ao dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                6 capítulos curtos mostram a operação real de uma cervejaria fictícia —
                pedido, pagamento, notificação multi-canal e BI conversando entre si.
              </p>
            </div>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/demo/beer-house"><PlayCircle className="w-4 h-4" /> Ler a história</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:p-8">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <Badge className="bg-gradient-primary mb-2">
                <PlayCircle className="w-3 h-3 mr-1" /> Modo Feira
              </Badge>
              <h3 className="font-semibold text-lg tracking-tight">Está em uma feira ou reunião agora?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Acesso imediato à demonstração no seu nicho com captura rápida (nome + WhatsApp + e-mail)
                e disparo automático de e-mail de boas-vindas.
              </p>
            </div>
            <Button asChild size="lg" className="bg-gradient-primary gap-2">
              <Link to="/demo/feira"><PlayCircle className="w-4 h-4" /> Abrir demo de feira</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-dashed border-border bg-muted/30 p-6 sm:p-8">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <h3 className="font-semibold text-lg tracking-tight">Prefere falar com alguém antes?</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Um especialista monta uma apresentação direcionada ao seu cenário e responde dúvidas
                de implantação, integrações e planos.
              </p>
            </div>
            <Button asChild size="lg" className="btn-whatsapp gap-2">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Falar com especialista
              </a>
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
