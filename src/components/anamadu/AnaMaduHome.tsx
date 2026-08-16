import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Gem, Heart, Search, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react';

type CatalogItem = {
  name: string;
  price: number;
  priceLabel: string;
  url: string;
  image?: string;
  status: 'available' | 'sold_out' | 'unknown';
};

type CatalogResponse = {
  source: string;
  syncedAt: string;
  count: number;
  items: CatalogItem[];
};

function track(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const dataLayer = (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [];
  dataLayer.push({ event, brand: 'ana_madu', ...payload });
  (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer = dataLayer;
}

function captureAttribution() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const attribution = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    gclid: params.get('gclid'),
    fbclid: params.get('fbclid'),
    referrer: document.referrer || null,
    landing_page: window.location.pathname,
  };
  if (Object.values(attribution).some(Boolean)) localStorage.setItem('anamadu.attribution.v1', JSON.stringify(attribution));
  track('anamadu_page_view', attribution);
}

export function AnaMaduHome() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'todos' | 'ate50' | '50a100' | 'acima100'>('todos');
  const [syncLabel, setSyncLabel] = useState('Consultando catálogo real…');

  useEffect(() => {
    captureAttribution();
    fetch('/api/anamadu/catalog')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('catalog_unavailable')))
      .then((data: CatalogResponse) => {
        if (!data.items?.length) throw new Error('catalog_empty');
        setCatalog(data.items);
        setCatalogState('ready');
        setSyncLabel(`${data.count} peças sincronizadas`);
        track('anamadu_catalog_loaded', { item_count: data.count, source: data.source });
      })
      .catch(() => {
        setCatalog([]);
        setCatalogState('unavailable');
        setSyncLabel('Catálogo temporariamente indisponível');
        track('anamadu_catalog_unavailable');
      });
  }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return catalog.filter((item) => {
      const matchesText = !normalized || item.name.toLocaleLowerCase('pt-BR').includes(normalized);
      const matchesPrice = filter === 'todos' || (filter === 'ate50' && item.price <= 50) || (filter === '50a100' && item.price > 50 && item.price <= 100) || (filter === 'acima100' && item.price > 100);
      return matchesText && matchesPrice;
    });
  }, [catalog, query, filter]);

  function openItem(item: CatalogItem) {
    track('anamadu_product_click', { item_name: item.name, price: item.price, destination: item.url });
    window.open(item.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] text-stone-950">
      <section className="relative isolate overflow-hidden border-b border-stone-200 bg-[#efe7d8]">
        <div className="absolute -left-32 top-4 size-80 rounded-full bg-rose-200/35 blur-3xl" />
        <div className="absolute right-0 top-10 size-96 rounded-full bg-amber-200/40 blur-3xl" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <a href="/anamadu" className="text-xl font-black tracking-[0.2em]">ANA MADÚ</a>
          <div className="hidden items-center gap-7 text-sm md:flex">
            <a href="#catalogo" className="hover:opacity-60">Peças</a>
            <a href="#ourives" className="hover:opacity-60">Ourives</a>
            <a href="#historia" className="hover:opacity-60">A marca</a>
            <a href="https://www.instagram.com/anamadu_acessorios" target="_blank" rel="noreferrer" className="hover:opacity-60">Instagram</a>
          </div>
          <button type="button" onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white">Explorar peças</button>
        </nav>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/60 px-3 py-1 text-xs font-medium"><Sparkles className="size-3.5" /> Pedras naturais · peças autorais · curadoria</div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-8xl">Peças com presença. Pedras com história.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-stone-700">Uma experiência de compra mais inteligente para descobrir acessórios com pedras naturais, explorar coleções e criar projetos exclusivos com atendimento consultivo.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 font-semibold text-white">Ver catálogo <ArrowRight className="size-4" /></button>
              <button onClick={() => document.getElementById('ourives')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full border border-stone-400 bg-white/50 px-6 py-3 font-semibold">Conhecer Ourives</button>
            </div>
          </div>

          <div className="grid content-end gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[32px] border border-white/60 bg-white/55 p-6 backdrop-blur"><Gem className="mb-8 size-9" /><div className="text-xs uppercase tracking-[0.22em] text-stone-500">Tradicional</div><h2 className="mt-2 text-2xl font-bold">Descubra sua próxima peça</h2><p className="mt-2 text-sm leading-relaxed text-stone-600">Coleções, pedras, presentes e achados autorais disponíveis no catálogo real.</p></div>
            <div id="ourives" className="rounded-[32px] bg-stone-950 p-6 text-white"><WandSparkles className="mb-8 size-9 text-amber-200" /><div className="text-xs uppercase tracking-[0.22em] text-stone-400">Ourives</div><h2 className="mt-2 text-2xl font-bold">Uma joia começa pela conversa</h2><p className="mt-2 text-sm leading-relaxed text-stone-300">Curadoria de pedras, briefing assistido pela Annita e projeto sob medida com atendimento consultivo.</p><button onClick={() => track('anamadu_ourives_interest')} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">Iniciar projeto <ArrowRight className="size-4" /></button></div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{syncLabel}</div><h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Encontre a peça certa</h2><p className="mt-3 max-w-xl text-stone-600">Busque por nome e faixa de preço. Preço e disponibilidade só são exibidos quando retornados pela fonte operacional consultada.</p></div>
          {catalogState === 'ready' && <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-3"><Search className="size-4 text-stone-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar peça..." className="w-56 bg-transparent text-sm outline-none" /></label>
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none"><option value="todos">Todos os preços</option><option value="ate50">Até R$ 50</option><option value="50a100">R$ 50 a R$ 100</option><option value="acima100">Acima de R$ 100</option></select>
          </div>}
        </div>

        {catalogState === 'loading' && <div className="mt-10 rounded-3xl border border-stone-200 bg-white p-10 text-center text-stone-600">Consultando o catálogo oficial…</div>}
        {catalogState === 'unavailable' && <div className="mt-10 rounded-3xl border border-amber-300 bg-amber-50 p-10 text-center text-stone-700"><strong className="block text-stone-950">Não vamos mostrar dados desatualizados.</strong><span className="mt-2 block">O catálogo operacional não respondeu agora. Fale com a Annita ou acesse a loja atual para consultar produtos e condições vigentes.</span><div className="mt-5 flex flex-wrap justify-center gap-3"><a href="https://www.anamadu.com.br/" target="_blank" rel="noreferrer" className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white">Acessar loja atual</a><button type="button" onClick={() => track('anamadu_catalog_unavailable_annita_intent')} className="rounded-full border border-stone-400 px-5 py-2.5 text-sm font-semibold">Falar com Annita</button></div></div>}

        {catalogState === 'ready' && <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.slice(0, 60).map((item) => (
            <article key={item.url + item.name} className="group overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <button type="button" onClick={() => openItem(item)} className="block w-full text-left">
                <div className="relative aspect-[4/4.4] overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#f1d8ca,transparent_38%),radial-gradient(circle_at_70%_70%,#d8c9b8,transparent_42%),#ece3d7]">
                  {item.image ? <img src={item.image} alt={item.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex size-full items-center justify-center"><Gem className="size-14 text-stone-500/60" /></div>}
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2"><Heart className="size-4" /></div>
                  {item.status === 'sold_out' && <div className="absolute left-3 top-3 rounded-full bg-stone-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Esgotado</div>}
                  {item.status === 'unknown' && <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-700">Disponibilidade a confirmar</div>}
                </div>
                <div className="p-5"><h3 className="min-h-12 font-semibold leading-snug">{item.name}</h3><div className="mt-3 flex items-end justify-between gap-3"><strong className="text-lg">{item.priceLabel}</strong><span className="inline-flex items-center gap-1 text-xs font-semibold">Ver peça <ArrowRight className="size-3.5" /></span></div></div>
              </button>
            </article>
          ))}
        </div>}
        {catalogState === 'ready' && !visible.length && <div className="mt-10 rounded-3xl border border-dashed border-stone-300 p-10 text-center text-stone-600">Nenhuma peça encontrada com esses filtros. Experimente outro termo ou peça ajuda à Annita.</div>}
        {catalogState === 'ready' && catalog.length > 60 && <div className="mt-8 text-center text-xs text-stone-500">Mostrando 60 de {catalog.length} itens sincronizados nesta visualização.</div>}
      </section>

      <section id="historia" className="bg-stone-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2"><div className="text-xs uppercase tracking-[0.22em] text-amber-200">Ana Madú</div><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Artesanal no toque. Inteligente na experiência.</h2><p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-300">A nova experiência une a identidade autoral da marca a um atendimento digital capaz de entender contexto, origem da campanha e intenção de compra sem transformar a jornada em um formulário frio.</p></div>
          <div className="space-y-3"><div className="rounded-3xl border border-white/10 p-5"><ShieldCheck className="mb-4 size-5 text-amber-200" /><strong className="block">Informação responsável</strong><p className="mt-2 text-sm leading-relaxed text-stone-400">Sem inventar procedência, propriedades, autenticidade, preço ou disponibilidade.</p></div><div className="rounded-3xl border border-white/10 p-5"><Sparkles className="mb-4 size-5 text-amber-200" /><strong className="block">Annita acompanha a jornada</strong><p className="mt-2 text-sm leading-relaxed text-stone-400">Descoberta, presente, catálogo, Ourives, pós-venda e continuidade entre canais.</p></div></div>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-[#f8f4ec]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><strong className="text-stone-950">ANA MADÚ</strong><span className="ml-3">Pedras naturais e peças autorais</span></div><div className="flex flex-wrap gap-4"><a href="https://www.anamadu.com.br/" target="_blank" rel="noreferrer">Loja atual</a><a href="https://www.instagram.com/anamadu_acessorios" target="_blank" rel="noreferrer">Instagram</a><a href="https://wa.me/5521966315945" target="_blank" rel="noreferrer">WhatsApp</a></div></div>
      </footer>
    </main>
  );
}