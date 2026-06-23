import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Info,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20contratar%20o%20m%C3%B3dulo%20";

export interface ModuleDetail {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  desc: string;
  badge: { label: string; className: string };
  /** Resumo de 1 linha provocativo. */
  hook: string;
  /** O que o cliente ganha (benefícios). */
  benefits: string[];
  /** Como funciona, passo a passo (jornada). */
  howItWorks: { step: string; detail: string }[];
  /** Exemplos reais de aplicação. */
  examples: string[];
  /** Diferenciais técnicos. */
  features: string[];
  /** Integrações disponíveis. */
  integrations?: string[];
  /** KPIs de impacto típicos. */
  impact: string[];
  /** Para quem é. */
  forWho: string;
  /** CTA principal (texto do botão). */
  ctaLabel?: string;
  /** Rota interna para demo/showroom (opcional). */
  demoRoute?: string;
}

interface Props {
  module: ModuleDetail;
  trigger: ReactNode;
}

export function ModuleDetailDialog({ module, trigger }: Props) {
  const Icon = module.icon;
  const waUrl =
    WHATSAPP_URL + encodeURIComponent(module.title) + "%20da%20Impulsionando.";

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header gradiente */}
        <div className="bg-gradient-primary text-primary-foreground p-6 sm:p-8 rounded-t-lg relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge
                  variant="outline"
                  className={`text-[10px] border-white/30 text-white bg-white/10`}
                >
                  {module.badge.label}
                </Badge>
                <span className="text-[10px] uppercase tracking-wider opacity-80">
                  Módulo Impulsionando
                </span>
              </div>
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight text-white">
                  {module.title}
                </DialogTitle>
                <DialogDescription className="text-white/85 text-sm leading-relaxed">
                  {module.hook}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Para quem */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-1">
              <Target className="w-4 h-4 text-primary" /> Para quem é
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {module.forWho}
            </p>
          </div>

          {/* Benefícios */}
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4 text-primary" /> O que você ganha
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {module.benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-sm leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Como funciona — Jornada */}
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Zap className="w-4 h-4 text-primary" /> Como funciona na prática
            </div>
            <ol className="space-y-2.5">
              {module.howItWorks.map((s, i) => (
                <li key={s.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.step}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {s.detail}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Exemplos */}
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Info className="w-4 h-4 text-primary" /> Exemplos reais
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {module.examples.map((e) => (
                <div
                  key={e}
                  className="text-xs leading-relaxed p-3 rounded-md bg-muted/40 border"
                >
                  {e}
                </div>
              ))}
            </div>
          </section>

          {/* Recursos */}
          <section>
            <div className="text-sm font-semibold mb-3">Recursos incluídos</div>
            <div className="flex flex-wrap gap-1.5">
              {module.features.map((f) => (
                <Badge key={f} variant="secondary" className="text-[11px]">
                  {f}
                </Badge>
              ))}
            </div>
          </section>

          {/* Integrações */}
          {module.integrations && module.integrations.length > 0 && (
            <section>
              <div className="text-sm font-semibold mb-2">Integrações</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {module.integrations.join(" · ")}
              </p>
            </section>
          )}

          {/* Impacto */}
          <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Impacto esperado
            </div>
            <ul className="space-y-1.5">
              {module.impact.map((i) => (
                <li
                  key={i}
                  className="text-xs leading-relaxed flex items-start gap-2"
                >
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* CTAs */}
          <div className="border-t pt-5 space-y-3">
            <div className="text-sm font-semibold">
              Pronto para começar agora?
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-2 bg-gradient-primary">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />{" "}
                  {module.ctaLabel ?? "Contratar agora no WhatsApp"}
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/orcamento">
                  Montar orçamento <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              {module.demoRoute && (
                <Button asChild variant="ghost" className="gap-2">
                  <Link to={module.demoRoute}>
                    Ver na demo <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Resposta em até 1 dia útil. Sem compromisso. Sem cadastro
              obrigatório.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
