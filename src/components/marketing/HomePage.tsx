import { Link } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle, ArrowRight, Sparkles, PlayCircle, Calculator, Search,
  Settings, Eye, CheckCircle2, Rocket, AlertTriangle, TrendingDown, Mail, MessageSquare, Phone,
  Building2, Gift, Bot, Zap, Clock, TrendingUp, ShieldCheck, Brain,
  Stethoscope, Beer, Home as HomeIcon, Scale, ShoppingBag, Ticket, Sparkle, Utensils,
  Dumbbell, GraduationCap, Layers, Store, Target, Users, Wallet,
  MessageCircleWarning, CalendarClock, BarChart3, Cog, RefreshCw, WifiOff, TimerReset,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { DemoLeadDialog } from "@/components/demo/DemoLeadDialog";
import { getDemoNichoLink } from "@/lib/demoResolver";
import { trackFunnelCta, getFunnelTraceId } from "@/lib/funnelTracking";


// ============== DIAGNÓSTICO ==============
const NICHOS = [
  { slug: "saude", label: "Clínica/consultório", icon: Stethoscope, desc: "Agenda, prontuário, cobrança" },
  { slug: "bares-restaurantes", label: "Bar/restaurante", icon: Beer, desc: "Comandas, PDV, cozinha" },
  { slug: "microcervejarias", label: "Microcervejaria", icon: Beer, desc: "PDV, B2B, eventos" },
  { slug: "imobiliaria", label: "Imobiliária", icon: HomeIcon, desc: "CRM de imóveis, corretores" },
  { slug: "contabilidade", label: "Contabilidade", icon: Scale, desc: "Portal do cliente, obrigações" },
  { slug: "comercio", label: "Loja física", icon: Store, desc: "PDV, estoque, financeiro" },
  { slug: "eventos", label: "Eventos", icon: Ticket, desc: "Ingressos, check-in, BI" },
  { slug: "servicos", label: "Serviços", icon: Sparkle, desc: "Propostas, contratos, agenda" },
  { slug: "ecommerce", label: "E-commerce", icon: ShoppingBag, desc: "Catálogo, pedidos, fulfillment" },
  { slug: "fitness", label: "Fitness", icon: Dumbbell, desc: "Aulas, mensalidade, app aluno" },
  { slug: "educacao", label: "Educação", icon: GraduationCap, desc: "Matrículas, portal, comunicados" },
  { slug: "white-label", label: "White Label", icon: Layers, desc: "Multi-empresa, marca própria" },
  { slug: "outro", label: "Outro", icon: Building2, desc: "Solução sob medida" },
];

const DOR_ICONS: Record<string, any> = {
  "Perco leads": TrendingDown,
  "Demoro para responder": Clock,
  "Não tenho CRM": Users,
  "Atendimento perdido no WhatsApp": MessageCircleWarning,
  "Equipe esquece follow-up": Bot,
  "Agenda confusa": CalendarClock,
  "Pagamentos manuais": Wallet,
  "Falta dashboard": BarChart3,
  "Falta área do cliente": Users,
  "Quero automatizar comunicação": Cog,
  "Quero vender mais": TrendingUp,
  "Quero organizar operação": Target,
};

const DORES = [
  "Perco leads", "Demoro para responder", "Não tenho CRM",
  "Atendimento perdido no WhatsApp", "Equipe esquece follow-up",
  "Agenda confusa", "Pagamentos manuais", "Falta dashboard",
  "Falta área do cliente", "Quero automatizar comunicação",
  "Quero vender mais", "Quero organizar operação",
];

const FOCO_ICONS: Record<string, any> = {
  "Captação": Target, "Atendimento": MessageCircle, "Vendas": TrendingUp,
  "Agenda": CalendarClock, "Pagamentos": Wallet, "Gestão": BarChart3,
  "Comunicação": Bot, "Fidelização": Sparkles, "Tudo junto": Zap,
};

const FOCOS = ["Captação", "Atendimento", "Vendas", "Agenda", "Pagamentos", "Gestão", "Comunicação", "Fidelização", "Tudo junto"];

type RecomendacaoBase = {
  modulos: string[];
  correlatos: string[];
  plano: string;
  demo: string;
  horas: number;
  compat: number;
};

type DiagnosticoCalculado = RecomendacaoBase & {
  economiaValor: number;
  racional: string;
  prioridade: string;
  nichoLabel: string;
};

const QUIZ_STORAGE_KEY = "impulsionando:diagnostico-home:v2";

