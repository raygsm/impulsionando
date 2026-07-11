/**
 * Impulsionito Concierge — Onda A3
 *
 * Concierge digital do ecossistema Impulsionando. Reorganiza a experiência
 * do assistente ao redor da jornada do visitante: launcher discreto +
 * painel contextual com cabeçalho, mensagem, sugestões, conversa,
 * links úteis e próximos passos.
 *
 * NÃO altera lógica, prompts, backend ou integrações. Reutiliza:
 *  - useImpulsionitoTransport (streaming HTTP + fallback mock)
 *  - getImpulsionitoContext (mensagens por rota/nicho)
 *  - suggestionsForRoute (sugestões contextuais)
 *  - trackImpulsionitoOpen (analytics)
 *  - buildOfficialWhatsAppUrl (canal oficial)
 *
 * Substitui ImpulsionitoPanel e consolida FABs: o WhatsApp oficial e o
 * Canal Oficial aparecem como ações secundárias dentro do próprio painel.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot, X, Minimize2, Send, MessageCircle, ArrowRight, Sparkles,
  LifeBuoy, Target, PlayCircle, ShieldCheck, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getImpulsionitoContext } from "@/data/impulsionito-context";
import { trackImpulsionitoOpen } from "@/lib/impulsionito-tracking";
import { buildOfficialWhatsAppUrl, OFFICIAL_WHATSAPP_PHONE_DISPLAY } from "@/lib/whatsapp-cta";
import {
  useImpulsionitoTransport,
  suggestionsForRoute,
  nichoSlugFromPath,
  type ImpulsionitoMessage,
} from "@/components/impulsionito/transport";
import { useCurrentUser } from "@/hooks/use-current-user";

// ---------------------------------------------------------------------------
// Rotas onde o concierge não aparece.
// ---------------------------------------------------------------------------
const HIDDEN_PREFIXES = [
  "/auth",
  "/reset-password",
  "/reset-password-sent",
  "/lovable",
  "/portal.",
  "/paciente",
  "/mesa",
];

const LEAD_STORAGE_KEY = "impulsionito:lead-context:v1";

type Audience = "visitor" | "lead" | "client";

interface LeadContext {
  lastPath: string;
  lastNicho?: string;
  lastLabel?: string;
  ts: number;
}

function readLeadContext(): LeadContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEAD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LeadContext;
    if (!parsed?.lastPath) return null;
    // Considera contexto válido por 30 dias.
    if (Date.now() - parsed.ts > 1000 * 60 * 60 * 24 * 30) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLeadContext(ctx: LeadContext) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(ctx));
  } catch { /* noop */ }
}

// ---------------------------------------------------------------------------
// Ações rápidas por audiência.
// ---------------------------------------------------------------------------
type QuickAction = { label: string; to?: string; onClick?: () => void; kind?: "primary" | "default" };

function visitorSuggestions(): string[] {
  return [
    "Descobrir minha solução",
    "Quero vender mais",
    "Quero organizar minha empresa",
    "Quero ver uma demonstração",
    "Conhecer meu setor",
  ];
}

function clientQuickActions(): QuickAction[] {
  return [
    { label: "Minha assinatura", to: "/minha-assinatura", kind: "primary" },
    { label: "Consultar cobrança", to: "/minha-assinatura" },
    { label: "Reenviar link de pagamento", to: "/minha-assinatura" },
    { label: "Confirmar pagamento", to: "/minha-assinatura" },
    { label: "Continuar onboarding", to: "/onboarding" },
    { label: "Abrir suporte", to: "/central-de-ajuda" },
    { label: "Entrar no Core", to: "/core" },
  ];
}

