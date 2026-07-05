/**
 * ImpulsionitoPanel — Interface visual do agente central Impulsionito.
 *
 * ATENÇÃO: Este componente é EXCLUSIVAMENTE visual. Não altera banco,
 * autenticação, permissões, pagamentos, integrações reais nem lógica de
 * negócio. Toda interação é simulada localmente (useState) para permitir
 * testes de navegação e experiência. A integração técnica será feita
 * posteriormente pelo Codex.
 *
 * Recursos visuais:
 * - Botão flutuante fixo (bottom-left)
 * - Janela compacta, expandida e tela cheia
 * - Estados: visitante, cliente adimplente, inadimplente, pedido WhatsApp,
 *   demanda inexistente
 * - Sugestões rápidas, cards de ação, histórico visual
 * - Hub de conversas (portal + WhatsApp) com filtros
 * - Exportação de conversas (PDF, TXT, MD, JSON) — botões sem lógica
 * - Layout responsivo (desktop, tablet, celular)
 */
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Bot,
  X,
  Maximize2,
  Minimize2,
  Expand,
  Send,
  MessageCircle,
  Download,
  Search,
  Filter,
  Calendar,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FileText,
  FileJson,
  FileType2,
  Paperclip,
  Users,
  CreditCard,
  Wallet,
  BookOpen,
  Wrench,
  LifeBuoy,
  RotateCcw,
  Undo2,
  ChevronRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PanelSize = "compact" | "expanded" | "fullscreen";
type DemoState =
  | "visitor"
  | "client_ok"
  | "client_overdue"
  | "wants_whatsapp"
  | "no_solution";
type Tab = "chat" | "hub" | "export";

interface ChatMsg {
  id: string;
  role: "bot" | "user";
  text: string;
  ts: number;
}

const HIDDEN_PREFIXES = [
  "/auth",
  "/reset-password",
  "/reset-password-sent",
  "/lovable",
];

const QUICK_SUGGESTIONS = [
  "Quero conhecer a Impulsionando",
  "Já sou cliente",
  "Sou empresa",
  "Sou consumidor final",
  "Sou White Label",
  "Quero regularizar meu acesso",
  "Quero falar sobre pagamentos",
  "Quero consultar agenda",
  "Quero acessar CRM",
  "Quero acessar ERP",
  "Quero pedir reembolso",
  "Quero solicitar uma nova funcionalidade",
  "Quero falar pelo WhatsApp",
];

const CLIENT_CARDS = [
  { label: "Agenda", icon: Calendar },
  { label: "CRM", icon: Users },
  { label: "ERP", icon: Building2 },
  { label: "Financeiro", icon: Wallet },
  { label: "Pagamentos", icon: CreditCard },
  { label: "Guias", icon: BookOpen },
  { label: "Ferramentas", icon: Wrench },
  { label: "Suporte", icon: LifeBuoy },
  { label: "Reembolso", icon: Undo2 },
  { label: "Exportar conversa", icon: Download },
];

const OVERDUE_ACTIONS = [
  "Ver pendências",
  "Pagar agora",
  "Gerar PIX",
  "Pagar com cartão",
  "Negociar",
  "Falar com financeiro",
];

const DEMO_STATE_LABEL: Record<DemoState, string> = {
  visitor: "Visitante",
  client_ok: "Cliente adimplente",
  client_overdue: "Cliente inadimplente",
  wants_whatsapp: "Pediu WhatsApp",
  no_solution: "Demanda nova",
};