const RECOMENDACOES: Record<string, RecomendacaoBase> = {
  imobiliaria: {
    modulos: ["CRM de imóveis", "Automação & Comunicação", "BI & Dashboards", "Área do Cliente", "Documentos & Propostas", "Gestão de Corretores"],
    correlatos: ["WhatsApp para corretores", "Portal do proprietário", "Funil comercial", "Relatórios por gerente"],
    plano: "Integrado", demo: "/demo/nicho/imobiliaria", horas: 42, compat: 96,
  },
  saude: {
    modulos: ["Agenda online", "Prontuário eletrônico", "Cobrança recorrente", "Área do paciente", "WhatsApp confirmação"],
    correlatos: ["Lista de espera", "Telemedicina", "Faturamento TISS", "BI clínico"],
    plano: "Integrado", demo: "/demo/nicho/saude", horas: 38, compat: 98,
  },
  contabilidade: {
    modulos: ["Portal do cliente contábil", "Calendário fiscal", "Documentos", "IRPF jornada", "BI gerencial"],
    correlatos: ["WhatsApp por departamento", "Contratos e onboarding", "Tarefas e obrigações"],
    plano: "Avançado", demo: "/demo/nicho/contabilidade", horas: 51, compat: 94,
  },
  "bares-restaurantes": {
    modulos: ["PDV", "Mesas e comandas", "QR Code menu", "Estoque", "Cozinha integrada"],
    correlatos: ["Delivery", "Fidelidade", "Pagamento na mesa", "Ficha técnica"],
    plano: "Integrado", demo: "/demo/nicho/bares-restaurantes", horas: 35, compat: 97,
  },
  microcervejarias: {
    modulos: ["PDV cervejeiro", "Catálogo B2B", "Pedidos de bares", "Eventos e degustações", "Estoque por lote"],
    correlatos: ["CRM de PDVs", "Sell-out", "WhatsApp para revendas", "BI por canal"],
    plano: "Integrado", demo: "/demo/nicho/microcervejarias", horas: 39, compat: 96,
  },
  eventos: {
    modulos: ["Ingressos", "Check-in QR", "CRM público", "BI evento"],
    correlatos: ["Transferência de ingresso", "Pesquisa pós-evento", "Pagamento parcelado"],
    plano: "Essencial", demo: "/demo/nicho/eventos", horas: 28, compat: 92,
  },
  ecommerce: {
    modulos: ["Catálogo", "Pedidos", "Pagamentos", "Estoque", "Área do consumidor"],
    correlatos: ["WhatsApp de carrinho", "Fidelidade", "Fulfillment", "BI vendas"],
    plano: "Integrado", demo: "/demo/nicho/ecommerce", horas: 40, compat: 95,
  },
  comercio: {
    modulos: ["PDV", "Estoque", "Vendas", "Financeiro", "Clientes"],
    correlatos: ["Cashback", "WhatsApp pós-venda", "Cupons"],
    plano: "Essencial", demo: "/demo/nicho/comercio", horas: 32, compat: 93,
  },
  servicos: {
    modulos: ["CRM", "Propostas", "Contratos", "Cobrança", "Agenda"],
    correlatos: ["Assinaturas", "WhatsApp", "BI comercial"],
    plano: "Integrado", demo: "/demo/nicho/servicos", horas: 36, compat: 95,
  },
  fitness: {
    modulos: ["Agenda de aulas", "Mensalidade recorrente", "App aluno", "Avaliações físicas"],
    correlatos: ["Check-in QR", "WhatsApp", "Comissão de professor"],
    plano: "Integrado", demo: "/showroom/fitness", horas: 30, compat: 96,
  },
  educacao: {
    modulos: ["Matrículas", "Pagamento recorrente", "Portal do aluno", "Comunicados"],
    correlatos: ["WhatsApp turma", "BI evasão", "Boletos"],
    plano: "Integrado", demo: "/demo/nicho/educacao", horas: 34, compat: 94,
  },
  "white-label": {
    modulos: ["Plataforma multiempresa", "Marca própria", "BI agregado", "Faturamento por cliente"],
    correlatos: ["Setup assistido", "Treinamento", "Suporte dedicado"],
    plano: "Sob Medida", demo: "/demo/nicho/white-label", horas: 60, compat: 99,
  },
  outro: {
    modulos: ["CRM", "Comunicação", "Pagamentos", "Dashboard"],
    correlatos: ["Atendimento consultivo", "Customização"],
    plano: "Sob Medida", demo: "/demo/nicho/servicos", horas: 30, compat: 90,
  },
};

const LEGACY_NICHO_ALIASES: Record<string, string> = {
  bares: "bares-restaurantes",
};

const DOR_MODULES: Record<string, string[]> = {
  "Perco leads": ["CRM", "Captação inteligente"],
  "Demoro para responder": ["WhatsApp automático", "Atendimento IA"],
  "Não tenho CRM": ["CRM & Funil"],
  "Atendimento perdido no WhatsApp": ["Central WhatsApp", "Histórico unificado"],
  "Equipe esquece follow-up": ["Réguas automáticas", "Tarefas"],
  "Agenda confusa": ["Agenda online", "Lembretes"],
  "Pagamentos manuais": ["Pix e cartão", "Cobrança recorrente"],
  "Falta dashboard": ["BI & Dashboards"],
  "Falta área do cliente": ["Portal do cliente"],
  "Quero automatizar comunicação": ["E-mail transacional", "WhatsApp"],
  "Quero vender mais": ["Campanhas", "Upsell"],
  "Quero organizar operação": ["Processos", "Permissões"],
};

const FOCO_MODULES: Record<string, string[]> = {
  Captação: ["Landing pages", "CRM"],
  Atendimento: ["Central de atendimento", "SLA"],
  Vendas: ["Funil comercial", "Checkout"],
  Agenda: ["Agenda online", "Confirmação automática"],
  Pagamentos: ["Pix", "Cartão", "Cobrança"],
  Gestão: ["BI executivo", "Auditoria"],
  Comunicação: ["WhatsApp", "E-mail", "N8N"],
  Fidelização: ["Clube", "Cashback", "Winback"],
  "Tudo junto": ["Core completo", "Automações", "BI", "Governança"],
};

function normalizeNichoSlug(slug: string): string {
  return LEGACY_NICHO_ALIASES[slug] ?? slug;
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function calculateDiagnostico(nicho: string, dores: string[], foco: string): DiagnosticoCalculado | null {
  const normalized = normalizeNichoSlug(nicho);
  const base = RECOMENDACOES[normalized] ?? RECOMENDACOES.outro;
  if (!base) return null;

  const selectedLabel = NICHOS.find((n) => n.slug === normalized)?.label ?? "operação";
  const doresModules = dores.flatMap((dor) => DOR_MODULES[dor] ?? []);
  const focoModules = FOCO_MODULES[foco] ?? [];
  const modulos = uniq([...base.modulos, ...doresModules, ...focoModules]).slice(0, 9);
  const correlatos = uniq([...base.correlatos, ...focoModules]).slice(0, 6);

  const wantsFull = dores.length >= 6 || foco === "Tudo junto" || normalized === "white-label";
  const canStartSimple = dores.length <= 2 && ["Agenda", "Pagamentos", "Captação"].includes(foco) && base.plano !== "Sob Medida";
  const plano = base.plano === "Sob Medida" ? "Sob Medida" : wantsFull ? "Avançado" : canStartSimple ? "Essencial" : base.plano;
  const horas = Math.min(86, base.horas + dores.length * 3 + (foco === "Tudo junto" ? 12 : foco === "Gestão" ? 7 : foco === "Comunicação" ? 5 : 0));
  const compat = Math.min(99, base.compat + Math.min(4, dores.length));
  const economiaValor = Math.round(horas * 95);
  const racional = plano === "Avançado"
    ? `Indiquei o Avançado porque você marcou ${dores.length} desafios e precisa integrar ${foco.toLowerCase()} com operação, dados e automações sem criar novos silos.`
    : plano === "Essencial"
      ? `Indiquei o Essencial porque sua prioridade imediata é ${foco.toLowerCase()} e o volume de desafios permite começar enxuto, com evolução modular.`
      : plano === "Sob Medida"
        ? `Indiquei Sob Medida porque este cenário pede marca, regras comerciais e implantação ajustadas ao modelo do seu negócio.`
        : `Indiquei o Integrado porque seu diagnóstico combina ${selectedLabel.toLowerCase()}, ${dores.length} desafios e foco em ${foco.toLowerCase()}, exigindo módulos conectados de ponta a ponta.`;

  return { ...base, modulos, correlatos, plano, horas, compat, economiaValor, racional, prioridade: foco, nichoLabel: selectedLabel };
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

// Contador animado (números crescendo)
function useCountUp(target: number, run: boolean, ms = 900): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) { setV(0); return; }
    const t0 = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return v;
}

