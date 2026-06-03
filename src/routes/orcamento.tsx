import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageCircle,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/* --------------------- Validation helpers --------------------- */

// Aceita 10 ou 11 dígitos (fixo / celular BR) após remover máscara
const phoneDigits = (v: string) => v.replace(/\D/g, "");
function formatPhoneBR(v: string): string {
  const d = phoneDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome (mínimo 2 caracteres).")
    .max(120, "Nome muito longo (máx. 120).")
    .regex(/^[\p{L}\p{M}'.\- ]+$/u, "Use apenas letras e espaços."),
  whatsapp: z
    .string()
    .trim()
    .min(1, "Informe um WhatsApp para contato.")
    .refine((v) => {
      const d = phoneDigits(v);
      return d.length === 10 || d.length === 11;
    }, "WhatsApp inválido. Use DDD + número (ex.: (21) 99999-9999)."),
  email: z
    .string()
    .trim()
    .max(200, "E-mail muito longo (máx. 200).")
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),
});
type LeadErrors = Partial<Record<"name" | "whatsapp" | "email", string>>;

type SearchParams = {
  segmento?: string;
  dores?: string; // comma-separated
  plano?: string; // Essencial | Integrado | Avançado | Sob Medida
  perfil?: string; // final | white-label
  origem?: string; // page slug for tracking
};

export const Route = createFileRoute("/orcamento")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    segmento: typeof search.segmento === "string" ? search.segmento : undefined,
    dores: typeof search.dores === "string" ? search.dores : undefined,
    plano: typeof search.plano === "string" ? search.plano : undefined,
    perfil: typeof search.perfil === "string" ? search.perfil : undefined,
    origem: typeof search.origem === "string" ? search.origem : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Orçamento automático — Impulsionando Tecnologia" },
      {
        name: "description",
        content:
          "Briefing inteligente: responda 6 perguntas e receba a recomendação de módulos e plano ideal para sua operação.",
      },
    ],
  }),
  component: OrcamentoPage,
});

/* --------------------------- Briefing ---------------------------- */

const SEGMENTOS = [
  { value: "saude", label: "Clínica / Profissional da saúde" },
  { value: "estetica", label: "Salão / Estética / Barbearia" },
  { value: "alimentacao", label: "Bar / Restaurante / Delivery" },
  { value: "varejo", label: "Loja / Varejo / E-commerce" },
  { value: "servicos", label: "Prestador de serviços" },
  { value: "educacao", label: "Educação / Cursos" },
  { value: "outro", label: "Outro nicho" },
] as const;

const TAMANHO = [
  { value: "solo", label: "Só eu (autônomo)" },
  { value: "pequena", label: "2 a 5 pessoas" },
  { value: "media", label: "6 a 20 pessoas" },
  { value: "grande", label: "Mais de 20 pessoas" },
] as const;

const UNIDADES = [
  { value: "1", label: "1 unidade" },
  { value: "2-3", label: "2 a 3 unidades" },
  { value: "4+", label: "4 ou mais unidades" },
] as const;

const DORES = [
  { value: "agenda", label: "Agendamento e controle de horários" },
  { value: "vendas", label: "Vendas no balcão / PDV" },
  { value: "financeiro", label: "Controle financeiro e caixa" },
  { value: "estoque", label: "Controle de estoque" },
  { value: "crm", label: "Captação e acompanhamento de clientes (CRM)" },
  { value: "whatsapp", label: "Atendimento por WhatsApp" },
  { value: "relatorios", label: "Relatórios e indicadores (BI)" },
] as const;

const URGENCIA = [
  { value: "imediato", label: "Quero começar imediatamente" },
  { value: "30d", label: "Nos próximos 30 dias" },
  { value: "60d", label: "Em 1 a 2 meses" },
  { value: "pesquisa", label: "Só pesquisando" },
] as const;

const PERFIL = [
  { value: "final", label: "Sou o cliente final (vou usar no meu negócio)" },
  { value: "white-label", label: "Quero revender / White label" },
] as const;

interface Answers {
  segmento: string;
  tamanho: string;
  unidades: string;
  dores: string[]; // múltiplas dores
  urgencia: string;
  perfil: string;
}

const INITIAL: Answers = {
  segmento: "",
  tamanho: "",
  unidades: "",
  dores: [],
  urgencia: "",
  perfil: "",
};

/* --------------------- Draft persistence --------------------- */

