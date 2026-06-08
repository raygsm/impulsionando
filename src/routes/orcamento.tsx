import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, ArrowRight, CheckCircle2, FileText, Loader2,
  Printer, Sparkles, ShieldCheck, MessageCircle, AlertTriangle, Copy, RotateCcw,
  Upload, FileCheck2,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  CATALOG_MODULES, getModule, modulesByCategory,
  type CatalogModule,
} from "@/data/moduleCatalog";
import { RECOMMENDED_BUNDLES, bundlesForCategory } from "@/data/recommendedBundles";
import { computeQuote, formatBRL } from "@/lib/pricing";
import {
  createQuote, updateQuote, acceptQuote, requestPayment,
} from "@/lib/quote.functions";

import { ModuleCard } from "@/components/orcamento/ModuleCard";
import { QuoteSidebar } from "@/components/orcamento/QuoteSidebar";
import { ContractView, type ContractData } from "@/components/orcamento/ContractView";

/* ============================== Route ============================== */

type SearchParams = {
  segmento?: string;
  bundle?: string;
  origem?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export const Route = createFileRoute("/orcamento")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    segmento: typeof s.segmento === "string" ? s.segmento : undefined,
    bundle: typeof s.bundle === "string" ? s.bundle : undefined,
    origem: typeof s.origem === "string" ? s.origem : undefined,
    utm_source: typeof s.utm_source === "string" ? s.utm_source : undefined,
    utm_medium: typeof s.utm_medium === "string" ? s.utm_medium : undefined,
    utm_campaign: typeof s.utm_campaign === "string" ? s.utm_campaign : undefined,
    utm_content: typeof s.utm_content === "string" ? s.utm_content : undefined,
    utm_term: typeof s.utm_term === "string" ? s.utm_term : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Monte seu Orçamento — Impulsionando Tecnologia" },
      {
        name: "description",
        content:
          "Escolha módulos, veja valores atualizados em tempo real, leia o contrato objetivo e avance para o pagamento. Em 12 etapas guiadas.",
      },
      { property: "og:title", content: "Monte seu Orçamento — Impulsionando Tecnologia" },
      {
        property: "og:description",
        content: "Jornada guiada para contratar a Impulsionando Tecnologia com transparência total.",
      },
      { property: "og:url", content: "https://impulsionando.com.br/orcamento" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/orcamento" }],
  }),
  component: OrcamentoPage,
});

/* ============================ Constants ============================ */

const TOTAL_STEPS = 12;
const STORAGE_KEY = "orcamento_wizard_v1";

const STEP_LABELS = [
  "Identificação",
  "Categoria",
  "Segmento",
  "Módulos",
  "Resumo dos módulos",
  "Valores",
  "Prazos e regras",
  "Dados da empresa",
  "Revisão final",
  "Contrato",
  "Aceite",
  "Pagamento",
] as const;

const CATEGORIAS: { value: string; label: string }[] = [
  { value: "saude", label: "Saúde, Bem-estar e Performance" },
  { value: "alimentacao", label: "Alimentação, Bebidas e Experiências" },
  { value: "servicos", label: "Serviços, Educação e Atendimento" },
  { value: "varejo", label: "Varejo, E-commerce e Produtos" },
  { value: "viagens", label: "Viagens, Turismo e Experiências" },
  { value: "eventos", label: "Eventos e Ingressos" },
  { value: "afiliados", label: "Afiliados e Produtos" },
  { value: "white-label", label: "White Label e Parceiros" },
  { value: "outro", label: "Outro segmento" },
];

const SEGMENTOS: Record<string, string[]> = {
  saude: ["Clínica médica", "Consultório", "Médico", "Dentista", "Fisioterapeuta", "Psicólogo", "Nutricionista", "Farmácia", "Academia", "CrossFit / Box", "Personal Trainer", "Outro"],
  alimentacao: ["Bar", "Restaurante", "Delivery", "Pizzaria", "Hamburgueria", "Cafeteria", "Casa de eventos", "Microcervejaria", "Fornecedor", "Outro"],
  servicos: ["Consultoria", "Educação", "Cursos", "Atendimento", "Coworking", "Serviços técnicos", "Outro"],
  varejo: ["Loja física", "E-commerce", "Marketplace", "Distribuidor", "Outro"],
  viagens: ["Agência", "Hotel", "Pousada", "Turismo", "Experiências", "Outro"],
  eventos: ["Evento pago", "Workshop", "Curso presencial", "Degustação", "Jantar harmonizado", "Evento corporativo", "Evento gastronômico", "Evento cervejeiro", "Outro"],
  afiliados: ["Produto físico", "Produto digital", "Serviço", "Assinatura", "Suplemento", "Curso", "Evento", "Coprodução", "Afiliados", "Outro"],
  "white-label": ["Agência", "Consultor", "Revenda", "Parceiro estratégico", "Outro"],
  outro: ["Descreva no contato"],
};