const STEP_LABELS = ["Segmento", "Desafios", "Prioridade"] as const;

// Watchdog do painel Impulsionito: se o usuário selecionou nicho mas não
// concluiu em `STREAM_TIMEOUT_MS`, exibimos um estado de timeout com CTA
// de "Tentar novamente". Também aceitamos ?diagError=timeout|error na URL
// para permitir screenshots/testes determinísticos sem alterar o backend.
const STREAM_TIMEOUT_MS = 60_000;
type StreamError = null | "timeout" | "error";

function readForcedError(): StreamError {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("diagError");
  return v === "timeout" || v === "error" ? v : null;
}

function Diagnostico() {
  const [step, setStep] = useState(0); // 0..2
  const [nicho, setNicho] = useState<string>("");
  const [dores, setDores] = useState<string[]>([]);
  const [foco, setFoco] = useState<string>("");
  const [streamError, setStreamError] = useState<StreamError>(null);
  const [restored, setRestored] = useState(false);

  const result = useMemo(() => nicho ? calculateDiagnostico(nicho, dores, foco) : null, [nicho, dores, foco]);
  const showResult = !!(nicho && foco && dores.length > 0 && result);

  const progress = showResult ? 100 : Math.min(95, ((nicho ? 33 : 0) + (dores.length ? 33 : 0) + (foco ? 29 : 0)));

  const horas = useCountUp(result?.horas ?? 0, showResult);
  const compat = useCountUp(result?.compat ?? 0, showResult);
  const empresas = useCountUp(1240, true, 1400);
  const similares = useCountUp(nicho ? 180 : 0, !!nicho, 900);
  const automacoes = useCountUp(320, true, 1500);

  const streamState: "idle" | "streaming" | "complete" | "timeout" | "error" =
    streamError ? streamError
    : showResult ? "complete"
    : nicho ? "streaming"
    : "idle";
  const nichoLabel = useMemo(() => NICHOS.find((n) => n.slug === nicho)?.label ?? nicho, [nicho]);
  const leadNotes = useMemo(() => {
    if (!result) return "";
    return [
      "Diagnóstico da Home — Impulsionando",
      `Segmento: ${result.nichoLabel} (${nicho})`,
      `Desafios: ${dores.join(", ") || "não informado"}`,
      `Prioridade: ${foco || "não informado"}`,
      `Plano indicado: ${result.plano}`,
      `Economia estimada: ${result.horas}h/mês (${formatBRL(result.economiaValor)}/mês operacional estimado)`,
      `Compatibilidade: ${result.compat}%`,
      `Módulos: ${result.modulos.join(", ")}`,
      `Racional: ${result.racional}`,
    ].join("\n");
  }, [dores, foco, nicho, result]);

  // Lê ?diagError=... uma vez na montagem (SSR-safe).
  useEffect(() => {
    const forced = readForcedError();
    if (forced) setStreamError(forced);
  }, []);

  // Restaura o diagnóstico localmente para o visitante continuar depois.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { step?: number; nicho?: string; dores?: string[]; foco?: string };
        const savedNicho = normalizeNichoSlug(String(saved.nicho ?? ""));
        const safeDores = Array.isArray(saved.dores) ? saved.dores.filter((d) => DORES.includes(d)).slice(0, DORES.length) : [];
        const safeFoco = FOCOS.includes(String(saved.foco ?? "")) ? String(saved.foco) : "";
        if (savedNicho && RECOMENDACOES[savedNicho]) setNicho(savedNicho);
        if (safeDores.length) setDores(safeDores);
        if (safeFoco) setFoco(safeFoco);
        const nextStep = Number.isInteger(saved.step) ? Math.min(2, Math.max(0, Number(saved.step))) : savedNicho ? safeDores.length ? 2 : 1 : 0;
        setStep(nextStep);
      }
    } catch {
      window.localStorage.removeItem(QUIZ_STORAGE_KEY);
    } finally {
      setRestored(true);
    }
  }, []);

  // Persiste apenas no navegador do visitante. Nada é enviado antes do contato.
  useEffect(() => {
    if (!restored || typeof window === "undefined") return;
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ step, nicho, dores, foco, updatedAt: new Date().toISOString() }));
  }, [step, nicho, dores, foco, restored]);

  // Watchdog: expira o streaming após STREAM_TIMEOUT_MS parado (sem completar).
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    if (nicho && !showResult && !streamError) {
      watchdogRef.current = setTimeout(() => setStreamError("timeout"), STREAM_TIMEOUT_MS);
    }
    return () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, [nicho, dores.length, foco, showResult, streamError]);

  const selectNicho = useCallback((slug: string) => {
    setStreamError(null);
    setNicho(normalizeNichoSlug(slug));
    setStep(1);
  }, []);
  const toggleDor = useCallback((d: string) => {
    setStreamError(null);
    setDores((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }, []);
  const selectFoco = useCallback((f: string) => {
    setStreamError(null);
    setFoco(f);
    setStep(2);
  }, []);
  const retry = useCallback(() => {
    setStreamError(null);
    setNicho("");
    setDores([]);
    setFoco("");
    setStep(0);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(QUIZ_STORAGE_KEY);
      const url = new URL(window.location.href);
      if (url.searchParams.has("diagError")) {
        url.searchParams.delete("diagError");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);


  return (
    <section id="diagnostico-wrap" className="relative overflow-hidden border-y border-primary/20 bg-slate-950 text-slate-100">
      <div className="absolute inset-0 pointer-events-none opacity-60 [background-image:radial-gradient(ellipse_at_top,theme(colors.primary/25),transparent_60%),radial-gradient(circle_at_20%_10%,theme(colors.primary/15),transparent_40%),radial-gradient(circle_at_80%_80%,theme(colors.primary/12),transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-10 animate-fade-in">
          <Badge className="bg-primary/25 text-white border-primary/40 mb-4 gap-1.5 px-3 py-1 hover:bg-primary/25">
            <Bot className="w-3.5 h-3.5" /> Impulsionito · Consultor de IA
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            Descubra em menos de 30 segundos como automatizar seu negócio
          </h2>
          <p className="text-slate-300 mt-3 text-sm sm:text-base">
            Responda poucas perguntas e veja imediatamente:
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-3 text-sm">
            {["módulos recomendados", "economia estimada", "plano indicado", "demonstração personalizada"].map((x) => (
              <span key={x} className="inline-flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-primary" /> {x}
              </span>
            ))}
          </div>
        </div>


        {/* GRID PRINCIPAL */}
        <div id="diagnostico" className="grid gap-6 lg:grid-cols-[40fr_60fr]" data-testid="diagnostico-root">
          {/* ---------------- ESQUERDA: PERGUNTAS ---------------- */}
          <div className="space-y-5 lg:min-h-0" data-testid="diagnostico-perguntas">
            {/* stepper */}
            <div className="flex items-center gap-2" data-testid="diagnostico-stepper" role="tablist" aria-label="Etapas do diagnóstico">
              {STEP_LABELS.map((label, i) => {
                const active = step === i;
                const done = step > i;
                return (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-current={active ? "step" : undefined}
                    data-testid={`step-tab-${i}`}
                    data-state={active ? "active" : done ? "done" : "idle"}
                    onClick={() => (i === 0 || nicho) && (i === 1 ? nicho : true) && setStep(i)}
                    className={`group flex-1 flex items-center gap-2 rounded-xl px-3 py-2 border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
                      ${active ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-[1.02]"
                        : done ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
                        : "bg-card/60 text-muted-foreground border-border/60 hover:border-primary/40"}`}
                  >
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold transition-colors duration-300
                      ${active ? "bg-primary-foreground/20" : done ? "bg-primary/20" : "bg-muted"}`}>
                      {done ? <CheckCircle2 className="w-4 h-4 animate-in zoom-in-50 duration-300" /> : i + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* STEP 1: Segmento */}
            {step === 0 && (
              <div
                key="step-0"
                data-testid="step-panel-0"
                className="min-h-[calc(100svh-16rem)] lg:min-h-0 flex animate-in fade-in slide-in-from-right-2 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none"
              >
              <Card className="flex-1 p-5 sm:p-6 border-primary/20 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/70">
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-wider text-primary font-semibold">Etapa 1 · Sobre você</div>
                  <h3 className="text-xl font-bold mt-1">Qual é o seu segmento?</h3>
                  <p className="text-xs text-muted-foreground">Escolha o que mais se aproxima do seu negócio.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {NICHOS.map((n) => {
                    const Icon = n.icon;
                    const on = nicho === n.slug;
                    return (
                      <button
                        key={n.slug}
                        type="button"
                        data-testid={`nicho-${n.slug}`}
                        aria-pressed={on}
                        onClick={() => selectNicho(n.slug)}
                        onPointerUp={() => selectNicho(n.slug)}
                        className={`group relative text-left rounded-xl p-3 border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] motion-reduce:transition-none
                          ${on ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 -translate-y-0.5"
                            : "border-border/60 bg-card/50 hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"}`}
                      >
                        <div className={`w-9 h-9 rounded-lg grid place-items-center mb-2 transition-colors
                          ${on ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-semibold leading-tight">{n.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </Card>
              </div>
            )}

            {/* STEP 2: Dores */}
            {step === 1 && (
              <div
                key="step-1"
                data-testid="step-panel-1"
                className="min-h-[calc(100svh-16rem)] lg:min-h-0 flex animate-in fade-in slide-in-from-right-2 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none"
              >
              <Card className="flex-1 p-5 sm:p-6 border-primary/20 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/70">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-primary font-semibold">Etapa 2 · Diagnóstico</div>
                    <h3 className="text-xl font-bold mt-1">Qual é seu maior desafio hoje?</h3>
                    <p className="text-xs text-muted-foreground">Pode escolher quantos precisar — quanto mais, melhor o match.</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setStep(0)} className="shrink-0 text-xs" data-testid="btn-voltar-1">Voltar</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DORES.map((d) => {
                    const Icon = DOR_ICONS[d] ?? AlertTriangle;
                    const on = dores.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        data-testid={`dor-${d}`}
                        aria-pressed={on}
                        onClick={() => toggleDor(d)}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 border text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] motion-reduce:transition-none
                          ${on ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "border-border/60 bg-card/50 hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"}`}
                      >
                        <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 transition-colors duration-300
                          ${on ? "bg-primary-foreground/20" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-sm font-medium">{d}</span>
                        {on && <CheckCircle2 className="w-4 h-4 ml-auto animate-in zoom-in-50 duration-300" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground" data-testid="dores-count">{dores.length} selecionada(s)</span>
                  <button
                    type="button"
                    onClick={() => dores.length > 0 && setStep(2)}
                    onPointerUp={() => dores.length > 0 && setStep(2)}
                    disabled={dores.length === 0}
                    data-testid="btn-continuar"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </Card>
              </div>
            )}

            {/* STEP 3: Foco */}
            {step === 2 && (
              <div
                key="step-2"
                data-testid="step-panel-2"
                className="min-h-[calc(100svh-16rem)] lg:min-h-0 flex animate-in fade-in slide-in-from-right-2 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none"
              >
              <Card className="flex-1 p-5 sm:p-6 border-primary/20 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/70">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-primary font-semibold">Etapa 3 · Prioridade</div>
                    <h3 className="text-xl font-bold mt-1">O que deseja resolver primeiro?</h3>
                    <p className="text-xs text-muted-foreground">Isso define por onde o Impulsionito começa a construir sua solução.</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setStep(1)} className="shrink-0 text-xs" data-testid="btn-voltar-2">Voltar</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {FOCOS.map((f) => {
                    const Icon = FOCO_ICONS[f] ?? Target;
                    const on = foco === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        data-testid={`foco-${f}`}
                        aria-pressed={on}
                        onClick={() => selectFoco(f)}
                        className={`group rounded-xl p-3 border text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] motion-reduce:transition-none
                          ${on ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 -translate-y-0.5"
                            : "border-border/60 bg-card/50 hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"}`}
                      >
                        <div className={`w-9 h-9 rounded-lg grid place-items-center mb-2 transition-colors duration-300
                          ${on ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-semibold">{f}</div>
                      </button>
                    );
                  })}
                </div>
              </Card>
              </div>
            )}
          </div>


          {/* ---------------- DIREITA: PAINEL IA ---------------- */}
          <div className="lg:sticky lg:top-6 self-start space-y-4" data-testid="impulsionito-panel" aria-live="polite">
            <Card
              data-testid="impulsionito-card"
              data-stream-state={streamState}
              className="relative overflow-hidden p-5 sm:p-6 border-primary/30 bg-gradient-to-br from-primary/95 via-primary to-primary/85 text-primary-foreground shadow-2xl shadow-primary/25 transition-shadow duration-500 min-h-[440px] flex flex-col [contain:layout]"
            >
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />
              {/* barra de scanning durante streaming */}
              {streamState === "streaming" && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent motion-safe:animate-pulse" />
              )}
              <div className="relative flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl backdrop-blur grid place-items-center ring-1 transition-[background-color,box-shadow,border-color] duration-500 will-change-[background-color]
                    ${streamState === "streaming" ? "bg-white/15 ring-white/50 shadow-lg shadow-white/10"
                      : streamState === "timeout" || streamState === "error" ? "bg-amber-500/20 ring-amber-200/40"
                      : "bg-white/15 ring-white/25"}`}>
                    {streamState === "timeout" ? (
                      <TimerReset className="w-6 h-6" />
                    ) : streamState === "error" ? (
                      <WifiOff className="w-6 h-6" />
                    ) : (
                      <Brain className={`w-6 h-6 transition-transform duration-500 ${streamState === "streaming" ? "motion-safe:animate-pulse" : streamState === "complete" ? "scale-110" : ""}`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider opacity-80">Impulsionito</div>
                    <div className="text-sm font-semibold flex items-center gap-1.5" data-testid="impulsionito-status">
                      <span className="truncate">
                        {streamState === "timeout" ? "Análise expirou"
                          : streamState === "error" ? "Falha temporária"
                          : streamState === "idle" ? "Aguardando segmento…"
                          : streamState === "streaming" ? "Analisando seu perfil"
                          : "Diagnóstico concluído"}
                      </span>
                      {streamState === "streaming" && (
                        <span className="inline-flex gap-0.5" aria-hidden="true">
                          <span className="w-1 h-1 rounded-full bg-white/90 motion-safe:animate-[bounce_1s_infinite_0ms]" />
                          <span className="w-1 h-1 rounded-full bg-white/90 motion-safe:animate-[bounce_1s_infinite_150ms]" />
                          <span className="w-1 h-1 rounded-full bg-white/90 motion-safe:animate-[bounce_1s_infinite_300ms]" />
                        </span>
                      )}
                      {streamState === "complete" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-in zoom-in-50 duration-500" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <Badge className="ml-auto bg-white/20 border-white/30 text-primary-foreground gap-1 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full motion-safe:animate-pulse
                      ${streamState === "complete" ? "bg-emerald-300"
                        : streamState === "timeout" || streamState === "error" ? "bg-amber-300"
                        : "bg-white/90"}`} /> ao vivo
                  </Badge>
                </div>

                {/* progresso */}
                <div className="h-1.5 rounded-full bg-white/15 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} data-testid="progress-bar">
                  <div
                    className={`h-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none will-change-[width]
                      ${streamState === "timeout" || streamState === "error"
                        ? "bg-gradient-to-r from-amber-200 to-amber-400"
                        : "bg-gradient-to-r from-white via-white to-white/70"}`}
                    style={{ width: `${progress}%` }}
                    data-testid="progress-fill"
                  />
                </div>
                <div className="mt-1.5 text-[11px] opacity-80 flex justify-between">
                  <span>
                    {streamState === "timeout" ? "Análise pausada"
                      : streamState === "error" ? "Conexão instável"
                      : streamState === "complete" ? "Compatibilidade calculada"
                      : streamState === "streaming" ? "Compatibilidade em cálculo"
                      : "Aguardando dados"}
                  </span>
                  <span className="font-mono tabular-nums" data-testid="progress-value">{progress}%</span>
                </div>

                {/* estado de erro / timeout com CTA de retry */}
                {(streamState === "timeout" || streamState === "error") && (
                  <div
                    role="alert"
                    data-testid="stream-error"
                    data-error-kind={streamState}
                    className="mt-4 rounded-xl bg-amber-500/15 ring-1 ring-amber-200/40 px-4 py-3 text-sm animate-in fade-in slide-in-from-bottom-1 duration-500"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-200" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">
                          {streamState === "timeout"
                            ? "Sua análise ficou parada por um tempo"
                            : "Não consegui completar a análise agora"}
                        </div>
                        <p className="opacity-90 text-xs mt-0.5">
                          {streamState === "timeout"
                            ? "Podemos recomeçar em segundos — nada foi enviado ao servidor."
                            : "Verifique sua conexão e tente novamente. Se persistir, fale com o time."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={retry}
                        data-testid="btn-retry"
                        className="gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10"
                      >
                        <a href="#impulsionito"><MessageCircle className="w-3.5 h-3.5 mr-1" /> Falar com o time</a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* estado inicial / streaming — mensagens parciais aparecem progressivamente */}
                {(streamState === "idle" || streamState === "streaming") && (
                  <>
                    {nicho && (
                      <div className="mt-4 rounded-lg bg-white/10 ring-1 ring-white/15 px-3 py-2 text-xs animate-in fade-in slide-in-from-bottom-1 duration-500" data-testid="stream-message">
                        <span className="opacity-80">Detectei que você atua em </span>
                        <strong className="font-semibold">{nichoLabel}</strong>
                        <span className="opacity-80">. Mapeando módulos compatíveis</span>
                        <span className="inline-block motion-safe:animate-pulse">…</span>
                      </div>
                    )}
                    <ul className="mt-4 space-y-2 text-sm" data-testid="stream-signals">
                      <SignalRow ok={!!nicho} text="Segmento identificado" />
                      <SignalRow ok={dores.length > 0} text={`Dores mapeadas${dores.length ? ` (${dores.length})` : ""}`} />
                      <SignalRow ok={!!foco} text="Prioridade definida" />
                      <SignalRow ok={false} text="Módulos compatíveis" pending />
                      <SignalRow ok={false} text="Plano ideal" pending />
                    </ul>
                  </>
                )}


                {/* estado final */}
                {showResult && result && (
                  <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" data-testid="diagnostico-resultado">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/10 backdrop-blur p-3 ring-1 ring-white/20">
                        <div className="text-[11px] uppercase tracking-wider opacity-80">Economia estimada</div>
                        <div className="mt-1 text-3xl font-black leading-none">
                          {horas}
                          <span className="text-sm font-medium opacity-80 ml-1">h/mês</span>
                        </div>
                        <div className="mt-1 text-xs opacity-80">≈ {formatBRL(result.economiaValor)}/mês em tempo operacional</div>
                      </div>
                      <div className="rounded-xl bg-white/10 backdrop-blur p-3 ring-1 ring-white/20">
                        <div className="text-[11px] uppercase tracking-wider opacity-80">Compatibilidade</div>
                        <div className="mt-1 text-3xl font-black leading-none">
                          {compat}<span className="text-sm font-medium opacity-80">%</span>
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
                          <div className="h-full bg-emerald-300 transition-all duration-1000" style={{ width: `${compat}%` }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-wider opacity-80 mb-1.5">Módulos recomendados</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.modulos.map((m) => (
                          <Badge key={m} className="bg-white/15 hover:bg-white/25 text-primary-foreground border-white/25 text-xs">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white/10 backdrop-blur p-3 ring-1 ring-white/20">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider opacity-80">Plano indicado</div>
                        <div className="text-lg font-bold">{result.plano}</div>
                      </div>
                      <Rocket className="w-8 h-8 opacity-70" />
                    </div>

                    <div className="rounded-xl bg-white/10 backdrop-blur p-3 ring-1 ring-white/20">
                      <div className="text-[11px] uppercase tracking-wider opacity-80">Por que esse plano</div>
                      <p className="mt-1 text-sm leading-relaxed text-white/90">{result.racional}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {showResult && result && (
              <Card className="p-5 border-primary/20 bg-card/95 shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-700" data-testid="diagnostico-resumo">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="outline" className="mb-2 border-primary/30 text-primary">Resumo do diagnóstico</Badge>
                    <h3 className="text-lg font-bold tracking-tight">{result.nichoLabel}: {result.plano}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{result.racional}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">economia estimada</div>
                    <div className="text-xl font-black text-primary">{formatBRL(result.economiaValor)}/mês</div>
                    <div className="text-xs text-muted-foreground">{result.horas}h operacionais</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Respostas salvas neste navegador</div>
                    <p className="mt-1 text-sm">{result.nichoLabel} · {dores.length} desafio(s) · foco em {foco}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximo passo</div>
                    <p className="mt-1 text-sm">Agendar uma demonstração personalizada com esse diagnóstico já preenchido.</p>
                  </div>
                </div>
              </Card>
            )}

            {/* CTAs */}
            {showResult && result && (
              <div className="grid gap-2 sm:grid-cols-3 animate-fade-in">
                <Button asChild size="lg" className="justify-center">
                  {(() => {
                    const link = getDemoNichoLink(nicho);
                    return (
                      <Link
                        to={link.to}
                        params={link.params}
                        data-analytics="diag-ver-demo"
                        data-nicho={nicho}
                        data-resolved={link.slug}
                        data-trace-id={getFunnelTraceId()}
                        onClick={() => trackFunnelCta({
                          cta: "diag-ver-demo",
                          origem: "home-diagnostico",
                          nicho_pedido: nicho,
                          alias_resolvido: link.slug,
                          isFallback: link.isFallback,
                          rotaDestino: `/demo/nicho/${link.slug}`,
                          extra: { plano: result.plano, dores: dores.length, foco },
                        })}
                      >
                        <PlayCircle className="w-4 h-4 mr-1.5" /> Ver demonstração do meu nicho
                      </Link>
                    );
                  })()}
                </Button>
                <Button asChild size="lg" variant="outline" className="justify-center">
                  <a href="#impulsionito"><Bot className="w-4 h-4 mr-1.5" /> Falar com Impulsionito</a>
                </Button>
                <DemoLeadDialog
                  niche={nicho}
                  nicheLabel={result.nichoLabel}
                  origin="diagnostico-home"
                  notes={leadNotes}
                  title="Agendar demonstração personalizada"
                  description="Seu diagnóstico será enviado junto para o time preparar uma demonstração com módulos, economia estimada e plano indicado."
                  submitLabel="Agendar demonstração"
                  label="Agendar demo"
                  trigger={(
                    <Button size="lg" variant="outline" className="justify-center">
                      <Calculator className="w-4 h-4 mr-1.5" /> Agendar demo
                    </Button>
                  )}
                />
              </div>
            )}

            {/* Indicadores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MiniStat icon={Building2} value={`${empresas}+`} label="Empresas atendidas" />
              <MiniStat icon={Users} value={similares > 0 ? `${similares}+` : "—"} label="Clientes similares" />
              <MiniStat icon={Clock} value="< 7d" label="Implantação média" />
              <MiniStat icon={Zap} value={`${automacoes}+`} label="Automações prontas" />
            </div>

            <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Nenhum dado enviado. Diagnóstico executado localmente.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const SignalRow = memo(function SignalRow({ ok, text, pending }: { ok: boolean; text: string; pending?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className={`w-4 h-4 rounded-full grid place-items-center text-[10px] font-bold shrink-0 transition-colors duration-300
        ${ok ? "bg-emerald-300 text-emerald-900"
          : pending ? "bg-white/15 text-white/60"
          : "bg-white/25 text-white/70"}`}>
        {ok ? "✓" : pending ? "…" : "•"}
      </span>
      <span className={`transition-opacity duration-300 ${ok ? "opacity-100" : "opacity-70"}`}>{text}</span>
    </li>
  );
});

const MiniStat = memo(function MiniStat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 text-center text-foreground hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none">
      <Icon className="w-4 h-4 text-primary mx-auto mb-1" aria-hidden="true" />
      <div className="text-base font-bold leading-none tabular-nums text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</div>
    </div>
  );
});


// ============== SIMULADOR DE PERDA ==============
function SimuladorPerda() {
  const [leads, setLeads] = useState(100);
  const [perda, setPerda] = useState(30);
  const [ticket, setTicket] = useState(500);

  const perdaMes = useMemo(() => (leads * (perda / 100) * ticket), [leads, perda, ticket]);
  const perdaAno = perdaMes * 12;

  // Lê o nicho salvo pelo Diagnóstico da Home para contextualizar o CTA "Ver demo".
  const [savedNicho, setSavedNicho] = useState<string>("");
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.nicho) setSavedNicho(String(parsed.nicho));
      }
    } catch { /* ignore */ }
  }, []);
  const demoLink = savedNicho ? getDemoNichoLink(savedNicho) : null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 mb-3">
          <TrendingDown className="w-3 h-3 mr-1" /> O custo de não ter sistema
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Quanto você perde por mês sem CRM, agenda e automação?</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="leads" className="text-sm">Leads recebidos por mês</Label>
            <Input id="leads" type="number" value={leads} onChange={(e) => setLeads(Math.max(0, +e.target.value || 0))} min={0} />
          </div>
          <div>
            <Label htmlFor="perda" className="text-sm">% que você acredita que perde</Label>
            <Input id="perda" type="number" value={perda} onChange={(e) => setPerda(Math.min(100, Math.max(0, +e.target.value || 0)))} min={0} max={100} />
          </div>
          <div>
            <Label htmlFor="ticket" className="text-sm">Ticket médio (R$)</Label>
            <Input id="ticket" type="number" value={ticket} onChange={(e) => setTicket(Math.max(0, +e.target.value || 0))} min={0} />
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pt-3 border-t">
            <li className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> Não responder rápido = lead esfria.</li>
            <li className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> Sem follow-up = oportunidade esquecida.</li>
            <li className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> Sem dashboard = gestor não enxerga onde agir.</li>
          </ul>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-destructive/5 to-primary/5 border-destructive/20">
          <div className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Estimativa mensal</div>
          <div className="text-4xl sm:text-5xl font-bold text-destructive">
            R$ {perdaMes.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">em oportunidades mal atendidas</div>

          <div className="mt-6 pt-6 border-t border-destructive/20">
            <div className="text-xs uppercase text-muted-foreground tracking-wide mb-1">No ano isso vira</div>
            <div className="text-2xl sm:text-3xl font-bold">R$ {perdaAno.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
          </div>

          <p className="text-sm mt-6 leading-relaxed">
            <strong>O sistema não aumenta resultado por mágica.</strong> Ele reduz perda, organiza jornada, aumenta velocidade e dá visibilidade para o gestor agir.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <Button asChild className="bg-gradient-primary flex-1">
              <Link to="/orcamento">Quero parar de perder dinheiro <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              {demoLink ? (
                <Link
                  to={demoLink.to}
                  params={demoLink.params}
                  data-nicho={savedNicho}
                  data-resolved={demoLink.slug}
                  onClick={() => trackFunnelCta({
                    cta: "simulador-ver-demo",
                    origem: "home-simulador",
                    nicho_pedido: savedNicho,
                    alias_resolvido: demoLink.slug,
                    isFallback: demoLink.isFallback,
                    rotaDestino: `/demo/nicho/${demoLink.slug}`,
                  })}
                >
                  <PlayCircle className="w-4 h-4 mr-1" /> Ver demo do meu nicho
                </Link>
              ) : (
                <Link
                  to="/demo/escolher-nicho"
                  onClick={() => trackFunnelCta({
                    cta: "simulador-escolher-nicho",
                    origem: "home-simulador",
                    alias_resolvido: "",
                    isFallback: false,
                    rotaDestino: "/demo/escolher-nicho",
                  })}
                >
                  <PlayCircle className="w-4 h-4 mr-1" /> Ver demo
                </Link>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

// ============== 5 FASES ==============
const FASES = [
  { n: 1, t: "Diagnóstico", icon: Search, d: "Entende nicho, dor, equipe, canais e módulos necessários." },
  { n: 2, t: "Configuração", icon: Settings, d: "Ativa módulos, usuários, permissões, funis, mensagens e dashboards." },
  { n: 3, t: "Demonstração", icon: Eye, d: "Você testa com dados fictícios e entende como o sistema opera no seu nicho." },
  { n: 4, t: "Contratação", icon: CheckCircle2, d: "Escolha plano, módulos, usuários e canais adicionais." },
  { n: 5, t: "Operação", icon: Rocket, d: "Sistema registra leads, clientes, pagamentos, documentos e indicadores em tempo real." },
];

function CincoFases() {
  return (
    <section className="bg-card/30 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge className="bg-accent/15 text-accent border-accent/20 mb-3">Como funciona</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">5 fases para sua operação rodar com a Impulsionando</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FASES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.n} className="p-5 relative hover:shadow-lg transition">
                <div className="absolute top-3 right-3 text-3xl font-bold text-muted/30">{f.n}</div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm mb-1.5">{f.t}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.d}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============== CANAIS ==============
function CanaisComunicacao() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-3xl mb-8">
        <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Comunicação</Badge>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">E-mail é nativo. WhatsApp, SMS e Voz são adicionais.</h2>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Você não paga a mais por comunicação básica. Se precisar de mais velocidade e proximidade, contrata o canal certo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-primary/30 bg-primary/5">
          <Mail className="w-6 h-6 text-primary mb-2" />
          <div className="font-bold text-sm mb-1">E-mail transacional</div>
          <Badge className="bg-primary text-primary-foreground text-[10px] mb-2">Nativo padrão</Badge>
          <p className="text-xs text-muted-foreground">Templates, logs, histórico no CRM. Já incluso na estrutura base.</p>
        </Card>
        <Card className="p-5">
          <MessageSquare className="w-6 h-6 text-green-600 mb-2" />
          <div className="font-bold text-sm mb-1">WhatsApp Business</div>
          <Badge variant="outline" className="text-[10px] mb-2">Canal adicional</Badge>
          <p className="text-xs text-muted-foreground">Disparos, atendimento, automação por departamento.</p>
        </Card>
        <Card className="p-5">
          <Phone className="w-6 h-6 text-muted-foreground mb-2" />
          <div className="font-bold text-sm mb-1">SMS</div>
          <Badge variant="outline" className="text-[10px] mb-2">Canal adicional</Badge>
          <p className="text-xs text-muted-foreground">Confirmações, OTP, alertas críticos com alta taxa de entrega.</p>
        </Card>
        <Card className="p-5">
          <Phone className="w-6 h-6 text-muted-foreground mb-2" />
          <div className="font-bold text-sm mb-1">Voz / VoIP / URA</div>
          <Badge variant="outline" className="text-[10px] mb-2">Canal adicional</Badge>
          <p className="text-xs text-muted-foreground">Ligação ativa, URA, integração telefônica para operação de volume.</p>
        </Card>
      </div>
    </section>
  );
}

// ============== HOMEPAGE ==============

/**
 * Hero CTA tracking — emite eventos para GA4 (gtag) e dataLayer (GTM) quando
 * presentes; em ambientes sem analytics, vira no-op silencioso. Use o mesmo
 * `id` no `data-analytics` do elemento para auditoria via DevTools.
 */
type HeroCtaId =
  | "sou_empresa"
  | "white_label"
  | "clube"
  | "diagnostico_30s"
  | "falar_impulsionito"
  | "ver_demonstracoes";

function trackHeroCta(id: HeroCtaId) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: Array<Record<string, unknown>>;
    };
    w.gtag?.("event", "hero_cta_click", {
      event_category: "hero",
      event_label: id,
      cta_id: id,
    });
    w.dataLayer?.push({ event: "hero_cta_click", cta_id: id });
  } catch {
    /* analytics indisponível — silencioso */
  }
}

export function HomePage() {

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO VENDEDOR */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
            <Badge className="bg-white/10 backdrop-blur text-white border-white/20 mb-6 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" /> Tecnologia + Estratégia + Comunicação
            </Badge>

            <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight max-w-4xl mx-auto text-balance">
              Tecnologia que conecta{" "}
              <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">atendimento, vendas e operação</span>{" "}
              em um só ecossistema.
            </h1>
            <p className="mt-6 text-base sm:text-lg lg:text-xl text-white/85 leading-relaxed max-w-2xl mx-auto">
              CRM, automação, agenda, pagamentos, área do cliente, dashboards e comunicação —
              modular, por nicho, com White Label pronto para revender com a sua marca.
            </p>

            {/* SR-only section heading — dá ao tablist de perfis um H2
              indexável sem competir com o H1 visível do hero. */}
            <h2 className="sr-only">Escolha o seu perfil</h2>

            {/*
              Hero CTAs — três cartões de perfil.
              Layout responsivo:
              - <sm  : 1 coluna, full-width, altura confortável.
              - >=sm : 3 colunas equal, mesma altura via items-stretch.
              Estrutura interna em flex-col centralizado garante alinhamento
              de ícone+título e subtítulo em qualquer breakpoint.
            */}
            <div
              className="mt-8 grid gap-3 grid-cols-1 sm:grid-cols-3 items-stretch max-w-3xl mx-auto"
              aria-label="Perfis de uso da Impulsionando"
              role="group"
            >
              <article aria-labelledby="hero-perfil-empresa" className="h-full">
                <h3 id="hero-perfil-empresa" className="sr-only">
                  Sou empresa — usar a plataforma na minha operação
                </h3>
                <Link
                  to="/orcamento"
                  data-analytics="hero-sou-empresa"
                  onClick={() => trackHeroCta("sou_empresa")}
                  className="group flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-white text-primary px-4 py-4 text-center shadow-sm ring-1 ring-white/20 transition hover:bg-white/95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex items-center justify-center gap-2 text-base font-semibold leading-tight">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Sou empresa</span>
                  </span>
                  <span className="text-xs font-normal leading-snug opacity-75">
                    Quero usar na minha operação
                  </span>
                </Link>
              </article>

              <article aria-labelledby="hero-perfil-white-label" className="h-full">
                <h3 id="hero-perfil-white-label" className="sr-only">
                  White Label — revender a plataforma com a minha marca
                </h3>
                <Link
                  to="/nichos/$slug"
                  params={{ slug: "white-label" }}
                  data-analytics="hero-white-label"
                  onClick={() => trackHeroCta("white_label")}
                  className="group flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-gradient-primary text-primary-foreground px-4 py-4 text-center shadow-sm ring-1 ring-white/20 transition hover:brightness-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex items-center justify-center gap-2 text-base font-semibold leading-tight">
                    <Rocket className="w-4 h-4 shrink-0" />
                    <span>White Label</span>
                  </span>
                  <span className="text-xs font-normal leading-snug opacity-90">
                    Quero revender com a minha marca
                  </span>
                </Link>
              </article>

              <article aria-labelledby="hero-perfil-clube" className="h-full">
                <h3 id="hero-perfil-clube" className="sr-only">
                  Clube de Vantagens — descontos e benefícios para consumidores
                </h3>
                <Link
                  to="/clube"
                  data-analytics="hero-clube"
                  data-cta="clube"
                  onClick={() => trackHeroCta("clube")}
                  className="group glass-cta flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-4 text-center shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex items-center justify-center gap-2 text-base font-semibold leading-tight">
                    <Gift className="w-4 h-4 shrink-0" />
                    <span>Clube de Vantagens</span>
                  </span>
                  <span className="text-xs font-normal leading-snug opacity-90">
                    Quero descontos e benefícios
                  </span>
                </Link>
              </article>
            </div>

            {/* CTA Ecossistema — porta de entrada do consumidor final */}
            <div className="mt-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 sm:p-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <Badge className="bg-white/20 text-white border-0 mb-2">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Para o consumidor
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-bold">Conheça o Ecossistema</h3>
                  <p className="text-sm sm:text-base text-white/85 mt-1">
                    Encontre empresas, serviços, benefícios e experiências próximas de você dentro da rede Impulsionando.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
                  <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 gap-1.5">
                    <Link to="/ecossistema" data-analytics="hero-ecossistema"><Sparkles className="w-4 h-4" /> Conheça o Ecossistema</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-1.5">
                    <Link to="/ecossistema" search={{ geo: 1 }} data-analytics="hero-ecossistema-geo"><Building2 className="w-4 h-4" /> Empresas perto de mim</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-1.5">
                    <Link to="/clube" data-analytics="hero-ecossistema-clube"><Gift className="w-4 h-4" /> Entrar no Clube</Link>
                  </Button>
                </div>
              </div>
            </div>


            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <Button
                asChild
                size="sm"
                className="bg-white text-primary hover:bg-white/90 gap-1.5 shadow-sm"
                onClick={() => trackHeroCta("diagnostico_30s")}
              >
                <a href="#diagnostico" data-analytics="hero-diagnostico-30s">
                  <Search className="w-4 h-4" /> Diagnóstico em 30 segundos
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-1.5 focus-ring"
                onClick={() => {
                  trackHeroCta("falar_impulsionito");
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("impulsionito:open"));
                  }
                }}
                data-analytics="hero-impulsionito"
              >
                <MessageCircle className="w-4 h-4" /> Falar com Impulsionito
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-1.5"
                onClick={() => trackHeroCta("ver_demonstracoes")}
              >
                <Link to="/demo/escolher-nicho" data-analytics="hero-ver-demos">
                  <PlayCircle className="w-4 h-4" /> Ver demonstrações
                </Link>
              </Button>
            </div>

            {/* Trust bar — reforço visual de segurança/leveza */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] sm:text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Sem cartão para testar</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Setup assistido</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> LGPD & dados no Brasil</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Modular por nicho</span>
            </div>




          </div>
        </section>

        {/* DIAGNÓSTICO */}
        <div id="diagnostico"><Diagnostico /></div>

        {/* SIMULADOR */}
        <SimuladorPerda />

        {/* 5 FASES */}
        <CincoFases />

        {/* CANAIS */}
        <CanaisComunicacao />

        {/* CTA FINAL */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Card className="p-8 sm:p-12 text-center bg-gradient-hero text-primary-foreground border-0">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3">Pronto para parar de perder oportunidade?</h2>
            <p className="text-white/85 max-w-2xl mx-auto mb-6">Veja a plataforma funcionando no seu nicho. Sem cartão, sem compromisso.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 btn-alive focus-ring">
                <Link to="/demo/feira"><PlayCircle className="w-4 h-4" /> Liberar demo agora</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2 focus-ring">
                <Link to="/planos"><ArrowRight className="w-4 h-4" /> Ver planos</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
