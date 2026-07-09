import { createFileRoute, Link } from "@tanstack/react-router";
import { LifeBuoy, MessageCircle, Mail, Ticket, BookOpen, ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { openImpulsionito } from "@/lib/impulsionito-tracking";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte — Impulsionando" },
      { name: "description", content: "Canais de atendimento, base de conhecimento e abertura de chamados do Ecossistema Impulsionando." },
      { property: "og:title", content: "Suporte — Impulsionando" },
      { property: "og:description", content: "Fale com o Impulsionito, abra um chamado ou acesse a base de conhecimento." },
    ],
  }),
  component: SuportePage,
});

type Channel = {
  icon: typeof MessageCircle;
  title: string;
  description: string;
  cta: string;
  href?: string;
  to?: string;
  external?: boolean;
  onClick?: () => void;
};

const CHANNELS: Channel[] = [
  {
    icon: MessageCircle,
    title: "Impulsionito — Assistente Impulsionando",
    description: "Atendimento humano + IA, das 8h às 22h (BRT). Resposta em até 5 min em horário comercial.",
    cta: "Falar agora",
    onClick: () => openImpulsionito("suporte-central"),
  },
  {
    icon: Ticket,
    title: "Abrir chamado",
    description: "Para problemas técnicos com SLA: registre um ticket e acompanhe o status pelo painel.",
    cta: "Abrir ticket",
    to: "/abrir-ticket",
  },
  {
    icon: Mail,
    title: "E-mail",
    description: "suporte@impulsionando.com.br — resposta em até 1 dia útil.",
    cta: "Enviar e-mail",
    href: "mailto:suporte@impulsionando.com.br",
    external: true,
  },
  {
    icon: BookOpen,
    title: "Base de conhecimento",
    description: "Tutoriais, vídeos e guias por nicho. Resolva sozinho em minutos.",
    cta: "Explorar",
    to: "/nichos",
  },
];

function SuportePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <LifeBuoy className="h-3.5 w-3.5" /> Central de Suporte
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              Como podemos ajudar você hoje?
            </h1>
            <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
              Escolha o canal que faz mais sentido. Nossa missão é destravar seu crescimento — não te deixar esperando.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 gap-4">
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              return (
                <article key={c.title} className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-foreground">{c.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                      <div className="mt-4">
                        {"external" in c && c.external ? (
                          <Button asChild size="sm" variant="outline" className="gap-1.5">
                            <a href={c.href} target="_blank" rel="noopener noreferrer">
                              {c.cta} <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="outline" className="gap-1.5">
                            <Link to={c.to!}>
                              {c.cta} <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">É cliente Impulsionando?</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
              Entre na sua conta para abrir tickets com SLA, ver o histórico, escalar pelo seu gerente de sucesso e acompanhar incidentes em tempo real.
            </p>
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <Button asChild className="bg-gradient-primary">
                <Link to="/auth">Entrar na minha conta</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/ecossistema">Conhecer o Ecossistema</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