function greetingFor(state: DemoState): string {
  switch (state) {
    case "visitor":
      return "Olá, eu sou o Impulsionito. Posso te ajudar a entender o ecossistema Impulsionando, encontrar soluções, explicar serviços e orientar seu próximo passo.";
    case "client_ok":
      return "Identifiquei seu acesso. Posso te ajudar com seus módulos, agenda, CRM, ERP, financeiro, pagamentos, guias, ferramentas e suporte.";
    case "client_overdue":
      return "Identificamos uma pendência financeira vinculada à sua conta. Enquanto ela permanecer, alguns recursos exclusivos ficam temporariamente indisponíveis. Regularize seu acesso para voltar a utilizar tudo normalmente.";
    case "wants_whatsapp":
      return "Podemos continuar pelo WhatsApp também. Mas por aqui, dentro do portal, o atendimento é mais rápido, seguro e completo. Aqui consigo acessar seu contexto, módulos, histórico, pagamentos, agenda e permissões. Além disso, você pode exportar suas conversas quando quiser.";
    case "no_solution":
      return "Ainda não temos exatamente essa solução pronta, mas posso registrar sua demanda para análise da equipe Impulsionando.";
  }
}

const MOCK_HUB = [
  {
    id: "h1",
    channel: "portal" as const,
    title: "Configuração inicial de módulos",
    empresa: "Impulsionando",
    date: "Hoje 14:22",
    status: "aberta",
  },
  {
    id: "h2",
    channel: "whatsapp" as const,
    title: "Dúvida sobre plano avançado",
    empresa: "CHRISMED",
    date: "Ontem 09:10",
    status: "aguardando",
  },
  {
    id: "h3",
    channel: "portal" as const,
    title: "Solicitação de nova funcionalidade",
    empresa: "Marocas",
    date: "3 dias atrás",
    status: "em análise",
  },
  {
    id: "h4",
    channel: "whatsapp" as const,
    title: "Reembolso mensalidade",
    empresa: "Riomed",
    date: "1 semana atrás",
    status: "resolvida",
  },
];

