import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Target, Building2, Stethoscope, Home as HomeIcon, Calendar as CalendarIcon,
  ShoppingCart, GraduationCap, Briefcase, ArrowRight, ArrowLeft, CheckCircle2,
  AlertTriangle, Lightbulb, Rocket, Link2,
} from "lucide-react";
import { getCatalogIntent, consumeCatalogIntent, trackCatalogEvent } from "@/lib/catalogo.functions";

const onboardingSearchSchema = z.object({ intent: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Impulsionando" }] }),
  validateSearch: (search) => onboardingSearchSchema.parse(search),
  component: OnboardingPage,
});


// ────────────────────────────────────────────────────────────────────────────
// 5 camadas: melhorar → nicho → diagnóstico → resultado → como
// ────────────────────────────────────────────────────────────────────────────

type Goal = "vender_mais" | "organizar" | "cobrar_melhor" | "fidelizar" | "escalar" | "reduzir_custo";
type Niche = "restaurante" | "imobiliaria" | "saude" | "agenda" | "varejo" | "educacao" | "servicos" | "outro";

interface State {
  step: number;
  goal: Goal | null;
  goalDetail: string;
  niche: Niche | null;
  nicheDetail: string;
  diag: {
    teamSize: string;
    mainPain: string;
    monthlyRevenue: string;
    tools: string;
  };
  outcome: {
    metric: string;
    target: string;
    horizon: "30d" | "90d" | "6m" | "12m";
  };
}

const STORAGE_KEY = "impulsionando.onboarding.v1";

const DEFAULT_STATE: State = {
  step: 0,
  goal: null,
  goalDetail: "",
  niche: null,
  nicheDetail: "",
  diag: { teamSize: "", mainPain: "", monthlyRevenue: "", tools: "" },
  outcome: { metric: "", target: "", horizon: "90d" },
};

const GOALS: { id: Goal; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "vender_mais", label: "Vender mais", desc: "Crescer receita e fechar mais oportunidades.", icon: Rocket },
  { id: "organizar", label: "Organizar a operação", desc: "Parar de perder informação no WhatsApp e na cabeça.", icon: Target },
  { id: "cobrar_melhor", label: "Cobrar melhor", desc: "Reduzir inadimplência e automatizar faturas.", icon: Sparkles },
  { id: "fidelizar", label: "Fidelizar clientes", desc: "Aumentar recompra, programa premium e LTV.", icon: CheckCircle2 },
  { id: "escalar", label: "Escalar para multi-unidade", desc: "Padronizar processos para abrir filiais.", icon: Building2 },
  { id: "reduzir_custo", label: "Reduzir custo operacional", desc: "Automatizar tarefas e cortar retrabalho.", icon: AlertTriangle },
];

const NICHES: { id: Niche; label: string; icon: React.ComponentType<{ className?: string }>; targetRoute: string }[] = [
  { id: "restaurante", label: "Restaurante / Bar", icon: ShoppingCart, targetRoute: "/sales" },
  { id: "imobiliaria", label: "Imobiliária", icon: HomeIcon, targetRoute: "/imobiliaria/vitrine" },
  { id: "saude", label: "Saúde / Clínica", icon: Stethoscope, targetRoute: "/ehr" },
  { id: "agenda", label: "Estética / Serviços com agenda", icon: CalendarIcon, targetRoute: "/agenda" },
  { id: "varejo", label: "Varejo / Comércio", icon: ShoppingCart, targetRoute: "/sales/new" },
  { id: "educacao", label: "Educação / Cursos", icon: GraduationCap, targetRoute: "/affiliates/products" },
  { id: "servicos", label: "Serviços B2B", icon: Briefcase, targetRoute: "/crm/board" },
  { id: "outro", label: "Outro", icon: Sparkles, targetRoute: "/dashboard" },
];