// ---------------------------------------------------------------------------
// Rotas úteis contextuais no rodapé do painel.
// ---------------------------------------------------------------------------
function nextStepsForRoute(pathname: string, audience: Audience): QuickAction[] {
  if (audience === "client") {
    return [
      { label: "Ir para o Core", to: "/core", kind: "primary" },
      { label: "Central de ajuda", to: "/central-de-ajuda" },
    ];
  }
  if (pathname.startsWith("/planos")) {
    return [
      { label: "Descobrir minha solução", to: "/escolher-nicho", kind: "primary" },
      { label: "Ver uma demonstração", to: "/demo" },
    ];
  }
  if (pathname.startsWith("/nichos") || pathname.startsWith("/demo/nicho/")) {
    return [
      { label: "Ver planos", to: "/planos", kind: "primary" },
      { label: "Explorar demonstrações", to: "/demo" },
    ];
  }
  if (pathname.startsWith("/demo")) {
    return [
      { label: "Descobrir minha solução", to: "/escolher-nicho", kind: "primary" },
      { label: "Ver planos", to: "/planos" },
    ];
  }
  return [
    { label: "Descobrir minha solução", to: "/escolher-nicho", kind: "primary" },
    { label: "Ver planos", to: "/planos" },
  ];
}

// ---------------------------------------------------------------------------
// Motion — respeita prefers-reduced-motion.
// ---------------------------------------------------------------------------
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

