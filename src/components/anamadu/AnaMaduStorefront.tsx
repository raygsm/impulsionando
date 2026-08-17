import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Gem, Heart, ImagePlus, Search, ShoppingBag, Sparkles, Trash2, WandSparkles, X } from 'lucide-react';

type CatalogItem = {
  name: string;
  price: number;
  priceLabel: string;
  url: string;
  image?: string;
  status: 'available' | 'sold_out' | 'unknown';
};

type ProductDetail = { name?: string | null; description?: string | null; image?: string | null; status?: string };
type CartItem = CatalogItem & { qty: number };
type OurivesBrief = { piece: string; metal: string; style: string; stone: string; notes: string; refs: string[] };

const CART_KEY = 'anamadu.cart.v1';

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]'); } catch { return []; }
}

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function track(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as Window & { dataLayer?: Record<string, unknown>[] };
  const dataLayer = w.dataLayer ?? [];
  dataLayer.push({ event, brand: 'ana_madu', ...payload });
  w.dataLayer = dataLayer;
}

export function AnaMaduStorefront() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [query, setQuery] = useState('');
  const [price, setPrice] = useState<'todos' | 'ate50' | '50a100' | 'acima100'>('todos');
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ourivesOpen, setOurivesOpen] = useState(false);

  useEffect(() => {
    setCart(readCart());
    fetch('/api/anamadu/catalog')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (!Array.isArray(data.items) || !data.items.length) throw new Error('empty');
        setCatalog(data.items);
        setState('ready');
        track('anamadu_storefront_catalog_ready', { count: data.items.length });
      })
      .catch(() => setState('unavailable'));
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return catalog.filter((item) => {
      const text = !q || item.name.toLocaleLowerCase('pt-BR').includes(q);
      const p = price === 'todos' || (price === 'ate50' && item.price <= 50) || (price === '50a100' && item.price > 50 && item.price <= 100) || (price === 'acima100' && item.price > 100);
      return text && p;
    });
  }, [catalog, query, price]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  async function openProduct(item: CatalogItem) {
    setSelected(item);
    setDetail(null);
    track('anamadu_product_open_internal', { item_name: item.name, price: item.price });
    try {
      const r = await fetch(`/api/anamadu/product-detail?url=${encodeURIComponent(item.url)}`);
      if (r.ok) setDetail(await r.json());
    } catch { /* product card remains usable without optional description */ }
  }

  function add(item: CatalogItem) {
    if (item.status === 'sold_out') return;
    setCart((current) => {
      const found = current.find((x) => x.url === item.url);
      return found ? current.map((x) => x.url === item.url ? { ...x, qty: x.qty + 1 } : x) : [...current, { ...item, qty: 1 }];
    });
    setCartOpen(true);
    track('anamadu_add_to_cart', { item_name: item.name, price: item.price });
  }

  function remove(url: string) { setCart((c) => c.filter((x) => x.url !== url)); }

  return <main className="min-h-screen bg-[#f8f4ec] text-stone-950">
    <section className="border-b border-stone-200 bg-[#efe7d8]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <div className="font-black tracking-[0.22em]">ANA MADÚ</div>
        <div className="hidden gap-7 text-sm md:flex"><a href="#catalogo">Peças</a><button onClick={() => setOurivesOpen(true)}>Ourives</button><a href="#marca">A marca</a></div>
        <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white"><ShoppingBag className="size-4" /> Sacola{count > 0 && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] text-stone-950">{count}</span>}</button>
      </nav>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/60 px-3 py-1 text-xs"><Sparkles className="size-3.5" /> Compra completa dentro da Ana Madú</div><h1 className="max-w-4xl text-5xl font-black leading-[.95] tracking-[-.04em] sm:text-6xl lg:text-8xl">Escolha. Crie. Compre.</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-stone-700">Todos os produtos, preços e detalhes disponíveis na experiência Ana Madú. A Annita acompanha sua escolha e a linha Ourives transforma referências em um projeto exclusivo.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#catalogo" className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 font-semibold text-white">Ver todas as peças <ArrowRight className="size-4" /></a><button onClick={() => setOurivesOpen(true)} className="rounded-full border border-stone-400 bg-white/50 px-6 py-3 font-semibold">Criar com Ourives</button></div></div>
        <div className="grid gap-3"><div className="rounded-[32px] border border-white/60 bg-white/55 p-6"><Gem className="mb-8 size-9" /><div className="text-xs uppercase tracking-[.22em] text-stone-500">Tradicional</div><h2 className="mt-2 text-2xl font-bold">Catálogo completo</h2><p className="mt-2 text-sm text-stone-600">Navegação, detalhes e sacola sem sair do site.</p></div><button onClick={() => setOurivesOpen(true)} className="rounded-[32px] bg-stone-950 p-6 text-left text-white"><WandSparkles className="mb-8 size-9 text-amber-200" /><div className="text-xs uppercase tracking-[.22em] text-stone-400">Ourives</div><h2 className="mt-2 text-2xl font-bold">Pedras raras e projetos exclusivos</h2><p className="mt-2 text-sm text-stone-300">Referências visuais, briefing com Annita, conceito para aprovação e análise orçamentária pela Ana Madú.</p></button></div>
      </div>
    </section>

    <section id="catalogo" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-xs uppercase tracking-[.22em] text-stone-500">{state === 'ready' ? `${catalog.length} peças sincronizadas` : 'Catálogo Ana Madú'}</div><h2 className="mt-2 text-4xl font-black sm:text-5xl">Todas as peças</h2><p className="mt-3 max-w-2xl text-stone-600">Nenhuma peça abre outra loja. Clique para ver detalhes aqui e adicionar à sacola.</p></div>{state === 'ready' && <div className="flex flex-col gap-2 sm:flex-row"><label className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-3"><Search className="size-4" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar peça" className="w-52 bg-transparent outline-none" /></label><select value={price} onChange={(e) => setPrice(e.target.value as typeof price)} className="rounded-full border border-stone-300 bg-white px-4 py-3"><option value="todos">Todos os preços</option><option value="ate50">Até R$ 50</option><option value="50a100">R$ 50–100</option><option value="acima100">Acima de R$ 100</option></select></div>}</div>
      {state === 'loading' && <div className="mt-10 rounded-3xl bg-white p-10 text-center">Carregando catálogo real…</div>}
      {state === 'unavailable' && <div className="mt-10 rounded-3xl border border-amber-300 bg-amber-50 p-10 text-center"><strong>Catálogo temporariamente indisponível.</strong><p className="mt-2 text-sm text-stone-600">A Annita pode registrar sua intenção sem inventar produto, preço ou estoque.</p></div>}
      {state === 'ready' && <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((item) => <article key={item.url} className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm"><button onClick={() => void openProduct(item)} className="block w-full text-left"><div className="relative aspect-[4/4.4] overflow-hidden bg-stone-100">{item.image ? <img src={item.image} alt={item.name} loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center"><Gem className="size-12 text-stone-400" /></div>}<div className="absolute right-3 top-3 rounded-full bg-white/90 p-2"><Heart className="size-4" /></div>{item.status === 'sold_out' && <span className="absolute left-3 top-3 rounded-full bg-stone-950 px-3 py-1 text-[10px] uppercase text-white">Esgotado</span>}</div><div className="p-5"><h3 className="min-h-12 font-semibold">{item.name}</h3><div className="mt-3 flex justify-between"><strong>{item.priceLabel}</strong><span className="text-xs font-semibold">Ver detalhes</span></div></div></button></article>)}</div>}
    </section>

    <section id="marca" className="bg-stone-950 text-white"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="text-xs uppercase tracking-[.22em] text-amber-200">Ana Madú</div><h2 className="mt-3 max-w-3xl text-4xl font-black sm:text-5xl">Artesanal no toque. Inteligente na experiência.</h2><p className="mt-6 max-w-2xl text-stone-300">A Annita une catálogo, contexto, referências visuais e intenção para tornar a compra e a criação sob medida mais claras e pessoais.</p></div></section>

    {selected && <div className="fixed inset-0 z-[70] bg-black/45 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.currentTarget === e.target) setSelected(null); }}><div className="mx-auto mt-[3vh] max-h-[94vh] max-w-4xl overflow-y-auto rounded-[32px] bg-[#fffdf8]"><div className="flex items-center justify-between border-b p-5"><button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm"><ChevronLeft className="size-4" /> Voltar ao catálogo</button><button onClick={() => setSelected(null)}><X /></button></div><div className="grid gap-8 p-6 md:grid-cols-2"><div className="aspect-square overflow-hidden rounded-3xl bg-stone-100">{(detail?.image || selected.image) ? <img src={detail?.image || selected.image} alt={selected.name} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center"><Gem className="size-16 text-stone-400" /></div>}</div><div className="flex flex-col"><div className="text-xs uppercase tracking-[.22em] text-stone-500">Peça Ana Madú</div><h2 className="mt-2 text-3xl font-black">{detail?.name || selected.name}</h2><strong className="mt-4 text-2xl">{selected.priceLabel}</strong><p className="mt-6 whitespace-pre-line leading-relaxed text-stone-600">{detail?.description || 'Descrição detalhada sendo sincronizada. A Annita pode ajudar a avaliar estilo, ocasião e combinação sem inventar informações sobre a pedra.'}</p><div className="mt-auto pt-8"><button disabled={selected.status === 'sold_out'} onClick={() => add(selected)} className="w-full rounded-full bg-stone-950 px-6 py-4 font-semibold text-white disabled:opacity-40">{selected.status === 'sold_out' ? 'Produto esgotado' : 'Adicionar à sacola'}</button></div></div></div></div></div>}

    {cartOpen && <div className="fixed inset-0 z-[80] bg-black/40" onMouseDown={(e) => { if (e.currentTarget === e.target) setCartOpen(false); }}><aside className="ml-auto flex h-full w-full max-w-md flex-col bg-[#fffdf8] shadow-2xl"><header className="flex items-center justify-between border-b p-5"><div><div className="text-xs uppercase tracking-[.2em] text-stone-500">Sacola</div><strong className="text-xl">{count} item(ns)</strong></div><button onClick={() => setCartOpen(false)}><X /></button></header><div className="flex-1 space-y-3 overflow-y-auto p-5">{!cart.length && <div className="rounded-3xl bg-stone-100 p-8 text-center text-sm text-stone-600">Sua sacola está vazia.</div>}{cart.map((item) => <div key={item.url} className="flex gap-3 rounded-2xl border bg-white p-3"><div className="size-20 overflow-hidden rounded-xl bg-stone-100">{item.image && <img src={item.image} alt="" className="size-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="font-semibold">{item.name}</div><div className="mt-1 text-sm">{item.qty} × {item.priceLabel}</div></div><button onClick={() => remove(item.url)} aria-label="Remover"><Trash2 className="size-4" /></button></div>)}</div><footer className="border-t p-5"><div className="mb-4 flex justify-between text-lg"><span>Total</span><strong>{money(total)}</strong></div><button disabled={!cart.length} onClick={() => track('anamadu_checkout_intent_internal', { total, items: count })} className="w-full rounded-full bg-stone-950 px-6 py-4 font-semibold text-white disabled:opacity-40">Finalizar compra aqui</button><p className="mt-3 text-center text-[11px] text-stone-500">O pagamento será ativado aqui assim que a credencial oficial do motor transacional estiver homologada. Nenhum dado financeiro é inventado ou desviado.</p></footer></aside></div>}

    {ourivesOpen && <OurivesStudio onClose={() => setOurivesOpen(false)} />}
  </main>;
}

function OurivesStudio({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [brief, setBrief] = useState<OurivesBrief>({ piece: 'Anel', metal: 'A definir', style: 'Orgânico', stone: '', notes: '', refs: [] });
  const [approved, setApproved] = useState(false);

  function files(input: FileList | null) {
    if (!input) return;
    Array.from(input).slice(0, 4).forEach((file) => {
      if (!file.type.startsWith('image/') || file.size > 5_000_000) return;
      const reader = new FileReader();
      reader.onload = () => setBrief((b) => ({ ...b, refs: [...b.refs, String(reader.result)].slice(0, 4) }));
      reader.readAsDataURL(file);
    });
  }

  function sendToAnnita() {
    const payload = { type: 'anamadu_ourives_brief', brief, approved, createdAt: new Date().toISOString() };
    localStorage.setItem('anamadu.ourives.brief.v1', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('anamadu:open-annita', { detail: payload }));
    track('anamadu_ourives_brief_approved', { piece: brief.piece, style: brief.style, refs: brief.refs.length });
    onClose();
  }

  return <div className="fixed inset-0 z-[90] overflow-y-auto bg-stone-950/75 p-4 backdrop-blur"><div className="mx-auto my-4 max-w-5xl overflow-hidden rounded-[32px] bg-[#fffdf8]"><header className="flex items-center justify-between border-b p-5"><div><div className="text-xs uppercase tracking-[.22em] text-stone-500">Estúdio Ourives</div><strong className="text-xl">Conceito visual antes do orçamento</strong></div><button onClick={onClose}><X /></button></header><div className="grid gap-0 lg:grid-cols-[.9fr_1.1fr]"><aside className="bg-stone-950 p-6 text-white"><WandSparkles className="size-8 text-amber-200" /><h2 className="mt-5 text-3xl font-black">Pedras raras pedem uma conversa rara.</h2><p className="mt-4 text-sm leading-relaxed text-stone-300">A Annita organiza referências, estilo, tipo de peça e intenção. O conceito visual é aprovado por você antes de seguir para análise técnica e orçamento da Ana Madú.</p><div className="mt-8 space-y-3 text-sm">{['Referências e intenção','Estrutura da peça','Conceito visual','Aprovação','Análise orçamentária'].map((x, i) => <div key={x} className="flex items-center gap-3"><span className={`flex size-7 items-center justify-center rounded-full ${step > i ? 'bg-amber-200 text-stone-950' : 'bg-white/10'}`}>{step > i ? <Check className="size-4" /> : i + 1}</span>{x}</div>)}</div></aside><div className="p-6 lg:p-8">{step === 1 && <div><h3 className="text-2xl font-black">O que você imagina?</h3><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm">Tipo de peça<select value={brief.piece} onChange={(e) => setBrief({ ...brief, piece: e.target.value })} className="mt-2 w-full rounded-2xl border bg-white p-3"><option>Anel</option><option>Colar</option><option>Brinco</option><option>Pulseira</option><option>Pingente</option><option>Outro</option></select></label><label className="text-sm">Estilo<select value={brief.style} onChange={(e) => setBrief({ ...brief, style: e.target.value })} className="mt-2 w-full rounded-2xl border bg-white p-3"><option>Orgânico</option><option>Minimalista</option><option>Clássico</option><option>Contemporâneo</option><option>Marcante</option><option>Delicado</option></select></label><label className="text-sm sm:col-span-2">Pedra desejada ou referência<input value={brief.stone} onChange={(e) => setBrief({ ...brief, stone: e.target.value })} placeholder="Ex.: turmalina, água-marinha, pedra da foto…" className="mt-2 w-full rounded-2xl border bg-white p-3" /></label></div><label className="mt-5 block rounded-3xl border border-dashed border-stone-300 p-6 text-center"><ImagePlus className="mx-auto size-7" /><span className="mt-2 block font-semibold">Adicionar até 4 imagens de referência</span><span className="mt-1 block text-xs text-stone-500">Fotos de pedras, peças, desenhos ou inspirações</span><input type="file" accept="image/*" multiple className="hidden" onChange={(e) => files(e.target.files)} /></label>{brief.refs.length > 0 && <div className="mt-4 grid grid-cols-4 gap-2">{brief.refs.map((src, i) => <img key={i} src={src} alt={`Referência ${i + 1}`} className="aspect-square rounded-xl object-cover" />)}</div>}<button onClick={() => setStep(2)} className="mt-6 w-full rounded-full bg-stone-950 p-4 font-semibold text-white">Continuar</button></div>}
      {step === 2 && <div><h3 className="text-2xl font-black">Estrutura da peça</h3><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm">Metal / acabamento<select value={brief.metal} onChange={(e) => setBrief({ ...brief, metal: e.target.value })} className="mt-2 w-full rounded-2xl border bg-white p-3"><option>A definir</option><option>Dourado</option><option>Prateado</option><option>Rosé</option><option>Outro</option></select></label><label className="text-sm">Observações<textarea value={brief.notes} onChange={(e) => setBrief({ ...brief, notes: e.target.value })} className="mt-2 min-h-28 w-full rounded-2xl border bg-white p-3" placeholder="Tamanho, ocasião, preferências, o que evitar…" /></label></div><div className="mt-6 flex gap-3"><button onClick={() => setStep(1)} className="flex-1 rounded-full border p-4">Voltar</button><button onClick={() => setStep(3)} className="flex-1 rounded-full bg-stone-950 p-4 font-semibold text-white">Montar conceito</button></div></div>}
      {step === 3 && <div><h3 className="text-2xl font-black">Seu conceito visual</h3><p className="mt-2 text-sm text-stone-600">Esta prancha organiza visualmente sua intenção para a Annita e para a Ana Madú. Ela não afirma material, pedra ou viabilidade ainda não validados.</p><div className="mt-5 overflow-hidden rounded-[28px] border bg-white"><div className="grid gap-0 sm:grid-cols-2"><div className="grid min-h-72 grid-cols-2 gap-1 bg-stone-100 p-1">{brief.refs.length ? brief.refs.map((src, i) => <img key={i} src={src} alt="Referência" className="size-full min-h-32 object-cover" />) : <div className="col-span-2 flex items-center justify-center text-stone-400"><Gem className="size-16" /></div>}</div><div className="p-6"><div className="text-xs uppercase tracking-[.2em] text-stone-500">Conceito Ourives</div><h4 className="mt-2 text-3xl font-black">{brief.piece} · {brief.style}</h4><dl className="mt-6 space-y-3 text-sm"><div><dt className="text-stone-500">Pedra/referência</dt><dd className="font-semibold">{brief.stone || 'A definir com Annita'}</dd></div><div><dt className="text-stone-500">Metal/acabamento</dt><dd className="font-semibold">{brief.metal}</dd></div><div><dt className="text-stone-500">Direção estética</dt><dd className="font-semibold">{brief.style}</dd></div></dl><p className="mt-6 text-sm leading-relaxed text-stone-600">{brief.notes || 'Sem observações adicionais.'}</p></div></div></div><label className="mt-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm"><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="mt-1" /><span><strong>Aprovo esta direção conceitual</strong><span className="mt-1 block text-stone-600">A aprovação libera o envio do briefing para a Annita organizar a análise orçamentária da Ana Madú.</span></span></label><div className="mt-6 flex gap-3"><button onClick={() => setStep(2)} className="flex-1 rounded-full border p-4">Ajustar</button><button disabled={!approved} onClick={sendToAnnita} className="flex-1 rounded-full bg-stone-950 p-4 font-semibold text-white disabled:opacity-40">Enviar para análise</button></div></div>}</div></div></div></div>;
}
