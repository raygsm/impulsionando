import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Loader2, MessageCircle, Sparkles } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
}: {
  rec: Recomendacao;
  answers: Answers;
  onRestart: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const whatsText = encodeURIComponent(
    `Olá! Fiz o briefing no site. Recomendação: Plano ${rec.plano} com módulos: ${rec.modulos.join(", ") || "—"}. Quero falar com um especialista.`
  );
  const whatsURL = `https://wa.me/5521993075000?text=${whatsText}`;

  async function submit(openWhats: boolean) {
    if (!name.trim() || !whatsapp.trim()) {
      toast.error("Informe nome e WhatsApp para que possamos te responder.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("marketing_leads").insert({
      source: "orcamento",
      name: name.trim(),
      phone: whatsapp.trim(),
      email: email.trim() || null,
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
    toast.success("Recebemos seu briefing! Nosso time entrará em contato.");
    if (openWhats) window.open(whatsURL, "_blank", "noopener,noreferrer");
  }

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
              <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-whats" className="text-xs">WhatsApp *</Label>
              <Input id="lead-whats" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(21) 99999-9999" inputMode="tel" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="lead-email" className="text-xs">E-mail (opcional)</Label>
              <Input id="lead-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@empresa.com" />
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

function OrcamentoPage() {
  const search = Route.useSearch();
  const initial = useMemo(() => buildPrefill(search), [search]);
  const [a, setA] = useState<Answers>(initial.answers);
  const [step, setStep] = useState(initial.firstStep);
  const [done, setDone] = useState(false);

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
    setA(INITIAL);
    setStep(0);
    setDone(false);
  }
  function toggleDor(v: string) {
    setA((prev) => ({
      ...prev,
      dores: prev.dores.includes(v) ? prev.dores.filter((x) => x !== v) : [...prev.dores, v],
    }));
  }

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
          {initial.hasPrefill && !done && (
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pré-preenchemos com sua escolha{search.plano ? ` (${search.plano})` : ""}. Confira e avance.
            </div>
          )}
        </div>


        {done ? (
          <ResultCard rec={recomendar(a)} answers={a} onRestart={reset} />
        ) : (
          <Card className="p-6 sm:p-8 space-y-6">
            <StepHeader title={current.title} helper={current.helper} step={step + 1} total={total} />

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

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <Button
                onClick={next}
                disabled={!canNext}
                className="gap-1 bg-gradient-primary shadow-elegant"
              >
                {step === total - 1 ? "Ver recomendação" : "Avançar"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
