import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CheckCircle2, Headphones, ShieldCheck, Sparkles, TicketCheck, Users } from "lucide-react";
import { COLORS_PRODUCTS } from "@/data/colors-products";
import { colorsEvents, ensureGaInstalled } from "@/lib/colors-analytics";
import { useColorsUtmHydration } from "@/lib/colors-utm-hydrate";
import AntiFakePopup from "@/components/colors/AntiFakePopup";
import ComprarOriginalFab from "@/components/colors/ComprarOriginalFab";
import { ColorsMark } from "@/components/brand/BrandMarks";
import { useEffect } from "react";

const COLORS_PUBLIC_ORIGIN="https://colorssaude.impulsionando.com.br";

export const Route = createFileRoute("/colors/")({
  head: () => ({
    meta: [
      { title: "Colors Saúde — Produtos oficiais, Íris, suporte, afiliados e eventos" },
      { name: "description", content: "Colors Saúde: produtos oficiais, Super Green Black, atendimento inteligente com a Íris, suporte com protocolo, agenda, afiliados, eventos e rastreabilidade de jornada." },
      { name: "keywords", content: "Colors Saúde, Super Green Black, produtos Colors Saúde, afiliados Colors Saúde, eventos Colors Saúde, atendimento Colors Saúde, Íris" },
      { property: "og:title", content: "Colors Saúde — Uma marca. Uma jornada. Íris com você." },
      { property: "og:description", content: "Conheça os produtos oficiais da Colors Saúde, fale com a Íris, agende uma conversa, participe de eventos e acesse suporte com protocolo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${COLORS_PUBLIC_ORIGIN}/` },
      { property: "og:site_name", content: "Colors Saúde" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Colors Saúde" },
      { name: "twitter:description", content: "Produtos oficiais, Íris, suporte, agenda, afiliados e eventos." },
    ],
    links: [{ rel: "canonical", href: `${COLORS_PUBLIC_ORIGIN}/` }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({
      "@context":"https://schema.org", "@type":"Organization", name:"Colors Saúde", url:`${COLORS_PUBLIC_ORIGIN}/`,
      description:"Ecossistema comercial e de relacionamento da Colors Saúde.",
      sameAs:["https://www.instagram.com/colorssaude/","https://www.youtube.com/@colorssaude","https://www.tiktok.com/@colorssaude"]
    }) }],
  }),
  component: ColorsHome,
});

export function ColorsHome(){
  useColorsUtmHydration("colors_home_unificada");
  useEffect(()=>{ensureGaInstalled();},[]);
  const sgb=COLORS_PRODUCTS.find(p=>p.slug==="super-green-black");
  const products=COLORS_PRODUCTS.filter(p=>p.slug!=="super-green-black");
  return <div className="min-h-screen bg-[#06100c] text-white">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06100c]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4"><a href="#top" className="flex items-center gap-2 font-black"><ColorsMark size={36} /><span>Colors Saúde</span></a><nav className="hidden items-center gap-5 text-sm text-white/90 lg:flex"><a href="#produtos">Produtos</a><a href="#iris">Íris</a><Link to="/colors/eventos">Eventos</Link><Link to="/colors/agenda">Agendar call</Link><Link to="/colors/suporte">Suporte</Link></nav><Link to="/colors/super-green-black" onClick={()=>colorsEvents.ctaClick("top_sgb","super-green-black")} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-black">Comprar original</Link></div></header>
    <main id="top">
      <section className="relative overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_30%_0%,rgba(16,185,129,.28),transparent_58%),radial-gradient(800px_circle_at_80%_30%,rgba(132,204,22,.12),transparent_55%)]"/><div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-28"><div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[.18em] text-emerald-300"><Sparkles className="h-4 w-4"/>Original Colors Saúde</span><h1 className="mt-6 text-5xl font-black leading-[1.03] sm:text-7xl">Super Green Black no centro de uma experiência Colors Saúde muito maior.</h1><p className="mt-6 max-w-2xl text-lg text-white/90">Produtos oficiais, compra segura, atendimento inteligente, rastreio, agenda, eventos, afiliados e suporte. A Íris conecta toda a jornada para você não precisar começar do zero a cada contato.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/colors/super-green-black" onClick={()=>colorsEvents.ctaClick("hero_sgb","super-green-black")} className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-7 py-3.5 font-black text-black shadow-xl shadow-emerald-500/20">Conhecer o Super Green Black <ArrowRight className="h-4 w-4"/></Link><Link to="/colors/agenda" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-bold"><CalendarDays className="h-4 w-4"/>Agendar uma conversa</Link></div><div className="mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3"><Stat n="60 mil+" l="clientes"/><Stat n="50 mil+" l="afiliados do SGB"/><Stat n="6 anos" l="de trajetória"/></div></div><div className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 to-white/[.03] p-8"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">Produto protagonista</p><h2 className="mt-3 text-4xl font-black">{sgb?.name??"Super Green Black"}</h2><p className="mt-4 text-white/90">O produto mais reconhecido da Colors Saúde e porta de entrada de milhares de clientes e afiliados. Compre somente por canais oficiais e desconfie de falsificações ou ofertas fora da rede autorizada.</p><div className="mt-6 space-y-3"><Trust text="Compra pelos canais oficiais da Colors Saúde"/><Trust text="Pré-checkout rastreável e atribuição de origem"/><Trust text="Atendimento e pós-venda conectados à Íris"/><Trust text="Suporte com protocolo quando necessário"/></div><Link to="/colors/super-green-black" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-emerald-300">Ver página oficial no ecossistema <ArrowRight className="h-4 w-4"/></Link></div></div></section>

      <section id="iris" className="border-y border-white/10 bg-white/[.025]"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 lg:grid-cols-2 lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.25em] text-emerald-400">Íris · cérebro vivo Colors Saúde</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">Ela não foi criada para “responder chat”. Foi criada para resolver e vender melhor.</h2><p className="mt-5 text-white/85">A Íris reconhece a jornada, consulta contexto antes de responder, preserva atribuição de afiliado, entende intenção, acompanha checkout, pedido e suporte e sabe quando uma pessoa realmente precisa de atendimento humano ou avaliação médica independente.</p></div><div className="grid gap-3 sm:grid-cols-2"><Feature title="Conhece a origem" text="UTMs, campanha, canal, afiliado e histórico de relacionamento."/><Feature title="Continua a conversa" text="Omnichannel e memória operacional para reduzir repetição e atrito."/><Feature title="Venda com responsabilidade" text="CTA forte sem inventar desconto, política, composição ou orientação clínica."/><Feature title="Zero ticket sempre que possível" text="Primeiro consulta pedido, pagamento, rastreio e base; ticket só quando precisa."/></div></div></section>

      <section id="produtos" className="mx-auto max-w-7xl px-4 py-20"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.25em] text-emerald-400">Portfólio unificado</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">Uma Colors Saúde. Um portfólio. Uma jornada.</h2><p className="mt-4 text-white/85">O cliente escolhe pelo que precisa. Informações de composição e modo de uso devem sempre vir da fonte oficial aprovada da Colors Saúde.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map(p=><article key={p.slug} className="flex flex-col rounded-3xl border border-white/10 bg-white/[.035] p-6"><span className="text-3xl">{p.emoji}</span><h3 className="mt-4 text-2xl font-black">{p.name}</h3><p className="mt-2 text-sm text-white/85">Produto original Colors Saúde. Consulte detalhes, disponibilidade e orientações exclusivamente nos canais oficiais.</p><Link to="/colors/produto/$slug" params={{slug:p.slug}} onClick={()=>colorsEvents.ctaClick("catalog_product",p.slug)} className="mt-6 inline-flex items-center gap-1.5 text-sm font-black text-emerald-300">Conhecer produto <ArrowRight className="h-4 w-4"/></Link></article>)}</div></section>

      <section className="border-y border-white/10 bg-emerald-400 text-black"><div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4"><Journey icon={CalendarDays} title="Agendar uma call" text="Cliente, lead, afiliado ou parceiro." to="/colors/agenda"/><Journey icon={Users} title="Eventos Colors Saúde" text="Agenda e inscrições gratuitas." to="/colors/eventos"/><Journey icon={Headphones} title="Suporte" text="Atendimento com protocolo e contexto." to="/colors/suporte"/><Journey icon={TicketCheck} title="Rastrear pedido" text="Acompanhe sua compra pela Colors Saúde." to="/colors/rastreio"/></div></section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 lg:grid-cols-2"><div className="rounded-3xl border border-red-400/20 bg-red-500/[.06] p-8"><ShieldCheck className="h-10 w-10 text-red-300"/><h2 className="mt-4 text-3xl font-black">Original Colors Saúde. Cuidado com falsificações.</h2><p className="mt-3 text-white/85">Não confie apenas em embalagem, anúncio ou preço. Use os canais oficiais da Colors Saúde e os links apresentados dentro desta experiência. A Íris deve orientar o cliente sem validar autenticidade de um item que não possa ser tecnicamente confirmado.</p></div><div className="rounded-3xl border border-white/10 bg-white/[.035] p-8"><h2 className="text-3xl font-black">Afiliados fazem parte do negócio, não de uma página esquecida.</h2><p className="mt-3 text-white/85">A jornada do afiliado preserva origem, plataforma e atribuição, oferece materiais oficiais e permite agendar uma call com gerente de afiliados. A Íris nunca inventa comissão ou promete renda.</p><Link to="/colors/agenda" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-black">Sou afiliado: agendar call</Link></div></section>
    </main>
    <footer className="border-t border-white/10 px-4 py-10 text-center text-sm text-white/80">Colors Saúde · Produtos oficiais · Atendimento inteligente · Privacidade e rastreabilidade</footer>
    <ComprarOriginalFab source="home_unificada"/><AntiFakePopup/>
  </div>
}
function Stat({n,l}:{n:string;l:string}){return <div><div className="text-3xl font-black">{n}</div><div className="mt-1 text-xs uppercase tracking-wider text-white/80">{l}</div></div>}
function Trust({text}:{text:string}){return <div className="flex items-start gap-2 text-sm text-white/90"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"/>{text}</div>}
function Feature({title,text}:{title:string;text:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><h3 className="font-black">{title}</h3><p className="mt-2 text-sm text-white/85">{text}</p></div>}
function Journey({icon:Icon,title,text,to}:{icon:any;title:string;text:string;to:string}){return <Link to={to as any} className="rounded-2xl bg-black/10 p-5 transition hover:bg-black/15"><Icon className="h-6 w-6"/><h3 className="mt-3 font-black">{title}</h3><p className="mt-1 text-sm text-black/80">{text}</p></Link>}
