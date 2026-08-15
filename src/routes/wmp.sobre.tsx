import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Award, ArrowRight, Workflow, Headphones, Handshake, FileText } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_CERTIFICACOES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a WMP — Wagner Miller Produções" },
      { name: "description", content: "Conheça a WMP — Wagner Miller Produções: produção e operação de eventos, DJs, som, luz, audiovisual, parceiros e gestão integrada pelo ecossistema Impulsionando." },
      { property: "og:title", content: "WMP — Wagner Miller Produções" },
      { property: "og:description", content: "Produção e operação de eventos com briefing, proposta comercial, parceiros, equipamentos, agenda e atendimento integrado pelo Milito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Wagner Miller Produções (WMP)",
          description: "Produção e operação de eventos, DJs, som, iluminação, audiovisual e rede de parceiros.",
          areaServed: "Brasil",
          address: { "@type": "PostalAddress", addressRegion: "RJ", addressCountry: "BR" },
        }),
      },
    ],
  }),
  component: WmpSobre,
});

function WmpSobre() {
  return (
    <WmpShell breadcrumbs={[{ label: "Sobre" }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-4xl px-6 pt-16 pb-14 text-center">
          <span className="wmp-chip mb-4"><Award className="size-3" /> Wagner Miller Produções</span>
          <h1 className="wmp-display text-4xl md:text-6xl mb-5 leading-[1.05]">
            Produção, operação e experiência<br />conectadas em uma única jornada.
          </h1>
          <p className="opacity-80 text-lg max-w-2xl mx-auto">
            A WMP organiza a contratação e a operação de eventos reunindo atendimento, briefing, DJs e parceiros, equipamentos, agenda, proposta comercial e acompanhamento em um mesmo ecossistema.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { i: Workflow, n: "Briefing", l: "estrutura definida a partir da necessidade real" },
            { i: Headphones, n: "Operação", l: "equipamentos e mão de obra tratados separadamente" },
            { i: Handshake, n: "Parceiros", l: "DJs, técnicos e fornecedores por perfil e disponibilidade" },
            { i: FileText, n: "Proposta", l: "condição comercial antes da formalização contratual" },
          ].map(({ i: Icon, n, l }) => (
            <div key={l} className="wmp-surface p-6">
              <Icon className="size-8 mx-auto mb-3" style={{ color: "var(--wmp-gold)" }} />
              <div className="wmp-display text-2xl" style={{ color: "var(--wmp-gold)" }}>{n}</div>
              <div className="text-xs uppercase tracking-wider mt-1 opacity-70">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="wmp-display text-3xl md:text-4xl text-center mb-10">Como trabalhamos</h2>
        <ol className="grid md:grid-cols-4 gap-6">
          {[
            { n: 1, t: "Briefing", d: "O cliente informa o tipo de evento, data, local, estrutura desejada e necessidades específicas." },
            { n: 2, t: "Composição", d: "A WMP dimensiona serviços, equipe, DJs, parceiros e equipamentos conforme o escopo real." },
            { n: 3, t: "Proposta comercial", d: "Primeiro são apresentados serviço, data ou período e preço. O contrato vem somente após a concordância inicial." },
            { n: 4, t: "Operação e relacionamento", d: "Agenda, execução, registros, protocolos e histórico ficam integrados para acompanhamento e recorrência." },
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
        <h2 className="wmp-display text-3xl md:text-4xl text-center mb-10">Compromissos operacionais</h2>
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
          <p className="opacity-80 mb-6">Conte ao Milito ou preencha o briefing para iniciar sua proposta.</p>
          <Link to="/wmp/orcamento" className="wmp-cta">
            Solicitar proposta <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </WmpShell>
  );
}