const DRAFT_KEY = "impulsionando:orcamento:draft";
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function saveDraft(answers: Answers, step: number) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ answers, step, savedAt: Date.now() })
    );
  } catch {}
}

function loadDraft(): { answers: Answers; step: number } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.savedAt || Date.now() - data.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return { answers: data.answers as Answers, step: data.step as number };
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

/* --------------------- Lógica de recomendação --------------------- */

interface Recomendacao {
  plano: "Essencial" | "Integrado" | "Avançado" | "Sob Medida";
  modulos: string[];
  resumo: string;
  motivo: string;
}

const MODULO_LABEL: Record<string, string> = {
  agenda: "Agenda online",
  vendas: "Vendas / PDV",
  financeiro: "Financeiro",
  estoque: "Estoque",
  crm: "CRM",
  whatsapp: "WhatsApp",
  relatorios: "Relatórios / BI",
};

function recomendar(a: Answers): Recomendacao {
  const modulos = a.dores.map((d) => MODULO_LABEL[d]).filter(Boolean);

  // White label sempre vai pra Sob Medida
  if (a.perfil === "white-label") {
    return {
      plano: "Sob Medida",
      modulos,
      resumo: "Solução white label personalizada com sua marca, multi-empresa e gestão master.",
      motivo:
        "Como você quer revender / operar como white label, montamos um pacote sob medida com sua identidade, hierarquia master/cliente e contratos por uso.",
    };
  }

  // Mais de 1 unidade ou empresa grande → Avançado/Sob Medida
  if (a.unidades !== "1" || a.tamanho === "grande") {
    if (modulos.length >= 3) {
      return {
        plano: "Sob Medida",
        modulos,
        resumo: "Pacote completo com múltiplas unidades e operação consolidada.",
        motivo:
          "Você opera em mais de uma unidade ou tem equipe grande. Recomendamos um plano dimensionado por uso, com integração entre unidades.",
      };
    }
    return {
      plano: "Avançado",
      modulos,
      resumo: "3 módulos integrados + relatórios consolidados.",
      motivo:
        "Operação distribuída ou equipe grande pede mais módulos integrados e visão consolidada.",
    };
  }

  // 1 unidade, conta por dores
  const n = Math.max(1, modulos.length);
  if (n === 1) {
    return {
      plano: "Essencial",
      modulos,
      resumo: "1 módulo focado na sua principal dor.",
      motivo: "Você sinalizou uma dor principal — comece focado, com baixo custo e escale depois.",
    };
  }
  if (n === 2) {
    return {
      plano: "Integrado",
      modulos,
      resumo: "2 módulos integrados.",
      motivo: "Suas necessidades se beneficiam de 2 módulos trabalhando juntos.",
    };
  }
  return {
    plano: "Avançado",
    modulos,
    resumo: "3 módulos integrados + relatórios.",
    motivo: "Você tem 3 ou mais frentes a organizar — o Avançado entrega o melhor custo-benefício.",
  };
}

/* ------------------------------ UI ------------------------------- */

const STEPS = [
  { key: "perfil", title: "Quem vai usar o sistema?", helper: "Isso muda completamente a recomendação." },
  { key: "segmento", title: "Qual é o seu segmento?", helper: "Usamos para escolher os módulos certos." },
  { key: "tamanho", title: "Tamanho da operação", helper: "Quantas pessoas vão usar o sistema?" },
  { key: "unidades", title: "Quantas unidades você tem?", helper: "1 unidade simplifica. Várias exigem multi-empresa." },
  { key: "dores", title: "O que precisa resolver agora?", helper: "Pode marcar mais de uma — vamos sugerir os módulos." },
  { key: "urgencia", title: "Para quando você precisa?", helper: "Ajuda nosso time a priorizar o atendimento." },
] as const;

