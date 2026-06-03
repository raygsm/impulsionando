import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Store, ArrowRight, HelpCircle, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demonstração — Impulsionando Tecnologia" },
      { name: "description", content: "Teste agora a plataforma Impulsionando. Escolha entre o ambiente white-label (revenda) ou o sistema para cliente final e explore módulos, permissões, agenda, CRM, financeiro e BI." },
      { property: "og:title", content: "Demonstração — Impulsionando Tecnologia" },
      { property: "og:description", content: "Ambiente de demonstração interativo, sem cadastro. Explore o sistema antes de contratar." },
    ],
  }),
  component: DemoLanding,
});

function DemoLanding() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />

        <main className="flex-1 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-gradient-primary mb-4">Acesso livre • sem cadastro</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Como você pretende usar a Impulsionando?
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Escolha a trilha de demonstração que combina com o seu objetivo. Os dois ambientes
              são totalmente navegáveis, com todos os painéis, permissionamentos, setores e usuários
              configurados — exatamente como no sistema real.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <HelpCircle className="w-3.5 h-3.5" />
              Durante toda a navegação, ícones de interrogação explicam cada recurso.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <DemoOptionCard
              to="/demo/white-label"
              icon={Building2}
              badge="White-label"
              title="Quero revender (ter meu próprio sistema)"
              description="Para agências, integradores e empresas de tecnologia que querem oferecer o sistema como sua própria marca. Veja painel master, gestão de clientes (empresas contratantes), nichos, módulos liberados e cobrança."
              points={[
                "Painel master e multiempresa",
                "Gestão de clientes, planos e módulos",
                "Personalização de marca e domínio",
                "Relatórios consolidados por nicho",
              ]}
              cta="Entrar no DEMO White-label"
            />
            <DemoOptionCard
              to="/demo/cliente-final"
              icon={Store}
              badge="Cliente final"
              title="Quero usar para o meu negócio"
              description="Para bares, restaurantes, clínicas, salões, profissionais da saúde e demais nichos. Veja agenda, CRM, vendas/PDV, estoque, financeiro, comissões e BI prontos para operar."
              points={[
                "Agenda, CRM e atendimento",
                "Vendas, PDV e fechamento de caixa",
                "Estoque, financeiro e comissões",
                "BI e relatórios operacionais",
              ]}
              cta="Entrar no DEMO Cliente Final"
            />
          </div>

          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            <FeatureChip icon={Sparkles} title="Dados de exemplo" text="Tudo já vem preenchido para você navegar sem configurar nada." />
            <FeatureChip icon={ShieldCheck} title="Listas suspensas" text="Cadastros usam opções padronizadas — sem texto livre que polua o histórico." />
            <FeatureChip icon={Zap} title="Reset com 1 clique" text="Botão de Zerar Dados disponível no rodapé do ambiente DEMO." />
          </div>
        </main>

        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

function DemoOptionCard({
  to, icon: Icon, badge, title, description, points, cta,
}: {
  to: string; icon: React.ComponentType<{ className?: string }>; badge: string;
  title: string; description: string; points: string[]; cta: string;
}) {
  return (
    <Card className="p-8 shadow-elegant hover:shadow-card-hover transition-shadow flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
          <Icon className="w-6 h-6" />
        </div>
        <Badge variant="outline">{badge}</Badge>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
      <ul className="mt-4 space-y-2 text-sm flex-1">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center gap-2">
        <Button asChild className="bg-gradient-primary shadow-elegant flex-1">
          <Link to={to}>
            {cta} <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Ajuda">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            Esse é um ambiente de demonstração. Nada que você fizer aqui afeta o sistema real, e
            você pode zerar os dados a qualquer momento pelo rodapé.
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
}

function FeatureChip({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="w-4 h-4 text-primary" /> {title}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
