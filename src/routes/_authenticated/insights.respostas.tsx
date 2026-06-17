import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, Building2, Activity, BarChart3, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/insights/respostas")({
  head: () => ({ meta: [{ title: "Dashboard de Respostas — Impulsionando" }] }),
  component: RespostasPage,
});

const STORAGE_KEY = "impulsionando.onboarding.v1";

interface OnboardingState {
  step: number;
  goal: string | null;
  goalDetail: string;
  niche: string | null;
  nicheDetail: string;
  diag: { teamSize: string; mainPain: string; monthlyRevenue: string; tools: string };
  outcome: { metric: string; target: string; horizon: string };
}

const GOAL_LABELS: Record<string, string> = {
  vender_mais: "Vender mais",
  organizar: "Organizar a operação",
  cobrar_melhor: "Cobrar melhor",
  fidelizar: "Fidelizar clientes",
  escalar: "Escalar para multi-unidade",
  reduzir_custo: "Reduzir custo operacional",
};
const NICHE_LABELS: Record<string, string> = {
  restaurante: "Restaurante / Bar",
  imobiliaria: "Imobiliária",
  saude: "Saúde / Clínica",
  agenda: "Estética / Serviços com agenda",
  varejo: "Varejo / Comércio",
  educacao: "Educação / Cursos",
  servicos: "Serviços B2B",
  outro: "Outro",
};

function RespostasPage() {
  const [state, setState] = useState<OnboardingState | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      setState(raw ? JSON.parse(raw) : null);
    } catch {
      setState(null);
    }
  }, []);

  if (!state || !state.goal) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <PageHeader title="Dashboard de Respostas" description="Suas respostas do onboarding aparecem aqui." />
        <Card className="p-8 text-center">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Você ainda não respondeu o onboarding.</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Responda 5 perguntas rápidas pra gente montar seu plano de ação.
          </p>
          <Button asChild>
            <Link to="/onboarding">Começar agora <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <PageHeader title="Dashboard de Respostas" description="O que você nos contou no onboarding." />

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Target className="h-4 w-4" /> Objetivo principal
          </div>
          <div className="text-lg font-semibold">{GOAL_LABELS[state.goal] ?? state.goal}</div>
          {state.goalDetail && <div className="text-sm text-muted-foreground mt-1">"{state.goalDetail}"</div>}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Building2 className="h-4 w-4" /> Nicho
          </div>
          <div className="text-lg font-semibold">{state.niche ? (NICHE_LABELS[state.niche] ?? state.niche) : "—"}</div>
          {state.nicheDetail && <div className="text-sm text-muted-foreground mt-1">{state.nicheDetail}</div>}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Activity className="h-4 w-4" /> Diagnóstico
          </div>
          <dl className="text-sm space-y-1">
            <div><dt className="inline text-muted-foreground">Equipe: </dt><dd className="inline">{state.diag.teamSize || "—"}</dd></div>
            <div><dt className="inline text-muted-foreground">Faturamento: </dt><dd className="inline">{state.diag.monthlyRevenue || "—"}</dd></div>
            <div><dt className="inline text-muted-foreground">Ferramentas: </dt><dd className="inline">{state.diag.tools || "—"}</dd></div>
            <div><dt className="inline text-muted-foreground">Maior dor: </dt><dd className="inline">{state.diag.mainPain || "—"}</dd></div>
          </dl>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <BarChart3 className="h-4 w-4" /> Resultado esperado
          </div>
          <div className="text-lg font-semibold">
            {state.outcome.metric || "—"} {state.outcome.target ? `→ ${state.outcome.target}` : ""}
          </div>
          <Badge variant="outline" className="mt-2">Horizonte: {state.outcome.horizon}</Badge>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/insights/oportunidades">Ver Central de Oportunidades <ArrowRight className="h-4 w-4 ml-2" /></Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/onboarding"><RefreshCw className="h-4 w-4 mr-2" /> Refazer onboarding</Link>
        </Button>
      </div>
    </div>
  );
}
