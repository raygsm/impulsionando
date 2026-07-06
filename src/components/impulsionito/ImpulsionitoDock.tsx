/**
 * ImpulsionitoDock — janela visual do agente Impulsionito no Core.
 *
 * Integração real: `useImpulsionitoTransport` chama /api/impulsionito/chat
 * (streamText via Lovable AI Gateway). Fallback automático para mock
 * quando offline ou o endpoint falha (ver ./transport.ts).
 *
 * Acessibilidade:
 * - Botão FAB e todos os controles com aria-label.
 * - `role="dialog"` + `aria-modal="false"` (dock não bloqueia página) e
 *   `aria-modal="true"` no modo fullscreen (bloqueia interação atrás).
 * - `role="log"` + `aria-live="polite"` na área de mensagens, com
 *   `aria-busy` durante streaming.
 * - Foco visível (`focus-visible:ring-2`) em todos os interativos.
 * - Navegação por teclado: Esc fecha (ou sai do fullscreen), Enter envia,
 *   Shift+Enter quebra linha, Ctrl/Cmd+L limpa conversa, Ctrl/Cmd+E
 *   expande/recolhe.
 * - Status de erro e "digitando…" anunciados via `aria-live`.
 *
 * Persistência (por dispositivo — chave separada para mobile e desktop):
 * - Modo (fechado / dock / full) é restaurado ao recarregar.
 * - Histórico persistido em localStorage.
 *
 * Exportação: JSON e TXT via download local.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Trash2,
  Maximize2,
  Minimize2,
  StopCircle,
  WifiOff,
  Loader2,
  Download,
  FileJson,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useImpulsionitoTransport,
  suggestionsForRoute,
  exportConversation,
  type ImpulsionitoMessage,
} from "./transport";
import { collectBrainSnapshot } from "@/lib/impulsionito-ic/brain-snapshot";
import { readLlmConfig } from "@/lib/impulsionito-ic/llm-config";
import { pushPendingLearning } from "@/lib/impulsionito-ic/pending-learning";

const HISTORY_KEY = "impulsionito.dock.history.v1";
const OPEN_KEY_DESKTOP = "impulsionito.dock.open.desktop.v1";
const OPEN_KEY_MOBILE = "impulsionito.dock.open.mobile.v1";
const MOBILE_QUERY = "(max-width: 640px)";

type Mode = "closed" | "dock" | "full";

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

function openKey(): string {
  return isMobile() ? OPEN_KEY_MOBILE : OPEN_KEY_DESKTOP;
}

function loadHistory(): ImpulsionitoMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImpulsionitoMessage[];
    return Array.isArray(parsed) ? parsed.slice(-80) : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ImpulsionitoMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-80)));
  } catch { /* ignore quota */ }
}

