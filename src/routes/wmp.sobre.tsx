import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Award, Users, Clock, ArrowRight } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_CERTIFICACOES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a WMP — 15 anos de palco, som e produção" },
      { name: "description", content: "Wagner Miller Produções: 15 anos de palco, +850 eventos, ART, laudos e engenharia de som aplicada. Autoridade em produção de eventos premium." },
      { property: "og:title", content: "WMP — 15 anos entregando som, luz e palco" },
      { property: "og:description", content: "De técnicos formados a produção plena. Conheça a estrutura e a metodologia da WMP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Wagner Miller Produções (WMP)",
          description: "Produção de eventos com som, iluminação, palco e telão. Pré-diagnóstico acústico, ART e laudo de dB.",
          areaServed: "Brasil",
          address: { "@type": "PostalAddress", addressRegion: "RJ", addressCountry: "BR" },
          foundingDate: "2010",
        }),
      },
    ],
  }),
  component: WmpSobre,
});

function WmpSobre() {
  return (
    <WmpShell>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-4xl px-6 pt-16 pb-14 text-center">
          <span className="wmp-chip mb-4"><Award className="size-3" /> Nossa história</span>
          <h1 className="wmp-display text-4xl md:text-6xl mb-5 leading-[1.05]">
            15 anos ligando o som<br />que emociona quem escuta.
          </h1>
          <p className="opacity-80 text-lg max-w-2xl mx-auto">
            A WMP nasceu no palco. Wagner Miller começou como técnico de som em bandas locais
            e, evento após evento, montou uma produtora que hoje atende de casamentos íntimos
            a festivais com milhares de pessoas — sempre com engenharia aplicada e sem improviso.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { i: Clock, n: "15 anos", l: "de palco" },
            { i: Users, n: "+850", l: "eventos entregues" },
            { i: ShieldCheck, n: "100%", l: "com plano B documentado" },
            { i: Award, n: "ART + Laudo", l: "em eventos de médio e grande porte" },
          ].map(({ i: Icon, n, l }) => (
            <div key={l} className="wmp-surface p-6">
              <Icon className="size-8 mx-auto mb-3" style={{ color: "var(--wmp-gold)" }} />
              <div className="wmp-display text-3xl" style={{ color: "var(--wmp-gold)" }}>{n}</div>
              <div className="text-xs uppercase tracking-wider mt-1 opacity-70">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="wmp-display text-3xl md:text-4xl text-center mb-10">Como trabalhamos</h2>
        <ol className="grid md:grid-cols-4 gap-6">
          {[
            { n: 1, t: "Briefing inteligente", d: "Formulário com pré-diagnóstico acústico gera estrutura sugerida antes da visita." },
            { n: 2, t: "Proposta em 24h", d: "Escopo, cronograma, plano B e valor detalhados por escrito." },
            { n: 3, t: "Execução com engenharia", d: "ART, laudo de dB, técnicos dedicados e checklist minuto a minuto." },
            { n: 4, t: "Pós-evento", d: "Relatório técnico, feedback e ajuste da rede de parceiros para o próximo." },
          ].map((s) => (
            <li key={s.n} className="wmp-surface p-6">
              <div className="wmp-display text-4xl mb-2" style={{ color: "var(--wmp-gold)" }}>{s.n}</div>
              <h3 className="wmp-display text-lg mb-2">{s.t}</h3>
              <p className="text-sm opacity-75">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="wmp-display text-3xl md:text-4xl text-center mb-10">Garantias técnicas</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {WMP_CERTIFICACOES.map((c) => (
            <div key={c.titulo} className="wmp-surface p-6 flex gap-4">
              <ShieldCheck className="size-6 shrink-0" style={{ color: "var(--wmp-gold)" }} />
              <div>
                <h3 className="wmp-display text-lg mb-1">{c.titulo}</h3>
                <p className="text-sm opacity-75">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="wmp-surface p-10">
          <h2 className="wmp-display text-2xl md:text-3xl mb-4">Vamos produzir o seu evento?</h2>
          <p className="opacity-80 mb-6">Briefing em 60 segundos, proposta em 24 horas.</p>
          <Link to="/wmp/orcamento" className="wmp-cta">
            Quero meu orçamento <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </WmpShell>
  );
}
