/**
 * ImpulsionitoDock — janela visual do agente Impulsionito dentro do Core.
 *
 * ATENÇÃO: 100% visual. Não faz chamadas de rede, não persiste em banco,
 * não altera Supabase, auth, RLS, tenants nem pagamentos. Toda resposta
 * é simulada por `useImpulsionitoTransport` (mock local).
 *
 * Recursos:
 * - Botão flutuante (bottom-right) no shell autenticado
 * - Modos: fechado, dock lateral (desktop), fullscreen (mobile)
 * - Streaming fake token a token
 * - Sugestões contextuais por rota
 * - Estados: online/offline, loading, erro, aborto
 * - Histórico persistido em localStorage (por usuário/sessão do browser)
 * - Suporte dark/light via tokens semânticos (bg-background, text-foreground)
 *
 * Ponto de integração backend: trocar a implementação de
 * `useImpulsionitoTransport` em `./transport.ts`. Nenhuma outra alteração
 * neste componente é necessária.
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useImpulsionitoTransport,
  suggestionsForRoute,
  type ImpulsionitoMessage,
} from "./transport";

const STORAGE_KEY = "impulsionito.dock.history.v1";
const OPEN_KEY = "impulsionito.dock.open.v1";

type Mode = "closed" | "dock" | "full";

function loadHistory(): ImpulsionitoMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-80)));
  } catch {
    /* ignore quota errors */
  }
}

function newId() {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Bootstrap: carregar histórico + estado aberto
  useEffect(() => {
    setMessages(loadHistory());
    try {
      const wasOpen = window.localStorage.getItem(OPEN_KEY);
      if (wasOpen === "dock" || wasOpen === "full") setMode(wasOpen as Mode);
    } catch { /* ignore */ }
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Persistir histórico + modo
  useEffect(() => saveHistory(messages), [messages]);
  useEffect(() => {
    try { window.localStorage.setItem(OPEN_KEY, mode); } catch { /* ignore */ }
  }, [mode]);

  // Auto-scroll ao final
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  // Foco no textarea ao abrir
  useEffect(() => {
    if (mode !== "closed") setTimeout(() => inputRef.current?.focus(), 60);
  }, [mode]);

  const suggestions = useMemo(
    () => suggestionsForRoute(location.pathname),
    [location.pathname],
  );

  const send = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || isStreaming) return;
    setError(null);
    const userMsg: ImpulsionitoMessage = {
      id: newId(), role: "user", text: clean, ts: Date.now(), status: "done",
    };
    const assistantId = newId();
    const assistantMsg: ImpulsionitoMessage = {
      id: assistantId, role: "assistant", text: "", ts: Date.now(), status: "streaming",
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const stream = transport.sendMessage({
        text: clean,
        context: {
          pathname: location.pathname,
          screen: typeof document !== "undefined" ? document.title : undefined,
        },
        signal: ac.signal,
      });
      for await (const chunk of stream) {
        if (ac.signal.aborted) break;
        if (chunk.delta) {
          setMessages((prev) => prev.map((m) =>
            m.id === assistantId ? { ...m, text: m.text + chunk.delta } : m,
          ));
        }
        if (chunk.done) break;
      }
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, status: "done" } : m,
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao responder.";
      setError(msg);
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, status: "error", text: m.text || msg } : m,
      ));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, location.pathname, transport]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const clearHistory = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
  }, [stop]);

  // Não renderizar em telas de auth
  if (location.pathname.startsWith("/auth") || location.pathname.startsWith("/reset-password")) {
    return null;
  }

  if (mode === "closed") {
    return (
      <button
        type="button"
        onClick={() => setMode("dock")}
        aria-label="Abrir Impulsionito"
        className={cn(
          "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full",
          "bg-primary text-primary-foreground shadow-lg hover:shadow-xl",
          "px-4 py-3 text-sm font-medium transition-all",
          "hover:scale-[1.02] active:scale-[0.98]",
        )}
      >
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">Impulsionito</span>
        <span className="rounded-full bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
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
      )}
      role="dialog"
      aria-label="Impulsionito"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            Impulsionito
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {transport.mode === "mock" ? "demo visual" : "live"}
            </span>
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {online ? "Assistente do Core Impulsionando" : (
              <span className="inline-flex items-center gap-1 text-destructive">
                <WifiOff className="h-3 w-3" /> Sem conexão
              </span>
            )}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={clearHistory}
          aria-label="Limpar conversa"
          title="Limpar conversa"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setMode(isFull ? "dock" : "full")}
          aria-label={isFull ? "Recolher" : "Expandir"}
        >
          {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setMode("closed")}
          aria-label="Fechar Impulsionito"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Corpo */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-3 p-3">
          {messages.length === 0 && (
            <div className="mx-auto max-w-sm rounded-xl border border-dashed bg-muted/30 p-4 text-center">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Como posso te ajudar aqui?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Esta é a janela visual do Impulsionito. Respostas ainda são
                simuladas — o cérebro real será plugado em seguida.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sugestões contextuais */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 border-t bg-muted/20 px-3 py-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
      >
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={online ? "Fale com o Impulsionito…" : "Sem conexão — só demo visual"}
          rows={1}
          className="min-h-[40px] max-h-32 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        {isStreaming ? (
          <Button type="button" size="icon" variant="secondary" onClick={stop} aria-label="Parar">
            <StopCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ImpulsionitoMessage }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {message.text}
        {message.status === "streaming" && (
          <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