/* ============================ Validation ============================ */

const phoneDigits = (v: string) => v.replace(/\D/g, "");
function formatPhoneBR(v: string): string {
  const d = phoneDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function formatCnpjBR(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  whatsapp: z.string().trim().refine((v) => {
    const d = phoneDigits(v);
    return d.length === 10 || d.length === 11;
  }, "WhatsApp inválido."),
  email: z.string().trim().email("E-mail inválido.").max(200).optional().or(z.literal("")),
  role: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(2, "UF").optional().or(z.literal("")),
});

/* =============================== State =============================== */

type WizardState = {
  step: number;
  // lead
  name: string;
  whatsapp: string;
  email: string;
  role: string;
  city: string;
  state: string;
  // segmentação
  category: string;
  segment: string;
  // módulos
  selected: string[];
  // empresa
  companyName: string;
  companyTaxId: string;
  companyLegalName: string;
  // aceite
  accepted: {
    terms: boolean;
    modules: boolean;
    deadlines: boolean;
    integrations: boolean;
    refund: boolean;
  };
  // estado do servidor
  quoteId: string | null;
  quoteNumber: string | null;
  publicToken: string | null;
  acceptedAt: string | null;
  paymentRequested: boolean;
};

const initialState: WizardState = {
  step: 1,
  name: "", whatsapp: "", email: "", role: "", city: "", state: "",
  category: "", segment: "",
  selected: [],
  companyName: "", companyTaxId: "", companyLegalName: "",
  accepted: { terms: false, modules: false, deadlines: false, integrations: false, refund: false },
  quoteId: null, quoteNumber: null, publicToken: null, acceptedAt: null, paymentRequested: false,
};

type Action =
  | { type: "SET"; patch: Partial<WizardState> }
  | { type: "TOGGLE_MODULE"; slug: string }
  | { type: "SET_BUNDLE"; slugs: string[] }
  | { type: "STEP"; delta: number }
  | { type: "GOTO"; step: number }
  | { type: "RESET" };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "SET": return { ...state, ...action.patch };
    case "TOGGLE_MODULE": {
      const has = state.selected.includes(action.slug);
      return { ...state, selected: has ? state.selected.filter((s) => s !== action.slug) : [...state.selected, action.slug] };
    }
    case "SET_BUNDLE": {
      // merge: marca todos do bundle preservando seleções extras
      const merged = Array.from(new Set([...state.selected, ...action.slugs]));
      return { ...state, selected: merged };
    }
    case "STEP": {
      const next = Math.max(1, Math.min(TOTAL_STEPS, state.step + action.delta));
      return { ...state, step: next };
    }
    case "GOTO":
      return { ...state, step: Math.max(1, Math.min(TOTAL_STEPS, action.step)) };
    case "RESET":
      return initialState;
    default: return state;
  }
}

/* =============================== Page =============================== */

function OrcamentoPage() {
  const search = Route.useSearch();
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    if (typeof window === "undefined") return init;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WizardState>;
        // Se o último orçamento já foi aceito, começa um novo do zero
        // a cada nova visita à página (não mantém "Contrato aceito" travado).
        if (parsed.acceptedAt) {
          try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
          return init;
        }
        return { ...init, ...parsed };
      }
    } catch { /* ignore */ }
    return init;
  });

  // Persistir
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  // Reset completo do wizard (novo pedido de orçamento)
  function resetWizard() {
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    dispatch({ type: "RESET" });
  }

  // Aplicar bundle vindo da URL (uma vez)
  const appliedRef = useRef(false);
  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;
    if (search.bundle) {
      const b = RECOMMENDED_BUNDLES.find((x) => x.slug === search.bundle);
      if (b) dispatch({ type: "SET_BUNDLE", slugs: b.moduleSlugs });
    }
  }, [search.bundle]);

  const totals = useMemo(() => computeQuote(state.selected), [state.selected]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1">
          <div className="container max-w-6xl mx-auto px-4 py-8">
            {/* Hero */}
            <div className="mb-6 text-center">
              <Badge variant="secondary" className="mb-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Plano em 1 minuto
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Monte seu Orçamento</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Escolha os módulos, veja valores em tempo real, leia o contrato objetivo e avance para o pagamento — em 12 etapas guiadas.
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-muted-foreground">
                  Etapa <strong className="text-foreground">{state.step}</strong> de {TOTAL_STEPS} — {STEP_LABELS[state.step - 1]}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {Math.round((state.step / TOTAL_STEPS) * 100)}%
                </span>
              </div>
              <Progress value={(state.step / TOTAL_STEPS) * 100} />
            </div>

            {/* Layout: conteúdo + sidebar */}
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div>
                <StepContent state={state} dispatch={dispatch} search={search} totals={totals} onReset={resetWizard} />
              </div>

              {/* Sidebar desktop */}
              <aside className="hidden lg:block">
                <QuoteSidebar
                  selectedSlugs={state.selected}
                  onRemove={(slug) => dispatch({ type: "TOGGLE_MODULE", slug })}
                />
              </aside>

              {/* Sidebar mobile (drawer) */}
              {state.selected.length > 0 && (
                <div className="lg:hidden fixed bottom-4 right-4 z-40">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button size="lg" className="shadow-lg">
                        <Sparkles className="h-4 w-4 mr-1" />
                        {formatBRL(totals.totalCents)}/mês
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] overflow-auto">
                      <QuoteSidebar
                        selectedSlugs={state.selected}
                        onRemove={(slug) => dispatch({ type: "TOGGLE_MODULE", slug })}
                        compact
                      />
                    </SheetContent>
                  </Sheet>
                </div>
              )}
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

