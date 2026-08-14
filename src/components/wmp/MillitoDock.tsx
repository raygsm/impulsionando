import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; text: string };

function getSession() {
  const key = 'wmp.millito.session.v1';
  let value = localStorage.getItem(key);
  if (!value) { value = `wmp:${crypto.randomUUID()}`; localStorage.setItem(key, value); }
  return value;
}

export function MillitoDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput(''); setBusy(true); setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', text: '' }]);
    try {
      const r = await fetch('/api/wmp/millito/chat', { method: 'POST', headers: { 'content-type': 'application/json', 'x-wmp-session': getSession() }, body: JSON.stringify({ text }) });
      if (!r.ok || !r.body) throw new Error('Falha no atendimento');
      const reader = r.body.getReader(); const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => m.map((msg, i) => i === m.length - 1 ? { ...msg, text: msg.text + chunk } : msg));
      }
    } catch {
      setMessages((m) => m.map((msg, i) => i === m.length - 1 ? { ...msg, text: 'Não consegui concluir agora. Use o briefing da WMP e nossa equipe dará continuidade.' } : msg));
    } finally { setBusy(false); }
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-50 wmp-cta shadow-xl" aria-label="Abrir Milito"><Bot className="size-4"/> Falar com Milito</button>;

  return <section role="dialog" aria-label="Milito — assistente WMP" className="fixed bottom-4 right-4 z-50 flex h-[min(620px,calc(100dvh-32px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
    <header className="flex items-center gap-2 border-b p-3"><Bot className="size-5"/><div className="flex-1"><strong>Milito</strong><div className="text-xs opacity-70">WMP Wagner Miller Produções</div></div><button aria-label="Fechar Milito" onClick={() => setOpen(false)}><X className="size-5"/></button></header>
    <div className="flex-1 overflow-y-auto p-3 space-y-3"><div className="rounded-xl bg-muted p-3 text-sm">Olá! Sou o Milito. Posso entender seu evento, orientar o setup e ajudar a preparar seu briefing.</div>{messages.map((m,i)=><div key={i} className={`max-w-[88%] rounded-xl p-3 text-sm ${m.role==='user'?'ml-auto bg-primary text-primary-foreground':'bg-muted'}`}>{m.text || (busy && i===messages.length-1 ? '...' : '')}</div>)}<div ref={endRef}/></div>
    <form className="flex gap-2 border-t p-3" onSubmit={(e)=>{e.preventDefault();void send();}}><input aria-label="Mensagem para Milito" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-base" value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Conte como será seu evento..."/><button className="wmp-cta min-h-11 min-w-11 px-3" disabled={busy} aria-label="Enviar"><Send className="size-4"/></button></form>
  </section>;
}