// Recomendações por (goal, niche)
function recommend(state: State): { module: string; route: string; why: string }[] {
  const recs: { module: string; route: string; why: string }[] = [];
  const niche = state.niche;
  const goal = state.goal;

  if (goal === "vender_mais") {
    recs.push({ module: "CRM — Kanban de oportunidades", route: "/crm/board", why: "Centralize leads e mova pelo funil sem perder ninguém." });
    recs.push({ module: "Leads do site", route: "/marketing/leads", why: "Capture e responda leads em minutos." });
  }
  if (goal === "organizar") {
    recs.push({ module: "Agenda", route: "/agenda", why: "Visibilidade do dia e da semana, sem conflitos." });
    recs.push({ module: "Clientes", route: "/customers", why: "Cadastro único, histórico e contato." });
  }
  if (goal === "cobrar_melhor") {
    recs.push({ module: "Contratos recorrentes", route: "/admin/billing-contracts", why: "Faturamento automático + régua de cobrança." });
    recs.push({ module: "Log de Webhooks", route: "/finance/webhook-log", why: "Acompanhe pagamentos PIX/cartão e reprocesse falhas." });
  }
  if (goal === "fidelizar") {
    recs.push({ module: "Consumidor Premium", route: "/core/consumidor-premium", why: "Programa de assinatura para recompra." });
  }
  if (goal === "escalar") {
    recs.push({ module: "Unidades", route: "/units", why: "Cadastre filiais e segregue operação." });
    recs.push({ module: "Usuários e Perfis", route: "/users", why: "Defina quem acessa o quê em cada unidade." });
  }
  if (goal === "reduzir_custo") {
    recs.push({ module: "Central de Agentes (IA)", route: "/adm/agentes", why: "Automatize tarefas repetitivas com IA." });
  }

  if (niche === "restaurante") {
    recs.push({ module: "PDV / Pedidos", route: "/sales/new", why: "Comanda, mesa e fechamento de conta." });
  } else if (niche === "imobiliaria") {
    recs.push({ module: "Vitrine de imóveis", route: "/imobiliaria/vitrine", why: "Publique e capte interessados." });
  } else if (niche === "saude") {
    recs.push({ module: "Prontuário Eletrônico", route: "/ehr", why: "Atendimento, evolução e documentos." });
  } else if (niche === "agenda") {
    recs.push({ module: "Agendamentos", route: "/agenda/appointments", why: "Profissionais, serviços e horários." });
  } else if (niche === "varejo") {
    recs.push({ module: "Estoque", route: "/inventory", why: "Produtos, fornecedores e movimentações." });
  } else if (niche === "educacao") {
    recs.push({ module: "Produtos e Afiliados", route: "/affiliates/products", why: "Cursos, ofertas e comissões." });
  } else if (niche === "servicos") {
    recs.push({ module: "Funis de venda", route: "/crm/pipelines", why: "Adapte etapas ao seu processo comercial." });
  }

  // De-dup
  const seen = new Set<string>();
  return recs.filter((r) => (seen.has(r.route) ? false : (seen.add(r.route), true)));
}

function loadState(): State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

// Map catalog macro_slug → onboarding Niche id
const MACRO_TO_NICHE: Record<string, Niche> = {
  saude: "saude",
  psicologia: "saude",
  clinicas: "saude",
  laboratorios: "saude",
  juridico: "servicos",
  contabilidade: "servicos",
  imobiliarias: "imobiliaria",
  restaurantes: "restaurante",
  bares: "restaurante",
  eventos: "servicos",
  veiculos: "servicos",
  comercio: "varejo",
  industrias: "servicos",
  educacao: "educacao",
};

type CatalogIntentSnapshot = {
  id: string;
  macro_slug: string;
  subnicho_slug: string;
  plan_tier: string;
  selected_modules: string[];
};

function OnboardingPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/onboarding" });
  const fetchIntent = useServerFn(getCatalogIntent);
  const consumeIntent = useServerFn(consumeCatalogIntent);
  const track = useServerFn(trackCatalogEvent);
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [intent, setIntent] = useState<CatalogIntentSnapshot | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  // If ?intent=<uuid>, ALWAYS reload from server and pre-select niche/modules.
  // The server is the source of truth — local state never overrides it.
  useEffect(() => {
    if (!search.intent) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchIntent({ data: { id: search.intent! } });
        if (cancelled || !row) return;
        setIntent(row as CatalogIntentSnapshot);
        const mappedNiche = MACRO_TO_NICHE[row.macro_slug] ?? "outro";
        setState((s) => ({
          ...s,
          niche: mappedNiche,
          nicheDetail: row.subnicho_slug,
          step: Math.max(s.step, 1),
        }));
        track({
          data: {
            eventName: "onboarding_opened",
            macroSlug: row.macro_slug,
            subnichoSlug: row.subnicho_slug,
            planTier: row.plan_tier,
            selectedModules: row.selected_modules,
            intentId: row.id,
          },
        }).catch(() => {});
        consumeIntent({ data: { id: row.id } }).catch(() => {});
      } catch {
        /* silent */
      }
    })();
    return () => { cancelled = true; };
  }, [search.intent, fetchIntent, consumeIntent, track]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const totalSteps = 5;
  const progress = ((state.step + 1) / totalSteps) * 100;

  const canNext = useMemo(() => {
    switch (state.step) {
      case 0: return !!state.goal;
      case 1: return !!state.niche;
      case 2: return state.diag.mainPain.trim().length > 3;
      case 3: return state.outcome.metric.trim().length > 0 && state.outcome.target.trim().length > 0;
      default: return true;
    }
  }, [state]);

  const recs = useMemo(() => recommend(state), [state]);
  const niche = NICHES.find((n) => n.id === state.niche);

  function next() { setState((s) => ({ ...s, step: Math.min(s.step + 1, totalSteps - 1) })); }
  function prev() { setState((s) => ({ ...s, step: Math.max(s.step - 1, 0) })); }
  function reset() {
    setState(DEFAULT_STATE);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <PageHeader
        title="Como podemos te ajudar a melhorar?"
        description="5 perguntas rápidas pra montar seu plano de ação personalizado."
      />

      {intent && (
        <Card className="mb-6 p-4 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <Link2 className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden />
            <div className="flex-1 text-sm">
              <div className="font-semibold">Sua intenção do catálogo foi restaurada</div>
              <div className="mt-1 text-muted-foreground">
                Nicho <strong className="text-foreground">{intent.macro_slug}</strong> ·
                Subnicho <strong className="text-foreground">{intent.subnicho_slug}</strong> ·
                Plano <strong className="text-foreground capitalize">{intent.plan_tier}</strong>
              </div>
              {intent.selected_modules.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {intent.selected_modules.map((m) => (
                    <Badge key={m} variant="secondary" className="text-[11px] font-normal">{m}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="mb-6 flex items-center gap-3">
        <Progress value={progress} className="flex-1" />
        <Badge variant="outline">{state.step + 1} de {totalSteps}</Badge>
      </div>

      <Card className="p-6">

        {state.step === 0 && (
          <Step
            badge="Camada 1 — Melhorar"
            title="O que você quer melhorar primeiro?"
            description="Escolha o objetivo principal pra esses próximos 90 dias. Você pode mudar depois."
          >
            <RadioGroup
              value={state.goal ?? ""}
              onValueChange={(v) => setState((s) => ({ ...s, goal: v as Goal }))}
              className="grid sm:grid-cols-2 gap-3"
            >
              {GOALS.map((g) => {
                const Icon = g.icon;
                const active = state.goal === g.id;
                return (
                  <Label
                    key={g.id}
                    htmlFor={`goal-${g.id}`}
                    className={`cursor-pointer rounded-md border p-4 flex gap-3 items-start transition ${active ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                  >
                    <RadioGroupItem value={g.id} id={`goal-${g.id}`} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4" /> {g.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{g.desc}</div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
            <div className="mt-4">
              <Label htmlFor="goalDetail">Conta em uma frase (opcional)</Label>
              <Textarea
                id="goalDetail"
                placeholder="Ex.: quero dobrar minha receita do delivery em 6 meses."
                value={state.goalDetail}
                onChange={(e) => setState((s) => ({ ...s, goalDetail: e.target.value }))}
                rows={2}
              />
            </div>
          </Step>
        )}

        {state.step === 1 && (
          <Step
            badge="Camada 2 — Nicho"
            title="Qual o seu negócio?"
            description="Vamos ativar os módulos certos pro seu segmento."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {NICHES.map((n) => {
                const Icon = n.icon;
                const active = state.niche === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, niche: n.id }))}
                    className={`text-left rounded-md border p-4 flex items-center gap-3 transition ${active ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{n.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <Label htmlFor="nicheDetail">Algo específico do seu negócio? (opcional)</Label>
              <Input
                id="nicheDetail"
                placeholder="Ex.: hamburgueria com delivery próprio + iFood."
                value={state.nicheDetail}
                onChange={(e) => setState((s) => ({ ...s, nicheDetail: e.target.value }))}
              />
            </div>
          </Step>
        )}

        {state.step === 2 && (
          <Step
            badge="Camada 3 — Diagnóstico"
            title="Como tá hoje?"
            description="Quanto mais claro, melhor a recomendação."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teamSize">Tamanho da equipe</Label>
                <Input id="teamSize" placeholder="Ex.: 8 pessoas"
                  value={state.diag.teamSize}
                  onChange={(e) => setState((s) => ({ ...s, diag: { ...s.diag, teamSize: e.target.value } }))} />
              </div>
              <div>
                <Label htmlFor="revenue">Faturamento mensal aprox.</Label>
                <Input id="revenue" placeholder="Ex.: R$ 80.000"
                  value={state.diag.monthlyRevenue}
                  onChange={(e) => setState((s) => ({ ...s, diag: { ...s.diag, monthlyRevenue: e.target.value } }))} />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="tools">Que ferramentas usa hoje?</Label>
              <Input id="tools" placeholder="Ex.: WhatsApp, planilha, iFood, Maquininha."
                value={state.diag.tools}
                onChange={(e) => setState((s) => ({ ...s, diag: { ...s.diag, tools: e.target.value } }))} />
            </div>
            <div className="mt-4">
              <Label htmlFor="pain">Qual é a maior dor hoje? *</Label>
              <Textarea id="pain" rows={3}
                placeholder="Ex.: perco pedido na hora do pico, cliente reclama de demora, não sei quanto sobra no fim do mês."
                value={state.diag.mainPain}
                onChange={(e) => setState((s) => ({ ...s, diag: { ...s.diag, mainPain: e.target.value } }))} />
            </div>
          </Step>
        )}

        {state.step === 3 && (
          <Step
            badge="Camada 4 — Resultado esperado"
            title="O que seria um sucesso?"
            description="Defina a meta. Sem meta, não dá pra medir."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metric">Métrica principal *</Label>
                <Input id="metric" placeholder="Ex.: faturamento, ticket médio, agendamentos/semana"
                  value={state.outcome.metric}
                  onChange={(e) => setState((s) => ({ ...s, outcome: { ...s.outcome, metric: e.target.value } }))} />
              </div>
              <div>
                <Label htmlFor="target">Meta *</Label>
                <Input id="target" placeholder="Ex.: +30%, R$ 120k/mês, 40 agendamentos"
                  value={state.outcome.target}
                  onChange={(e) => setState((s) => ({ ...s, outcome: { ...s.outcome, target: e.target.value } }))} />
              </div>
            </div>
            <div className="mt-4">
              <Label>Horizonte</Label>
              <RadioGroup
                value={state.outcome.horizon}
                onValueChange={(v) => setState((s) => ({ ...s, outcome: { ...s.outcome, horizon: v as State["outcome"]["horizon"] } }))}
                className="grid grid-cols-4 gap-2 mt-2"
              >
                {(["30d", "90d", "6m", "12m"] as const).map((h) => (
                  <Label
                    key={h}
                    htmlFor={`h-${h}`}
                    className={`cursor-pointer rounded-md border p-3 text-center text-sm transition ${state.outcome.horizon === h ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                  >
                    <RadioGroupItem value={h} id={`h-${h}`} className="sr-only" />
                    {h}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </Step>
        )}

        {state.step === 4 && (
          <Step
            badge="Camada 5 — Como"
            title="Seu plano de ação"
            description="A Impulsionando vai te entregar isto agora."
          >
            <div className="mb-4 rounded-md border bg-muted/30 p-4 text-sm space-y-2">
              <div><span className="text-muted-foreground">Quero melhorar:</span> <span className="font-medium">{GOALS.find(g => g.id === state.goal)?.label ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Nicho:</span> <span className="font-medium">{niche?.label ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Maior dor:</span> <span className="font-medium">{state.diag.mainPain || "—"}</span></div>
              <div><span className="text-muted-foreground">Meta:</span> <span className="font-medium">{state.outcome.metric} {state.outcome.target ? `→ ${state.outcome.target}` : ""} ({state.outcome.horizon})</span></div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Módulos recomendados pra você começar agora</h3>
            </div>

            <div className="space-y-2">
              {recs.length === 0 && (
                <div className="text-sm text-muted-foreground">Selecione objetivo e nicho pra ver recomendações.</div>
              )}
              {recs.map((r) => (
                <Link
                  key={r.route}
                  to={r.route}
                  className="block rounded-md border p-3 hover:bg-muted/40 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.module}</div>
                      <div className="text-sm text-muted-foreground">{r.why}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {niche && (
                <Button onClick={() => navigate({ to: niche.targetRoute })}>
                  <Rocket className="h-4 w-4 mr-2" /> Começar pelo módulo principal
                </Button>
              )}
              <Button variant="outline" onClick={reset}>Refazer onboarding</Button>
            </div>
          </Step>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={prev} disabled={state.step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          {state.step < totalSteps - 1 ? (
            <Button onClick={next} disabled={!canNext}>
              Continuar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => navigate({ to: "/dashboard" })}>
              Ir para o Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Step({ badge, title, description, children }: { badge: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <Badge variant="secondary" className="mb-2">{badge}</Badge>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground mb-5">{description}</p>
      {children}
    </div>
  );
}
