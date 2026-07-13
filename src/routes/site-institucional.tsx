/**
 * /site-institucional — Landing pública do produto Site Institucional Impulsionando.
 *
 * Onda 2 do roadmap: primeira porta de entrada de tenants novos.
 * Leva o visitante para /checkout/site-institucional (fluxo Mercado Pago
 * existente, plano `site-institucional` cadastrado em mp_plans).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, CheckCircle2, Globe, Zap, ShieldCheck, MessageCircle,
  Search, Rocket, ArrowRight, Clock,
} from "lucide-react";

export const Route = createFileRoute("/site-institucional")({
  head: () => ({
    meta: [
      { title: "Site Institucional profissional — R$ 1.500 · Impulsionando" },
      { name: "description", content: "Site institucional entregue em até 10 dias úteis: até 6 páginas, SEO, formulário no CRM, WhatsApp integrado, hospedagem e domínio inclusos. R$ 1.500 pagamento único." },
      { property: "og:title", content: "Site Institucional Impulsionando — R$ 1.500" },
      { property: "og:description", content: "Até 6 páginas, SEO, CRM, WhatsApp, hospedagem e domínio inclusos. Entrega em 10 dias." },
      { property: "og:url", content: "https://impulsionando.com.br/site-institucional" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/site-institucional" }],
  }),
  component: SiteInstitucionalPage,
});

const INCLUI = [
  { icon: Globe, title: "Até 6 páginas", desc: "Home, Sobre, Serviços, Blog, Contato e uma landing page de campanha." },
  { icon: Search, title: "SEO técnico completo", desc: "Title, description, Open Graph, sitemap, robots e schema.org configurados." },
  { icon: MessageCircle, title: "WhatsApp + Formulário no CRM", desc: "Leads caem direto no CRM Impulsionando, com resposta automática." },
  { icon: ShieldCheck, title: "Hospedagem + SSL grátis 1º ano", desc: "Infra Impulsionando, backup diário e certificado seguro." },
  { icon: Zap, title: "Performance e Analytics", desc: "Google Analytics, Search Console e otimização de carregamento." },
  { icon: Rocket, title: "Domínio .com.br configurado", desc: "Registramos ou apontamos seu domínio sem custo extra de mão-de-obra." },
];

const ETAPAS = [
  { n: "1", titulo: "Briefing (dia 1)", desc: "Enviamos o formulário; você preenche identidade, textos e imagens." },
  { n: "2", titulo: "Estrutura + design (dias 2 a 5)", desc: "Montamos rascunho navegável no seu subdomínio Impulsionando." },
  { n: "3", titulo: "Ajustes (dias 6 a 8)", desc: "Você revisa; aplicamos ajustes de conteúdo, cor e imagens." },
  { n: "4", titulo: "Publicação (dias 9 a 10)", desc: "Apontamos o domínio, ativamos SSL, entregamos o site no ar." },
];

function SiteInstitucionalPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <Badge className="bg-white/15 text-primary-foreground border-0 mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Onboarding Impulsionando
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Site Institucional profissional em até 10 dias úteis
            </h1>
            <p className="mt-4 text-white/85 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Até 6 páginas, SEO técnico, formulário no CRM, WhatsApp integrado, hospedagem e domínio inclusos.
              Pagamento único de <strong>R$ 1.500</strong>.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                <Link to="/checkout/$slug" params={{ slug: "site-institucional" }}>
                  Contratar agora <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white gap-2">
                <a href="https://wa.me/5521999999999?text=Quero%20o%20Site%20Institucional%20Impulsionando"
                   target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/70 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Prazo médio: 10 dias úteis · Hospedagem grátis no 1º ano
            </p>
          </div>
        </section>

        {/* O QUE INCLUI */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-2">O que está incluso</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tudo pronto para o seu site vender, não só existir
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUI.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="surface-2 border-y border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-2">Como funciona</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                4 etapas, prazo garantido em contrato
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ETAPAS.map((e) => (
                <Card key={e.n} className="p-5">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold mb-3">
                    {e.n}
                  </div>
                  <h3 className="font-semibold mb-1">{e.titulo}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PREÇO */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 border-primary/30 shadow-xl">
            <div className="text-center">
              <Badge className="mb-3">Pagamento único</Badge>
              <div className="text-5xl font-bold tracking-tight">R$ 1.500</div>
              <p className="text-sm text-muted-foreground mt-2">
                Pix, cartão em até 12x ou boleto · Hospedagem grátis no 1º ano
              </p>
            </div>
            <ul className="mt-6 space-y-2 max-w-md mx-auto">
              {INCLUI.map((item) => (
                <li key={item.title} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="flex-1 gap-2">
                <Link to="/checkout/$slug" params={{ slug: "site-institucional" }}>
                  Contratar agora <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1 gap-2">
                <Link to="/vitrine">Ver quem já é parceiro</Link>
              </Button>
            </div>
            <p className="mt-4 text-[11px] text-center text-muted-foreground">
              A partir do 13º mês: hospedagem + domínio a R$ 49/mês. Cancele quando quiser.
            </p>
            <p className="mt-6 text-center text-sm">
              Já contratou?{" "}
              <Link to="/briefing/site-institucional" className="text-primary font-medium hover:underline">
                Preencher o briefing agora →
              </Link>
            </p>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
