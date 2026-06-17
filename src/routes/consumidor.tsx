import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Sparkles, MapPin, Bell, History, Trophy, Heart,
  Calendar, Gift, Crown, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

export const Route = createFileRoute("/consumidor")({
  head: () => ({
    meta: [
      { title: "Clube Impulsionando — Descubra lugares, acumule benefícios" },
      { name: "description", content: "Entre grátis no Clube Impulsionando. Descubra bares, restaurantes, cervejarias e eventos próximos, receba vantagens exclusivas e participe das experiências da nossa rede de parceiros." },
      { property: "og:title", content: "Clube Impulsionando — Vantagens exclusivas para você" },
      { property: "og:description", content: "Cadastro grátis. Descubra parceiros, acumule pontos, receba alertas e curta experiências exclusivas." },
      { property: "og:url", content: "https://impulsionando.com.br/consumidor" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/consumidor" }],
  }),
  component: ClubeLanding,
});

const FREE_FEATURES = [
  { icon: MapPin,   title: "Parceiros próximos",     desc: "Descubra bares, restaurantes, cervejarias, cafés e eventos perto de você." },
  { icon: Sparkles, title: "Busca inteligente",      desc: "Filtre por comida, bebida, ambiente e estilo musical." },
  { icon: Gift,     title: "Promoções e vouchers",   desc: "Cupons, happy hours, combos e brindes liberados pelos parceiros." },
  { icon: Heart,    title: "Favoritos e avaliações", desc: "Salve seus lugares preferidos e avalie experiências." },
  { icon: Calendar, title: "Agenda de eventos",      desc: "Shows, festivais, degustações e encontros gastronômicos." },
  { icon: Trophy,   title: "Programa de indicação",  desc: "Indique amigos e ganhe pontos, cupons e benefícios." },
];

const PREMIUM_FEATURES = [
  { icon: History, title: "Histórico completo de consumo", desc: "Onde, quando, o que e quanto você consumiu — quando o parceiro permitir." },
  { icon: Sparkles, title: "Biblioteca pessoal",            desc: "Suas cervejas, restaurantes e eventos preferidos, com ticket médio e evolução." },
  { icon: Bell,    title: "Alertas inteligentes",          desc: "Avise quando rolar IPA, costela BBQ, festival de hambúrguer, blues ao vivo, e mais." },
  { icon: Trophy,  title: "Participação nas decisões",     desc: "Vote em bandas, pratos e eventos das suas marcas favoritas." },
  { icon: Crown,   title: "Cashback e vantagens",          desc: "Cashback ampliado, vouchers e experiências exclusivas dos parceiros." },
  { icon: Gift,    title: "Nota fiscal organizada",        desc: "Cupons, notas e comprovantes em um só lugar, prontos pra exportar." },
];

const COMPARE_ROWS = [
  { feat: "Descobrir parceiros próximos",       free: true,  premium: true  },
  { feat: "Filtros (comida, bebida, ambiente, música)", free: true, premium: true },
  { feat: "Promoções, vouchers e cupons",       free: true,  premium: true  },
  { feat: "Favoritos e avaliações",             free: true,  premium: true  },
  { feat: "Agenda de eventos",                  free: true,  premium: true  },
  { feat: "Programa de indicação",              free: true,  premium: true  },
  { feat: "Histórico completo de consumo",      free: false, premium: true  },
  { feat: "Biblioteca pessoal de experiências", free: false, premium: true  },
  { feat: "Alertas inteligentes por interesse", free: false, premium: true  },
  { feat: "Participação em enquetes exclusivas",free: false, premium: true  },
  { feat: "Cashback ampliado",                  free: false, premium: true  },
  { feat: "Nota fiscal digital organizada",     free: false, premium: true  },
];

const LEVELS = [
  { name: "Explorador",     visits: "Cadastro inicial" },
  { name: "Frequentador",   visits: "5 visitas"        },
  { name: "Entusiasta",     visits: "20 visitas"       },
  { name: "Embaixador",     visits: "50 visitas"       },
  { name: "Lenda do Clube", visits: "100 visitas"      },
];

function ClubeLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <Badge className="bg-white/15 text-primary-foreground border-0 mb-4">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Clube Impulsionando
            </Badge>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Descubra lugares, acumule benefícios <br className="hidden sm:block" />
              e viva experiências exclusivas
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
              Bares, restaurantes, cervejarias, cafeterias, hamburguerias, eventos e muito mais — perto de você, com vantagens reais da rede Impulsionando.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                <Link to="/auth" search={{ mode: "signup" } as any}>
                  Entrar gratuitamente <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto">
                <Link to="/checkout/$plano" params={{ plano: "clube_premium" }}>
                  <Crown className="w-4 h-4" /> Assinar Premium · R$ 9,99/mês
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/70">Sem cobrança no plano grátis. Cancele o Premium quando quiser.</p>
          </div>
        </section>

        {/* O QUE VOCÊ GANHA NO FREE */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-3">Clube Free</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Já no cadastro grátis você recebe benefícios reais</h2>
            <p className="mt-3 text-muted-foreground">Sem mensalidade. Sem letras miúdas. Crie sua conta e comece a usar.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6 flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* PREMIUM */}
        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge className="bg-gradient-primary mb-3"><Crown className="w-3 h-3 mr-1" /> Clube Premium · R$ 9,99/mês</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Inteligência, histórico e participação</h2>
              <p className="mt-3 text-muted-foreground">Mais do que descontos: o Premium aprende com você e abre portas que o cadastro grátis não tem.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PREMIUM_FEATURES.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="p-6 flex flex-col border-primary/20">
                  <div className="w-11 h-11 rounded-xl bg-gradient-primary text-primary-foreground inline-flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold tracking-tight">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARATIVO */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Free vs Premium</h2>
            <p className="mt-3 text-muted-foreground">Comece grátis. Evolua quando quiser.</p>
          </div>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] text-sm">
              <div className="px-4 sm:px-6 py-4 bg-muted/40 font-semibold">Recurso</div>
              <div className="px-4 sm:px-6 py-4 bg-muted/40 text-center font-semibold">Free</div>
              <div className="px-4 sm:px-6 py-4 bg-gradient-primary text-primary-foreground text-center font-semibold">Premium</div>
              {COMPARE_ROWS.map((row) => (
                <FeatureRow key={row.feat} {...row} />
              ))}
            </div>
            <div className="px-4 sm:px-6 py-5 border-t bg-muted/20 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <p className="text-sm text-muted-foreground">Premium por <strong className="text-foreground">R$ 9,99/mês</strong>. Cancele quando quiser.</p>
              <Button asChild size="sm" className="bg-gradient-primary">
                <Link to="/checkout/$plano" params={{ plano: "clube_premium" }}>Assinar Premium</Link>
              </Button>
            </div>
          </Card>
        </section>

        {/* GAMIFICAÇÃO */}
        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <Badge variant="secondary" className="mb-3"><Trophy className="w-3 h-3 mr-1" /> Gamificação</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Suba de nível a cada visita</h2>
              <p className="mt-3 text-muted-foreground">Cada nível desbloqueia novos benefícios, cupons e experiências.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {LEVELS.map((l, i) => (
                <Card key={l.name} className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center mb-2 font-bold">{i + 1}</div>
                  <div className="font-semibold text-sm">{l.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{l.visits}</div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Pronto pra entrar no Clube?</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Crie sua conta grátis em menos de 1 minuto e comece a aproveitar os benefícios da rede Impulsionando hoje mesmo.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary gap-2 w-full sm:w-auto">
              <Link to="/auth" search={{ mode: "signup" } as any}>
                Entrar gratuitamente <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <Link to="/checkout/$plano" params={{ plano: "clube_premium" }}>
                <Crown className="w-4 h-4" /> Assinar Premium
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function FeatureRow({ feat, free, premium }: { feat: string; free: boolean; premium: boolean }) {
  return (
    <>
      <div className="px-4 sm:px-6 py-3 border-t text-sm">{feat}</div>
      <div className="px-4 sm:px-6 py-3 border-t text-center">
        {free ? <Check className="w-4 h-4 mx-auto text-primary" /> : <X className="w-4 h-4 mx-auto text-muted-foreground/50" />}
      </div>
      <div className="px-4 sm:px-6 py-3 border-t text-center bg-primary/5">
        {premium ? <Check className="w-4 h-4 mx-auto text-primary" /> : <X className="w-4 h-4 mx-auto text-muted-foreground/50" />}
      </div>
    </>
  );
}