function StepHeader({ title, helper, step, total }: { title: string; helper: string; step: number; total: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Passo {step} de {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-primary transition-all"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight pt-2 flex items-center gap-2">
        {title}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Ajuda">
                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">{helper}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h2>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-12">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MultiChips({
  values,
  onToggle,
  options,
}: {
  values: string[];
  onToggle: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={cn(
              "text-left px-4 py-3 rounded-md border text-sm transition-all flex items-center gap-2",
              active
                ? "border-primary bg-primary/5 text-foreground shadow-elegant"
                : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                active ? "bg-primary border-primary text-primary-foreground" : "border-border"
              )}
            >
              {active && <CheckCircle2 className="w-3 h-3" />}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ResultCard({
  rec,
  answers,
  onRestart,
  onClearDraft,
}: {
  rec: Recomendacao;
  answers: Answers;
  onRestart: () => void;
  onClearDraft: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<LeadErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const whatsText = encodeURIComponent(
    `Olá! Fiz o briefing no site. Recomendação: Plano ${rec.plano} com módulos: ${rec.modulos.join(", ") || "—"}. Quero falar com um especialista.`
  );
  const whatsURL = `https://wa.me/5521993075000?text=${whatsText}`;

  function validate(): { ok: boolean; data?: z.infer<typeof leadSchema> } {
    const parsed = leadSchema.safeParse({ name, whatsapp, email });
    if (!parsed.success) {
      const errs: LeadErrors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof LeadErrors;
        if (k && !errs[k]) errs[k] = i.message;
      });
      setErrors(errs);
      // foca o primeiro campo inválido
      const order: (keyof LeadErrors)[] = ["name", "whatsapp", "email"];
      const first = order.find((k) => errs[k]);
      if (first && typeof document !== "undefined") {
        document.getElementById(`lead-${first}`)?.focus();
      }
      return { ok: false };
    }
    setErrors({});
    return { ok: true, data: parsed.data };
  }

  async function submit(openWhats: boolean) {
    const { ok, data } = validate();
    if (!ok || !data) {
      toast.error("Revise os campos destacados antes de enviar.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("marketing_leads").insert({
      source: "orcamento",
      name: data.name,
      phone: phoneDigits(data.whatsapp),
      email: data.email ? data.email : null,
      message: `Plano ${rec.plano} · Módulos: ${rec.modulos.join(", ") || "—"}`,
      answers: answers as never,
      recommended_plan: rec.plano,
      recommended_modules: rec.modulos,
      page_url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível enviar agora. Tente novamente.");
      return;
    }
    setSaved(true);
    onClearDraft();
    toast.success("Recebemos seu briefing! Nosso time entrará em contato.");
    if (openWhats) window.open(whatsURL, "_blank", "noopener,noreferrer");
  }

  const fieldError = (msg?: string) =>
    msg ? <p className="text-[11px] text-destructive mt-1">{msg}</p> : null;

  return (
    <Card className="p-6 sm:p-8 space-y-6 shadow-elegant">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Recomendação</div>
          <h2 className="text-3xl font-bold tracking-tight">Plano {rec.plano}</h2>
          <p className="text-muted-foreground mt-1">{rec.resumo}</p>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Módulos sugeridos</div>
        {rec.modulos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum módulo marcado. Volte e escolha pelo menos uma dor para receber sugestões.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rec.modulos.map((m) => (
              <span
                key={m}
                className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed">
        <span className="font-medium">Por que esse plano?</span> {rec.motivo}
      </div>

      {!saved && (
        <div className="rounded-lg border border-border p-4 sm:p-5 space-y-3 bg-card">
          <div className="text-sm font-semibold">Receba sua proposta personalizada</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="lead-name" className="text-xs">Seu nome *</Label>
              <Input
                id="lead-name"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                onBlur={() => { if (name) validate(); }}
                placeholder="Como podemos te chamar?"
                aria-invalid={!!errors.name}
                maxLength={120}
                className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
              />
              {fieldError(errors.name)}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-whatsapp" className="text-xs">WhatsApp *</Label>
              <Input
                id="lead-whatsapp"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(formatPhoneBR(e.target.value));
                  if (errors.whatsapp) setErrors({ ...errors, whatsapp: undefined });
                }}
                onBlur={() => { if (whatsapp) validate(); }}
                placeholder="(21) 99999-9999"
                inputMode="tel"
                autoComplete="tel-national"
                aria-invalid={!!errors.whatsapp}
                maxLength={16}
                className={cn(errors.whatsapp && "border-destructive focus-visible:ring-destructive")}
              />
              {fieldError(errors.whatsapp) ?? (
                <p className="text-[11px] text-muted-foreground mt-1">DDD + número, com 10 ou 11 dígitos.</p>
              )}
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="lead-email" className="text-xs">E-mail (opcional)</Label>
              <Input
                id="lead-email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                onBlur={() => { if (email) validate(); }}
                type="email"
                placeholder="voce@empresa.com"
                aria-invalid={!!errors.email}
                maxLength={200}
                autoComplete="email"
                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              {fieldError(errors.email)}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Ao enviar você concorda com nossa{" "}
            <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {!saved ? (
          <>
            <Button
              size="lg"
              className="gap-2 bg-gradient-primary shadow-elegant"
              onClick={() => submit(true)}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Enviar e falar no WhatsApp
            </Button>
            <Button size="lg" variant="outline" onClick={() => submit(false)} disabled={saving}>
              Só enviar para receber depois
            </Button>
          </>
        ) : (
          <Button asChild size="lg" className="gap-2 bg-gradient-primary shadow-elegant">
            <a href={whatsURL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              Falar no WhatsApp agora
            </a>
          </Button>
        )}
        <Button asChild variant="outline" size="lg">
          <Link to="/demo">Ver o sistema funcionando</Link>
        </Button>
        <Button variant="ghost" size="lg" onClick={onRestart}>
          Refazer briefing
        </Button>
      </div>
    </Card>
  );
}



const VALID_DORES = new Set<string>(DORES.map((d) => d.value));
const VALID_SEGMENTOS = new Set<string>(SEGMENTOS.map((s) => s.value));
const VALID_PERFIS = new Set<string>(PERFIL.map((p) => p.value));

function buildPrefill(s: SearchParams): { answers: Answers; firstStep: number; hasPrefill: boolean } {
  const a: Answers = { ...INITIAL };
  let hasPrefill = false;

  if (s.segmento && VALID_SEGMENTOS.has(s.segmento)) { a.segmento = s.segmento; hasPrefill = true; }
  if (s.dores) {
    const list = s.dores.split(",").map((d) => d.trim()).filter((d) => VALID_DORES.has(d));
    if (list.length) { a.dores = list; hasPrefill = true; }
  }
  if (s.perfil && VALID_PERFIS.has(s.perfil)) { a.perfil = s.perfil; hasPrefill = true; }
  if (s.plano === "Sob Medida") {
    a.perfil = a.perfil || "white-label";
    a.unidades = a.unidades || "4+";
    a.tamanho = a.tamanho || "grande";
    hasPrefill = true;
  } else if (s.plano === "Avançado") {
    a.unidades = a.unidades || "2-3";
    hasPrefill = true;
  }

  // Find first unanswered step
  const order: (keyof Answers)[] = ["perfil", "segmento", "tamanho", "unidades", "dores", "urgencia"];
  let firstStep = 0;
  for (let i = 0; i < order.length; i++) {
    const k = order[i];
    const filled = k === "dores" ? a.dores.length > 0 : !!a[k];
    if (!filled) { firstStep = i; break; }
    firstStep = i + 1;
  }
  return { answers: a, firstStep: Math.min(firstStep, STEPS.length - 1), hasPrefill };
}

function mergeDraftWithPrefill(
  draft: { answers: Answers; step: number } | null,
  prefill: { answers: Answers; firstStep: number; hasPrefill: boolean }
): { answers: Answers; step: number; source: "draft" | "prefill" | "fresh" } {
  // URL prefill sempre tem prioridade sobre draft (ação deliberada do usuário)
  if (prefill.hasPrefill) {
    return { answers: prefill.answers, step: prefill.firstStep, source: "prefill" };
  }
  if (draft) {
    return { answers: draft.answers, step: draft.step, source: "draft" };
  }
  return { answers: prefill.answers, step: prefill.firstStep, source: "fresh" };
}

function OrcamentoPage() {
  const search = Route.useSearch();
  const prefill = useMemo(() => buildPrefill(search), [search]);

  const [mounted, setMounted] = useState(false);
  const [a, setA] = useState<Answers>(prefill.answers);
  const [step, setStep] = useState(prefill.firstStep);
  const [done, setDone] = useState(false);
  const [draftToastShown, setDraftToastShown] = useState(false);
  const draftSavedRef = useRef(false);

  // Hydration-safe: only read localStorage after mount
  useEffect(() => {
    setMounted(true);
    const draft = loadDraft();
    const merged = mergeDraftWithPrefill(draft, prefill);
    setA(merged.answers);
    setStep(merged.step);
    if (merged.source === "draft" && !draftToastShown) {
      setDraftToastShown(true);
      toast.info("Continuando de onde você parou. O rascunho foi restaurado.", {
        duration: 5000,
        action: {
          label: "Recomeçar",
          onClick: () => {
            clearDraft();
            setA(INITIAL);
            setStep(0);
            toast.success("Rascunho removido. Comece do início.");
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft whenever answers or step change (throttle via ref to avoid first render save)
  useEffect(() => {
    if (!mounted) return;
    // Debounce: só salva 800ms após a última mudança para não floodar
    const t = setTimeout(() => {
      saveDraft(a, step);
      draftSavedRef.current = true;
    }, 800);
    return () => clearTimeout(t);
  }, [a, step, mounted]);

  const total = STEPS.length;
  const current = STEPS[step];

  const canNext = useMemo(() => {
    const key = current.key as keyof Answers;
    if (key === "dores") return a.dores.length > 0;
    return !!a[key];
  }, [a, current]);

  function next() {
    if (step < total - 1) setStep((s) => s + 1);
    else setDone(true);
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }
  function reset() {
    clearDraft();
    setA(INITIAL);
    setStep(0);
    setDone(false);
    draftSavedRef.current = false;
  }
  function toggleDor(v: string) {
    setA((prev) => ({
      ...prev,
      dores: prev.dores.includes(v) ? prev.dores.filter((x) => x !== v) : [...prev.dores, v],
    }));
  }

  const hasAnyAnswer =
    !!a.perfil || !!a.segmento || !!a.tamanho || !!a.unidades || a.dores.length > 0 || !!a.urgencia;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Briefing inteligente
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Descubra o plano ideal em 1 minuto</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Responda 6 perguntas e receba uma recomendação personalizada de módulos e plano — sem cadastro.
          </p>
          {prefill.hasPrefill && !done && (
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pré-preenchemos com sua escolha{search.plano ? ` (${search.plano})` : ""}. Confira e avance.
            </div>
          )}
        </div>

        {done ? (
          <ResultCard rec={recomendar(a)} answers={a} onRestart={reset} onClearDraft={clearDraft} />
        ) : (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <StepHeader title={current.title} helper={current.helper} step={step + 1} total={total} />
              {hasAnyAnswer && (
                <button
                  type="button"
                  onClick={reset}
                  className="shrink-0 ml-3 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  title="Limpar rascunho e recomeçar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>

            {draftSavedRef.current && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground -mt-2">
                <Save className="w-3 h-3" />
                <span>Rascunho salvo automaticamente</span>
              </div>
            )}

            <div className="space-y-3">
              {current.key === "perfil" && (
                <>
                  <Label className="sr-only">Perfil</Label>
                  <SelectField
                    value={a.perfil}
                    onChange={(v) => setA({ ...a, perfil: v })}
                    options={PERFIL}
                    placeholder="Selecione uma opção"
                  />
                </>
              )}
              {current.key === "segmento" && (
                <SelectField
                  value={a.segmento}
                  onChange={(v) => setA({ ...a, segmento: v })}
                  options={SEGMENTOS}
                  placeholder="Selecione o segmento"
                />
              )}
              {current.key === "tamanho" && (
                <SelectField
                  value={a.tamanho}
                  onChange={(v) => setA({ ...a, tamanho: v })}
                  options={TAMANHO}
                  placeholder="Selecione o tamanho da equipe"
                />
              )}
              {current.key === "unidades" && (
                <SelectField
                  value={a.unidades}
                  onChange={(v) => setA({ ...a, unidades: v })}
                  options={UNIDADES}
                  placeholder="Selecione o número de unidades"
                />
              )}
              {current.key === "dores" && (
                <MultiChips values={a.dores} onToggle={toggleDor} options={DORES} />
              )}
              {current.key === "urgencia" && (
                <SelectField
                  value={a.urgencia}
                  onChange={(v) => setA({ ...a, urgencia: v })}
                  options={URGENCIA}
                  placeholder="Selecione a urgência"
                />
              )}
            </div>

            {!canNext && (
              <p className="text-xs text-muted-foreground -mt-2">
                {current.key === "dores"
                  ? "Selecione pelo menos uma opção para receber sugestões de módulos."
                  : "Faça uma seleção para avançar."}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <div className="flex flex-col items-end gap-1">
                <Button
                  onClick={next}
                  disabled={!canNext}
                  className="gap-1 bg-gradient-primary shadow-elegant"
                >
                  {step === total - 1 ? "Ver recomendação" : "Avançar"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                {step < total - 1 && (
                  <span className="text-[11px] text-muted-foreground">
                    Próximo: {STEPS[step + 1].title}
                  </span>
                )}
              </div>
            </div>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
