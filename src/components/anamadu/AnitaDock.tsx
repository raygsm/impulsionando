import { useEffect, useRef, useState } from 'react';
import { Bot, Gem, Gift, Hammer, ImagePlus, MessageCircle, Search, Send, Sparkles, X, ShieldCheck, Truck, RotateCcw, HeartHandshake } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; text: string; images?: string[] };
type Action = { label: string; prompt: string; icon: typeof Gem };
type OurivesEvent = { type?: string; brief?: { piece?: string; metal?: string; style?: string; stone?: string; notes?: string; refs?: string[] }; approved?: boolean };

const WHATSAPP_URL = 'https://wa.me/5521966315945?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Ana%20Mad%C3%BA%20e%20quero%20falar%20com%20a%20Annita.';

const PRIMARY_ACTIONS: Action[] = [
  { label: 'Encontre minha pedra', prompt: 'Quero ajuda para escolher uma peça e uma pedra de acordo com meu estilo e ocasião.', icon: Gem },
  { label: 'Quero presentear', prompt: 'Quero escolher um presente. Me ajude considerando pessoa, ocasião, faixa de preço e estilo.', icon: Gift },
  { label: 'Criar peça Ourives', prompt: 'Quero criar uma peça exclusiva pela linha Ourives. Me conduza pelo briefing inicial.', icon: Hammer },
  { label: 'Buscar uma peça', prompt: 'Estou procurando uma peça específica no catálogo. Me ajude a encontrar.', icon: Search },
];

const FAQ_ACTIONS: Action[] = [
  { label: 'Entrega e prazo', prompt: 'Quero saber sobre entrega, prazo e acompanhamento do meu pedido. Consulte apenas as regras vigentes do Core e, se não estiverem disponíveis, diga o que precisa ser confirmado.', icon: Truck },
  { label: 'Trocas e pedidos', prompt: 'Tenho uma dúvida sobre troca, pedido ou pós-venda. Consulte somente as políticas vigentes e me oriente sem inventar condições.', icon: RotateCcw },
  { label: 'Cuidados com pedras', prompt: 'Quero saber como cuidar da minha peça e da pedra para preservar beleza, acabamento e durabilidade.', icon: ShieldCheck },
  { label: 'Falar com uma pessoa', prompt: 'Quero atendimento humano. Preserve meu contexto e me encaminhe sem pedir novamente o que eu já informei.', icon: HeartHandshake },
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
  if (Object.values(current).some(Boolean)) localStorage.setItem(key, JSON.stringify(current));
  try { return JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { return {}; }
}

function readImages(files: FileList | null): Promise<string[]> {
  if (!files) return Promise.resolve([]);
  const selected = Array.from(files).filter((file) => file.type.startsWith('image/') && file.size <= 2_000_000).slice(0, 3);
  return Promise.all(selected.map((file) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })));
}