function newId() {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ImpulsionitoDock() {
  const location = useLocation();
  const transport = useImpulsionitoTransport();
  const [mode, setMode] = useState<Mode>("closed");
  const [messages, setMessages] = useState<ImpulsionitoMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [status, setStatus] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const messagesRef = useRef<ImpulsionitoMessage[]>([]);
  messagesRef.current = messages;

  // Bootstrap
  useEffect(() => {
    setMessages(loadHistory());
    try {
      const wasOpen = window.localStorage.getItem(openKey());
      if (wasOpen === "dock" || wasOpen === "full") setMode(wasOpen as Mode);
    } catch { /* ignore */ }
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const on = () => { setOnline(true); setStatus("Conexão restabelecida."); };
    const off = () => { setOnline(false); setStatus("Sem conexão — respostas em modo demo."); };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Persistência
  useEffect(() => saveHistory(messages), [messages]);
  useEffect(() => {
    try { window.localStorage.setItem(openKey(), mode); } catch { /* ignore */ }
  }, [mode]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  // Foco no textarea ao abrir; devolve foco ao FAB ao fechar
  useEffect(() => {
    if (mode !== "closed") setTimeout(() => inputRef.current?.focus(), 60);
    else setTimeout(() => fabRef.current?.focus(), 60);
  }, [mode]);

  const suggestions = useMemo(
    () => suggestionsForRoute(location.pathname),
    [location.pathname],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setStatus("Resposta interrompida.");
  }, []);

  const send = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || isStreaming) return;
    setError(null);
    setStatus("Enviando mensagem…");
    const userMsg: ImpulsionitoMessage = {
      id: newId(), role: "user", text: clean, ts: Date.now(), status: "done",
    };
    const assistantId = newId();
    const assistantMsg: ImpulsionitoMessage = {
      id: assistantId, role: "assistant", text: "", ts: Date.now(), status: "streaming",
    };
    const historyBeforeSend = messagesRef.current;
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const stream = transport.sendMessage({
        text: clean,
        history: historyBeforeSend,
        context: {
          pathname: location.pathname,
          screen: typeof document !== "undefined" ? document.title : undefined,
          channel: "web",
        },
        brain: collectBrainSnapshot(),
        llm: readLlmConfig(),
        signal: ac.signal,
      });
      setStatus("Impulsionito está respondendo…");
      let received = false;
      let fullAnswer = "";
      for await (const chunk of stream) {
        if (ac.signal.aborted) break;
        if (chunk.delta) {
          received = true;
          fullAnswer += chunk.delta;
          setMessages((prev) => prev.map((m) =>
            m.id === assistantId ? { ...m, text: m.text + chunk.delta } : m,
          ));
        }
        if (chunk.done) break;
      }
      if (!received) {
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, text: m.text || "(sem resposta)", status: "done" } : m,
        ));
      } else {
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, status: "done" } : m,
        ));
      }
      // Captura de aprendizado — vai para Aprendizados Pendentes,
      // nunca entra no Prompt Mestre sem aprovação humana.
      if (received && fullAnswer.trim()) {
        pushPendingLearning({
          question: clean,
          answer: fullAnswer,
          page: location.pathname,
          channel: "web",
        });
      }
      setStatus("Resposta concluída.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao responder.";
      setError(msg);
      setStatus(`Erro: ${msg}`);
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, status: "error", text: m.text || msg } : m,
      ));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, location.pathname, transport]);

  const clearHistory = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
    setStatus("Conversa limpa.");
  }, [stop]);

  const doExport = useCallback((format: "json" | "txt") => {
    if (messagesRef.current.length === 0) {
      setStatus("Nada para exportar ainda.");
      return;
    }
    const { filename, mime, content } = exportConversation(messagesRef.current, format);
    download(filename, mime, content);
    setStatus(`Conversa exportada como ${format.toUpperCase()}.`);
  }, []);

  // Atalhos de teclado (globais quando aberto)
  useEffect(() => {
    if (mode === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "full") setMode("dock");
        else setMode("closed");
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        clearHistory();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setMode((m) => (m === "full" ? "dock" : "full"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, clearHistory]);

  // Oculto em rotas de auth
  if (location.pathname.startsWith("/auth") || location.pathname.startsWith("/reset-password")) {
    return null;
  }

  if (mode === "closed") {
    return (
      <button
        ref={fabRef}
        type="button"
        onClick={() => setMode(isMobile() ? "full" : "dock")}
        aria-label="Abrir Impulsionito (assistente do Core)"
        className={cn(
          "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full",
          "bg-primary text-primary-foreground shadow-lg hover:shadow-xl",
          "px-4 py-3 text-sm font-medium transition-all",
          "hover:scale-[1.02] active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "min-h-11 min-w-11",
        )}
      >
        <Bot className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Impulsionito</span>
        <span className="rounded-full bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide" aria-hidden="true">
          {transport.mode === "mock" ? "demo" : "live"}
        </span>
      </button>
    );
  }

  const isFull = mode === "full";

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden border bg-background text-foreground shadow-2xl",
        isFull
          ? "inset-0 rounded-none"
          : "bottom-4 right-4 h-[min(640px,calc(100vh-32px))] w-[min(400px,calc(100vw-32px))] rounded-2xl",
        "focus-visible:outline-none",
      )}
      role="dialog"
      aria-modal={isFull ? "true" : "false"}
      aria-label="Impulsionito — assistente do Core Impulsionando"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
          <Bot className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            Impulsionito
            <span
              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              aria-label={transport.mode === "mock" ? "Modo demonstração visual" : "Modo ao vivo"}
            >
              {transport.mode === "mock" ? "demo visual" : "live"}
            </span>
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {online ? "Assistente do Core Impulsionando" : (
              <span className="inline-flex items-center gap-1 text-destructive">
                <WifiOff className="h-3 w-3" aria-hidden="true" /> Sem conexão
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Exportar conversa"
              disabled={messages.length === 0}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => doExport("json")}>
              <FileJson className="mr-2 h-4 w-4" aria-hidden="true" /> Exportar como JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => doExport("txt")}>
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" /> Exportar como TXT
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={clearHistory}
          aria-label="Limpar conversa (Ctrl+L)"
          title="Limpar conversa (Ctrl+L)"
          disabled={messages.length === 0 && !isStreaming}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setMode(isFull ? "dock" : "full")}
          aria-label={isFull ? "Recolher janela (Ctrl+E)" : "Expandir para tela cheia (Ctrl+E)"}
          title={isFull ? "Recolher (Ctrl+E)" : "Expandir (Ctrl+E)"}
        >
          {isFull ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setMode("closed")}
          aria-label="Fechar Impulsionito (Esc)"
          title="Fechar (Esc)"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Corpo — role="log" para leitor de tela */}
      <ScrollArea className="flex-1">
        <div
          ref={scrollRef}
          className="flex flex-col gap-3 p-3"
          role="log"
          aria-live="polite"
          aria-busy={isStreaming}
          aria-relevant="additions text"
          aria-label="Histórico da conversa"
        >
          {messages.length === 0 && (
            <div className="mx-auto max-w-sm rounded-xl border border-dashed bg-muted/30 p-4 text-center">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" aria-hidden="true" />
              <p className="text-sm font-medium">Como posso te ajudar aqui?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Digite uma pergunta ou escolha uma sugestão abaixo. Use
                Enter para enviar, Shift+Enter para quebrar linha.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {error && (
            <div
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Anúncio para leitor de tela (fora da tela, não visível) */}
      <div className="sr-only" role="status" aria-live="polite">
        {status}
      </div>

      {/* Sugestões contextuais */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 border-t bg-muted/20 px-3 py-2" aria-label="Sugestões rápidas">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        className="flex items-end gap-2 border-t p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        aria-label="Enviar mensagem para o Impulsionito"
      >
        <label htmlFor="impulsionito-input" className="sr-only">
          Mensagem para o Impulsionito
        </label>
        <Textarea
          id="impulsionito-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={online ? "Fale com o Impulsionito…" : "Sem conexão — modo demo"}
          rows={1}
          className="min-h-11 max-h-32 resize-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-describedby="impulsionito-input-help"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        <span id="impulsionito-input-help" className="sr-only">
          Pressione Enter para enviar, Shift Enter para quebrar linha, Esc para fechar.
        </span>
        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={stop}
            aria-label="Parar resposta em andamento"
            className="h-11 w-11 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <StopCircle className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            aria-label="Enviar mensagem"
            className="h-11 w-11 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ImpulsionitoMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
          aria-label={`Você às ${time}`}
        >
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div
        className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-foreground"
        aria-label={`Impulsionito às ${time}`}
      >
        {message.text}
        {message.status === "streaming" && (
          <>
            <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Digitando…</span>
          </>
        )}
      </div>
    </div>
  );
}
