import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Gem, ImagePlus, Menu, Search, ShoppingCart, Trash2, WandSparkles, X } from 'lucide-react';

type CatalogItem = { id:string; name:string; price:number; priceLabel:string; image?:string; status:'available'|'sold_out'|'unknown'; category?:string; description?:string };
type ProductDetail = CatalogItem;
type CartItem = CatalogItem & { qty:number };
type OurivesBrief = { piece:string; metal:string; style:string; stone:string; notes:string; refs:string[] };
type CheckoutData = { name:string; email:string; phone:string };

const CART_KEY='anamadu.cart.v2';
const LOGO='https://acdn-us.mitiendanube.com/stores/002/084/059/themes/common/logo-639668539-1695137829-8706d864784df755e32ada619f5a55711695137829-480-0.webp';
const BRAND_RED='#c5382b';
const BRAND_RED_DARK='#a92e25';
const CATEGORIES=['COLARES','BRINCOS','ÁNEIS','PULSEIRAS','TORNOZELEIRAS','JAPAMALA','PEDRAS PARA AMBIENTE','COLEÇÃO CHAKRAS','COLARES ÚNICOS','COLEÇÃO COLOURS','COLEÇÃO ESCAPULÁRIOS','COLEÇÃO GLOBOS','COLEÇÃO HEMATITA','PROMOÇÃO','ÁGUA MARINHA'];

