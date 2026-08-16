import { useEffect, useRef, useState } from 'react';
import { Bot, Gem, Gift, Hammer, Search, Send, Sparkles, X } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; text: string };
type Action = { label: string; prompt: string; icon: typeof Gem };

const ACTIONS: Action[] = [
  { label: 'Encontre minha pedra', prompt: 'Quero ajuda para escolher uma peça e uma pedra de acordo com meu estilo e ocasião.', icon: Gem },
  { label: 'Quero presentear', prompt: 'Quero escolher um presente. Me ajude considerando pessoa, ocasião, faixa de preço e estilo.', icon: Gift },
  { label: 'Criar peça Ourives', prompt: 'Quero criar uma peça exclusiva pela linha Ourives. Me conduza pelo briefing inicial.', icon: Hammer },
  { label: 'Buscar uma peça', prompt: 'Estou procurando uma peça específica no catálogo. Me ajude a encontrar.', icon: Search },
];

function sessionId() {
  const key = 'anamadu.annita.session.v1';
  const legacyKey = 'anamadu.anita.session.v1';
  let value = localStorage.getItem(key) ?? localStorage.getItem(legacyKey);
  if (!value) value = `anamadu:${crypto.randomUUID()}`;
  localStorage.setItem(key, value);
  return value;
}

function attribution() {
  const key = 'anamadu.attribution.v1';
  const params = new URLSearchParams(window.location.search);
  const current = {
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
    utm_content: params.get('utm_content') ?? undefined,
    utm_term: params.get('utm_term') ?? undefined,
    gclid: params.get('gclid') ?? undefined,
    fbclid: params.get('fbclid') ?? undefined,
    landing_page: window.location.pathname,
    referrer: document.referrer || undefined,
  };
  const useful = Object.values(current).some(Boolean);
  if (useful) localStorage.setItem(key, JSON.stringify(current));
  try { return JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { return {}; }
}

export function AnitaDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function sendText(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', text: '' }]);
    try {
      const response = await fetch('/api/anamadu/anita/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-anamadu-session': sessionId() },
        body: JSON.stringify({ text, attribution: attribution() }),
      });
      if (!response.ok || !response.body) throw new Error('annita_unavailable');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => m.map((message, index) => index === m.length - 1 ? { ...message, text: message.text + chunk } : message));
      }
    } catch {
      setMessages((m) => m.map((message, index) => index === m.length - 1 ? {
        ...message,
        text: 'Não consegui concluir esta etapa agora. Você pode navegar pelo catálogo ou falar com a Ana Madú pelo WhatsApp (21) 96631-5945.',
      } : message));
    } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label="Falar com Annita" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5">
        <Sparkles className="size-4" /> Falar com Annita
      </button>
    );
  }

  return (
    <section role="dialog" aria-label="Annita — consultora virtual Ana Madú" className="fixed bottom-4 right-4 z-50 flex h-[min(700px,calc(100dvh-32px))] w-[min(440px,calc(100vw-32px))] flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-[#fffdf8] shadow-2xl">
      <header className="flex items-center gap-3 border-b border-stone-200 bg-stone-950 p-4 text-white">
        <div className="flex size-11 items-center justify-center rounded-full bg-amber-200 text-stone-950"><Bot className="size-5" /></div>
        <div className="min-w-0 flex-1"><strong className="block text-base">Annita</strong><div className="truncate text-xs text-stone-300">Consultora virtual Ana Madú · powered by Impulsionito</div></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar Annita" className="rounded-full p-2 hover:bg-white/10"><X className="size-5" /></button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!messages.length && <>
          <div className="rounded-2xl bg-stone-100 p-4 text-sm leading-relaxed text-stone-700">
            <div className="mb-1 font-semibold text-stone-950">Sua curadoria começa aqui.</div>
            Conte o que você procura. Eu posso cruzar estilo, ocasião, tipo de peça, pedra e faixa de preço — ou iniciar seu projeto exclusivo Ourives.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map(({ label, prompt, icon: Icon }) => <button key={label} type="button" onClick={() => void sendText(prompt)} className="min-h-24 rounded-2xl border border-stone-200 bg-white p-3 text-left text-xs font-medium text-stone-800 transition hover:border-stone-400 hover:shadow-sm"><Icon className="mb-2 size-4" />{label}</button>)}
          </div>
        </>}
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-stone-950 text-white' : 'bg-stone-100 text-stone-800'}`}>{message.text || (busy && index === messages.length - 1 ? '...' : '')}</div>)}
        <div ref={endRef} />
      </div>

      <form className="border-t border-stone-200 p-3" onSubmit={(event) => { event.preventDefault(); void sendText(input); }}>
        <div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ex.: presente até R$ 100, ametista..." aria-label="Mensagem para Annita" className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-stone-700" /><button disabled={busy || !input.trim()} aria-label="Enviar" className="flex size-12 items-center justify-center rounded-full bg-stone-950 text-white disabled:opacity-40"><Send className="size-4" /></button></div>
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-stone-500">A Annita não inventa preço, estoque, origem ou propriedades de pedras. Quando necessário, encaminha seu atendimento para uma pessoa.</p>
      </form>
    </section>
  );
}