export function AnitaDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<OurivesEvent>).detail ?? {};
      const brief = detail.brief ?? {};
      const prompt = [
        'Meu conceito Ourives foi aprovado e quero seguir para a análise com a Ana Madú.',
        `Tipo de peça: ${brief.piece ?? 'a definir'}.`,
        `Estilo: ${brief.style ?? 'a definir'}.`,
        `Metal/acabamento: ${brief.metal ?? 'a definir'}.`,
        `Pedra/referência: ${brief.stone ?? 'a definir'}.`,
        brief.notes ? `Observações: ${brief.notes}.` : '',
        'Analise as referências visuais sem inventar material, procedência, autenticidade ou viabilidade. Organize o briefing e diga quais pontos precisam ser confirmados antes da análise orçamentária humana.',
      ].filter(Boolean).join('\n');
      setOpen(true);
      setImages(Array.isArray(brief.refs) ? brief.refs.slice(0, 3) : []);
      setTimeout(() => void sendText(prompt, Array.isArray(brief.refs) ? brief.refs.slice(0, 3) : []), 0);
    };
    window.addEventListener('anamadu:open-annita', handler);
    return () => window.removeEventListener('anamadu:open-annita', handler);
  }, []);

  async function sendText(raw: string, suppliedImages?: string[]) {
    const text = raw.trim();
    const outgoingImages = (suppliedImages ?? images).slice(0, 3);
    if ((!text && !outgoingImages.length) || busy) return;
    setInput('');
    setImages([]);
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', text: text || 'Analise estas referências visuais.', images: outgoingImages }, { role: 'assistant', text: '' }]);
    try {
      const response = await fetch('/api/anamadu/anita/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-anamadu-session': sessionId() },
        body: JSON.stringify({ text: text || 'Analise estas referências visuais.', images: outgoingImages, attribution: attribution() }),
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
        text: 'Não consegui concluir esta etapa agora. Seu contexto permanece preservado. Você pode tentar novamente ou falar pelo WhatsApp.',
      } : message));
    } finally { setBusy(false); }
  }

  if (!open) {
    return <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">
      <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Falar com a Ana Madú pelo WhatsApp" className="flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:-translate-y-0.5"><MessageCircle className="size-5" /></a>
      <button type="button" onClick={() => setOpen(true)} aria-label="Falar com Annita" className="flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5"><Sparkles className="size-4" /> Falar com Annita</button>
    </div>;
  }

  return <section role="dialog" aria-label="Annita — consultora virtual Ana Madú" className="fixed bottom-4 right-4 z-[90] flex h-[min(760px,calc(100dvh-32px))] w-[min(460px,calc(100vw-32px))] flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-[#fffdf8] shadow-2xl">
    <header className="flex items-center gap-3 border-b border-stone-200 bg-stone-950 p-4 text-white">
      <div className="flex size-11 items-center justify-center rounded-full bg-amber-200 text-stone-950"><Bot className="size-5" /></div>
      <div className="min-w-0 flex-1"><strong className="block text-base">Annita</strong><div className="truncate text-xs text-stone-300">Especialista Ana Madú · pedras · catálogo · Ourives</div></div>
      <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp" className="rounded-full bg-[#25D366] p-2 text-white"><MessageCircle className="size-5" /></a>
      <button type="button" onClick={() => setOpen(false)} aria-label="Fechar Annita" className="rounded-full p-2 hover:bg-white/10"><X className="size-5" /></button>
    </header>

    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {!messages.length && <>
        <div className="rounded-2xl bg-stone-100 p-4 text-sm leading-relaxed text-stone-700"><div className="mb-1 font-semibold text-stone-950">Como posso ajudar?</div>Converse comigo, envie uma foto de pedra ou peça, procure um produto, tire dúvidas ou comece um projeto Ourives. Eu preservo o contexto da sua jornada.</div>
        <div className="grid grid-cols-2 gap-2">{PRIMARY_ACTIONS.map(({ label, prompt, icon: Icon }) => <button key={label} type="button" onClick={() => void sendText(prompt)} className="min-h-24 rounded-2xl border border-stone-200 bg-white p-3 text-left text-xs font-medium text-stone-800 transition hover:border-stone-400 hover:shadow-sm"><Icon className="mb-2 size-4" />{label}</button>)}</div>
        <div className="pt-1 text-[11px] font-semibold uppercase tracking-[.16em] text-stone-500">Dúvidas rápidas</div>
        <div className="grid grid-cols-2 gap-2">{FAQ_ACTIONS.map(({ label, prompt, icon: Icon }) => <button key={label} type="button" onClick={() => void sendText(prompt)} className="rounded-xl border border-stone-200 bg-[#fffaf4] p-3 text-left text-xs font-medium text-stone-800 transition hover:border-stone-400"><Icon className="mb-1.5 size-4" />{label}</button>)}</div>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"><MessageCircle className="size-4" /> Continuar pelo WhatsApp</a>
      </>}
      {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[92%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-stone-950 text-white' : 'bg-stone-100 text-stone-800'}`}>{message.images?.length ? <div className="mb-2 grid grid-cols-3 gap-1">{message.images.map((src, i) => <img key={i} src={src} alt="Referência enviada" className="aspect-square rounded-lg object-cover" />)}</div> : null}{message.text || (busy && index === messages.length - 1 ? '...' : '')}</div>)}<div ref={endRef} />
    </div>

    <form className="border-t border-stone-200 p-3" onSubmit={(event) => { event.preventDefault(); void sendText(input); }}>
      {images.length > 0 && <div className="mb-2 flex gap-2">{images.map((src, i) => <div key={i} className="relative"><img src={src} alt="Anexo" className="size-14 rounded-xl object-cover" /><button type="button" onClick={() => setImages((v) => v.filter((_, n) => n !== i))} className="absolute -right-1 -top-1 rounded-full bg-stone-950 p-1 text-white"><X className="size-3" /></button></div>)}</div>}
      <div className="flex gap-2"><label className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-stone-300 bg-white" title="Enviar imagens"><ImagePlus className="size-4" /><input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void readImages(e.target.files).then((newImages) => setImages((current) => [...current, ...newImages].slice(0, 3)))} /></label><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte ou envie uma referência..." aria-label="Mensagem para Annita" className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-stone-700" /><button disabled={busy || (!input.trim() && !images.length)} aria-label="Enviar" className="flex size-12 items-center justify-center rounded-full bg-stone-950 text-white disabled:opacity-40"><Send className="size-4" /></button></div>
      <p className="mt-2 px-1 text-[10px] leading-relaxed text-stone-500">Até 3 imagens, 2 MB cada. A Annita analisa referências visuais e ajuda na curadoria, sem substituir laudo gemológico ou validação humana.</p>
    </form>
  </section>;
}
