import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Circle, ArrowRight, Target, Building2, Sparkles, ShoppingCart,
  Users, BarChart3, Megaphone, Calendar, MessageCircle, FileText, Rocket,
  Settings, CreditCard, Award, Compass,
} from "lucide-react";

type Step = {
  key: string;
  title: string;
  description: string;
  cta: string;
  to: string;
  icon: typeof Target;
  search?: Record<string, string>;
};

const STEPS: Step[] = [
  { key: "boas-vindas", title: "1. Boas-vindas ao Impulsionando", description: "Entenda em 60s o que é o sistema e como ele vai trabalhar pelo seu negócio.", cta: "Conhecer o sistema", to: "/como-funciona", icon: Compass },
  { key: "nicho", title: "2. Identifique seu nicho", description: "Escolha o seu nicho para receber recomendações sob medida.", cta: "Escolher nicho", to: "/escolher-nicho", icon: Target },
  { key: "simulador", title: "3. Simule sua operação", description: "Veja seu negócio rodando com módulos integrados em tempo real.", cta: "Abrir simulador", to: "/demo/simulador", icon: BarChart3 },
  { key: "modulos", title: "4. Selecione módulos essenciais", description: "Marque CRM, agenda, financeiro, atendimento e o que precisar.", cta: "Ver módulos", to: "/demo/modulos", icon: Sparkles },
  { key: "plano", title: "5. Compare planos", description: "Essencial, Integrado ou Avançado — escolha pelo seu momento.", cta: "Ver planos", to: "/planos", icon: Award },
  { key: "checkout", title: "6. Contrate online (Pix em 1 minuto)", description: "Cadastro + pagamento via Pix, cartão ou boleto.", cta: "Ir para checkout", to: "/escolher-nicho", icon: ShoppingCart },
  { key: "empresa", title: "7. Configure sua empresa", description: "Logo, dados fiscais, equipe e canal oficial de WhatsApp.", cta: "Abrir cadastro", to: "/demo/cadastro", icon: Building2 },
  { key: "equipe", title: "8. Convide sua equipe", description: "Vendas, atendimento e financeiro, com permissões por papel.", cta: "Ver equipe (demo)", to: "/showroom/onboarding", icon: Users },
  { key: "crm", title: "9. Importe seus leads e clientes", description: "Comece a operar o funil em minutos.", cta: "Conhecer o CRM", to: "/demo/crm", icon: Target },
  { key: "agenda", title: "10. Configure agenda e horários", description: "Profissionais, salas, regras e bloqueios.", cta: "Abrir agenda", to: "/demo/agenda", icon: Calendar },
  { key: "whatsapp", title: "11. Ligue o WhatsApp oficial", description: "Conecte sua linha WABA ou use o número Impulsionando.", cta: "Ativar WhatsApp", to: "/demo/whatsapp", icon: MessageCircle },
  { key: "marketing", title: "12. Suba sua primeira régua", description: "Recuperação de carrinho, follow-up e reativação automáticas.", cta: "Ver réguas", to: "/modulos/funil-marketing-automatico", icon: Megaphone },
  { key: "fiscal", title: "13. Conecte emissão fiscal", description: "NFS-e/NF-e automáticas após a venda.", cta: "Conhecer fiscal", to: "/modulos/fiscal-completo", icon: FileText },
  { key: "pagamentos", title: "14. Configure recebimentos", description: "Pix, cartão, boleto, split e antecipação.", cta: "Ver pagamentos", to: "/modulos/pagamentos-completos", icon: CreditCard },
  { key: "lancamento", title: "15. Lance e acompanhe resultados", description: "Dashboard ao vivo de leads, vendas, agenda e financeiro.", cta: "Ver dashboard demo", to: "/demo", icon: Rocket },
];

const STORAGE_KEY = "impulsionando.onboarding.v1";

function loadDone(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

function OnboardingPage() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => { setDone(loadDone()); }, []);

  function toggle(key: string) {
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function reset() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    setDone({});
  }

  const completed = STEPS.filter((s) => done[s.key]).length;
  const pct = Math.round((completed / STEPS.length) * 100);

  return (
    <div className="min-h-dvh bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-4xl">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-2">Onboarding guiado</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Sua jornada Impulsionando em 15 passos</h1>
          <p className="text-muted-foreground">
            Do "nunca usei" até "operando 100% no automático". Marque cada etapa conforme avança — seu progresso fica salvo neste dispositivo.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Progresso</div>
                <div className="text-2xl font-bold">{completed} de {STEPS.length} etapas</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{pct}%</div>
                {completed > 0 && (
                  <button onClick={reset} className="text-xs text-muted-foreground hover:underline">
                    reiniciar
                  </button>
                )}
              </div>
            </div>
            <Progress value={pct} />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = !!done[step.key];
            return (
              <Card key={step.key} className={isDone ? "border-emerald-500/50 bg-emerald-500/5" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggle(step.key)}
                      aria-label={isDone ? "Marcar como pendente" : "Marcar como concluído"}
                      className="mt-0.5 shrink-0"
                    >
                      {isDone
                        ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        : <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base">{step.title}</CardTitle>
                      </div>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pl-14">
                  <Button asChild size="sm" variant={isDone ? "outline" : "default"}>
                    <Link to={step.to as any} search={step.search as any}>
                      {step.cta} <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {completed === STEPS.length && (
          <Card className="mt-8 border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                <CardTitle>Você concluiu o onboarding!</CardTitle>
              </div>
              <CardDescription>Seu Impulsionando está pronto para operar. Que tal falar com o time para revisar a estratégia?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild><Link to="/contato">Falar com o time</Link></Button>
              <Button asChild variant="outline"><Link to="/abrir-ticket">Abrir ticket de suporte</Link></Button>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Precisa de ajuda em alguma etapa?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/abrir-ticket">Abrir ticket</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/contato">Falar com consultor</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/canal-oficial">Canal oficial WhatsApp</Link></Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/onboarding-guiado")({
  head: () => ({
    meta: [
      { title: "Onboarding guiado em 15 passos | Impulsionando" },
      { name: "description", content: "Do zero ao Impulsionando rodando no automático — siga 15 passos com progresso salvo." },
    ],
  }),
  component: OnboardingPage,
});