// ---------------------------------------------------------------------------
// Componente principal.
// ---------------------------------------------------------------------------
export function ImpulsionitoConcierge() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ImpulsionitoMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lead, setLead] = useState<LeadContext | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const transport = useImpulsionitoTransport();
  const reduced = usePrefersReducedMotion();
  const { data: currentUser } = useCurrentUser();

  const isAuthenticated = Boolean(currentUser);
  const audience: Audience = isAuthenticated
    ? "client"
    : lead
      ? "lead"
      : "visitor";

  const ctx = useMemo(() => {
    const nicho = nichoSlugFromPath(pathname) ?? undefined;
    return getImpulsionitoContext(pathname, nicho);
  }, [pathname]);

  const contextualHeadline = useMemo(() => {
    if (audience === "client") {
      return "O que você precisa resolver agora?";
    }
    if (audience === "lead" && lead) {
      const nicho = lead.lastLabel ?? lead.lastNicho;
      return nicho
        ? `Você estava conhecendo soluções para ${nicho}. Posso continuar de onde parou?`
        : "Posso continuar sua recomendação de onde parou?";
    }
    if (pathname === "/") return "Posso ajudar você a encontrar a solução ideal.";
    if (pathname.startsWith("/planos")) return "Posso explicar as diferenças entre os planos.";
    if (pathname.startsWith("/demo")) return "Posso conduzir você por esta demonstração.";
    if (pathname.startsWith("/nichos/") || pathname.startsWith("/demo/nicho/")) {
      return "Posso mostrar como funciona para o seu setor.";
    }
    return "Como posso ajudar sua empresa hoje?";
  }, [audience, lead, pathname]);

  const quickSuggestions = useMemo(() => {
    if (audience === "client") return [] as string[];
    const routed = suggestionsForRoute(pathname);
    if (routed.length > 0) return routed.slice(0, 5);
    return visitorSuggestions();
  }, [audience, pathname]);

  const clientActions = useMemo(
    () => (audience === "client" ? clientQuickActions() : []),
    [audience],
  );

  const nextSteps = useMemo(
    () => nextStepsForRoute(pathname, audience),
    [pathname, audience],
  );

  // Restaura contexto de lead ao montar.
  useEffect(() => {
    setLead(readLeadContext());
  }, []);

  // Registra contexto ao visitar rota de nicho (base para "lead").
  useEffect(() => {
    const nicho = nichoSlugFromPath(pathname);
    if (!nicho) return;
    const nextLead: LeadContext = {
      lastPath: pathname,
      lastNicho: nicho,
      lastLabel: nicho.replace(/-/g, " "),
      ts: Date.now(),
    };
    writeLeadContext(nextLead);
    setLead(nextLead);
  }, [pathname]);

  // Evento global impulsionito:open — mantém compatibilidade.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      setOpen(true);
      setMinimized(false);
      const origin = (e as CustomEvent<{ origin?: string }>).detail?.origin ?? "unknown";
      trackImpulsionitoOpen(origin, { path: pathname, ctx: ctx.id });
    };
    window.addEventListener("impulsionito:open", handler);
    return () => window.removeEventListener("impulsionito:open", handler);
  }, [pathname, ctx.id]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      const now = Date.now();
      const userMsg: ImpulsionitoMessage = {
        id: `u_${now}`,
        role: "user",
        text: trimmed,
        ts: now,
        status: "done",
      };
      const botMsg: ImpulsionitoMessage = {
        id: `a_${now + 1}`,
        role: "assistant",
        text: "",
        ts: now + 1,
        status: "streaming",
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const iter = transport.sendMessage({
          text: trimmed,
          context: {
            pathname,
            audience,
            channel: "web",
          },
          history: messages,
          signal: controller.signal,
        });
        let acc = "";
        for await (const chunk of iter) {
          if (chunk.delta) {
            acc += chunk.delta;
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsg.id ? { ...m, text: acc } : m)),
            );
          }
          if (chunk.done) break;
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsg.id ? { ...m, status: "done" } : m)),
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsg.id
              ? { ...m, status: "error", text: (err as Error)?.message ?? "Falha momentânea. Tente novamente." }
              : m,
          ),
        );
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [audience, messages, pathname, sending, transport],
  );

  // Não renderiza em rotas ocultas.
  if (
    pathname.startsWith("/_authenticated") ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return null;
  }

  return (
    <>
      {/* Launcher discreto — sempre acessível, sem pulsar */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMinimized(false);
            trackImpulsionitoOpen("launcher", { path: pathname, ctx: ctx.id });
          }}
          aria-label="Abrir Impulsionito, seu concierge digital"
          data-testid="impulsionito-launcher"
          className={cn(
            "fixed z-[60] print:hidden",
            "bottom-4 right-4 sm:bottom-5 sm:right-5",
            "inline-flex items-center gap-2 rounded-full",
            "bg-gradient-primary text-primary-foreground",
            "px-3.5 py-2.5 shadow-elegant",
            "border border-primary/20",
            "text-sm font-medium",
            "hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !reduced && "transition-all duration-200",
          )}
        >
          <span className="relative inline-flex h-5 w-5 items-center justify-center">
            <Bot className="h-4 w-4" aria-hidden />
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-primary"
            />
          </span>
          <span className="hidden sm:inline">Impulsionito</span>
        </button>
      )}

      {/* Painel do concierge */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Impulsionito concierge"
          className={cn(
            "fixed z-[60] print:hidden",
            "bottom-0 right-0 left-0 sm:left-auto sm:bottom-5 sm:right-5",
            "sm:w-[min(400px,calc(100vw-2.5rem))]",
            "flex flex-col",
            "bg-card text-card-foreground",
            "border border-border sm:rounded-2xl",
            "shadow-elegant",
            "max-h-[92dvh] sm:max-h-[min(640px,calc(100dvh-6rem))]",
            !reduced && "animate-in fade-in slide-in-from-bottom-4",
          )}
        >
          {/* Cabeçalho */}
          <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:rounded-t-2xl bg-gradient-to-br from-primary/5 to-transparent">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-sm">
              <Bot className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                Impulsionito
                <span
                  aria-label="Online"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                />
              </div>
              <div className="text-[11px] text-muted-foreground">
                {audience === "client" ? "Concierge do Core" : "Concierge Impulsionando"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMinimized((v) => !v)}
              aria-label={minimized ? "Expandir painel" : "Minimizar painel"}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {minimized ? <ChevronDown className="h-4 w-4 rotate-180" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar Impulsionito"
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {!minimized && (
            <>
              {/* Corpo — scroll interno */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                {/* Mensagem contextual */}
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <p className="text-sm leading-relaxed text-foreground">{contextualHeadline}</p>
                  </div>
                </div>

                {/* Ações rápidas / sugestões */}
                {audience === "client" ? (
                  <section aria-labelledby="concierge-actions" className="space-y-2">
                    <h3 id="concierge-actions" className="text-eyebrow text-muted-foreground">Ações rápidas</h3>
                    <ul className="grid grid-cols-2 gap-2">
                      {clientActions.map((a) => (
                        <li key={a.label}>
                          {a.to ? (
                            <Link
                              to={a.to}
                              onClick={() => trackImpulsionitoOpen("action", { path: pathname, ctx: `client:${a.label}` })}
                              className={cn(
                                "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium",
                                "hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                a.kind === "primary" && "border-primary bg-primary/5 text-primary",
                              )}
                            >
                              <ArrowRight className="h-3 w-3 shrink-0" /> {a.label}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={a.onClick}
                              className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/40"
                            >
                              <ArrowRight className="h-3 w-3" /> {a.label}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : quickSuggestions.length > 0 && messages.length === 0 ? (
                  <section aria-labelledby="concierge-suggestions" className="space-y-2">
                    <h3 id="concierge-suggestions" className="text-eyebrow text-muted-foreground">Sugestões</h3>
                    <ul className="flex flex-wrap gap-1.5">
                      {quickSuggestions.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onClick={() => send(s)}
                            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {/* Conversa */}
                {messages.length > 0 && (
                  <section aria-label="Conversa" className="space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          m.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                            m.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm",
                            m.status === "error" && "bg-destructive/10 text-destructive",
                          )}
                        >
                          {m.text || (m.status === "streaming" ? "…" : "")}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {/* Próximos passos */}
                {nextSteps.length > 0 && (
                  <section aria-labelledby="concierge-next" className="space-y-2 border-t border-border pt-4">
                    <h3 id="concierge-next" className="text-eyebrow text-muted-foreground">Próximos passos</h3>
                    <div className="flex flex-wrap gap-2">
                      {nextSteps.map((n) => (
                        <Link
                          key={n.label}
                          to={n.to!}
                          onClick={() => trackImpulsionitoOpen("next-step", { path: pathname, ctx: n.label })}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                            n.kind === "primary"
                              ? "bg-gradient-primary text-primary-foreground shadow-sm"
                              : "border border-border text-foreground hover:bg-accent/50",
                          )}
                        >
                          {n.kind === "primary" ? <Target className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                          {n.label}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Links úteis — canal oficial + central de ajuda + WhatsApp */}
                <section aria-labelledby="concierge-links" className="space-y-2 border-t border-border pt-4">
                  <h3 id="concierge-links" className="text-eyebrow text-muted-foreground">Links úteis</h3>
                  <div className="grid gap-1.5">
                    <a
                      href={buildOfficialWhatsAppUrl(ctx.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:border-emerald-500/40 hover:bg-emerald-500/5"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      WhatsApp oficial · {OFFICIAL_WHATSAPP_PHONE_DISPLAY}
                    </a>
                    <Link
                      to="/canal-oficial"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary/40"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Canal oficial único — política e segurança
                    </Link>
                    <Link
                      to="/central-de-ajuda"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary/40"
                    >
                      <LifeBuoy className="h-3.5 w-3.5 text-primary" />
                      Central de ajuda
                    </Link>
                  </div>
                </section>
              </div>

              {/* Composer */}
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="border-t border-border p-3 sm:rounded-b-2xl bg-background"
              >
                <div className="flex items-end gap-2 rounded-xl border border-border bg-card focus-within:ring-2 focus-within:ring-ring">
                  <label htmlFor="impulsionito-input" className="sr-only">Escreva para o Impulsionito</label>
                  <textarea
                    id="impulsionito-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder={audience === "client" ? "Descreva o que precisa..." : "Escreva sua pergunta..."}
                    rows={1}
                    className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    aria-label="Enviar mensagem"
                    className={cn(
                      "m-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      "bg-gradient-primary text-primary-foreground",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
                  Concierge do ecossistema Impulsionando · pressione Enter para enviar
                </p>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default ImpulsionitoConcierge;
