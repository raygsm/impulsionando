import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  HelpCircle,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/demo/trial")({
  head: () => ({
    meta: [
      { title: "Trial × Demonstração — Impulsionando Tecnologia" },
      {
        name: "description",
        content:
          "Entenda a diferença entre Demonstração (gratuita, com dados fictícios) e Trial (contratação real com cartão de crédito e reembolso automático em até 7 dias).",
      },
      { property: "og:title", content: "Trial × Demonstração — Impulsionando Tecnologia" },
      {
        property: "og:description",
        content:
          "Trial é contratação real do sistema com cartão de crédito. Cancelamento e reembolso automático em até 7 dias após o pagamento.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrialExplained,
});

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground transition-colors align-middle"
          aria-label="Mais informações"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

const STATUS = [
  { key: "contratado", label: "Trial contratado", icon: CreditCard, tone: "default" },
  { key: "aprovado", label: "Pagamento aprovado", icon: CheckCircle2, tone: "success" },
  { key: "liberado", label: "Acesso liberado", icon: Sparkles, tone: "success" },
  { key: "cancelamento", label: "Cancelamento solicitado", icon: RefreshCw, tone: "warn" },
  { key: "dentro", label: "Dentro do prazo de reembolso (até 7 dias)", icon: Clock, tone: "success" },
  { key: "fora", label: "Fora do prazo de reembolso", icon: XCircle, tone: "warn" },
  { key: "ref_solicitado", label: "Reembolso automático solicitado", icon: RefreshCw, tone: "default" },
  { key: "ref_processando", label: "Reembolso processando", icon: RefreshCw, tone: "default" },
  { key: "ref_concluido", label: "Reembolso concluído", icon: CheckCircle2, tone: "success" },
  { key: "ref_indisponivel", label: "Reembolso não disponível", icon: XCircle, tone: "warn" },
  { key: "convertido", label: "Trial convertido em plano ativo", icon: Sparkles, tone: "success" },
  { key: "cancelado", label: "Trial cancelado", icon: XCircle, tone: "warn" },
];

function TrialExplained() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <DemoModeBanner />

        <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 w-full">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge className="bg-gradient-primary mb-4">Trial — contratação real</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Trial não é demonstração. Trial é contratação.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              O Trial da Impulsionando Tecnologia é uma{" "}
              <strong>contratação inicial do sistema com pagamento por cartão de crédito</strong>.
              Você pode cancelar e solicitar reembolso automático em até{" "}
              <strong>7 dias após o horário da contratação</strong>, conforme regras da oferta e do
              gateway de pagamento.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/trial">
                  Contratar Trial <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/demo">Conhecer a Demonstração (grátis)</Link>
              </Button>
            </div>
          </div>

          {/* Comparativo */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="p-6 border-2">
              <Badge variant="outline" className="mb-3">Demonstração</Badge>
              <h2 className="text-xl font-semibold mb-2">Para conhecer a plataforma</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Gratuita e sem cadastro</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Dados fictícios e ambiente seguro</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Ideal para conhecer recursos</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Não gera contratação real</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Sem cobrança real (apenas simulação)</li>
              </ul>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/demo">Entrar na Demonstração</Link>
              </Button>
            </Card>

            <Card className="p-6 border-2 border-primary/50 bg-primary/[0.02]">
              <Badge className="bg-gradient-primary mb-3">Trial</Badge>
              <h2 className="text-xl font-semibold mb-2">Para contratar e operar</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><CreditCard className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Contratação real com cartão de crédito <Tip>O pagamento é processado pelo gateway. A liberação de acesso é imediata após aprovação.</Tip></li>
                <li className="flex gap-2"><Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Acesso inicial à operação real do sistema</li>
                <li className="flex gap-2"><RefreshCw className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Cancelamento + reembolso automático em até 7 dias <Tip>Conta-se a partir do horário exato do pagamento aprovado. Após o prazo, valem as regras comerciais do plano.</Tip></li>
                <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Sujeito às regras da oferta e do gateway</li>
                <li className="flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /> Após o prazo, passam a valer as regras do plano contratado</li>
              </ul>
              <Button asChild className="mt-4 w-full">
                <Link to="/trial">Contratar Trial agora</Link>
              </Button>
            </Card>
          </div>

          {/* Regras do reembolso */}
          <Card className="p-6 mb-12">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-6 h-6 text-primary shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Reembolso automático em até 7 dias <Tip>O sistema dispara o reembolso pelo mesmo gateway que processou a cobrança. O prazo de retorno ao cartão depende da operadora (geralmente 5 a 30 dias).</Tip>
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Se o cliente cancelar dentro de até 7 dias após o horário do pagamento aprovado,
                  o sistema prevê <strong>reembolso automático</strong>, conforme integração do
                  gateway de pagamento.
                </p>
                <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Reembolso automático preparado</strong> — aguardando credenciais do
                    gateway para processamento em produção. Em ambiente atual, o fluxo é registrado
                    e auditado mas não dispara a chamada real ao gateway.
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Status possíveis */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">
              Status possíveis do Trial <Tip>Cada mudança de status gera evento em <code>trial_events</code> e notifica o cliente por e-mail e WhatsApp quando aplicável.</Tip>
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              O ciclo completo, do pagamento ao reembolso ou conversão em plano ativo.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STATUS.map((s) => {
                const Icon = s.icon;
                const toneClass =
                  s.tone === "success"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : s.tone === "warn"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border bg-muted/30";
                return (
                  <div key={s.key} className={`rounded-md border p-3 flex items-center gap-3 ${toneClass}`}>
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Elementos da página de trial */}
          <Card className="p-6 mb-12">
            <h2 className="text-xl font-semibold mb-4">O que você verá ao contratar o Trial</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium mb-2 text-muted-foreground">Dados do plano</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Nome do plano e módulos incluídos</li>
                  <li>• Valor e forma de pagamento</li>
                  <li>• Horário da contratação</li>
                  <li>• Política de cancelamento e reembolso</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-muted-foreground">Dados do contratante</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Nome, CPF/CNPJ, e-mail, WhatsApp, empresa</li>
                  <li>• Cartão de crédito válido</li>
                  <li>• Aceite dos termos</li>
                  <li>• Aceite da política de reembolso</li>
                  <li>• Confirmação de ciência do prazo de 7 dias</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/trial">Iniciar contratação</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/reembolso">Política de reembolso</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/termos">Termos de uso</Link>
              </Button>
            </div>
          </Card>

          {/* FAQ curta */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Perguntas rápidas</h2>
            <div className="space-y-3">
              <Card className="p-4">
                <h3 className="font-medium">O Trial é gratuito?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Não. O Trial é uma contratação real com cobrança no cartão de crédito. O que
                  existe é a garantia de reembolso automático em até 7 dias após o pagamento.
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="font-medium">Qual a diferença para a Demonstração?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  A <Link to="/demo" className="text-primary hover:underline">Demonstração</Link> é
                  gratuita, usa dados fictícios e serve para conhecer a plataforma. O Trial é
                  contratação real com acesso à operação.
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="font-medium">Como peço o reembolso?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Dentro do prazo de 7 dias, o cancelamento dispara o reembolso automaticamente
                  pelo gateway. Após o prazo, passam a valer as regras do plano contratado.
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="font-medium">Preciso de cartão para a Demonstração?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Não. A Demonstração não exige cadastro nem cartão. Apenas o Trial exige cartão de
                  crédito válido.
                </p>
              </Card>
            </div>
          </section>

          <div className="text-center">
            <Button asChild size="lg">
              <Link to="/trial">
                Contratar Trial <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </main>

        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}
