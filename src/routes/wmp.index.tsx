import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Music2, Lightbulb, Mic2, Calendar, Handshake, ArrowRight, ShieldCheck, Headphones, Zap, Check, HelpCircle } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_PACOTES, WMP_FAQ, WMP_CERTIFICACOES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/")({
  head: () => ({
    meta: [
      { title: "WMP — Wagner Miller Produções" },
      { name: "description", content: "Produção de eventos com briefing estruturado, som, iluminação, vídeo, DJs, equipamentos, logística e acompanhamento pelo Milito." },
      { property: "og:title", content: "WMP — Wagner Miller Produções" },
      { property: "og:description", content: "Produção técnica e comercial sob medida, do briefing à proposta." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "WMP" },
      { property: "og:url", content: "https://wmp.impulsionando.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://wmp.impulsionando.com.br/" }],
  }),
  component: WmpHome,
});

function WmpHome() {
  return (
    <WmpShell>
      <section className="wmp-stage-bg">
        <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-20 text-center">
          <span className="wmp-chip mb-6"><Sparkles className="size-3" /> Produção pensada para cada evento</span>
          <h1 className="wmp-display mx-auto mb-6 max-w-4xl text-5xl leading-[1.05] md:text-7xl">Estrutura que <span style={{ color: "var(--wmp-gold)" }}>funciona</span>.<br />Experiência que <span style={{ color: "var(--wmp-violet-glow)" }}>marca</span>.</h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg opacity-80 md:text-xl">A WMP organiza som, iluminação, vídeo, DJs, equipamentos, equipe e logística a partir de um briefing objetivo. O Milito acompanha a jornada comercial e operacional.</p>
          <div className="flex flex-wrap items-center justify-center gap-3"><Link to="/wmp/orcamento" className="wmp-cta"><Sparkles className="size-4" /> Solicitar proposta</Link><Link to="/wmp/onde-estou" className="wmp-cta wmp-cta-outline"><Calendar className="size-4" /> Onde estou</Link><Link to="/wmp/parceiro" className="wmp-cta wmp-cta-outline"><Handshake className="size-4" /> Seja parceiro WMP</Link></div>
        </div>
      </section>

      <section id="servicos" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center"><span className="wmp-chip mb-3"><Music2 className="size-3" /> Estrutura sob medida</span><h2 className="wmp-display text-3xl md:text-4xl">Cada evento recebe o que realmente precisa</h2></div>
        <div className="grid gap-6 md:grid-cols-3">
          <ServiceCard icon={Headphones} title="Som" desc="PA, monitores, microfones, mesas e operação dimensionados conforme o evento." />
          <ServiceCard icon={Lightbulb} title="Iluminação" desc="Iluminação cênica e recursos adicionais definidos conforme briefing e disponibilidade." />
          <ServiceCard icon={Mic2} title="Vídeo, palco e adicionais" desc="Telas, projetores, estruturas, backline e outros itens podem integrar o escopo." />
          <ServiceCard icon={Zap} title="Briefing técnico" desc="Local, ambiente, público, horários e necessidades especiais orientam a operação." />
          <ServiceCard icon={ShieldCheck} title="Escopo documentado" desc="Serviços, equipamentos, mão de obra e logística ficam discriminados antes da execução." />
          <ServiceCard icon={Calendar} title="Agenda e operação" desc="Agenda, DJs, parceiros, equipamentos, propostas e histórico operacional ficam organizados no ecossistema WMP." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center"><span className="wmp-chip mb-3"><Sparkles className="size-3" /> Formatos de contratação</span><h2 className="wmp-display mb-2 text-3xl md:text-4xl">Escopo claro antes da formalização</h2><p className="opacity-70">Preço, equipamentos e equipe são definidos na proposta real do evento.</p></div>
        <div className="grid gap-6 md:grid-cols-3">{WMP_PACOTES.map((p) => <div key={p.slug} className="wmp-surface flex flex-col p-7"><h3 className="wmp-display mb-1 text-xl">{p.nome}</h3><p className="mb-3 text-xs opacity-70">{p.publico}</p><div className="mb-4"><span className="wmp-display text-2xl" style={{ color: "var(--wmp-gold)" }}>{p.preco_a_partir}</span></div><ul className="mb-5 flex-1 space-y-1.5">{p.bullets.map((b) => <li key={b} className="flex items-start gap-2 text-xs opacity-85"><Check className="mt-0.5 size-3.5 shrink-0" style={{ color: "var(--wmp-gold)" }} /><span>{b}</span></li>)}</ul><Link to="/wmp/orcamento" className="wmp-cta wmp-cta-outline text-sm">Solicitar proposta <ArrowRight className="size-3.5" /></Link></div>)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center"><span className="wmp-chip mb-3"><ShieldCheck className="size-3" /> Processo operacional</span><h2 className="wmp-display text-3xl md:text-4xl">Controle antes de promessa</h2></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{WMP_CERTIFICACOES.map((c) => <div key={c.titulo} className="wmp-surface p-5"><ShieldCheck className="mb-3 size-6" style={{ color: "var(--wmp-gold)" }} /><h3 className="wmp-display mb-1 text-base">{c.titulo}</h3><p className="text-xs leading-relaxed opacity-75">{c.desc}</p></div>)}</div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="mb-10 text-center"><span className="wmp-chip mb-3"><HelpCircle className="size-3" /> Dúvidas frequentes</span><h2 className="wmp-display text-3xl md:text-4xl">Como funciona</h2></div>
        <div className="wmp-surface p-2 md:p-4">{WMP_FAQ.map((item) => <details key={item.pergunta} className="border-b p-4 last:border-b-0" style={{ borderColor: "var(--wmp-border)" }}><summary className="cursor-pointer font-medium">{item.pergunta}</summary><p className="mt-3 text-sm leading-relaxed opacity-75">{item.resposta}</p></details>)}</div>
      </section>
    </WmpShell>
  );
}

function ServiceCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return <article className="wmp-surface p-6"><Icon className="mb-4 size-7" style={{ color: "var(--wmp-gold)" }} /><h3 className="wmp-display mb-2 text-xl">{title}</h3><p className="text-sm leading-relaxed opacity-75">{desc}</p></article>;
}