export function ImpulsionitoPanel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<PanelSize>("compact");
  const [tab, setTab] = useState<Tab>("chat");
  const [demo, setDemo] = useState<DemoState>("visitor");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: "greet",
      role: "bot",
      text: greetingFor("visitor"),
      ts: Date.now(),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reseta saudação ao trocar de estado de demonstração.
  useEffect(() => {
    setMessages([
      { id: `greet-${demo}`, role: "bot", text: greetingFor(demo), ts: Date.now() },
    ]);
  }, [demo]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, size, tab, typing]);

  useEffect(() => () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  const hidden = useMemo(
    () => HIDDEN_PREFIXES.some((p) => pathname.startsWith(p)),
    [pathname],
  );
  if (hidden) return null;

  function pushUser(text: string) {
    if (!text.trim()) return;
    const now = Date.now();
    setMessages((m) => [
      ...m,
      { id: `u-${now}`, role: "user", text, ts: now },
    ]);
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: "Entendi. (Resposta simulada — a integração real será conectada em seguida.)",
          ts: Date.now(),
        },
      ]);
      setTyping(false);
    }, 900);
  }

  function onSend() {
    pushUser(input);
    setInput("");
  }

  const containerClass = cn(
    "fixed z-[60] bg-card text-card-foreground border border-border shadow-elegant flex flex-col overflow-hidden print:hidden",
    size === "compact" &&
      "bottom-4 left-4 right-4 sm:right-auto sm:w-[380px] h-[min(600px,calc(100dvh-2rem))] rounded-2xl",
    size === "expanded" &&
      "bottom-4 left-4 right-4 sm:right-auto sm:w-[560px] h-[min(720px,calc(100dvh-2rem))] rounded-2xl",
    size === "fullscreen" && "inset-0 sm:inset-4 rounded-none sm:rounded-2xl",
  );

  return (
    <>
      {/* Botão flutuante */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir Impulsionito"
          className="fixed bottom-4 left-4 z-[60] inline-flex items-center gap-2 rounded-full bg-gradient-primary text-primary-foreground px-4 py-3 shadow-elegant hover:brightness-110 transition-all font-medium text-sm print:hidden"
        >
          <span className="relative inline-flex">
            <Bot className="w-5 h-5" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
          </span>
          <span className="hidden sm:inline">Impulsionito</span>
        </button>
      )}

      {open && (
        <div
          className={containerClass}
          role="dialog"
          aria-label="Assistente Impulsionito"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-gradient-primary text-primary-foreground">
            <span className="inline-flex w-8 h-8 rounded-full bg-white/15 items-center justify-center">
              <Bot className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold truncate">
                Impulsionito
                <ShieldCheck className="w-3.5 h-3.5 opacity-80" aria-label="Ambiente seguro" />
              </div>
              <div className="text-[11px] opacity-80 truncate">
                Agente oficial · Ambiente seguro do portal
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {size !== "compact" && (
                <button
                  type="button"
                  onClick={() => setSize("compact")}
                  aria-label="Recolher"
                  className="p-1.5 rounded hover:bg-white/15"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              )}
              {size !== "expanded" && (
                <button
                  type="button"
                  onClick={() => setSize("expanded")}
                  aria-label="Expandir"
                  className="p-1.5 rounded hover:bg-white/15"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              {size !== "fullscreen" && (
                <button
                  type="button"
                  onClick={() => setSize("fullscreen")}
                  aria-label="Tela cheia"
                  className="p-1.5 rounded hover:bg-white/15"
                >
                  <Expand className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="p-1.5 rounded hover:bg-white/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-2 pt-2 border-b border-border bg-muted/30">
            {(
              [
                { id: "chat", label: "Conversa", icon: MessageCircle },
                { id: "hub", label: "Hub", icon: Search },
                { id: "export", label: "Exportar", icon: Download },
              ] as { id: Tab; label: string; icon: typeof MessageCircle }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors",
                  tab === t.id
                    ? "border-primary text-foreground bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
            <div className="ml-auto pr-1 pb-1">
              <select
                value={demo}
                onChange={(e) => setDemo(e.target.value as DemoState)}
                aria-label="Estado de demonstração"
                title="Estado de demonstração (visual)"
                className="text-[11px] rounded border border-border bg-background px-1.5 py-1 text-muted-foreground"
              >
                {(Object.keys(DEMO_STATE_LABEL) as DemoState[]).map((k) => (
                  <option key={k} value={k}>
                    Demo: {DEMO_STATE_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 flex flex-col">
            {tab === "chat" && (
              <ChatTab
                demo={demo}
                messages={messages}
                scrollRef={scrollRef}
                onQuick={pushUser}
                typing={typing}
              />
            )}
            {tab === "hub" && <HubTab />}
            {tab === "export" && <ExportTab />}
          </div>

          {/* Composer */}
          {tab === "chat" && (
            <div className="border-t border-border p-2 bg-background">
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  placeholder="Digite sua mensagem…"
                  rows={1}
                  className="min-h-[40px] max-h-32 resize-none text-sm"
                />
                <Button
                  size="icon"
                  onClick={onSend}
                  aria-label="Enviar"
                  disabled={!input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Conversa protegida · dentro do portal
                </span>
                <span>Enter envia · Shift+Enter quebra linha</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ----------------------------- Chat tab ----------------------------- */

function ChatTab({
  demo,
  messages,
  scrollRef,
  onQuick,
  typing,
}: {
  demo: DemoState;
  messages: ChatMsg[];
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
  onQuick: (t: string) => void;
  typing: boolean;
}) {
  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 bg-muted/20"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {typing && <TypingBubble />}

        <StateExtras demo={demo} onQuick={onQuick} />
      </div>

      {/* Quick suggestions bar */}
      <div className="border-t border-border bg-background/95 px-2 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onQuick(s)}
              className="shrink-0 text-[11px] rounded-full border border-border bg-card px-2.5 py-1 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isBot = msg.role === "bot";
  return (
    <div className={cn("flex gap-2", isBot ? "justify-start" : "justify-end")}>
      {isBot && (
        <span className="w-7 h-7 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center shrink-0">
          <Bot className="w-3.5 h-3.5" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug shadow-sm",
          isBot
            ? "bg-card text-card-foreground rounded-tl-sm border border-border"
            : "bg-primary text-primary-foreground rounded-tr-sm",
        )}
      >
        {msg.text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2 justify-start" aria-live="polite" aria-label="Impulsionito está digitando">
      <span className="w-7 h-7 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5" />
      </span>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2.5 shadow-sm inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
      </div>
    </div>
  );
}

  demo,
  onQuick,
}: {
  demo: DemoState;
  onQuick: (t: string) => void;
}) {
  if (demo === "visitor") {
    return (
      <div className="flex flex-wrap gap-1.5 pl-9">
        {["Entrar no portal", "Quero conhecer", "Já sou cliente", "Falar pelo WhatsApp"].map(
          (b) => (
            <button
              key={b}
              type="button"
              onClick={() => onQuick(b)}
              className="text-xs rounded-full border border-border bg-background px-3 py-1.5 hover:bg-accent"
            >
              {b}
            </button>
          ),
        )}
      </div>
    );
  }

  if (demo === "client_ok") {
    return (
      <div className="pl-9 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CLIENT_CARDS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onQuick(c.label)}
            className="group flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left hover:border-primary/60 hover:bg-accent transition-colors"
          >
            <span className="inline-flex w-7 h-7 rounded-md bg-primary/10 text-primary items-center justify-center shrink-0">
              <c.icon className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-medium truncate">{c.label}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground group-hover:text-foreground shrink-0" />
          </button>
        ))}
      </div>
    );
  }

  if (demo === "client_overdue") {
    return (
      <div className="pl-9 space-y-2">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-amber-900 dark:text-amber-100">
              Acesso parcialmente bloqueado
            </div>
            <div className="text-amber-900/80 dark:text-amber-100/80">
              Regularize para reativar todos os módulos.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {OVERDUE_ACTIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onQuick(b)}
              className="text-xs rounded-full border border-border bg-background px-3 py-1.5 hover:bg-accent"
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (demo === "wants_whatsapp") {
    return (
      <div className="pl-9 flex flex-wrap gap-1.5">
        {[
          { label: "Continuar aqui no portal", icon: ShieldCheck },
          { label: "Ir para o WhatsApp", icon: MessageCircle },
          { label: "Exportar conversa antes de sair", icon: Download },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => onQuick(b.label)}
            className="inline-flex items-center gap-1.5 text-xs rounded-full border border-border bg-background px-3 py-1.5 hover:bg-accent"
          >
            <b.icon className="w-3.5 h-3.5" />
            {b.label}
          </button>
        ))}
      </div>
    );
  }

  if (demo === "no_solution") {
    return <NoSolutionForm onSubmit={() => onQuick("Enviar solicitação de nova demanda")} />;
  }

  return null;
}

function NoSolutionForm({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div className="pl-9">
      <div className="rounded-xl border border-border bg-background p-3 space-y-2.5">
        <div className="text-xs font-semibold inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Registrar nova demanda
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FormField label="Necessidade">
            <Input placeholder="Ex: Integração com…" className="h-8 text-xs" />
          </FormField>
          <FormField label="Segmento">
            <Input placeholder="Ex: Clínica, Bar…" className="h-8 text-xs" />
          </FormField>
          <FormField label="Impacto">
            <select className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs">
              <option>Baixo</option>
              <option>Médio</option>
              <option>Alto</option>
              <option>Crítico</option>
            </select>
          </FormField>
          <FormField label="Urgência">
            <select className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs">
              <option>Sem pressa</option>
              <option>30 dias</option>
              <option>15 dias</option>
              <option>Imediato</option>
            </select>
          </FormField>
        </div>
        <FormField label="Interesse comercial">
          <Textarea
            rows={2}
            placeholder="Está disposto a apoiar comercialmente esta demanda?"
            className="text-xs"
          />
        </FormField>
        <Button size="sm" className="w-full" onClick={onSubmit}>
          <ArrowRight className="w-3.5 h-3.5" /> Enviar solicitação
        </Button>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/* ------------------------------ Hub tab ------------------------------ */

function HubTab() {
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<"all" | "portal" | "whatsapp">("all");
  const [empresa, setEmpresa] = useState("");
  const items = MOCK_HUB.filter((it) => {
    if (channel !== "all" && it.channel !== channel) return false;
    if (q && !it.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (empresa && !it.empresa.toLowerCase().includes(empresa.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="p-2.5 border-b border-border space-y-2 bg-muted/20">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por palavra-chave…"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="all">Todos os canais</option>
            <option value="portal">Portal</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <Input
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Empresa…"
            className="h-8 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground"
          />
          <input
            type="date"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {items.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8">
              Nenhuma conversa encontrada.
            </div>
          )}
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-lg border border-border bg-background p-2.5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "inline-flex w-7 h-7 rounded-md items-center justify-center shrink-0",
                    it.channel === "portal"
                      ? "bg-primary/10 text-primary"
                      : "bg-emerald-500/15 text-emerald-600",
                  )}
                >
                  {it.channel === "portal" ? (
                    <Bot className="w-3.5 h-3.5" />
                  ) : (
                    <MessageCircle className="w-3.5 h-3.5" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{it.title}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span>{it.empresa}</span>
                    <span>·</span>
                    <span>{it.date}</span>
                    <span>·</span>
                    <StatusPill status={it.status} />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-[11px] px-2">
                  <RotateCcw className="w-3 h-3" /> Continuar
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2">
                  <Download className="w-3 h-3" /> Exportar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "resolvida"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : status === "aguardando"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : "bg-primary/10 text-primary";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", tone)}>
      {status === "resolvida" && <CheckCircle2 className="w-2.5 h-2.5" />}
      {status}
    </span>
  );
}

/* ---------------------------- Export tab ---------------------------- */

function ExportTab() {
  const [withAttachments, setWithAttachments] = useState(true);
  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        <div>
          <div className="text-xs font-semibold mb-1.5">Exportar esta conversa</div>
          <div className="grid grid-cols-2 gap-2">
            <ExportBtn icon={FileText} label="PDF" hint=".pdf" />
            <ExportBtn icon={FileType2} label="TXT" hint=".txt" />
            <ExportBtn icon={FileText} label="Markdown" hint=".md" />
            <ExportBtn icon={FileJson} label="JSON" hint=".json" />
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold mb-1.5">Exportar em lote</div>
          <div className="space-y-2">
            <ExportRow icon={Download} label="Exportar todas as conversas" />
            <ExportRow icon={Calendar} label="Exportar por período">
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="date"
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground"
                />
                <input
                  type="date"
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground"
                />
              </div>
            </ExportRow>
            <ExportRow icon={Filter} label="Exportar por canal">
              <select className="mt-2 h-8 w-full rounded-md border border-input bg-background px-2 text-xs">
                <option>Todos</option>
                <option>Portal</option>
                <option>WhatsApp</option>
              </select>
            </ExportRow>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold mb-1.5">Opções</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setWithAttachments(true)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors",
                withAttachments
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-accent",
              )}
            >
              <Paperclip className="w-3.5 h-3.5" /> Com anexos
            </button>
            <button
              type="button"
              onClick={() => setWithAttachments(false)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors",
                !withAttachments
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-accent",
              )}
            >
              <FileText className="w-3.5 h-3.5" /> Sem anexos
            </button>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Interface visual. A exportação real será conectada em breve.
        </div>
      </div>
    </ScrollArea>
  );
}

function ExportBtn({
  icon: Icon,
  label,
  hint,
}: {
  icon: typeof FileText;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-start gap-1 rounded-lg border border-border bg-background p-2.5 hover:border-primary/60 hover:bg-accent transition-colors text-left"
    >
      <span className="inline-flex w-7 h-7 rounded-md bg-primary/10 text-primary items-center justify-center">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[10px] text-muted-foreground">{hint}</span>
    </button>
  );
}

function ExportRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Download;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-2.5">
      <button type="button" className="flex items-center gap-2 w-full text-left">
        <span className="inline-flex w-7 h-7 rounded-md bg-primary/10 text-primary items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs font-medium flex-1">{label}</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {children}
    </div>
  );
}
