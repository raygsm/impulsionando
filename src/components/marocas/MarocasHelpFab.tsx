import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  CalendarCheck,
  Home,
  Loader2,
  Send,
  ShoppingBasket,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import {
  useImpulsionitoTransport,
  type ImpulsionitoMessage,
} from "@/components/impulsionito/transport";

type QuickAction = {
  icon: React.ReactNode;
  label: string;
  prompt: string;
};

const quickActions: QuickAction[] = [
  {
    icon: <Home className="h-4 w-4" />,
    label: "Contratar limpeza",
    prompt: "Quero contratar limpeza entre hóspedes para meu imóvel. Faça a qualificação necessária sem inventar preço.",
  },
  {
    icon: <CalendarCheck className="h-4 w-4" />,
    label: "Plano recorrente",
    prompt: "Quero entender qual plano recorrente de operação e manutenção faz sentido para meu imóvel.",
  },
  {
    icon: <ShoppingBasket className="h-4 w-4" />,
    label: "Reposição",
    prompt: "Preciso organizar reposição de consumíveis no meu imóvel. Como a Marocas pode assumir essa operação?",
  },
  {
    icon: <Wrench className="h-4 w-4" />,
    label: "Manutenção",
    prompt: "Tenho uma ocorrência de manutenção no imóvel. Faça as perguntas necessárias para classificar a situação sem inventar diagnóstico.",
  },
];

function makeId() {
  return `maru_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Maruquito — agente virtual oficial da Marocas.
 * Usa o transporte do Impulsionito; o backend resolve a instância Marocas
 * exclusivamente pelo pathname sanitizado e não confia no tenant do browser.
 */
export function MaruquitoFab() {
  const location = useLocation();
  const transport = useImpulsionitoTransport();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ImpulsionitoMessage[]>([
    {
      id: "maruquito_welcome",
      role: "assistant",
      text: "Oi! Eu sou o Maruquito, agente virtual da Marocas. Posso ajudar com limpeza entre hóspedes, preparação do imóvel, reposição, manutenção e planos recorrentes. O que você precisa resolver?",
      ts: Date.now(),
      status: "done",
    },
  ]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;

    const history = messagesRef.current;
    const userMessage: ImpulsionitoMessage = {
      id: makeId(),
      role: "user",
      text,
      ts: Date.now(),
      status: "done",
    };
    const assistantId = makeId();
    const assistantMessage: ImpulsionitoMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      ts: Date.now(),
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setBusy(true);

    try {
      const stream = transport.sendMessage({
        text,
        history,
        context: {
          pathname: location.pathname,
          screen: typeof document !== "undefined" ? document.title : "Marocas",
          tenant: "marocas",
          audience: "anfitriao-proprietario",
          userProfile: "cliente-publico-marocas",
          channel: "web",
        },
      });

      let received = false;
      for await (const chunk of stream) {
        if (!chunk.delta) continue;
        received = true;
        setMessages((prev) => prev.map((message) =>
          message.id === assistantId
            ? { ...message, text: message.text + chunk.delta }
            : message,
        ));
      }

      setMessages((prev) => prev.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              status: "done",
              text: received
                ? message.text
                : "Não consegui concluir essa resposta agora. Você pode continuar pelo cadastro do imóvel sem perder o contexto da sua necessidade.",
            }
          : message,
      ));
    } catch {
      setMessages((prev) => prev.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              status: "error",
              text: "Tive uma falha de conexão. Não vou inventar informações operacionais. Você pode cadastrar o imóvel ou tentar novamente por aqui.",
            }
          : message,
      ));
    } finally {
      setBusy(false);
    }
  }, [busy, location.pathname, transport]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div
          role="dialog"
          aria-label="Conversa com Maruquito"
          className="mb-3 w-[390px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b bg-gradient-to-br from-primary/15 via-background to-amber-50/40 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="font-bold">Maruquito</div>
                <div className="truncate text-xs text-muted-foreground">Agente Marocas · inteligência Impulsionito</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 hover:bg-muted"
              aria-label="Fechar Maruquito"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b bg-muted/20 p-3">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => void send(action.prompt)}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-xl border bg-card p-2.5 text-left text-xs font-medium hover:bg-muted/40 disabled:opacity-50"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={message.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[88%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm"}
                >
                  {message.text || (message.status === "streaming" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Pensando…
                    </span>
                  ) : null)}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="border-t bg-background p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Conte o que precisa no imóvel…"
                rows={2}
                className="min-h-[44px] flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
                aria-label="Enviar mensagem"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <span>Limpeza · reposição · manutenção</span>
              <Link to="/marocas/cadastrar-imovel" className="font-semibold text-primary hover:underline">
                Cadastrar imóvel
              </Link>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground shadow-xl transition hover:shadow-2xl"
        aria-expanded={open}
        aria-label="Falar com Maruquito"
      >
        <Sparkles className="h-5 w-5" />
        Maruquito
      </button>
    </div>
  );
}

// Compatibilidade temporária com imports antigos durante a migração do nome.
export const MaroquitoFab = MaruquitoFab;
export const MarocasHelpFab = MaruquitoFab;