/* ========================== Step content ========================== */

interface StepProps {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  search: SearchParams;
  totals: ReturnType<typeof computeQuote>;
  onReset?: () => void;
}

function StepContent(props: StepProps) {
  switch (props.state.step) {
    case 1: return <StepLead {...props} />;
    case 2: return <StepCategoria {...props} />;
    case 3: return <StepSegmento {...props} />;
    case 4: return <StepModulos {...props} />;
    case 5: return <StepResumoModulos {...props} />;
    case 6: return <StepValores {...props} />;
    case 7: return <StepPrazos {...props} />;
    case 8: return <StepEmpresa {...props} />;
    case 9: return <StepRevisao {...props} />;
    case 10: return <StepContrato {...props} />;
    case 11: return <StepAceite {...props} />;
    case 12: return <StepPagamento {...props} />;
    default: return null;
  }
}

function NavRow({
  onBack, onNext, nextLabel = "Continuar", nextDisabled, loading,
}: { onBack?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; loading?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 mt-6">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      ) : <span />}
      {onNext && (
        <Button type="button" onClick={onNext} disabled={nextDisabled || loading}>
          {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {nextLabel}
          {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
        </Button>
      )}
    </div>
  );
}

/* ----------------------- Step 1 — Lead ----------------------- */

function StepLead({ state, dispatch, search }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createFn = useServerFn(createQuote);
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    const parsed = leadSchema.safeParse({
      name: state.name, whatsapp: state.whatsapp, email: state.email,
      role: state.role, city: state.city, state: state.state,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[issue.path.join(".")] = issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const result = await createFn({
        data: {
          lead: {
            name: state.name, whatsapp: state.whatsapp,
            email: state.email || undefined, role: state.role || undefined,
            city: state.city || undefined, state: state.state || undefined,
          },
          modules: state.selected,
          tracking: {
            utm_source: search.utm_source, utm_medium: search.utm_medium,
            utm_campaign: search.utm_campaign, utm_content: search.utm_content,
            utm_term: search.utm_term, origin: search.origem ?? "/orcamento",
          },
        },
      });
      dispatch({ type: "SET", patch: { quoteId: result.id, quoteNumber: result.quoteNumber, publicToken: result.publicToken, step: 2 } });
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível salvar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Vamos começar pelo básico</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Essas informações ajudam a montar uma proposta compatível com sua operação e manter o histórico da sua solicitação.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <FieldText label="Nome completo *" value={state.name} onChange={(v) => dispatch({ type: "SET", patch: { name: v } })} error={errors.name} />
        <FieldText
          label="WhatsApp *" value={state.whatsapp}
          onChange={(v) => dispatch({ type: "SET", patch: { whatsapp: formatPhoneBR(v) } })}
          placeholder="(00) 00000-0000" error={errors.whatsapp}
        />
        <FieldText label="E-mail" type="email" value={state.email} onChange={(v) => dispatch({ type: "SET", patch: { email: v } })} error={errors.email} />
        <FieldText label="Cargo / função" value={state.role} onChange={(v) => dispatch({ type: "SET", patch: { role: v } })} />
        <FieldText label="Cidade" value={state.city} onChange={(v) => dispatch({ type: "SET", patch: { city: v } })} />
        <FieldText label="UF" maxLength={2} value={state.state} onChange={(v) => dispatch({ type: "SET", patch: { state: v.toUpperCase() } })} error={errors.state} />
      </div>
      <NavRow onNext={handleNext} loading={loading} />
    </Card>
  );
}

/* ---------------------- Step 2 — Categoria ---------------------- */

function StepCategoria({ state, dispatch }: StepProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Qual é a área principal do seu negócio?</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        A categoria escolhida ajuda a recomendar os módulos certos para seu segmento.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {CATEGORIAS.map((cat) => (
          <Card
            key={cat.value}
            role="button" tabIndex={0}
            onClick={() => dispatch({ type: "SET", patch: { category: cat.value, segment: "" } })}
            onKeyDown={(e) => { if (e.key === "Enter") dispatch({ type: "SET", patch: { category: cat.value, segment: "" } }); }}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              state.category === cat.value ? "border-primary bg-primary/5" : "hover:border-primary/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{cat.label}</span>
              {state.category === cat.value && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
          </Card>
        ))}
      </div>
      <NavRow
        onBack={() => dispatch({ type: "STEP", delta: -1 })}
        onNext={() => dispatch({ type: "STEP", delta: 1 })}
        nextDisabled={!state.category}
      />
    </Card>
  );
}

/* ---------------------- Step 3 — Segmento ---------------------- */

function StepSegmento({ state, dispatch }: StepProps) {
  const segs = SEGMENTOS[state.category] ?? [];
  const bundles = bundlesForCategory(state.category);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Qual segmento descreve melhor sua operação?</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Vamos sugerir uma combinação de módulos baseada no seu segmento — você pode ajustar depois.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
        {segs.map((seg) => (
          <button
            type="button" key={seg}
            onClick={() => dispatch({ type: "SET", patch: { segment: seg } })}
            className={cn(
              "p-3 text-left rounded-md border transition-all text-sm",
              state.segment === seg
                ? "border-primary bg-primary/10 font-medium"
                : "border-border hover:border-primary/40",
            )}
          >
            {seg}
          </button>
        ))}
      </div>

      {bundles.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary" /> Combinações recomendadas para você
          </h3>
          <div className="flex flex-wrap gap-2">
            {bundles.map((b) => (
              <Button
                key={b.slug} size="sm" variant="outline"
                onClick={() => {
                  dispatch({ type: "SET_BUNDLE", slugs: b.moduleSlugs });
                  toast.success(`Bundle "${b.name}" aplicado. ${b.moduleSlugs.length} módulos adicionados.`);
                }}
              >
                + {b.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <NavRow
        onBack={() => dispatch({ type: "STEP", delta: -1 })}
        onNext={() => dispatch({ type: "STEP", delta: 1 })}
        nextDisabled={!state.segment}
      />
    </Card>
  );
}

/* ---------------------- Step 4 — Módulos ---------------------- */

function StepModulos({ state, dispatch }: StepProps) {
  const grouped = useMemo(() => modulesByCategory(), []);
  const updateFn = useServerFn(updateQuote);

  // Sincroniza módulos com banco em background
  const lastSyncedRef = useRef<string>("");
  useEffect(() => {
    if (!state.quoteId || !state.publicToken) return;
    const key = state.selected.slice().sort().join(",");
    if (key === lastSyncedRef.current) return;
    lastSyncedRef.current = key;
    const t = setTimeout(() => {
      updateFn({ data: { id: state.quoteId!, publicToken: state.publicToken!, modules: state.selected, category: state.category, segment: state.segment } })
        .catch(() => { /* silent */ });
    }, 800);
    return () => clearTimeout(t);
  }, [state.quoteId, state.publicToken, state.selected, state.category, state.segment, updateFn]);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Escolha os módulos</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Cada módulo custa <strong className="text-foreground">{formatBRL(49700)}/mês</strong>. Marque e desmarque para ver o valor atualizado em tempo real.
      </p>

      {(Object.keys(grouped) as Array<keyof typeof grouped>).map((cat) => (
        <section key={cat} className="mb-8">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{cat}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {grouped[cat].map((mod: CatalogModule) => (
              <ModuleCard
                key={mod.slug} module={mod}
                selected={state.selected.includes(mod.slug)}
                onToggle={() => {
                  dispatch({ type: "TOGGLE_MODULE", slug: mod.slug });
                  const wasSelected = state.selected.includes(mod.slug);
                  toast.success(wasSelected
                    ? "Módulo removido. O orçamento foi recalculado."
                    : "Módulo adicionado ao seu orçamento. O valor foi atualizado automaticamente.",
                    { duration: 1500 });
                }}
              />
            ))}
          </div>
        </section>
      ))}

      <NavRow
        onBack={() => dispatch({ type: "STEP", delta: -1 })}
        onNext={() => dispatch({ type: "STEP", delta: 1 })}
        nextDisabled={state.selected.length === 0}
        nextLabel={state.selected.length === 0 ? "Selecione ao menos 1 módulo" : "Ver resumo"}
      />
    </Card>
  );
}

/* ---------------- Step 5 — Resumo dos módulos ---------------- */

function StepResumoModulos({ state, dispatch, totals }: StepProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Confirme os módulos escolhidos</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Você pode remover qualquer módulo abaixo ou voltar para adicionar mais.
      </p>
      <ul className="space-y-2 mb-6">
        {totals.lineItems.map((it) => {
          const mod = getModule(it.slug);
          return (
            <li key={it.slug} className="flex items-center justify-between p-3 rounded-md border border-border">
              <div className="flex-1">
                <p className="font-medium">{mod?.name}</p>
                <p className="text-xs text-muted-foreground">{mod?.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums">{formatBRL(it.priceCents)}</span>
                <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "TOGGLE_MODULE", slug: it.slug })}>
                  Remover
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <NavRow
        onBack={() => dispatch({ type: "STEP", delta: -1 })}
        onNext={() => dispatch({ type: "STEP", delta: 1 })}
        nextDisabled={totals.lineItems.length === 0}
      />
    </Card>
  );
}

/* -------------------- Step 6 — Valores -------------------- */

function StepValores({ dispatch, totals }: StepProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Valores do seu orçamento</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Quebra detalhada do que você vai pagar. Cobrança mensal, sem fidelidade.
      </p>
      <dl className="space-y-2 text-sm mb-6">
        <Row label={`Subtotal (${totals.selectedCount} módulos × ${formatBRL(49700)})`} value={formatBRL(totals.subtotalCents)} />
        <Row
          label={`Desconto progressivo (${totals.discountPct}%)`}
          value={`- ${formatBRL(totals.discountCents)}`}
          accent={totals.discountCents > 0 ? "emerald" : undefined}
        />
        <Row label="Setup / implantação" value={formatBRL(totals.setupCents)} muted />
        <div className="border-t border-border pt-2 mt-2">
          <Row label="Total mensal" value={formatBRL(totals.totalCents)} bold />
        </div>
      </dl>
      <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
        <p>• Próximo vencimento: na mesma data da contratação, a cada mês.</p>
        <p>• Forma de pagamento: cartão de crédito recorrente.</p>
        <p>• Sem multa por cancelamento.</p>
        <p>• Reembolso integral em até 7 dias após a primeira cobrança.</p>
      </div>
      <NavRow
        onBack={() => dispatch({ type: "STEP", delta: -1 })}
        onNext={() => dispatch({ type: "STEP", delta: 1 })}
      />
    </Card>
  );
}

function Row({ label, value, bold, muted, accent }: { label: string; value: string; bold?: boolean; muted?: boolean; accent?: "emerald" }) {
  return (
    <div className={cn(
      "flex justify-between",
      bold && "font-semibold text-base",
      muted && "text-muted-foreground",
      accent === "emerald" && "text-emerald-600 dark:text-emerald-500",
    )}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/* -------------------- Step 7 — Prazos e regras -------------------- */

function StepPrazos({ state, dispatch }: StepProps) {
  const selectedMods = state.selected.map(getModule).filter(Boolean) as CatalogModule[];
  const needsCredentials = selectedMods.filter((m) => m.requiresExternalCredentials);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Prazos, regras e dependências</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Leia com calma. Tudo aqui faz parte do contrato que você vai assinar.
      </p>
      <div className="space-y-4 text-sm">
        <Section title="Prazo de ativação">
          Até 5 dias úteis após a confirmação do pagamento. Onboarding guiado pela equipe da Impulsionando.
        </Section>
        <Section title="Forma de pagamento e vencimento">
          Cobrança mensal recorrente no cartão de crédito, no mesmo dia da contratação a cada mês.
        </Section>
        <Section title="Cancelamento">
          Sem multa, a qualquer momento, com efeito ao final do ciclo já pago.
        </Section>
        <Section title="Reembolso">
          Direito de arrependimento de 7 dias corridos após a primeira cobrança (CDC art. 49).
        </Section>
        <Section title="Suporte">
          WhatsApp e e-mail em horário comercial. Plantão para incidentes críticos.
        </Section>
        {needsCredentials.length > 0 && (
          <Section title="Dependências externas dos módulos escolhidos">
            <p>Os módulos abaixo dependem de credenciais externas. Eles ficarão "prontos para ativar" assim que as credenciais forem configuradas:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {needsCredentials.map((m) => <li key={m.slug}><strong>{m.name}</strong></li>)}
            </ul>
          </Section>
        )}
      </div>
      <NavRow
        onBack={() => dispatch({ type: "STEP", delta: -1 })}
        onNext={() => dispatch({ type: "STEP", delta: 1 })}
      />
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-md p-3">
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

/* -------------------- Step 8 — Dados da empresa -------------------- */

function StepEmpresa({ state, dispatch }: StepProps) {
  const updateFn = useServerFn(updateQuote);
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    if (state.quoteId) {
      setSaving(true);
      try {
        await updateFn({
          data: {
            id: state.quoteId,
            company: {
              companyName: state.companyName || undefined,
              companyTaxId: state.companyTaxId || undefined,
              companyLegalName: state.companyLegalName || undefined,
            },
          },
        });
      } catch (e) {
        toast.error("Não foi possível salvar agora. Vamos continuar mesmo assim.");
      } finally {
        setSaving(false);
      }
    }
    dispatch({ type: "STEP", delta: 1 });
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Dados da empresa para o contrato</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Opcional, mas recomendado para emissão de nota fiscal e identificação no contrato.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <FieldText label="Nome fantasia" value={state.companyName} onChange={(v) => dispatch({ type: "SET", patch: { companyName: v } })} />
        <FieldText label="Razão social" value={state.companyLegalName} onChange={(v) => dispatch({ type: "SET", patch: { companyLegalName: v } })} />
        <FieldText
          label="CNPJ" value={state.companyTaxId}
          onChange={(v) => dispatch({ type: "SET", patch: { companyTaxId: formatCnpjBR(v) } })}
          placeholder="00.000.000/0000-00"
        />
      </div>
      <NavRow
        onBack={() => dispatch({ type: "STEP", delta: -1 })}
        onNext={handleNext}
        loading={saving}
      />
    </Card>
  );
}

/* -------------------- Step 9 — Revisão final -------------------- */

function StepRevisao({ state, dispatch, totals }: StepProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1">Revisão final</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Revise com calma. A contratação só avança após sua confirmação e aceite dos termos.
      </p>

      <div className="space-y-4 text-sm">
        <Section title="Contratante">
          <p><strong>{state.name}</strong>{state.role && <> • {state.role}</>}</p>
          <p>{state.whatsapp}{state.email && <> • {state.email}</>}</p>
          {(state.city || state.state) && <p>{state.city}{state.state && ` / ${state.state}`}</p>}
        </Section>

        {(state.companyName || state.companyTaxId) && (
          <Section title="Empresa">
            <p>{state.companyName}{state.companyLegalName && ` (${state.companyLegalName})`}</p>
            {state.companyTaxId && <p>CNPJ {state.companyTaxId}</p>}
          </Section>
        )}

        <Section title="Segmentação">
          <p>
            {CATEGORIAS.find((c) => c.value === state.category)?.label ?? "—"}
            {state.segment && <> • {state.segment}</>}
          </p>
        </Section>

        <Section title={`Módulos contratados (${totals.lineItems.length})`}>
          <ul className="space-y-0.5">
            {totals.lineItems.map((it) => (
              <li key={it.slug} className="flex justify-between">
                <span>{getModule(it.slug)?.name}</span>
                <span className="tabular-nums">{formatBRL(it.priceCents)}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Valores">
          <Row label="Subtotal" value={formatBRL(totals.subtotalCents)} />
          {totals.discountCents > 0 && (
            <Row label={`Desconto (${totals.discountPct}%)`} value={`- ${formatBRL(totals.discountCents)}`} accent="emerald" />
          )}
          <Row label="Total mensal" value={formatBRL(totals.totalCents)} bold />
        </Section>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <Button variant="outline" onClick={() => dispatch({ type: "GOTO", step: 4 })}>
          Editar módulos
        </Button>
        <Button onClick={() => dispatch({ type: "STEP", delta: 1 })}>
          Ver contrato <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Button variant="ghost" className="mt-3" onClick={() => dispatch({ type: "STEP", delta: -1 })}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
    </Card>
  );
}

/* -------------------- Step 10 — Contrato -------------------- */

function StepContrato({ state, dispatch }: StepProps) {
  const contractData: ContractData = {
    quoteNumber: state.quoteNumber ?? "ORC-RASCUNHO",
    leadName: state.name,
    leadEmail: state.email || null,
    leadWhatsapp: state.whatsapp,
    companyName: state.companyName || null,
    companyTaxId: state.companyTaxId || null,
    companyLegalName: state.companyLegalName || null,
    category: state.category || null,
    segment: state.segment || null,
    modules: state.selected,
  };
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Contrato
        </h2>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Imprimir
        </Button>
      </div>
      <ContractView data={contractData} />
      <NavRow
        onBack={() => dispatch({ type: "STEP", delta: -1 })}
        onNext={() => dispatch({ type: "STEP", delta: 1 })}
        nextLabel="Avançar para aceite"
      />
    </Card>
  );
}

/* -------------------- Step 11 — Aceite -------------------- */

function StepAceite({ state, dispatch }: StepProps) {
  const acceptFn = useServerFn(acceptQuote);
  const [loading, setLoading] = useState(false);
  const allChecked = Object.values(state.accepted).every(Boolean);

  function setAccept(key: keyof WizardState["accepted"], value: boolean) {
    dispatch({ type: "SET", patch: { accepted: { ...state.accepted, [key]: value } } });
  }

  async function handleAccept() {
    if (!state.quoteId) {
      toast.error("Orçamento não foi salvo. Volte ao início e tente novamente.");
      return;
    }
    if (!allChecked) return;
    setLoading(true);
    try {
      const result = await acceptFn({
        data: {
          id: state.quoteId,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : undefined,
          terms: {
            terms: true, modules: true, deadlines: true, integrations: true, refund: true,
          },
        },
      });
      dispatch({ type: "SET", patch: { acceptedAt: result.acceptedAt, step: 12 } });
      toast.success("Aceite registrado. Vamos para o pagamento.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível registrar o aceite.");
    } finally {
      setLoading(false);
    }
  }

  const items: Array<[keyof WizardState["accepted"], string]> = [
    ["terms", "Li e aceito os termos de contratação."],
    ["modules", "Declaro estar ciente dos módulos escolhidos e valores."],
    ["deadlines", "Declaro estar ciente dos prazos e regras de implantação."],
    ["integrations", "Declaro estar ciente de que integrações externas dependem de credenciais e aprovações de terceiros."],
    ["refund", "Aceito a política de cancelamento e reembolso."],
  ];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" /> Aceite eletrônico
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Marque os itens abaixo para confirmar que leu e aceita o contrato.
      </p>
      <div className="space-y-3 mb-6">
        {items.map(([key, label]) => (
          <label key={key} className="flex items-start gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-muted/30">
            <Checkbox
              checked={state.accepted[key]}
              onCheckedChange={(c) => setAccept(key, c === true)}
              className="mt-0.5"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => dispatch({ type: "STEP", delta: -1 })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button onClick={handleAccept} disabled={!allChecked || loading}>
          {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Aceitar contrato e ir para pagamento
        </Button>
      </div>
    </Card>
  );
}

/* -------------------- Step 12 — Pagamento -------------------- */

const PIX_KEY = "54.295.500/0001-27";
const PIX_KEY_PLAIN = "54295500000127";
const PIX_RECEBEDOR = "Impulsionando Tecnologia LTDA";
const PIX_RECEBEDOR_SHORT = "IMPULSIONANDO TEC"; // <= 25 chars, ASCII, sem acento
const PIX_CIDADE = "RIO DE JANEIRO"; // <= 15 chars

function pixTLV(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}
function pixCRC16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function buildPixPayload(amountCents: number, txid: string) {
  const amount = (Math.max(0, amountCents) / 100).toFixed(2);
  const safeTxid = (txid || "ORC").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "ORC";
  const merchant = pixTLV("00", "BR.GOV.BCB.PIX") + pixTLV("01", PIX_KEY_PLAIN);
  const payload =
    pixTLV("00", "01") +
    pixTLV("26", merchant) +
    pixTLV("52", "0000") +
    pixTLV("53", "986") +
    pixTLV("54", amount) +
    pixTLV("58", "BR") +
    pixTLV("59", PIX_RECEBEDOR_SHORT) +
    pixTLV("60", PIX_CIDADE) +
    pixTLV("62", pixTLV("05", safeTxid));
  const toCrc = payload + "6304";
  return toCrc + pixCRC16(toCrc);
}

function StepPagamento({ state, dispatch, totals, onReset }: StepProps) {
  const reqPaymentFn = useServerFn(requestPayment);
  const [requested, setRequested] = useState(state.paymentRequested);
  const [loading, setLoading] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [comprovante, setComprovante] = useState<{ name: string; size: number } | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const pixPayload = useMemo(
    () => buildPixPayload(totals.totalCents, state.quoteNumber || "ORC"),
    [totals.totalCents, state.quoteNumber],
  );
  const pixQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(pixPayload)}`;


  async function handleRequest() {
    if (!state.quoteId) return;
    setLoading(true);
    try {
      await reqPaymentFn({ data: { id: state.quoteId } });
      dispatch({ type: "SET", patch: { paymentRequested: true } });
      setRequested(true);
      toast.success("Solicitação registrada! Nossa equipe entra em contato em até 1 dia útil com o link de pagamento.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível registrar agora.");
      // Em caso de falha no método de pagamento, mostra o fallback Pix automaticamente.
      setPixOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function copyPix(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  const whatsappMsg = encodeURIComponent(
    `Olá! Acabei de fechar o orçamento ${state.quoteNumber} no site (${totals.lineItems.length} módulos, ${formatBRL(totals.totalCents)}/mês). Quero receber o link de pagamento.`,
  );

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Contrato aceito!</h2>
        <p className="text-muted-foreground text-sm">
          Orçamento <strong className="text-foreground">{state.quoteNumber}</strong>
          {state.acceptedAt && <> • aceite registrado em {new Date(state.acceptedAt).toLocaleString("pt-BR")}</>}
        </p>
      </div>

      <div className="bg-muted/40 rounded-md p-4 mb-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total mensal</span>
          <span className="text-2xl font-bold tabular-nums">{formatBRL(totals.totalCents)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {totals.lineItems.length} módulos • cobrança mensal recorrente
        </p>
      </div>

      <div className="space-y-3">
        <div className="border border-dashed border-border rounded-md p-4 text-center">
          <p className="text-sm font-medium mb-1">Checkout preparado — aguardando credenciais do gateway</p>
          <p className="text-xs text-muted-foreground mb-3">
            Para combinações personalizadas usamos checkout assistido: nossa equipe envia o link de pagamento
            (cartão recorrente) por WhatsApp ou e-mail em até 1 dia útil.
          </p>
          {requested ? (
            <div className="text-sm text-emerald-700 dark:text-emerald-500 font-medium">
              ✓ Solicitação registrada. Você receberá o link em breve.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={handleRequest} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Solicitar link de pagamento
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://wa.me/5521972554500?text=${whatsappMsg}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Fallback Pix — instabilidade no método de pagamento */}
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                Houve instabilidade no método de pagamento?
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-0.5">
                Você pode pagar diretamente via <strong>Pix</strong> usando o CNPJ da Impulsionando como chave.
                Após o pagamento, envie o comprovante pelo WhatsApp para liberação imediata.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPixOpen((v) => !v)}
            className="mb-2"
          >
            {pixOpen ? "Ocultar dados do Pix" : "Pagar via Pix (chave CNPJ)"}
          </Button>

          {pixOpen && (
            <div className="grid md:grid-cols-[240px_1fr] gap-4 items-start mt-2 rounded-md bg-background p-3 border border-border">
              <div className="flex flex-col items-center">
                <img
                  src={pixQrUrl}
                  alt="QR Code Pix — chave CNPJ Impulsionando"
                  width={240}
                  height={240}
                  className="rounded-md border border-border bg-white"
                  loading="lazy"
                />
                <p className="text-[11px] text-muted-foreground mt-1 text-center">
                  Aponte a câmera do seu app bancário
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo de chave</Label>
                  <p className="font-medium">CNPJ</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Chave Pix (CNPJ)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-2 py-1.5 rounded-md bg-muted text-sm font-mono select-all break-all">
                      {PIX_KEY}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copyPix(PIX_KEY, "CNPJ")}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pix copia e cola (com valor)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-2 py-1.5 rounded-md bg-muted text-[11px] font-mono select-all break-all max-h-20 overflow-auto">
                      {pixPayload}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copyPix(pixPayload, "Código Pix")}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Já inclui o valor de <strong className="text-foreground">{formatBRL(totals.totalCents)}</strong> e o identificador do orçamento.
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Recebedor</Label>
                  <p className="font-medium">{PIX_RECEBEDOR}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                  Valor sugerido: <strong className="text-foreground">{formatBRL(totals.totalCents)}</strong>{" "}
                  (1ª mensalidade). Inclua o orçamento{" "}
                  <strong className="text-foreground">{state.quoteNumber}</strong> na descrição do Pix.
                </div>

                {/* Comprovante + Confirmar pagamento */}
                {paymentConfirmed ? (
                  <div className="rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/60 p-3 flex items-start gap-2">
                    <FileCheck2 className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
                    <div className="text-xs text-emerald-900 dark:text-emerald-200">
                      <p className="font-medium">Pagamento confirmado pelo cliente</p>
                      <p className="opacity-80">
                        Comprovante: <strong>{comprovante?.name ?? "enviado"}</strong>. Nossa equipe valida em até 1 dia útil e libera o acesso.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-md border border-border bg-card p-3">
                    <Label className="text-xs text-muted-foreground">Anexar comprovante do Pix</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="comprovante-input"
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (f.size > 8 * 1024 * 1024) {
                            toast.error("Arquivo muito grande (máx. 8MB).");
                            return;
                          }
                          setComprovante({ name: f.name, size: f.size });
                          toast.success("Comprovante anexado. Confirme o pagamento abaixo.");
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById("comprovante-input")?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {comprovante ? "Trocar arquivo" : "Selecionar arquivo"}
                      </Button>
                      <span className="text-xs text-muted-foreground truncate">
                        {comprovante ? comprovante.name : "PNG, JPG ou PDF até 8MB"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={!comprovante}
                      onClick={() => {
                        setPaymentConfirmed(true);
                        toast.success("Pagamento confirmado! Equipe notificada para liberação.");
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar pagamento
                    </Button>
                  </div>
                )}

                <Button asChild variant="outline" size="sm" className="w-full">
                  <a
                    href={`https://wa.me/5521972554500?text=${encodeURIComponent(
                      `Olá! Paguei via Pix o orçamento ${state.quoteNumber} (${formatBRL(totals.totalCents)}). Segue o comprovante.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" /> Enviar comprovante por WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>


        <p className="text-xs text-muted-foreground text-center">
          Já é cliente ou prefere ver os planos fechados?{" "}
          <Link to="/planos" className="underline">Ver Essencial / Integrado / Avançado</Link>
        </p>

        {/* Iniciar novo orçamento */}
        <div className="pt-4 mt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Quer simular outra combinação de módulos? Inicie um novo orçamento do zero.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (onReset) onReset();
              toast.success("Novo orçamento iniciado.");
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Iniciar novo orçamento
          </Button>
        </div>
      </div>
    </Card>
  );
}


/* ============================== Inputs ============================== */

function FieldText({
  label, value, onChange, type = "text", error, placeholder, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; error?: string; placeholder?: string; maxLength?: number;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <Input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className={cn("mt-1", error && "border-destructive")}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
