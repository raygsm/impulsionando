import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, Building2, ChartNoAxesCombined, Landmark, Newspaper, Radar, ShieldCheck, Sparkles, TrendingUp, Waves } from "lucide-react";

export const Route = createFileRoute("/csi/")({
  head: () => ({
    meta: [
      { title: "CSI Invest — Inteligência, patrimônio e mercado" },
      { name: "description", content: "Portal CSI Invest para investidores qualificados: inteligência de mercado, patrimônio, indicadores, notícias, alertas e acompanhamento em ambiente privado." },
      { property: "og:title", content: "CSI Invest — Mercado, patrimônio e inteligência" },
      { property: "og:description", content: "Uma experiência premium para acompanhar mercado, oportunidades, patrimônio, notícias e sinais relevantes com contexto e responsabilidade." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://csi.impulsionando.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://csi.impulsionando.com.br/" }],
  }),
  component: CsiHome,
});

const rioSignals = [
  { value: "R$ 17,2 bi", label: "impacto estimado do turismo no Rio no 1º semestre de 2026", note: "Prefeitura do Rio · 28/07/2026" },
  { value: "6,4 mi", label: "visitantes no primeiro semestre de 2026", note: "20% internacionais · Prefeitura do Rio" },
  { value: "R$ 12,2 bi", label: "impacto do turismo entre janeiro e abril de 2026", note: "+3,2% versus o mesmo período de 2025" },
];

const intelligence = [
  { icon: TrendingUp, title: "Mercados", text: "Índices, juros, câmbio, inflação, commodities e ativos acompanhados com contexto — não apenas números soltos." },
  { icon: Building2, title: "Patrimônio", text: "Leitura de ativos reais, imobiliário, infraestrutura, turismo, hospitalidade e oportunidades conectadas à economia do Rio." },
  { icon: Newspaper, title: "CSI Radar", text: "Notícias filtradas por relevância patrimonial, risco, impacto setorial e potencial de oportunidade." },
  { icon: BellRing, title: "Alertas inteligentes", text: "Avisos configuráveis para eventos de mercado, vencimentos, documentos, mudanças de cenário e fatos relevantes." },
];

function CsiHome() {
  return (
    <main className="min-h-screen bg-[#07111b] text-white selection:bg-amber-300 selection:text-slate-950">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(217,168,72,.20),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(27,91,120,.30),transparent_32%),linear-gradient(135deg,#07111b_0%,#0a1b29_55%,#061019_100%)]" />
        <div className="absolute inset-0 opacity-[.06] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 md:py-28 lg:py-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5" /> CSI Intelligence Experience
            </div>
            <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl font-semibold leading-[.98] tracking-[-.04em]">Para quem vê o mercado como <span className="text-amber-300">patrimônio, informação e experiência.</span></h1>
            <p className="mt-7 max-w-2xl text-lg md:text-xl leading-relaxed text-slate-300">A CSI transforma acompanhamento financeiro em uma experiência de alto nível: mercado, ativos reais, Rio de Janeiro, inteligência patrimonial, notícias e relacionamento privado em um único ambiente.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/csi/portal" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200">Acessar área do investidor <ArrowRight className="h-4 w-4" /></Link><a href="#radar-rio" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Explorar CSI Radar <Radar className="h-4 w-4" /></a></div>
            <p className="mt-5 max-w-2xl text-xs leading-relaxed text-slate-500">Conteúdo informativo. Não constitui recomendação de investimento, promessa de rentabilidade ou oferta pública. Produtos e operações sujeitos a elegibilidade, documentação, suitability e regras aplicáveis.</p>
          </div>
          <div className="lg:col-span-5"><div className="rounded-[28px] border border-white/10 bg-white/[.055] p-5 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-xs uppercase tracking-[.16em] text-slate-500">CSI Pulse</p><p className="mt-1 text-lg font-semibold">Painel de inteligência</p></div><span className="inline-flex items-center gap-2 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" /> monitoramento</span></div><div className="grid grid-cols-2 gap-3 py-5">{["Macro & juros","Ativos reais","Risco & segurança","Rio & economia"].map((x) => <div key={x} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300"><ChartNoAxesCombined className="mb-3 h-5 w-5 text-amber-300" />{x}</div>)}</div><div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.07] p-4"><p className="text-xs uppercase tracking-[.16em] text-amber-200">Princípio CSI</p><p className="mt-2 text-sm leading-relaxed text-slate-300">Mais informação, mais contexto e mais rastreabilidade. Dados em tempo real só são exibidos quando provenientes de fonte integrada e validada.</p></div></div></div>
        </div>
      </section>

      <section id="radar-rio" className="mx-auto max-w-7xl px-5 py-16 md:py-20"><div className="grid lg:grid-cols-12 gap-8 items-end"><div className="lg:col-span-7"><div className="flex items-center gap-2 text-amber-300"><Waves className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[.2em]">Rio como ativo econômico</span></div><h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight">Turismo, entretenimento, patrimônio e capital se encontram na mesma cidade.</h2></div><div className="lg:col-span-5 text-slate-400 leading-relaxed">A narrativa CSI parte de fatos: o Rio registrou forte atividade turística em 2026 e recebeu historicamente classificação brAAA em escala nacional. O portal separa rigorosamente dado atual, referência histórica e opinião editorial.</div></div><div className="mt-10 grid md:grid-cols-3 gap-4">{rioSignals.map((item) => <article key={item.value} className="rounded-3xl border border-white/10 bg-white/[.04] p-6"><div className="text-3xl font-semibold text-amber-300">{item.value}</div><p className="mt-2 text-sm leading-relaxed text-slate-300">{item.label}</p><p className="mt-4 text-xs text-slate-600">{item.note}</p></article>)}</div><div className="mt-5 rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4 text-xs leading-relaxed text-slate-500">Rating histórico, não atual: a S&amp;P atribuiu à Cidade do Rio de Janeiro BBB na escala global e brAAA na escala nacional em maio de 2012. A nota brAAA também foi atribuída ao Estado do Rio em período histórico. O portal não apresenta essas classificações como ratings vigentes sem confirmação atual da agência.</div></section>

      <section className="border-y border-white/10 bg-white/[.025]"><div className="mx-auto max-w-7xl px-5 py-16 md:py-20"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Financial entertainment, sem perder seriedade</p><h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">Um portal que dá vontade de acompanhar.</h2><p className="mt-4 text-slate-400 text-lg">A lógica é transformar informação financeira em hábito: leitura rápida, profundidade quando desejada, alertas relevantes e visualização patrimonial sem gamificar risco.</p></div><div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">{intelligence.map(({icon: Icon,title,text}) => <article key={title} className="rounded-3xl border border-white/10 bg-[#0b1824] p-6 transition hover:-translate-y-1 hover:border-amber-300/30"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:py-20 grid lg:grid-cols-2 gap-6"><div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-[#102231] to-[#08131d] p-8 md:p-10"><ShieldCheck className="h-8 w-8 text-amber-300"/><h2 className="mt-6 text-3xl font-semibold">Tecnologia como parte da confiança.</h2><p className="mt-4 text-slate-400 leading-relaxed">Área privada, trilha de auditoria, alertas, documentos, perfil de risco, origem dos dados e segregação de acesso. O investidor deve saber o que está vendo, de onde veio e quando foi atualizado.</p></div><div className="rounded-[30px] border border-amber-300/20 bg-amber-300 p-8 md:p-10 text-slate-950"><Landmark className="h-8 w-8"/><h2 className="mt-6 text-3xl font-semibold">High ticket exige conversa de alto nível.</h2><p className="mt-4 text-slate-800 leading-relaxed">O CTA não empurra produto: abre uma jornada qualificada, coleta objetivo, horizonte, liquidez, perfil e contexto patrimonial antes de qualquer encaminhamento comercial.</p><Link to="/csi/portal" className="mt-7 inline-flex items-center gap-2 font-semibold">Entrar na experiência CSI <ArrowRight className="h-4 w-4"/></Link></div></section>
    </main>
  );
}
