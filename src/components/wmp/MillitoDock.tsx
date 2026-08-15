import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Building2, CalendarDays, Headphones, Send, Sparkles, X } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; text: string };

type QuickAction = {
  label: string;
  prompt: string;
  icon: typeof Sparkles;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Quero produzir um evento',
    prompt: 'Quero produzir um evento. Me ajude a montar o briefing e chegar à proposta certa.',
    icon: Sparkles,
  },
  {
    label: 'Sou hotel ou empresa',
    prompt: 'Represento um hotel ou empresa. Quero entender contratação recorrente de DJs, eventos e como agendar uma conversa comercial.',
    icon: Building2,
  },
  {
    label: 'Quero contratar um DJ',
    prompt: 'Quero contratar um DJ. Me ajude a definir perfil musical, data, local, duração, estrutura e disponibilidade.',
    icon: Headphones,
  },
  {
    label: 'Quero ser parceiro WMP',
    prompt: 'Sou DJ ou profissional de eventos e quero me cadastrar como parceiro da WMP. Me conduza pelo cadastro e próximos passos.',
    icon: CalendarDays,
  },
];

function getSession() {
  const key = 'wmp.millito.session.v1';
  let value = localStorage.getItem(key);
  if (!value) {
    value = `wmp:${crypto.randomUUID()}`;
    localStorage.setItem(key, value);
  }
  return value;
}

function renderTextWithLinks(text: string) {
  const parts = text.split(/((?:https?:\/\/[^\s]+)|(?:\/wmp\/[^\s]+))/g);
  return parts.map((part, index) => {
    if (!part) return null;
    const isAbsolute = /^https?:\/\//.test(part);
    const isInternal = /^\/wmp\//.test(part);
    if (!isAbsolute && !isInternal) return <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>;

    const href = part.replace(/[),.;]+$/, '');
    const trailing = part.slice(href.length);
    return (
      <span key={`${index}-${href}`}>
        <a
          href={href}
          target={isAbsolute ? '_blank' : undefined}
          rel={isAbsolute ? 'noreferrer' : undefined}
          className="font-semibold underline underline-offset-2"
        >
          {isInternal ? 'Continuar atendimento' : href}
        </a>
        {trailing}
      </span>
    );
  });
}

export function MillitoDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const hasConversation = messages.length > 0;
  const headline = useMemo(
    () => (hasConversation ? 'Milito está acompanhando seu atendimento' : 'Conte o que você precisa. Eu conduzo o próximo passo.'),
    [hasConversation],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function sendText(rawText: string) {
    const text = rawText.trim();
    if (!text || busy) return;

    setInput('');
    setBusy(true);
    setMessages((current) => [...current, { role: 'user', text }, { role: 'assistant', text: '' }]);

    try {
      const response = await fetch('/api/wmp/millito/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-wmp-session': getSession(),
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok || !response.body) throw new Error('Falha no atendimento');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message, index) =>
            index === current.length - 1 ? { ...message, text: message.text + chunk } : message,
          ),
        );
      }
    } catch {
      setMessages((current) =>
        current.map((message, index) =>
          index === current.length - 1
            ? {
                ...message,
                text: 'Não consegui concluir esta etapa agora. Você pode continuar pelo briefing em /wmp/orcamento ou tentar novamente aqui. Seu atendimento não precisa recomeçar do zero.',
              }
            : message,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    await sendText(input);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 wmp-cta shadow-xl"
        aria-label="Abrir Milito"
      >
        <Bot className="size-4" /> Falar com Milito
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label="Milito — assistente WMP"
      className="fixed bottom-4 right-4 z-50 flex h-[min(680px,calc(100dvh-32px))] w-[min(430px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
    >
      <header className="flex items-center gap-3 border-b p-3">
        <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'var(--gradient-wmp-cta)', color: 'var(--wmp-bg)' }}>
          <Bot className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block">Milito</strong>
          <div className="truncate text-xs opacity-70">Cérebro comercial e operacional da WMP</div>
        </div>
        <button type="button" aria-label="Fechar Milito" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-muted">
          <X className="size-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="rounded-xl border bg-muted/60 p-3 text-sm">
          <div className="mb-1 font-semibold">{headline}</div>
          <p className="leading-relaxed opacity-80">
            Eu entendo a necessidade, qualifico o evento, organizo o briefing, direciono contratação de DJ,
            cadastro parceiros e conduzo hotéis e empresas até o próximo passo comercial — sem inventar preço
            ou disponibilidade.
          </p>
        </div>

        {!hasConversation && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Atalhos do Milito">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  disabled={busy}
                  onClick={() => void sendText(action.prompt)}
                  className="flex min-h-16 items-start gap-2 rounded-xl border p-3 text-left text-xs transition hover:bg-muted disabled:opacity-60"
                >
                  <Icon className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--wmp-gold)' }} aria-hidden />
                  <span className="font-medium leading-snug">{action.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[90%] whitespace-pre-wrap rounded-xl p-3 text-sm leading-relaxed ${
              message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {message.text ? renderTextWithLinks(message.text) : busy && index === messages.length - 1 ? '...' : ''}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="flex gap-2">
          <input
            aria-label="Mensagem para Milito"
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-base"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Evento, DJ, hotel, empresa, parceria..."
            autoComplete="off"
          />
          <button className="wmp-cta min-h-11 min-w-11 px-3" disabled={busy || !input.trim()} aria-label="Enviar">
            <Send className="size-4" />
          </button>
        </div>
        <div className="mt-2 text-[11px] opacity-60">
          O Milito registra o atendimento no Core WMP para manter contexto, protocolo e continuidade quando aplicável.
        </div>
      </form>
    </section>
  );
}
