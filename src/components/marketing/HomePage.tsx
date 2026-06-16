import { Link } from "@tanstack/react-router";
import {
  MessageCircle, ArrowRight, CheckCircle2, Sparkles,
  Info, Target, Building2, Layers, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { MODULE_DETAILS } from "./moduleDetails";
import { NICHO_DETAILS } from "./nichoDetails";
import { WhatsAppBlock } from "./WhatsAppBlock";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20a%20Impulsionando%20Tecnologia%20sobre%20m%C3%B3dulos%2C%20automa%C3%A7%C3%A3o%2C%20agenda%20online%2C%20WhatsApp%2C%20CRM%20ou%20sistemas%20personalizados.";

const PAINS = [
  "Atendimento desorganizado",
  "Perda de leads",
  "Demora no WhatsApp",
  "Agenda manual",
  "Falta de confirmação de pagamento",
  "Falta de CRM",
  "Ausência de indicadores",
  "Retrabalho operacional",
  "Falta de integração entre ferramentas",
];


const PLANS = [
  { name: "Essencial", modules: "1 módulo", price: "R$ 297", suffix: "/mês", desc: "Resolva a dor principal com rapidez." },
  { name: "Integrado", modules: "2 módulos", price: "R$ 697", suffix: "/mês", desc: "Conecte duas áreas críticas da operação.", highlight: true },
  { name: "Avançado", modules: "3 módulos", price: "R$ 997", suffix: "/mês", desc: "Jornada digital completa de ponta a ponta." },
  { name: "Sob Medida", modules: "Múltiplos módulos", price: "Sob consulta", suffix: "", desc: "Projeto exclusivo, integrações e regras próprias." },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <main className="flex-1">
      {/* HERO — seletor de público */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Grupo Impulsionando · Tecnologia + Marketing
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Quem é você?
            </h1>
            <p className="text-lg text-white/85 leading-relaxed">
              Escolha o caminho que combina com o seu objetivo. A plataforma é a mesma —
              o que muda é o jeito que ela trabalha pra você.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* EMPRESA */}
            <Card className="group p-7 flex flex-col bg-white text-foreground hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Sou uma empresa</div>
              <h2 className="text-2xl font-bold tracking-tight">
                Quero automatizar meu negócio
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
                Clínica, imobiliária, restaurante, academia, concessionária, escritório, comércio.
                Sistema pronto para o seu segmento com agenda, CRM, WhatsApp, financeiro e BI.
              </p>
              <Button asChild className="mt-6 gap-2 bg-gradient-primary shadow-elegant">
                <Link to="/empresas">
                  Quero automatizar meu negócio <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>

            {/* WHITE LABEL */}
            <Card className="group p-7 flex flex-col bg-white text-foreground hover:shadow-card-hover transition-all md:scale-[1.02] md:-translate-y-1 ring-1 ring-accent/40">
              <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent inline-flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <div className="text-xs uppercase tracking-wider text-accent mb-1">Quero minha própria plataforma</div>
              <h2 className="text-2xl font-bold tracking-tight">
                White Label
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
                Agências, consultorias, franqueadoras e grupos empresariais.
                Sua marca, seu domínio, seus clientes, seu faturamento — sem precisar desenvolver.
              </p>
              <Button asChild className="mt-6 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/white-label">
                  Quero vender minha própria plataforma <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>

            {/* CONSUMIDOR */}
            <Card className="group p-7 flex flex-col bg-white text-foreground hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-muted text-foreground inline-flex items-center justify-center mb-4">
                <UserRound className="w-6 h-6" />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Sou consumidor</div>
              <h2 className="text-2xl font-bold tracking-tight">
                Entrar na minha área
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
                Quero acessar minhas agendas, pedidos, eventos, cupons, programas de fidelidade
                e serviços contratados em empresas que usam a plataforma.
              </p>
              <Button asChild variant="outline" className="mt-6 gap-2">
                <Link to="/auth">
                  Entrar na minha área <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
              <Link to="/demo">Ver demonstrações <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" className="btn-whatsapp gap-2">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Falar com Especialista
              </a>
            </Button>
          </div>
          <p className="text-xs text-white/70 pt-4 text-center">
            Procura apenas marketing digital? Vá direto para a{" "}
            <a href="https://impulsionandobrasil.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-white font-medium">
              Impulsionando Brasil
            </a>.
          </p>
        </div>
      </section>


      {/* PARCERIA GRUPO IMPULSIONANDO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Parceria Grupo Impulsionando
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Você quer marketing, sistema — ou os dois trabalhando juntos?
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Somos duas empresas do mesmo grupo, com times integrados. Você pode contratar cada uma separadamente
            ou combinar marketing e tecnologia em uma operação única, sem retrabalho entre fornecedores.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="p-7 flex flex-col">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Impulsionando Brasil</div>
            <div className="text-xl font-semibold tracking-tight">Marketing, estratégia e crescimento</div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
              Social Media, Tráfego Pago, Google Ads, Assessoria de Marketing Digital e Empresarial, funis,
              jornadas, lançamentos de produtos e marcas, CRM estratégico, automação no WhatsApp,
              posicionamento e estruturação comercial.
            </p>
            <Button asChild variant="outline" className="mt-5 gap-2">
              <a href="https://impulsionandobrasil.com.br" target="_blank" rel="noopener noreferrer">
                Acessar Impulsionando Brasil <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </Card>
          <Card className="p-7 flex flex-col border-primary shadow-elegant ring-1 ring-primary/20">
            <div className="text-xs uppercase tracking-wider text-primary mb-2">Impulsionando Tecnologia · você está aqui</div>
            <div className="text-xl font-semibold tracking-tight">Sistemas, plataformas e automação</div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
              Criamos sistemas completos, modulares, inteligentes e adaptados à realidade da sua operação:
              CRM, agenda online, WhatsApp automatizado, checkout, PDV, dashboards, áreas administrativas
              e integrações sob medida.
            </p>
            <Button asChild className="mt-5 gap-2">
              <Link to="/orcamento">Quero criar meu sistema <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </Card>
        </div>
        <Card className="mt-5 p-6 bg-muted/40 border-dashed">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold tracking-tight">Combo Marketing + Tecnologia</div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Estratégia sem sistema vira intenção. Sistema sem estratégia vira ferramenta solta.
                Contratando o grupo, você tem um único ponto de contato cuidando da captação, do funil,
                do atendimento, da venda e da operação — com dados conversando entre marketing e plataforma.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/contato">Quero falar com o grupo</Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp direto
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>


      {/* PAINS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">O que resolvemos</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            A Impulsionando Tecnologia organiza processos digitais para reduzir retrabalho, melhorar atendimento, aumentar conversão e dar mais clareza à operação.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PAINS.map((p) => (
            <div key={p} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">{p}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Soluções modulares</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Comece pelo módulo que resolve a maior dor agora. Adicione novos módulos a qualquer momento, conforme a operação evolui.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULE_DETAILS.map((mod) => {
              const Icon = mod.icon;
              return (
                <Card key={mod.id} className="p-6 hover:shadow-elegant transition-shadow flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${mod.badge.className}`}>
                      {mod.badge.label}
                    </span>
                  </div>
                  <div className="font-semibold tracking-tight">{mod.title}</div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed flex-1">{mod.desc}</p>
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm" className="w-full gap-1.5 group">
                      <Link to="/modulos/$slug" params={{ slug: mod.id }}>
                        <Info className="w-3.5 h-3.5" />
                        SAIBA MAIS
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-10">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/modulos">Ver todos os módulos <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* NICHOS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs mb-3">
            <Target className="w-3.5 h-3.5" /> Soluções por nicho
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Cada nicho tem dor própria. Cada dor tem solução pronta.
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Clínicas, bares e restaurantes, microcervejarias, fornecedores, serviços, e-commerce, fitness e White Label —
            com jornada prática, módulos recomendados e demonstração.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NICHO_DETAILS.map((n) => {
            const Icon = n.icon;
            return (
              <Card key={n.slug} className="p-6 hover:shadow-elegant transition-shadow flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-semibold tracking-tight leading-tight">{n.shortLabel}</div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{n.cardDesc}</p>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="w-full gap-1.5 group">
                    <Link to="/nichos/$slug" params={{ slug: n.slug }}>
                      Ver nicho
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="mt-10">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/nichos">Explorar todos os nichos <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      {/* WHATSAPP */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
        <WhatsAppBlock />
      </section>

      {/* PLANS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Contrate por módulos</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Comece com 1 módulo, contrate 2 ou 3 simultâneos ou avance para um projeto sob medida. Valores simulados, sujeitos a validação comercial.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={
                "p-6 flex flex-col " +
                (plan.highlight ? "border-primary shadow-elegant ring-1 ring-primary/20" : "")
              }
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{plan.modules}</div>
              <div className="text-xl font-semibold tracking-tight mt-1">{plan.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.suffix && <span className="text-sm text-muted-foreground">{plan.suffix}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">{plan.desc}</p>
              <Button asChild className="mt-6 w-full" variant={plan.highlight ? "default" : "outline"}>
                <Link to="/planos">Ver detalhes</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="p-10 lg:p-14 bg-gradient-primary text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-3xl space-y-5">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Não existe mais limite real para o que pode ser integrado, automatizado ou conectado.
            </h2>
            <p className="text-white/85 leading-relaxed">
              O ponto inteligente é começar pelo módulo que resolve a maior dor agora.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com a Impulsionando Tecnologia
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Link to="/orcamento">Orçamento automático</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
      </main>

      <PublicFooter />
    </div>
  );
}