function money(v:number){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function readCart():CartItem[]{if(typeof window==='undefined')return[];try{return JSON.parse(localStorage.getItem(CART_KEY)??'[]');}catch{return[];}}
function attribution(){if(typeof window==='undefined')return{};try{return JSON.parse(localStorage.getItem('anamadu.attribution.v1')??'{}');}catch{return{};}}
function track(event:string,payload:Record<string,unknown>={}){if(typeof window==='undefined')return;const w=window as Window & {dataLayer?:Record<string,unknown>[]};const d=w.dataLayer??[];d.push({event,brand:'ana_madu',...payload});w.dataLayer=d;}

export function AnaMaduStorefront(){
  const[catalog,setCatalog]=useState<CatalogItem[]>([]);
  const[state,setState]=useState<'loading'|'ready'|'unavailable'>('loading');
  const[query,setQuery]=useState('');
  const[selected,setSelected]=useState<CatalogItem|null>(null);
  const[detail,setDetail]=useState<ProductDetail|null>(null);
  const[cart,setCart]=useState<CartItem[]>([]);
  const[cartOpen,setCartOpen]=useState(false);
  const[ourivesOpen,setOurivesOpen]=useState(false);
  const[menuOpen,setMenuOpen]=useState(false);
  const[checkoutOpen,setCheckoutOpen]=useState(false);
  const[checkout,setCheckout]=useState<CheckoutData>({name:'',email:'',phone:''});
  const[orderBusy,setOrderBusy]=useState(false);
  const[orderResult,setOrderResult]=useState('');

  useEffect(()=>{
    setCart(readCart());
    fetch('/api/anamadu/catalog',{headers:{accept:'application/json'}})
      .then(r=>r.ok?r.json():Promise.reject())
      .then(data=>{if(!Array.isArray(data.items)||!data.items.length)throw new Error('empty');setCatalog(data.items);setState('ready');track('anamadu_storefront_catalog_ready',{count:data.items.length,source:data.source});})
      .catch(()=>setState('unavailable'));
  },[]);
  useEffect(()=>{if(typeof window!=='undefined')localStorage.setItem(CART_KEY,JSON.stringify(cart));},[cart]);

  const visible=useMemo(()=>{const q=query.trim().toLocaleLowerCase('pt-BR');return catalog.filter(item=>!q||item.name.toLocaleLowerCase('pt-BR').includes(q)||String(item.category??'').toLocaleLowerCase('pt-BR').includes(q));},[catalog,query]);
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);const count=cart.reduce((s,i)=>s+i.qty,0);

  async function openProduct(item:CatalogItem){setSelected(item);setDetail(null);track('anamadu_product_open_internal',{product_id:item.id,item_name:item.name,price:item.price});try{const r=await fetch(`/api/anamadu/product-detail?id=${encodeURIComponent(item.id)}`);if(r.ok)setDetail(await r.json());}catch{}}
  function add(item:CatalogItem){if(item.status==='sold_out')return;setCart(c=>{const f=c.find(x=>x.id===item.id);return f?c.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x):[...c,{...item,qty:1}]});setCartOpen(true);track('anamadu_add_to_cart',{product_id:item.id,item_name:item.name,price:item.price});}
  function remove(id:string){setCart(c=>c.filter(x=>x.id!==id));}

  async function createOrder(){
    if(!checkout.name.trim()||!checkout.email.trim()||!checkout.phone.trim()||!cart.length)return;
    setOrderBusy(true);setOrderResult('');
    try{
      const r=await fetch('/api/anamadu/order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({customer:checkout,items:cart.map(i=>({id:i.id,qty:i.qty})),attribution:attribution()})});
      const data=await r.json();
      if(!r.ok)throw new Error(data?.error||'Falha ao criar pedido');
      setOrderResult(`Pedido ${data.order.order_number} criado com sucesso. A Annita acompanhará a próxima etapa.`);
      track('anamadu_order_created',{order_number:data.order.order_number,total:data.order.total});
      setCart([]);
    }catch(error){setOrderResult(error instanceof Error?error.message:'Não foi possível criar o pedido agora.');}
    finally{setOrderBusy(false);}
  }

  return <main className="min-h-screen bg-[#fffaf8] text-[#2d2928]">
    <header className="sticky top-0 z-40 shadow-sm" style={{backgroundColor:BRAND_RED}}>
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={()=>setMenuOpen(v=>!v)} aria-label="Abrir menu" className="flex size-11 items-center justify-center text-white"><Menu className="size-8"/></button>
          <button type="button" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="flex flex-1 justify-center"><img src={LOGO} alt="Ana Madú Acessórios" className="h-12 max-w-[180px] object-contain brightness-0 invert sm:h-14 sm:max-w-[220px]"/></button>
          <button type="button" onClick={()=>setCartOpen(true)} aria-label="Abrir carrinho" className="relative flex size-11 items-center justify-center text-white"><ShoppingCart className="size-8"/>{count>0&&<span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-[#f3c3c0] text-xs font-bold text-[#a42d25]">{count}</span>}</button>
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 shadow-sm"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="O que você está buscando?" className="min-w-0 flex-1 bg-transparent text-lg text-[#b6372e] outline-none placeholder:text-[#b6372e]/85"/><Search className="size-7 shrink-0" style={{color:BRAND_RED_DARK}}/></label>
      </div>
      {menuOpen&&<div className="border-t border-white/20 bg-white px-5 py-5 text-sm text-[#342c2a]"><div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4"><a href="#catalogo" onClick={()=>setMenuOpen(false)} className="font-semibold">INÍCIO / PRODUTOS</a>{CATEGORIES.map(c=><button key={c} onClick={()=>{setQuery(c);setMenuOpen(false);document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'});}} className="text-left">{c}</button>)}<button onClick={()=>{setOurivesOpen(true);setMenuOpen(false)}} className="text-left font-semibold" style={{color:BRAND_RED}}>OURIVES</button></div></div>}
    </header>

    <section className="border-b border-[#eadfdb] bg-[#fcf7f5]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-16"><div className="flex flex-col justify-center"><div className="mb-4 text-xs font-semibold uppercase tracking-[.24em]" style={{color:BRAND_RED}}>Pedras naturais · peças autorais · feitas à mão</div><h1 className="max-w-3xl text-4xl font-light leading-[1.04] tracking-[-.035em] sm:text-5xl lg:text-6xl">Ana Madú, agora com loja própria e inteligência da Annita.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#6d625f]">Catálogo, detalhes, carrinho, pedidos e projetos Ourives funcionam dentro do ecossistema Ana Madú. A loja antiga não é destino da jornada.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#catalogo" className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white" style={{backgroundColor:BRAND_RED}}>Ver produtos <ArrowRight className="size-4"/></a><button onClick={()=>setOurivesOpen(true)} className="rounded-full border-2 px-6 py-3 font-semibold" style={{borderColor:BRAND_RED,color:BRAND_RED}}>Criar com Ourives</button></div></div><button onClick={()=>setOurivesOpen(true)} className="rounded-3xl p-8 text-left text-white" style={{backgroundColor:BRAND_RED}}><WandSparkles className="mb-10 size-9"/><div className="text-xs uppercase tracking-[.22em] text-white/70">Ourives</div><h2 className="mt-3 text-3xl font-light">Pedras raras e projetos exclusivos com referências visuais.</h2><p className="mt-4 text-sm leading-relaxed text-white/80">A Annita estrutura o conceito, o cliente aprova e a Ana Madú segue para análise orçamentária.</p></button></div></section>

    <section id="catalogo" className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><div><div className="text-xs uppercase tracking-[.22em]" style={{color:BRAND_RED}}>{state==='ready'?`${catalog.length} produtos no catálogo próprio`:'Catálogo Ana Madú'}</div><h2 className="mt-2 text-4xl font-light">Produtos</h2><p className="mt-3 max-w-2xl text-[#746864]">Todos os detalhes são carregados do Core da Impulsionando.</p></div>
      {state==='loading'&&<div className="py-16 text-center text-[#746864]">Carregando catálogo próprio…</div>}
      {state==='unavailable'&&<div className="my-10 rounded-2xl border border-[#e7c8c3] bg-[#fff3f1] p-8 text-center">Catálogo temporariamente indisponível. A Annita pode registrar sua intenção sem inventar produto, preço ou estoque.</div>}
      {state==='ready'&&<div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map(item=><article key={item.id} className="group"><button onClick={()=>void openProduct(item)} className="block w-full text-left"><div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f5efec]">{item.image?<img src={item.image} alt={item.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.025]"/>:<div className="flex size-full items-center justify-center"><Gem className="size-11 text-[#d4c3bd]"/></div>}{item.status==='sold_out'&&<span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase">Esgotado</span>}</div><div className="pt-4"><h3 className="min-h-10 text-sm font-medium leading-snug">{item.name}</h3>{item.category&&<div className="mt-1 text-[11px] uppercase tracking-wide text-[#8a7c77]">{item.category}</div>}<div className="mt-2 font-semibold" style={{color:BRAND_RED_DARK}}>{item.priceLabel}</div><div className="mt-2 text-xs font-semibold underline">Ver detalhes</div></div></button></article>)}</div>}
    </section>

    {selected&&<div className="fixed inset-0 z-[70] bg-black/45 p-4" onMouseDown={e=>{if(e.currentTarget===e.target)setSelected(null)}}><div className="mx-auto mt-[3vh] max-h-[94vh] max-w-4xl overflow-y-auto rounded-3xl bg-white"><div className="flex items-center justify-between border-b p-5"><button onClick={()=>setSelected(null)} className="flex items-center gap-2 text-sm"><ChevronLeft className="size-4"/>Voltar</button><button onClick={()=>setSelected(null)}><X/></button></div><div className="grid gap-8 p-6 md:grid-cols-2"><div className="aspect-square overflow-hidden rounded-2xl bg-[#f5efec]">{(detail?.image||selected.image)?<img src={detail?.image||selected.image} alt={selected.name} className="size-full object-cover"/>:<div className="flex size-full items-center justify-center"><Gem className="size-16 text-[#d4c3bd]"/></div>}</div><div><div className="text-xs uppercase tracking-[.22em]" style={{color:BRAND_RED}}>Ana Madú</div><h2 className="mt-2 text-3xl font-light">{detail?.name||selected.name}</h2><strong className="mt-4 block text-xl" style={{color:BRAND_RED_DARK}}>{selected.priceLabel}</strong><p className="mt-6 whitespace-pre-line leading-relaxed text-[#6d625f]">{detail?.description||selected.description||'A descrição completa está sendo consolidada no catálogo próprio. A Annita pode ajudar sem inventar características da pedra.'}</p><button disabled={selected.status==='sold_out'} onClick={()=>add(selected)} className="mt-8 w-full rounded-full px-6 py-4 font-semibold text-white disabled:opacity-40" style={{backgroundColor:BRAND_RED}}>{selected.status==='sold_out'?'Produto esgotado':'Adicionar ao carrinho'}</button></div></div></div></div>}

    {cartOpen&&<div className="fixed inset-0 z-[80] bg-black/40" onMouseDown={e=>{if(e.currentTarget===e.target)setCartOpen(false)}}><aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white"><header className="flex items-center justify-between p-5 text-white" style={{backgroundColor:BRAND_RED}}><div><div className="text-xs uppercase tracking-[.2em] text-white/70">Carrinho</div><strong className="text-xl">{count} item(ns)</strong></div><button onClick={()=>setCartOpen(false)}><X/></button></header><div className="flex-1 space-y-3 overflow-y-auto p-5">{!cart.length&&<div className="p-8 text-center text-sm text-[#746864]">Seu carrinho está vazio.</div>}{cart.map(item=><div key={item.id} className="flex gap-3 border-b border-[#eadfdb] pb-3"><div className="size-20 overflow-hidden rounded-xl bg-[#f5efec]">{item.image&&<img src={item.image} alt="" className="size-full object-cover"/>}</div><div className="min-w-0 flex-1"><div className="text-sm font-medium">{item.name}</div><div className="mt-1 text-sm">{item.qty} × {item.priceLabel}</div></div><button onClick={()=>remove(item.id)}><Trash2 className="size-4"/></button></div>)}</div><footer className="border-t p-5"><div className="mb-4 flex justify-between"><span>Total</span><strong>{money(total)}</strong></div><button disabled={!cart.length} onClick={()=>setCheckoutOpen(true)} className="w-full rounded-full px-6 py-4 font-semibold text-white disabled:opacity-40" style={{backgroundColor:BRAND_RED}}>Continuar compra</button></footer></aside></div>}

    {checkoutOpen&&<div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/55 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.2em]" style={{color:BRAND_RED}}>Checkout Ana Madú</div><h2 className="mt-1 text-2xl font-light">Criar pedido</h2></div><button onClick={()=>setCheckoutOpen(false)}><X/></button></div><div className="mt-6 space-y-4"><CheckoutField label="Nome" value={checkout.name} onChange={v=>setCheckout(c=>({...c,name:v}))}/><CheckoutField label="E-mail" value={checkout.email} onChange={v=>setCheckout(c=>({...c,email:v}))}/><CheckoutField label="WhatsApp" value={checkout.phone} onChange={v=>setCheckout(c=>({...c,phone:v}))}/></div><div className="mt-6 flex justify-between border-t pt-4"><span>Total</span><strong>{money(total)}</strong></div><button disabled={orderBusy||!cart.length} onClick={()=>void createOrder()} className="mt-5 w-full rounded-full px-6 py-4 font-semibold text-white disabled:opacity-40" style={{backgroundColor:BRAND_RED}}>{orderBusy?'Criando pedido…':'Criar pedido'}</button>{orderResult&&<p className="mt-4 rounded-xl bg-[#fff3f1] p-4 text-sm leading-relaxed">{orderResult}</p>}<p className="mt-3 text-xs leading-relaxed text-[#746864]">O pedido é gravado no ERP da Impulsionando. O meio de pagamento só será apresentado após homologação real; nenhum pagamento é simulado.</p></div></div>}

    {ourivesOpen&&<OurivesStudio onClose={()=>setOurivesOpen(false)}/>} 
  </main>;
}

function OurivesStudio({onClose}:{onClose:()=>void}){
  const[brief,setBrief]=useState<OurivesBrief>({piece:'',metal:'',style:'',stone:'',notes:'',refs:[]});const[sending,setSending]=useState(false);const[error,setError]=useState('');
  function set<K extends keyof OurivesBrief>(key:K,value:OurivesBrief[K]){setBrief(b=>({...b,[key]:value}));setError('');}
  async function refs(files:FileList|null){if(!files)return;const next=await Promise.all(Array.from(files).slice(0,4).map(file=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);})));set('refs',[...brief.refs,...next].slice(0,6));}
  async function approve(){setSending(true);setError('');try{const r=await fetch('/api/anamadu/ourives-request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({brief,approved:true,attribution:attribution()})});if(!r.ok)throw new Error('save_failed');window.dispatchEvent(new CustomEvent('anamadu:open-annita',{detail:{type:'ourives',approved:true,brief}}));onClose();}catch{setError('Não consegui registrar o projeto agora. Tente novamente ou continue com a Annita.');}finally{setSending(false);}}
  return <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/70 p-4"><div className="mx-auto my-4 max-w-5xl overflow-hidden rounded-3xl bg-white"><header className="flex items-center justify-between p-5 text-white" style={{backgroundColor:BRAND_RED}}><div><div className="text-xs uppercase tracking-[.22em] text-white/70">Ana Madú · Ourives</div><h2 className="mt-1 text-3xl font-light">Estúdio de criação</h2></div><button onClick={onClose}><X/></button></header><div className="grid gap-8 p-6 lg:grid-cols-2"><div className="space-y-5"><p className="text-sm leading-relaxed text-[#6d625f]">Envie referências e descreva a peça. A Annita interpreta o contexto visual; a Ana Madú valida material, viabilidade e orçamento.</p><Field label="Tipo de peça" value={brief.piece} onChange={v=>set('piece',v)} placeholder="Colar, brinco, anel…"/><Field label="Pedra ou referência" value={brief.stone} onChange={v=>set('stone',v)} placeholder="Pedra desejada ou a definir"/><Field label="Estilo" value={brief.style} onChange={v=>set('style',v)} placeholder="Delicado, orgânico, marcante…"/><Field label="Metal/acabamento" value={brief.metal} onChange={v=>set('metal',v)} placeholder="Preferência visual"/><label className="block text-sm"><span className="mb-2 block font-medium">Observações</span><textarea value={brief.notes} onChange={e=>set('notes',e.target.value)} rows={4} className="w-full rounded-xl border border-[#dbc9c3] p-3 outline-none"/></label><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#c99e96] p-4 text-sm"><ImagePlus className="size-5" style={{color:BRAND_RED}}/>Adicionar imagens<input type="file" accept="image/*" multiple className="hidden" onChange={e=>void refs(e.target.files)}/></label></div><div className="rounded-2xl bg-[#fcf7f5] p-6"><div className="text-xs uppercase tracking-[.22em]" style={{color:BRAND_RED}}>Prancha do conceito</div><div className="mt-5 grid grid-cols-2 gap-2">{brief.refs.map((src,i)=><img key={i} src={src} alt={`Referência ${i+1}`} className="aspect-square size-full rounded-xl object-cover"/>)}{!brief.refs.length&&<div className="col-span-2 flex aspect-video items-center justify-center rounded-xl border border-dashed border-[#d7c4be] text-sm text-[#746864]">Referências visuais</div>}</div><button disabled={sending||(!brief.piece&&!brief.stone&&!brief.refs.length)} onClick={()=>void approve()} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 font-semibold text-white disabled:opacity-40" style={{backgroundColor:BRAND_RED}}><Check className="size-4"/>{sending?'Registrando…':'Aprovar conceito e enviar para análise'}</button>{error&&<p className="mt-3 text-sm text-red-700">{error}</p>}</div></div></div></div>;
}

function Field({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string}){return <label className="block text-sm"><span className="mb-2 block font-medium">{label}</span><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#dbc9c3] p-3 outline-none"/></label>}
function CheckoutField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="block text-sm"><span className="mb-2 block font-medium">{label}</span><input value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-[#dbc9c3] p-3 outline-none"/></label>}
