import { Link } from "@tanstack/react-router";
import {
  MessageCircle, ArrowRight, CheckCircle2, Sparkles,
  Building2, Store, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { ModuleDetailDialog } from "./ModuleDetailDialog";
import { MODULE_DETAILS } from "./moduleDetails";

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

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Plataforma modular para negócios reais
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Tecnologia, automação e sistemas inteligentes para empresas que precisam crescer com controle.
            </h1>
            <p className="text-lg text-white/80 max-w-2xl leading-relaxed">
              A Impulsionando Tecnologia cria soluções digitais modulares para atendimento, agenda online, WhatsApp, CRM, afiliados, pagamentos, emissão fiscal, relatórios, integrações e gestão operacional.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <Link to="/demo/white-label">
                  <Building2 className="w-4 h-4" /> Demo White Label <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/demo/cliente-final">
                  <Store className="w-4 h-4" /> Demo Cliente Final <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="gap-2 text-white hover:bg-white/10 hover:text-white">
                <Link to="/orcamento">Montar orçamento <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            <p className="text-xs text-white/70 pt-1">
              Acesso livre, sem cadastro. Escolha a trilha que combina com o seu objetivo.
            </p>
          </div>
        </div>
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
                    <ModuleDetailDialog
                      module={mod}
                      trigger={
                        <Button variant="outline" size="sm" className="w-full gap-1.5 group">
                          <Info className="w-3.5 h-3.5" />
                          SAIBA MAIS
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      }
                    />
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

      <PublicFooter />
    </div>
  );
}
