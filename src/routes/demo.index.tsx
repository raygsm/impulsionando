import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Store, ArrowRight, HelpCircle, Sparkles, ShieldCheck, Zap, LogIn, Workflow, Plug, KeyRound, Smartphone, Database, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";

export const Route = createFileRoute("/demo/")({
  head: () => ({
    meta: [
      { title: "Demonstração — Impulsionando Tecnologia" },
      { name: "description", content: "Teste agora a plataforma Impulsionando. Escolha entre o ambiente white-label (revenda) ou o sistema para cliente final e explore módulos, permissões, agenda, CRM, financeiro e BI." },
      { property: "og:title", content: "Demonstração — Impulsionando Tecnologia" },
      { property: "og:description", content: "Ambiente de demonstração interativo, sem cadastro. Explore o sistema antes de contratar." },
      { property: "og:url", content: "https://impulsionando.com.br/demo" },
    
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo" }],
  }),
  component: DemoLanding,
});

function DemoLanding() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <DemoModeBanner />

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
            <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <HelpCircle className="w-3.5 h-3.5" />
                Durante toda a navegação, ícones de interrogação explicam cada recurso.
              </div>
              <Button asChild size="sm" className="bg-gradient-primary">
                <Link to="/demo/modulos">Vitrine de Módulos & Contratação demo</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/demo/checklist">Ver checklist de prontidão</Link>
              </Button>
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

          {/* Como funciona o acesso real */}
          <section className="mt-16">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <Badge variant="outline" className="mb-3">Acesso real, na prática</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Como funciona depois que você contrata</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Você não precisa instalar nada. O sistema é 100% web, responsivo e roda em qualquer
                navegador. Veja o passo a passo do acesso real.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <StepCard step={1} icon={KeyRound} title="Convite & senha" text="Cada usuário recebe convite por e-mail, define a própria senha e ativa MFA (opcional)." />
              <StepCard step={2} icon={LogIn} title="Login isolado" text="Acesso por subdomínio da sua empresa. Dados, usuários e configurações ficam isolados (multi-tenant)." />
              <StepCard step={3} icon={ShieldCheck} title="Perfis & permissões" text="Cada perfil libera apenas os módulos e ações que o usuário precisa. Auditoria registra tudo." />
              <StepCard step={4} icon={Smartphone} title="Web e mobile" text="Mesmo sistema funciona em desktop, tablet e celular — sem app para instalar." />
            </div>
          </section>

          {/* O que está configurado */}
          <section className="mt-16">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">O que já está configurado na demonstração</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Não é maquete. Cada módulo opera com dados reais, fluxos completos e integrações ativas
                — exatamente como em produção.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard icon={Workflow} title="Fluxos completos" items={["Venda → estoque → financeiro", "Agenda → comissão → relatório", "Lead → cliente → venda", "Compra → fornecedor → estoque"]} />
              <InfoCard icon={Plug} title="Integrações ativas" items={["WhatsApp para confirmações", "Pix, cartões, dinheiro, boleto", "Comprovantes e relatórios em PDF", "Webhooks e API REST"]} />
              <InfoCard icon={Database} title="Dados & relatórios" items={["KPIs em tempo real", "BI consolidado por módulo", "Exportação para Excel/CSV", "Histórico auditável"]} />
              <InfoCard icon={ShieldCheck} title="Segurança & LGPD" items={["Multi-tenant com RLS no banco", "Auditoria de cada alteração", "Consentimento e anonimização", "Backups automáticos"]} />
              <InfoCard icon={MessageCircle} title="Comunicação" items={["Notificações in-app", "E-mails transacionais", "WhatsApp do cliente final", "Suporte humano por chat"]} />
              <InfoCard icon={Sparkles} title="Pronto pra usar" items={["Sem instalação local", "Templates por nicho", "Onboarding guiado", "Migração de dados assistida"]} />
            </div>
          </section>

          {/* Diferenças DEMO vs real */}
          <section className="mt-16">
            <div className="rounded-xl border bg-card p-6 md:p-8">
              <h2 className="text-xl font-bold tracking-tight">DEMO × Sistema real</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tudo o que você vê no DEMO existe no sistema real. A diferença está em onde os dados moram.
              </p>
              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Ambiente DEMO (você está aqui)</div>
                  <ul className="mt-2 text-sm space-y-1.5">
                    <li>• Dados salvos no seu navegador (localStorage)</li>
                    <li>• Sem cadastro, sem cartão, sem compromisso</li>
                    <li>• Reset com 1 clique a qualquer momento</li>
                    <li>• Mesma UI, mesmos fluxos do produto real</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                  <div className="text-xs uppercase tracking-wider text-primary font-semibold">Sistema real (após contratar)</div>
                  <ul className="mt-2 text-sm space-y-1.5">
                    <li>• Dados em banco seguro com backup automático</li>
                    <li>• Multi-usuário, multi-unidade, multi-tenant</li>
                    <li>• Integrações WhatsApp/Pagamentos/E-mail ativas</li>
                    <li>• Suporte humano, onboarding e migração inclusos</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild className="bg-gradient-primary shadow-elegant">
                  <Link to="/orcamento">Quero um orçamento personalizado <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contato">Falar com um especialista</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

function StepCard({ step, icon: Icon, title, text }: { step: number; icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-5 relative">
      <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-elegant">
        {step}
      </div>
      <Icon className="w-5 h-5 text-primary" />
      <div className="mt-2 font-semibold text-sm">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function InfoCard({ icon: Icon, title, items }: { icon: React.ComponentType<{ className?: string }>; title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Icon className="w-4 h-4 text-primary" /> {title}
      </div>
      <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
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
